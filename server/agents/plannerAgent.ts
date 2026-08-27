export type MarineAgentId =
  | 'planner'
  | 'satellite'
  | 'oceanPfz'
  | 'weatherSafety'
  | 'geofence'
  | 'weatherSafeRouting'
  | 'historicalAnalytics'
  | 'vectorKnowledge'
  | 'synthesisXai'
  | 'voiceAssistant';

export interface PlannedTaskDAG {
  query: string;
  detectedLanguage: string;
  detectedIntent: 'FIND_PFZ' | 'CHECK_WEATHER_SAFETY' | 'GEOFENCE_BOUNDARY_VERIFICATION' | 'NAVIGATE_SAFE_ROUTE' | 'HISTORICAL_CAUSAL_ANALYSIS' | 'COMPREHENSIVE_OCEAN_INTELLIGENCE';
  extractedEntities: {
    locationName?: string;
    coordinates?: { lat: number; lng: number };
    timeHorizon?: string;
    targetSpecies?: string;
    variableFocus?: string;
  };
  requiredAgents: {
    id: MarineAgentId;
    displayName: string;
    purpose: string;
    dependsOn: MarineAgentId[];
    priority: number;
  }[];
  reasoningPlan: string;
}

export class PlannerAgent {
  public plan(query: string, language: string = 'en', context?: any): PlannedTaskDAG {
    const q = (query || '').toLowerCase();

    // --- TIME HORIZON EXTRACTION ---
    const hasTomorrow = q.includes('tomorrow') || q.includes('நாளை') || q.includes('कल') || q.includes('రేపు') || q.includes('നാളെ');
    const hasToday = q.includes('today') || q.includes('இன்று') || q.includes('आज') || q.includes('ఈరోజు') || q.includes('ഇന്ന്');
    const hasFuture = hasTomorrow || q.includes('next') || q.includes('upcoming') || q.includes('forecast') || q.includes('predict');
    const timeHorizon = hasTomorrow ? 'tomorrow' : hasToday ? 'today' : hasFuture ? 'future' : 'current';

    // --- INTENT CLASSIFICATION ---
    // Safety/weather keywords
    const weatherKeywords = ['weather', 'wave', 'storm', 'wind', 'swell', 'cyclone', 'rain',
      'forecast', 'sea condition', 'sea state', 'current', 'tide',
      'வானிலை', 'அலை', 'புயல்', 'காற்று',
      'मौसम', 'लहर', 'तूफान', 'हवा',
      'వాతావరణం', 'అలల', 'తుఫాను',
      'കാലാവസ്ഥ', 'തിരമാല'];
    const hasWeatherKeyword = weatherKeywords.some(kw => q.includes(kw));

    // Safety keywords (can I go, is it safe, risk, danger)
    const safetyKeywords = ['safe', 'risk', 'danger', 'can i go', 'should i go', 'is it ok',
      'பாதுகாப்ப', 'போகலாமா', 'செல்லலாமா',
      'सुरक्षित', 'जा सकत', 'जाना',
      'సురక్షిత', 'వెళ్ల',
      'സുരക്ഷിത', 'പോകാമോ',
      'హెచ్చరిక', 'അപായം'];
    const hasSafetyKeyword = safetyKeywords.some(kw => q.includes(kw));

    // PFZ/fishing location keywords
    const pfzKeywords = ['where', 'nearest', 'zone', 'pfz', 'fishing zone', 'fishing area',
      'எங்கே', 'மண்டலம்',
      'कहाँ', 'क्षेत्र',
      'ఎక్కడ', 'ప్రాంతం',
      'എവിടെ', 'മേഖല'];
    const hasPfzKeyword = pfzKeywords.some(kw => q.includes(kw));

    // Fishing word alone (without location words) + future/safety context = safety query
    const hasFishWord = q.includes('fish') || q.includes('மீன்') || q.includes('मछली') || q.includes('చేప') || q.includes('മീൻ');

    const isHistoricalCausal = q.includes('why') || q.includes('decline') || q.includes('productivity') ||
                               q.includes('anomaly') || q.includes('history') || q.includes('trend') ||
                               q.includes('குறைவு') || q.includes('कम') || q.includes('కారణం') || q.includes('കാരണം');

    const isGeofence = q.includes('imbl') || q.includes('border') || q.includes('boundary') || q.includes('geofence') ||
                        q.includes('sri lanka') || q.includes('restricted') || q.includes('எல்லை') || q.includes('सीमा');

    const isRouting = q.includes('route') || q.includes('path') || q.includes('navigate') || q.includes('waypoint') ||
                      q.includes('bearing') || q.includes('வழி') || q.includes('रास्ता') || q.includes('మార్గం');

    // --- INTENT PRIORITY RESOLUTION ---
    let intent: PlannedTaskDAG['detectedIntent'] = 'FIND_PFZ';

    if (isHistoricalCausal) {
      intent = 'HISTORICAL_CAUSAL_ANALYSIS';
    } else if (isGeofence) {
      intent = 'GEOFENCE_BOUNDARY_VERIFICATION';
    } else if (isRouting) {
      intent = 'NAVIGATE_SAFE_ROUTE';
    } else if (hasWeatherKeyword) {
      // Explicit weather/wave/wind query → always weather
      intent = 'CHECK_WEATHER_SAFETY';
    } else if (hasSafetyKeyword) {
      // "is it safe", "can I go" → weather/safety
      intent = 'CHECK_WEATHER_SAFETY';
    } else if (hasFishWord && hasFuture && !hasPfzKeyword) {
      // "can I go fishing tomorrow" → safety (not asking WHERE, asking IF)
      intent = 'CHECK_WEATHER_SAFETY';
    } else if (hasFishWord && hasSafetyKeyword) {
      // "is fishing safe" → safety
      intent = 'CHECK_WEATHER_SAFETY';
    } else if (hasPfzKeyword || (hasFishWord && !hasFuture)) {
      // "where to fish", "nearest zone", "fish today" → PFZ
      intent = 'FIND_PFZ';
    } else if (hasFishWord) {
      // Generic fishing query without location words
      intent = 'FIND_PFZ';
    } else {
      intent = 'COMPREHENSIVE_OCEAN_INTELLIGENCE';
    }

    // Extract coastal location entities
    let locName = context?.name || 'Kasimedu Fishing Harbour, Chennai (Coromandel Coast)';
    let coords = { lat: context?.lat || 13.0827, lng: context?.lng || 80.2707 };

    if (q.includes('kerala') || q.includes('kochi') || q.includes('cochin') || q.includes('malabar')) {
      locName = 'Kochi / Malabar Coast, Kerala';
      coords = { lat: 9.9312, lng: 76.2673 };
    } else if (q.includes('veraval') || q.includes('gujarat') || q.includes('saurashtra')) {
      locName = 'Veraval / Saurashtra Coast, Gujarat';
      coords = { lat: 20.89, lng: 70.38 };
    } else if (q.includes('visakhapatnam') || q.includes('vizag') || q.includes('andhra')) {
      locName = 'Off Visakhapatnam Coast, Andhra Pradesh';
      coords = { lat: 17.68, lng: 83.35 };
    } else if (q.includes('mannar') || q.includes('rameswaram') || q.includes('palk')) {
      locName = 'Gulf of Mannar / Palk Strait';
      coords = { lat: 9.15, lng: 79.25 };
    }

    // Construct dynamic DAG based strictly on intent requirements
    const requiredAgents: PlannedTaskDAG['requiredAgents'] = [];

    // Stage 1: Always include Planner & Satellite Observation
    requiredAgents.push({
      id: 'planner',
      displayName: 'Planner Agent',
      purpose: 'Intent decomposition, spatial entity extraction, and task DAG scheduling',
      dependsOn: [],
      priority: 1,
    });

    requiredAgents.push({
      id: 'satellite',
      displayName: 'Satellite Observation Agent',
      purpose: 'Harvesting INSAT-3DR SST and Oceansat-3 OCM-3 multi-spectral satellite rasters',
      dependsOn: ['planner'],
      priority: 2,
    });

    // Stage 2: Specialized domain agents
    if (intent === 'FIND_PFZ' || intent === 'COMPREHENSIVE_OCEAN_INTELLIGENCE') {
      requiredAgents.push({
        id: 'oceanPfz',
        displayName: 'Ocean State & PFZ Discovery Agent',
        purpose: 'Thermal front boundary detection, chlorophyll-a bloom correlation, and species scoring',
        dependsOn: ['satellite'],
        priority: 3,
      });
      requiredAgents.push({
        id: 'geofence',
        displayName: 'Geospatial & Geofence Agent',
        purpose: 'IMBL & Marine Protected Area geodesic distance verification',
        dependsOn: ['satellite'],
        priority: 3,
      });
      requiredAgents.push({
        id: 'weatherSafety',
        displayName: 'Weather & Swell Safety Agent',
        purpose: 'Significant wave height & wind gust risk verification',
        dependsOn: ['satellite'],
        priority: 3,
      });
      requiredAgents.push({
        id: 'weatherSafeRouting',
        displayName: 'Weather-Safe Routing Agent',
        purpose: 'A* waypoint path generation avoiding shallow shoals and restricted corridors',
        dependsOn: ['oceanPfz', 'geofence', 'weatherSafety'],
        priority: 4,
      });
    } else if (intent === 'HISTORICAL_CAUSAL_ANALYSIS') {
      requiredAgents.push({
        id: 'vectorKnowledge',
        displayName: 'Vector Knowledge Agent',
        purpose: 'Semantic search of peer oceanographic literature and INCOIS technical records',
        dependsOn: ['satellite'],
        priority: 3,
      });
      requiredAgents.push({
        id: 'historicalAnalytics',
        displayName: 'Historical Causal Analytics Agent',
        purpose: 'Multi-temporal anomaly decomposition across 4 distinct evidence tiers',
        dependsOn: ['vectorKnowledge'],
        priority: 4,
      });
    } else if (intent === 'CHECK_WEATHER_SAFETY') {
      requiredAgents.push({
        id: 'weatherSafety',
        displayName: 'Weather & Swell Safety Agent',
        purpose: 'Significant wave height, wind shear, and thunderstorm risk classification',
        dependsOn: ['satellite'],
        priority: 3,
      });
      requiredAgents.push({
        id: 'geofence',
        displayName: 'Geospatial & Geofence Agent',
        purpose: 'Territorial water buffer check',
        dependsOn: ['satellite'],
        priority: 3,
      });
    } else if (intent === 'GEOFENCE_BOUNDARY_VERIFICATION') {
      requiredAgents.push({
        id: 'geofence',
        displayName: 'Geospatial & Geofence Agent',
        purpose: 'High-precision geodesic distance calculation to IMBL and restricted polygons',
        dependsOn: ['satellite'],
        priority: 3,
      });
    } else if (intent === 'NAVIGATE_SAFE_ROUTE') {
      requiredAgents.push({
        id: 'weatherSafety',
        displayName: 'Weather & Swell Safety Agent',
        purpose: 'Real-time sea state check along navigational corridor',
        dependsOn: ['satellite'],
        priority: 3,
      });
      requiredAgents.push({
        id: 'geofence',
        displayName: 'Geospatial & Geofence Agent',
        purpose: 'Boundary exclusion constraint checking',
        dependsOn: ['satellite'],
        priority: 3,
      });
      requiredAgents.push({
        id: 'weatherSafeRouting',
        displayName: 'Weather-Safe Routing Agent',
        purpose: 'Dynamic A* marine pathfinding avoiding hazardous nodes',
        dependsOn: ['weatherSafety', 'geofence'],
        priority: 4,
      });
    }

    // Final Stages: Synthesis and Voice
    requiredAgents.push({
      id: 'synthesisXai',
      displayName: 'XAI & Evidence Synthesis Agent',
      purpose: 'Multi-source cross-corroboration, transparent reasoning, and confidence calibration',
      dependsOn: requiredAgents.map(a => a.id),
      priority: 5,
    });

    requiredAgents.push({
      id: 'voiceAssistant',
      displayName: 'Multilingual Voice Agent',
      purpose: `Formatting native voice response for ${language}`,
      dependsOn: ['synthesisXai'],
      priority: 6,
    });

    const reasoningPlan = `Decomposed user request into ${requiredAgents.length} specialized task nodes with intent '${intent}' targeting ${locName}. Time horizon: ${timeHorizon}.`;

    return {
      query,
      detectedLanguage: language,
      detectedIntent: intent,
      extractedEntities: {
        locationName: locName,
        coordinates: coords,
        timeHorizon,
      },
      requiredAgents,
      reasoningPlan,
    };
  }
}

export const globalPlannerAgent = new PlannerAgent();
