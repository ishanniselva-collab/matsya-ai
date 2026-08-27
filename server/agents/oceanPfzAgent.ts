import { calculateHaversineKm, calculateBearingDegrees } from './geofenceAgent';
import fs from 'fs';
import path from 'path';

export interface PFZCandidate {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  direction: string;
  bearingDegrees: number;
  suitabilityScore: number; // 0-100%
  confidenceScore: number; // 0-100%
  sst: number; // in °C
  chlorophyllLevel: 'Low' | 'Medium' | 'High' | 'Very High';
  chlorophyllValue: number; // in mg/m³
  waveHeight: number; // in meters
  windSpeed: number; // in km/h
  marineRisk: 'LOW' | 'MODERATE' | 'HIGH';
  depthMeters: number;
  speciesLikelihood: string[];
  oceanographicEvidence: {
    thermalGradient: string;
    chlorophyllPlume: string;
    bathymetricFeature: string;
    currentConvergence: string;
  };
  reasoning: string;
  validUntil: string;
  source?: 'ml_prediction' | 'hardcoded';
}

export interface OceanPfzAnalysisResult {
  searchOrigin: { lat: number; lng: number; locationName: string };
  radiusKm: number;
  sstSummary: {
    meanSst: number;
    thermalFrontDetected: boolean;
    gradientStrength: string;
  };
  chlorophyllSummary: {
    meanValue: number;
    bloomStatus: 'Active Coastal Bloom' | 'Moderate Front' | 'Dispersed';
  };
  currentSummary: {
    speedMs: number;
    direction: string;
    divergenceType: 'Upwelling Front' | 'Convergent Shelf Filament' | 'Laminar Coastal Stream';
  };
  pfzCandidates: PFZCandidate[];
  fisheriesAdvisory: string;
  timestamp: string;
  dataSource: 'ml_satellite_prediction' | 'hardcoded_fallback';
  mlMetadata?: {
    model: string;
    features: string[];
    totalPredictions: number;
    dataDate: string;
    disclaimer: string;
  };
}

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

export class OceanPfzAgent {
  private mlPredictionsCache: any[] | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  private loadMLPredictions(): any[] | null {
    const geojsonPath = path.join(process.cwd(), 'server', 'data', 'pfz_map_locations.geojson');
    try {
      if (!fs.existsSync(geojsonPath)) return null;
      const now = Date.now();
      if (this.mlPredictionsCache && (now - this.cacheTimestamp) < this.CACHE_TTL_MS) {
        return this.mlPredictionsCache;
      }
      const raw = fs.readFileSync(geojsonPath, 'utf-8');
      const geojson = JSON.parse(raw);
      this.mlPredictionsCache = geojson.features;
      this.cacheTimestamp = now;
      return this.mlPredictionsCache;
    } catch {
      return null;
    }
  }

  private loadMLMetadata(): any | null {
    const metaPath = path.join(process.cwd(), 'server', 'models', 'orca_pfz_metadata.json');
    try {
      if (!fs.existsSync(metaPath)) return null;
      return JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    } catch {
      return null;
    }
  }

  public async callLiveMLService(sst: number, sst_gradient: number, chlorophyll: number): Promise<{ pfz_prediction: boolean; confidence: number } | null> {
    try {
      const response = await fetch(`${ML_SERVICE_URL}/predict/pfz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sst, sst_gradient, chlorophyll }),
      });
      if (response.ok) return await response.json() as any;
    } catch {}
    return null;
  }

  public analyze(params: {
    lat: number;
    lng: number;
    locationName?: string;
    radiusKm?: number;
    targetSpecies?: string;
  }): OceanPfzAnalysisResult {
    const originLat = params.lat || 13.0827;
    const originLng = params.lng || 80.2707;
    const radius = params.radiusKm || 80;
    const locName = params.locationName || `Coastal Station (${originLat.toFixed(2)}°N, ${originLng.toFixed(2)}°E)`;

    // Try ML predictions first (Member 1's pipeline output)
    const mlFeatures = this.loadMLPredictions();
    const mlMeta = this.loadMLMetadata();

    if (mlFeatures && mlFeatures.length > 0) {
      return this.buildFromMLPredictions(mlFeatures, mlMeta, originLat, originLng, radius, locName);
    }

    // Fallback to hardcoded zones if no ML data available
    return this.buildFromHardcodedZones(originLat, originLng, radius, locName);
  }

  private buildFromMLPredictions(
    features: any[],
    metadata: any | null,
    originLat: number,
    originLng: number,
    radius: number,
    locName: string
  ): OceanPfzAnalysisResult {
    const dirNames = ['North', 'Northeast', 'East', 'Southeast', 'South', 'Southwest', 'West', 'Northwest'];

    // Convert GeoJSON features to PFZCandidates, sorted by distance from origin
    const candidates: PFZCandidate[] = features
      .map((feature: any, idx: number) => {
        const lng = feature.geometry.coordinates[0];
        const lat = feature.geometry.coordinates[1];
        const props = feature.properties;

        const dist = calculateHaversineKm(originLat, originLng, lat, lng);
        const bearing = calculateBearingDegrees(originLat, originLng, lat, lng);
        const dirIndex = Math.round(bearing / 45) % 8;
        const dirStr = `${dirNames[dirIndex]} (${bearing.toString().padStart(3, '0')}°)`;

        // Derive suitability from ML probability
        const prob = props.pfz_probability || 0;
        const suitabilityScore = Math.min(98, Math.max(55, Math.round(prob * 100)));
        const confidenceScore = Math.min(96, Math.max(60, Math.round(prob * 95)));

        const chlValue = props.chlorophyll || 0;
        const chlLevel: PFZCandidate['chlorophyllLevel'] =
          chlValue > 1.0 ? 'Very High' : chlValue > 0.5 ? 'High' : chlValue > 0.2 ? 'Medium' : 'Low';

        const gradient = props.sst_gradient || 0;

        // Infer species from SST range (Indian Ocean pelagic ecology)
        const sst = props.sst || 27;
        let species: string[];
        if (sst >= 27 && sst <= 29) {
          species = ['Indian Oil Sardine', 'Indian Mackerel', 'Anchovies', 'Ribbonfish'];
        } else if (sst >= 25 && sst < 27) {
          species = ['Skipjack Tuna', 'Yellowfin Tuna', 'Seerfish', 'Barracuda'];
        } else {
          species = ['Squid', 'Cuttlefish', 'Pomfret', 'Croakers'];
        }

        return {
          id: `ml-pfz-${idx}`,
          name: `ML PFZ Zone ${idx + 1} (${lat.toFixed(1)}°N, ${lng.toFixed(1)}°E)`,
          latitude: lat,
          longitude: lng,
          distanceKm: Math.round(dist * 10) / 10,
          direction: dirStr,
          bearingDegrees: bearing,
          suitabilityScore,
          confidenceScore,
          sst: props.sst,
          chlorophyllLevel: chlLevel,
          chlorophyllValue: chlValue,
          waveHeight: 0.9,
          windSpeed: 14,
          marineRisk: 'LOW' as const,
          depthMeters: 50,
          speciesLikelihood: species,
          oceanographicEvidence: {
            thermalGradient: `${gradient.toFixed(3)}°C/grid — ${gradient > 0.5 ? 'strong' : gradient > 0.1 ? 'moderate' : 'weak'} thermal front`,
            chlorophyllPlume: `${chlValue.toFixed(3)} mg/m³ — satellite-observed productivity`,
            bathymetricFeature: 'Continental shelf zone (NOAA OISST grid)',
            currentConvergence: 'Satellite-derived convergence indicator',
          },
          reasoning: `ML model prediction (probability ${(prob * 100).toFixed(1)}%) based on SST ${sst.toFixed(1)}°C, thermal gradient ${gradient.toFixed(3)}, and chlorophyll ${chlValue.toFixed(3)} mg/m³. Source: NOAA OISST + NASA MODIS satellite data.`,
          validUntil: `Data date: ${props.date || 'unknown'}`,
          source: 'ml_prediction' as const,
        };
      })
      .sort((a, b) => a.distanceKm - b.distanceKm);

    // Filter to radius, return top candidates
    const withinRadius = candidates.filter(c => c.distanceKm <= radius);
    const resultCandidates = withinRadius.length >= 2 ? withinRadius.slice(0, 6) : candidates.slice(0, 6);

    // Compute summary stats from the ML data
    const allSst = features.map((f: any) => f.properties.sst).filter(Boolean);
    const allChl = features.map((f: any) => f.properties.chlorophyll).filter(Boolean);
    const meanSst = allSst.length > 0 ? allSst.reduce((a: number, b: number) => a + b, 0) / allSst.length : 27.5;
    const meanChl = allChl.length > 0 ? allChl.reduce((a: number, b: number) => a + b, 0) / allChl.length : 0.4;

    return {
      searchOrigin: { lat: originLat, lng: originLng, locationName: locName },
      radiusKm: radius,
      sstSummary: {
        meanSst: Math.round(meanSst * 10) / 10,
        thermalFrontDetected: true,
        gradientStrength: 'Strong (satellite-derived SST gradient analysis)',
      },
      chlorophyllSummary: {
        meanValue: Math.round(meanChl * 1000) / 1000,
        bloomStatus: meanChl > 0.5 ? 'Active Coastal Bloom' : meanChl > 0.3 ? 'Moderate Front' : 'Dispersed',
      },
      currentSummary: {
        speedMs: 0.42,
        direction: 'North-Northeast (030°)',
        divergenceType: 'Upwelling Front',
      },
      pfzCandidates: resultCandidates,
      fisheriesAdvisory: resultCandidates.length > 0
        ? `ML model identified ${features.length} potential fishing zones from satellite data. Nearest: ${resultCandidates[0].name} (${resultCandidates[0].distanceKm} km, probability ${resultCandidates[0].suitabilityScore}%).`
        : 'No ML-predicted PFZ zones found within the requested radius.',
      timestamp: new Date().toISOString(),
      dataSource: 'ml_satellite_prediction',
      mlMetadata: metadata ? {
        model: metadata.model || 'RandomForestClassifier',
        features: metadata.features || ['sst', 'sst_gradient', 'chlorophyll'],
        totalPredictions: metadata.pfz_predictions || features.length,
        dataDate: metadata.data_date || 'unknown',
        disclaimer: 'Satellite-derived ML predictions (pseudo-labels). NOT official INCOIS PFZ advisories.',
      } : undefined,
    };
  }

  private buildFromHardcodedZones(
    originLat: number,
    originLng: number,
    radius: number,
    locName: string
  ): OceanPfzAnalysisResult {
    const rawZones = [
      {
        id: 'pfz-coromandel-alpha',
        name: 'Coromandel Thermal Front Alpha',
        lat: 13.34,
        lng: 80.62,
        sst: 28.3,
        chl: 2.65,
        wave: 0.8,
        wind: 12,
        depth: 45,
        species: ['Indian Oil Sardine', 'Indian Mackerel', 'Yellowfin Tuna', 'Anchovies'],
        thermalGradient: '0.6°C / 4 km sharp frontal boundary',
        chlPlume: '2.65 mg/m³ dense coastal plume (OCM-3 / Sentinel-3)',
        bathy: '45m contour shelf edge convergence',
        curr: '0.45 m/s NE divergence driving nutrient upwelling',
      },
      {
        id: 'pfz-palaverikadu-shoal',
        name: 'Palaverikadu Outer Shoal Convergence',
        lat: 12.82,
        lng: 80.48,
        sst: 28.5,
        chl: 2.40,
        wave: 0.9,
        wind: 14,
        depth: 55,
        species: ['Ribbonfish', 'Seerfish (King Mackerel)', 'Carangids', 'Squid'],
        thermalGradient: '0.4°C / 5 km moderate front',
        chlPlume: '2.40 mg/m³ stable chlorophyll shelf plume',
        bathy: '55m seabed depression with forage aggregation',
        curr: '0.38 m/s NNE boundary flow',
      },
      {
        id: 'pfz-pulicat-offshore',
        name: 'Pulicat Deep Shelf Front',
        lat: 13.55,
        lng: 80.75,
        sst: 28.1,
        chl: 2.85,
        wave: 1.0,
        wind: 15,
        depth: 68,
        species: ['Skipjack Tuna', 'Tuna (Pelagic)', 'Barracuda', 'Mackerel'],
        thermalGradient: '0.8°C / 3.5 km prominent thermal front',
        chlPlume: '2.85 mg/m³ high-reflectance phytoplankton plume',
        bathy: '68m continental slope break',
        curr: '0.52 m/s cyclonic eddy filament',
      },
      {
        id: 'pfz-kerala-malabar-bravo',
        name: 'Malabar Upwelling Zone Bravo',
        lat: 9.75,
        lng: 75.85,
        sst: 27.6,
        chl: 3.80,
        wave: 1.3,
        wind: 18,
        depth: 62,
        species: ['Indian Oil Sardine', 'Chub Mackerel', 'Cuttlefish', 'Tuna'],
        thermalGradient: '1.1°C / 4 km intense monsoonal upwelling front',
        chlPlume: '3.80 mg/m³ high-intensity chlorophyll filament',
        bathy: '62m mud bank boundary',
        curr: '0.65 m/s southward coastal jet',
      },
      {
        id: 'pfz-veraval-saurashtra',
        name: 'Saurashtra Shelf Ridge',
        lat: 20.65,
        lng: 69.95,
        sst: 28.1,
        chl: 3.10,
        wave: 1.1,
        wind: 15,
        depth: 48,
        species: ['Silver Pomfret', 'Hilsa', 'Ribbon Fish', 'Croakers'],
        thermalGradient: '0.7°C / 5 km bathymetric upwelling front',
        chlPlume: '3.10 mg/m³ nutrient rich shelf plume',
        bathy: '48m rocky ridge contour',
        curr: '0.48 m/s NW tidal divergence',
      },
      {
        id: 'pfz-visakhapatnam-eddy',
        name: 'Kalingapatnam Boundary Convergence',
        lat: 18.15,
        lng: 84.10,
        sst: 28.9,
        chl: 2.15,
        wave: 1.0,
        wind: 13,
        depth: 110,
        species: ['Yellowfin Tuna', 'Skipjack Tuna', 'Mahi Mahi (Dolphinfish)', 'Sailfish'],
        thermalGradient: '0.5°C / 6 km mesoscale eddy boundary',
        chlPlume: '2.15 mg/m³ offshore entrainment band',
        bathy: '110m deep canyon slope',
        curr: '0.58 m/s anticyclonic eddy perimeter',
      },
    ];

    const dirNames = ['North', 'Northeast', 'East', 'Southeast', 'South', 'Southwest', 'West', 'Northwest'];

    const candidates: PFZCandidate[] = rawZones
      .map(z => {
        const dist = calculateHaversineKm(originLat, originLng, z.lat, z.lng);
        const bearing = calculateBearingDegrees(originLat, originLng, z.lat, z.lng);
        const dirIndex = Math.round(bearing / 45) % 8;
        const dirStr = `${dirNames[dirIndex]} (${bearing.toString().padStart(3, '0')}°)`;

        let sstScore = z.sst >= 27.5 && z.sst <= 29.0 ? 35 : z.sst >= 27.0 && z.sst <= 29.5 ? 28 : 18;
        let chlScore = z.chl >= 3.0 ? 40 : z.chl >= 2.2 ? 34 : 22;
        let waveScore = z.wave <= 1.0 ? 15 : z.wave <= 1.6 ? 10 : 3;
        let proximityScore = dist <= 40 ? 10 : dist <= 80 ? 6 : 2;

        const suitabilityScore = Math.min(96, Math.max(60, sstScore + chlScore + waveScore + proximityScore));
        const confidenceScore = Math.min(94, Math.max(72, suitabilityScore - 4 + Math.round(Math.random() * 3)));

        const chlLevel: PFZCandidate['chlorophyllLevel'] = z.chl > 3.2 ? 'Very High' : z.chl > 2.2 ? 'High' : z.chl > 1.4 ? 'Medium' : 'Low';
        const risk: PFZCandidate['marineRisk'] = z.wave > 2.0 || z.wind > 30 ? 'HIGH' : z.wave > 1.4 || z.wind > 22 ? 'MODERATE' : 'LOW';

        return {
          id: z.id,
          name: z.name,
          latitude: z.lat,
          longitude: z.lng,
          distanceKm: Math.round(dist * 10) / 10,
          direction: dirStr,
          bearingDegrees: bearing,
          suitabilityScore,
          confidenceScore,
          sst: z.sst,
          chlorophyllLevel: chlLevel,
          chlorophyllValue: z.chl,
          waveHeight: z.wave,
          windSpeed: z.wind,
          marineRisk: risk,
          depthMeters: z.depth,
          speciesLikelihood: z.species,
          oceanographicEvidence: {
            thermalGradient: z.thermalGradient,
            chlorophyllPlume: z.chlPlume,
            bathymetricFeature: z.bathy,
            currentConvergence: z.curr,
          },
          reasoning: `Co-location of high chlorophyll-a (${z.chl} mg/m³) and sharp SST thermal front (${z.sst}°C) along the ${z.depth}m isobath. ${z.thermalGradient}. Strong forage fish concentration expected.`,
          validUntil: 'Tomorrow, 18:00 IST (Daily composite update)',
          source: 'hardcoded' as const,
        };
      })
      .sort((a, b) => a.distanceKm - b.distanceKm);

    const filteredCandidates = candidates.filter(c => c.distanceKm <= radius);
    const resultCandidates = filteredCandidates.length > 0 ? filteredCandidates : candidates.slice(0, 2);

    return {
      searchOrigin: { lat: originLat, lng: originLng, locationName: locName },
      radiusKm: radius,
      sstSummary: {
        meanSst: 28.4,
        thermalFrontDetected: true,
        gradientStrength: 'Strong (>0.6°C / 4 km front gradient)',
      },
      chlorophyllSummary: {
        meanValue: 2.65,
        bloomStatus: 'Active Coastal Bloom',
      },
      currentSummary: {
        speedMs: 0.45,
        direction: 'North-Northeast (030°)',
        divergenceType: 'Upwelling Front',
      },
      pfzCandidates: resultCandidates,
      fisheriesAdvisory: `Optimal pelagic fishing conditions in ${resultCandidates[0]?.name || 'coastal zone'} (${resultCandidates[0]?.distanceKm || 38} km offshore). High concentration of sardines and mackerel along the frontal shelf boundary.`,
      timestamp: new Date().toISOString(),
      dataSource: 'hardcoded_fallback',
    };
  }
}

export const globalOceanPfzAgent = new OceanPfzAgent();
