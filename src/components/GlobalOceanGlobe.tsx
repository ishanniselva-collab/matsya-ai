import React, { useState, useRef, useEffect } from 'react';
import { 
  Globe, 
  ExternalLink, 
  RotateCcw, 
  Maximize2, 
  Minimize2, 
  Sparkles, 
  Compass, 
  Layers, 
  Activity, 
  Info, 
  ShieldCheck, 
  ChevronRight,
  Crosshair,
  MapPin,
  Mic
} from 'lucide-react';
import { OceanVariable, MarineLocationData } from '../types/marine';
import { MOCK_MARINE_LOCATIONS } from '../data/mockMarineData';

interface GlobalOceanGlobeProps {
  onAskOrca?: (location: MarineLocationData, variable: OceanVariable) => void;
  onAskSamudra?: (location: MarineLocationData, variable: OceanVariable) => void;
  onOpenVoiceModal?: (query: string) => void;
  onNavigate?: (view: string) => void;
  initialVariable?: OceanVariable;
  isFullScreenDefault?: boolean;
  onCloseFullScreen?: () => void;
}

const COPERNICUS_URL = "https://myoceanglobe.marine.copernicus.eu/?pk_vid=679d37b9d67ebbdb1787385338dc55d5";

export const GlobalOceanGlobe: React.FC<GlobalOceanGlobeProps> = ({
  onAskOrca,
  onAskSamudra,
  onOpenVoiceModal,
  onNavigate,
  initialVariable = 'temperature',
  isFullScreenDefault = false,
  onCloseFullScreen,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(isFullScreenDefault);
  const [showTelemetryCard, setShowTelemetryCard] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<MarineLocationData>(MOCK_MARINE_LOCATIONS.chennai);
  const [activeVariable, setActiveVariable] = useState<OceanVariable>(initialVariable);

  const handleQuerySamudra = () => {
    const formattedQuery = `Analyze the selected ocean location:
Latitude: ${selectedLocation.latitude.toFixed(4)}
Longitude: ${selectedLocation.longitude.toFixed(4)}
SST: ${selectedLocation.temperature} °C
Salinity: ${selectedLocation.salinity} PSU
Wave Height: ${selectedLocation.waveHeight} m
Chlorophyll: ${selectedLocation.chlorophyll} mg/m³`;

    if (onAskSamudra) {
      onAskSamudra(selectedLocation, activeVariable);
    } else if (onAskOrca) {
      onAskOrca(selectedLocation, activeVariable);
    } else if (onOpenVoiceModal) {
      onOpenVoiceModal(formattedQuery);
    }
  };

  // Fullscreen toggle handler
  const toggleFullScreen = () => {
    if (!containerRef.current) return;
    if (!isFullScreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(() => {});
      }
      setIsFullScreen(true);
    } else {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullScreen(false);
      if (onCloseFullScreen) onCloseFullScreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleReload = () => {
    setIsLoading(true);
    if (iframeRef.current) {
      iframeRef.current.src = COPERNICUS_URL;
    }
  };

  return (
    <div 
      ref={containerRef}
      id="samudra-global-ocean-viewer"
      className={`relative w-full h-full bg-[#040D1A] overflow-hidden flex flex-col ${
        isFullScreen ? 'fixed inset-0 z-50' : 'min-h-[600px]'
      }`}
    >
      {/* 1. TOP FLOATING SAMUDRA AI HUD BAR */}
      <div className="absolute top-3 left-3 right-3 z-30 pointer-events-none flex flex-wrap items-center justify-between gap-2">
        
        {/* Brand & Ingestion Status */}
        <div className="bg-black/85 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/20 shadow-xl pointer-events-auto flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white tracking-wide font-mono uppercase">
                SAMUDRA AI
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40">
                COPERNICUS MYOCEAN LIVE
              </span>
            </div>
            <p className="text-[10px] text-neutral-300 font-mono">
              Operational Earth Observation & Global 3D Ocean GIS
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="bg-black/85 backdrop-blur-md px-2 py-1.5 rounded-xl border border-white/20 shadow-xl pointer-events-auto flex items-center gap-2">
          
          {/* Query SAMUDRA AI */}
          <button
            id="hud-query-samudra-btn"
            onClick={handleQuerySamudra}
            className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-[11px] font-bold font-mono transition flex items-center gap-1.5 shadow-md uppercase tracking-wider cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-200" />
            <span>QUERY SAMUDRA AI</span>
          </button>

          {/* Open in New Window */}
          <a
            href={COPERNICUS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition flex items-center gap-1 text-[11px] font-mono font-bold px-2.5"
            title="Open Copernicus MyOcean Globe in full browser window"
          >
            <ExternalLink className="w-3.5 h-3.5 text-teal-300" />
            <span className="hidden sm:inline">FULL TAB</span>
          </a>

          {/* Reload Globe */}
          <button
            onClick={handleReload}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white transition"
            title="Reload Ocean Globe"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullScreen}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white transition"
            title={isFullScreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullScreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 2. LOADING STATE OVERLAY */}
      {isLoading && (
        <div className="absolute inset-0 z-20 bg-[#040D1A] flex flex-col items-center justify-center text-white space-y-4">
          <div className="w-12 h-12 rounded-full border-3 border-teal-500/30 border-t-teal-400 animate-spin" />
          <div className="text-center space-y-1">
            <h3 className="font-mono text-sm font-bold tracking-wider text-teal-300 uppercase">
              INITIALIZING COPERNICUS 3D GLOBAL OCEAN
            </h3>
            <p className="text-xs text-neutral-400 font-mono">
              Loading High-Resolution Multi-Spectral Satellite Data & Velocity Vector Fields...
            </p>
          </div>
        </div>
      )}

      {/* 3. AUTHENTIC COPERNICUS MYOCEAN GLOBE EMBEDDED APPLICATION */}
      <div className="w-full h-full flex-1 relative z-10">
        <iframe
          ref={iframeRef}
          src={COPERNICUS_URL}
          onLoad={() => setIsLoading(false)}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          title="Copernicus MyOcean Global Ocean GIS"
        />
      </div>

      {/* 4. SAMUDRA AI TELEMETRY & LOCATION DRILL-DOWN CARD (COLLAPSIBLE / FLOATING) */}
      <div className="absolute bottom-4 left-4 z-30 pointer-events-none">
        {showTelemetryCard ? (
          <div className="bg-black/90 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-2xl pointer-events-auto text-white w-72 sm:w-80 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/15">
              <div className="flex items-center gap-1.5">
                <Crosshair className="w-3.5 h-3.5 text-teal-400" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal-300">
                  SELECTED LOCATION
                </span>
              </div>
              <button
                onClick={() => setShowTelemetryCard(false)}
                className="text-neutral-400 hover:text-white text-xs font-bold px-1"
              >
                ✕
              </button>
            </div>

            {/* Region Selector */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white font-mono truncate max-w-[140px]">
                {selectedLocation.locationName}
              </span>
              <select
                value={selectedLocation.locationName}
                onChange={(e) => {
                  const locationsList = Object.values(MOCK_MARINE_LOCATIONS) as MarineLocationData[];
                  const foundLoc = locationsList.find(r => r.locationName === e.target.value);
                  if (foundLoc) setSelectedLocation(foundLoc);
                }}
                className="bg-white/10 border border-white/20 text-white rounded px-2 py-0.5 text-[10px] font-mono focus:outline-hidden max-w-[120px]"
              >
                {(Object.values(MOCK_MARINE_LOCATIONS) as MarineLocationData[]).map(r => (
                  <option key={r.locationName} value={r.locationName} className="bg-neutral-900 text-white">
                    {r.locationName}
                  </option>
                ))}
              </select>
            </div>

            {/* Coordinates */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-white/5 p-2 rounded-lg border border-white/10">
              <div>
                <span className="text-[9px] text-neutral-400 uppercase block">Latitude</span>
                <span className="text-white font-bold block">{selectedLocation.latitude.toFixed(4)}° N</span>
              </div>
              <div>
                <span className="text-[9px] text-neutral-400 uppercase block">Longitude</span>
                <span className="text-white font-bold block">{selectedLocation.longitude.toFixed(4)}° E</span>
              </div>
            </div>

            {/* Ingestion Telemetry Metrics */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                <span className="text-[9px] text-neutral-400 uppercase block font-mono">SST</span>
                <span className="text-sm font-bold text-rose-400 font-mono">{selectedLocation.temperature} °C</span>
              </div>
              <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                <span className="text-[9px] text-neutral-400 uppercase block font-mono">Salinity</span>
                <span className="text-sm font-bold text-amber-300 font-mono">{selectedLocation.salinity} PSU</span>
              </div>
              <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                <span className="text-[9px] text-neutral-400 uppercase block font-mono">Wave Height</span>
                <span className="text-sm font-bold text-sky-400 font-mono">{selectedLocation.waveHeight} m</span>
              </div>
              <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                <span className="text-[9px] text-neutral-400 uppercase block font-mono">Chlorophyll</span>
                <span className="text-sm font-bold text-emerald-400 font-mono">{selectedLocation.chlorophyll} mg/m³</span>
              </div>
            </div>

            {/* Action Button */}
            <button
              id="telemetry-card-query-samudra-btn"
              onClick={handleQuerySamudra}
              className="w-full py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-1.5 uppercase font-mono tracking-wider cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-200" />
              <span>QUERY SAMUDRA AI</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowTelemetryCard(true)}
            className="bg-black/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 shadow-xl pointer-events-auto text-white flex items-center gap-2 text-xs font-mono font-bold hover:bg-black transition"
          >
            <Crosshair className="w-3.5 h-3.5 text-teal-400" />
            <span>SHOW TELEMETRY DRILL-DOWN</span>
          </button>
        )}
      </div>

    </div>
  );
};
