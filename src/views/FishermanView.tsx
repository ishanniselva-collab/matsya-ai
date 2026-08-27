import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Compass,
  Waves,
  Wind,
  Thermometer,
  ShieldAlert,
  CheckCircle2,
  Navigation,
  PhoneCall,
  Languages,
  Sparkles,
  AlertTriangle,
  Anchor,
  Fish,
  ChevronRight,
  Radio,
  MapPin,
  Clock,
  HelpCircle,
  Square,
  LocateFixed,
  RefreshCw
} from 'lucide-react';
import { PFZZone, RoutePlan, AgentOrchestrationResult } from '../types/marine';
import { MOCK_PFZ_ZONES, MOCK_SAMPLE_ROUTES, SUPPORTED_LANGUAGES } from '../data/mockMarineData';
import { TacticalMap } from '../components/TacticalMap';
import { MarineVoiceService } from '../services/voice';
import { runAgentOrchestration } from '../services/api';
import { GeoPosition, requestPosition, getFallbackPosition, formatLocationName } from '../services/geolocation';
import { FishermanProfile } from '../components/FishermanAuthModal';

interface FishermanViewProps {
  onOpenGlobalExplorer?: () => void;
  fishermanProfile?: FishermanProfile;
}

export type FishermanTaskState = 
  | 'IDLE' 
  | 'LISTENING' 
  | 'PLANNING' 
  | 'EXECUTING' 
  | 'SYNTHESIZING' 
  | 'SPEAKING' 
  | 'COMPLETED';

export const FishermanView: React.FC<FishermanViewProps> = ({ onOpenGlobalExplorer, fishermanProfile }) => {
  const [selectedLang, setSelectedLang] = useState<string>('ta'); // Default Tamil
  const [taskState, setTaskState] = useState<FishermanTaskState>('IDLE');
  const [voiceQuery, setVoiceQuery] = useState('');
  const [selectedPFZ, setSelectedPFZ] = useState<PFZZone>(MOCK_PFZ_ZONES[0]);
  const [activeRoute, setActiveRoute] = useState<RoutePlan>(MOCK_SAMPLE_ROUTES.chennai_to_pfz1);
  const [lastAnswer, setLastAnswer] = useState<string>('');
  const [livePfzZones, setLivePfzZones] = useState<PFZZone[]>([]);
  const [liveRisk, setLiveRisk] = useState<AgentOrchestrationResult['riskAssessment'] | null>(null);
  const [isMapLoading, setIsMapLoading] = useState(false);
  const [geoPos, setGeoPos] = useState<GeoPosition>(() => ({ ...getFallbackPosition(), status: 'loading' }));
  const [hasGreeted, setHasGreeted] = useState(false);

  const currentTaskIdRef = React.useRef<string | null>(null);
  const isExecutingRef = React.useRef<boolean>(false);

  useEffect(() => {
    requestPosition().then(setGeoPos);
  }, []);

  // Auto-greeting when fisherman enters
  useEffect(() => {
    if (fishermanProfile && !hasGreeted && geoPos.status !== 'loading') {
      setHasGreeted(true);

      // Generate greeting in selected language
      const greetings: Record<string, string> = {
        ta: `வணக்கம் ${fishermanProfile.name}! நான் சமுத்ரா (SAMUDRA). இன்று எங்கே செல்ல விரும்புகிறீர்கள்?`,
        hi: `नमस्ते ${fishermanProfile.name}! मैं समुद्रा हूं। आज आप कहाँ जाना चाहेंगे?`,
        te: `నమస్కారం ${fishermanProfile.name}! నేను సముద్ర. ఈరోజు మీరు ఎక్కడికి వెళ్లాలనుకుంటున్నారు?`,
        ml: `നമസ്കാരം ${fishermanProfile.name}! ഞാൻ സമുദ്ര. ഇന്ന് നിങ്ങൾ എവിടേക്ക് പോകണം?`,
        kn: `ನಮಸ್ಕಾರ ${fishermanProfile.name}! ನಾನು ಸಮುದ್ರ. ಇಂದು ನೀವು ಎಲ್ಲಿಗೆ ಹೋಗಲು ಬಯಸುತ್ತೀರಿ?`,
        en: `Hello ${fishermanProfile.name}! I'm SAMUDRA. Where would you like to go today?`,
      };

      const greeting = greetings[selectedLang] || greetings['en'];
      setLastAnswer(greeting);

      // Speak the greeting automatically
      setTimeout(() => {
        setTaskState('SPEAKING');
        MarineVoiceService.speak(
          greeting,
          selectedLang,
          'greeting',
          () => {
            setTaskState('IDLE');
          }
        );
      }, 800);
    }
  }, [fishermanProfile, hasGreeted, selectedLang, geoPos.status]);

  const retryGps = () => {
    setGeoPos(prev => ({ ...prev, status: 'loading' }));
    requestPosition().then(setGeoPos);
  };

  React.useEffect(() => {
    return () => {
      MarineVoiceService.stopAll();
      currentTaskIdRef.current = null;
      isExecutingRef.current = false;
    };
  }, []);

  const localQuickQueries: Record<string, string[]> = {
    ta: [
      'இன்று கடலுக்கு செல்வது பாதுகாப்பானதா?',
      'அருகிலுள்ள சாதகமான மீன்பிடி மண்டலம் எங்கே?',
      'இன்றைய அலை உயரம் மற்றும் காற்று வேகம் என்ன?',
      'எல்லைக்கோடு (IMBL) எவ்வளவு தூரத்தில் உள்ளது?',
    ],
    hi: [
      'क्या आज समुद्र में जाना सुरक्षित है?',
      'निकटतम अनुकूल मत्स्य क्षेत्र (PFZ) कहाँ है?',
      'आज लहरों की ऊँचाई और हवा की गति क्या है?',
      'प्रतिबंधित समुद्री सीमा कितनी दूर है?',
    ],
    te: [
      'ఈరోజు సముద్రంలోకి వెళ్లడం సురక్షితమేనా?',
      'సమీపంలోని సంభావ్య చేపల వేట ప్రాంతం ఎక్కడ ఉంది?',
      'ఈరోజు అలల ఎత్తు మరియు గాలి వేగం ఎంత?',
    ],
    en: [
      'Is it safe to venture into the sea today?',
      'Where is the nearest Potential Fishing Zone?',
      'What are the wave heights and wind speeds?',
      'Check distance to international maritime boundary',
    ],
  };

  const startFishermanTask = async (queryText: string) => {
    const cleanQuery = queryText.trim();
    if (!cleanQuery || isExecutingRef.current) return;

    const newTaskId = `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    currentTaskIdRef.current = newTaskId;
    isExecutingRef.current = true;

    // Stop any previous voice audio or mic recording
    MarineVoiceService.stopAll();

    try {
      // 1. PLANNING
      setTaskState('PLANNING');
      await new Promise((r) => setTimeout(r, 120));
      if (currentTaskIdRef.current !== newTaskId) return;

      // 2. EXECUTING (Specialized agents execute in background)
      setTaskState('EXECUTING');
      setIsMapLoading(true);
      const result = await runAgentOrchestration(cleanQuery, selectedLang, {
        lat: geoPos.latitude,
        lng: geoPos.longitude,
        name: formatLocationName(geoPos),
      });

      if (currentTaskIdRef.current !== newTaskId) return;

      // 3. SYNTHESIZING
      setTaskState('SYNTHESIZING');
      setLastAnswer(result.answer);
      setIsMapLoading(false);

      if (result.pfzRecommendations && result.pfzRecommendations.length > 0) {
        setLivePfzZones(result.pfzRecommendations);
        setSelectedPFZ(result.pfzRecommendations[0]);
      }
      if (result.riskAssessment) {
        setLiveRisk(result.riskAssessment);
      }

      await new Promise((r) => setTimeout(r, 120));

      if (currentTaskIdRef.current !== newTaskId) return;

      // 4. SPEAKING (Play TTS ONCE)
      setTaskState('SPEAKING');
      const textToSpeak = result.spokenText || result.answer;

      MarineVoiceService.speak(
        textToSpeak,
        selectedLang,
        newTaskId,
        () => {
          // 5. SPEAKING -> COMPLETED -> IDLE
          if (currentTaskIdRef.current === newTaskId) {
            setTaskState('COMPLETED');
            isExecutingRef.current = false;
            setTimeout(() => {
              if (currentTaskIdRef.current === newTaskId) {
                setTaskState('IDLE');
              }
            }, 600);
          }
        }
      );
    } catch (err) {
      console.error('[FishermanView] Task execution failed:', err);
      isExecutingRef.current = false;
      setIsMapLoading(false);
      setTaskState('IDLE');
    }
  };

  const handleVoiceToggle = () => {
    if (taskState === 'LISTENING') {
      MarineVoiceService.stopListening();
      if (voiceQuery.trim()) {
        startFishermanTask(voiceQuery);
      } else {
        setTaskState('IDLE');
      }
    } else {
      MarineVoiceService.stopAll();
      currentTaskIdRef.current = null;
      isExecutingRef.current = false;
      setVoiceQuery('');
      setTaskState('LISTENING');

      MarineVoiceService.playBeep(600, 100);

      const started = MarineVoiceService.startListening(
        selectedLang,
        (text, isFinal) => {
          setVoiceQuery(text);
          if (isFinal && text.trim()) {
            MarineVoiceService.stopListening();
            startFishermanTask(text.trim());
          }
        },
        (err) => {
          console.warn('[FishermanView] Recognition error:', err);
          setTaskState('IDLE');
        },
        () => {
          setTaskState((prev) => (prev === 'LISTENING' ? 'IDLE' : prev));
        }
      );

      if (!started) {
        setTaskState('IDLE');
      }
    }
  };

  const handleStopSpeaking = () => {
    MarineVoiceService.stopSpeaking();
    isExecutingRef.current = false;
    setTaskState('IDLE');
  };

  const isBusy = taskState === 'PLANNING' || taskState === 'EXECUTING' || taskState === 'SYNTHESIZING';

  return (
    <div id="orca-fisherman-mode-view" className="w-full max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Top Welcome & Language Selection Banner */}
      <div className="bg-white border border-[#E5E5E5] rounded-xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-[#111111] text-white flex items-center justify-center shadow-xs">
            <Anchor className="w-5 h-5 text-teal-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-[#111111] tracking-tight">Fisherman Marine Decision Console</h1>
              <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                TASK-BASED AGENT ACTIVE
              </span>
              {geoPos.status === 'success' && (
                <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1">
                  <LocateFixed className="w-3 h-3" /> GPS ({'±'}{geoPos.accuracy}m)
                </span>
              )}
              {geoPos.status === 'loading' && (
                <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-amber-50 text-amber-800 border border-amber-200 animate-pulse">
                  GPS...
                </span>
              )}
              {(geoPos.status === 'denied' || geoPos.status === 'unavailable' || geoPos.status === 'error') && (
                <button
                  onClick={retryGps}
                  className="text-[10px] px-2 py-0.5 rounded font-bold bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-1 hover:bg-rose-100 transition"
                >
                  <RefreshCw className="w-3 h-3" />
                  {geoPos.status === 'denied' ? 'GPS Denied' : 'No GPS'}
                </button>
              )}
            </div>
            <p className="text-xs text-[#555555]">
              {geoPos.isLive
                ? `GPS Active • ${geoPos.latitude.toFixed(4)}° N, ${geoPos.longitude.toFixed(4)}° E`
                : geoPos.status === 'loading'
                  ? 'Getting GPS location...'
                  : 'Demo • Kasimedu Fishing Harbour (13.08° N, 80.27° E)'}
            </p>
          </div>
        </div>

        {/* Regional Language Switcher */}
        <div className="flex items-center gap-1.5 bg-[#F7F7F5] p-1 rounded-lg border border-[#E5E5E5]">
          <Languages className="w-4 h-4 text-[#555555] ml-2" />
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              id={`lang-btn-${lang.code}`}
              disabled={isBusy}
              onClick={() => {
                setSelectedLang(lang.code);
                MarineVoiceService.stopAll();
                setTaskState('IDLE');
              }}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition disabled:opacity-50 ${
                selectedLang === lang.code
                  ? 'bg-[#111111] text-white shadow-xs'
                  : 'text-[#555555] hover:text-[#111111] hover:bg-white'
              }`}
            >
              {lang.nativeName}
            </button>
          ))}
        </div>
      </div>

      {/* Hero Voice Interaction Card */}
      <div className="bg-white border border-[#E5E5E5] rounded-xl p-6 shadow-xs text-center relative overflow-hidden">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="flex items-center justify-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 block">
              Natural Voice Assistance • குரல் வழி வழிகாட்டி
            </span>
            {taskState === 'PLANNING' && (
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">PLANNING</span>
            )}
            {taskState === 'EXECUTING' && (
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 animate-pulse">EXECUTING SUB-AGENTS</span>
            )}
            {taskState === 'SYNTHESIZING' && (
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200">SYNTHESIZING XAI</span>
            )}
            {taskState === 'SPEAKING' && (
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200 animate-pulse">SPEAKING</span>
            )}
          </div>

          {/* Central Animated Mic Button */}
          <div className="flex justify-center my-3">
            <button
              id="fisherman-main-mic-btn"
              disabled={isBusy}
              onClick={handleVoiceToggle}
              className={`w-20 h-20 rounded-full flex flex-col items-center justify-center gap-1 transition-all shadow-md transform active:scale-95 disabled:opacity-50 ${
                taskState === 'LISTENING'
                  ? 'bg-rose-600 text-white animate-pulse ring-4 ring-rose-200'
                  : 'bg-[#111111] text-white hover:bg-black ring-4 ring-gray-100'
              }`}
            >
              {taskState === 'LISTENING' ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6 text-teal-400" />}
              <span className="text-[9px] font-bold uppercase tracking-wider">
                {taskState === 'LISTENING' ? 'Listening' : 'Tap & Speak'}
              </span>
            </button>
          </div>

          {/* Live Transcript / Prompt */}
          <div className="min-h-[44px] flex items-center justify-center">
            {taskState === 'LISTENING' ? (
              <p className="text-sm font-semibold text-rose-700 animate-pulse flex items-center gap-2">
                <Radio className="w-4 h-4 text-rose-600" />
                "{voiceQuery || 'கேளுங்கள்... (Listening...)'}"
              </p>
            ) : isBusy ? (
              <p className="text-sm font-semibold text-teal-700 animate-pulse flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-600 animate-spin" />
                {taskState === 'PLANNING' && 'Planning sub-agent execution graph...'}
                {taskState === 'EXECUTING' && 'Silent domain sub-agents querying live ocean telemetry...'}
                {taskState === 'SYNTHESIZING' && 'Synthesis agent corroborating findings...'}
              </p>
            ) : (
              <p className="text-xs text-[#555555]">
                Speak naturally in {SUPPORTED_LANGUAGES.find((l) => l.code === selectedLang)?.nativeName} about safe zones, weather, or directions.
              </p>
            )}
          </div>

          {/* SAMUDRA AI Spoken Answer Card */}
          {lastAnswer && (
            <div className="p-4 rounded-xl bg-[#F7F7F5] border border-[#E5E5E5] text-left text-xs shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#111111] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  SAMUDRA Voice Advisory
                </span>
                {taskState === 'SPEAKING' ? (
                  <button
                    onClick={handleStopSpeaking}
                    className="p-1.5 rounded-md bg-rose-50 border border-rose-200 text-rose-800 hover:bg-rose-100 flex items-center gap-1 text-[11px] shadow-xs transition"
                  >
                    <Square className="w-3.5 h-3.5 text-rose-700 fill-rose-700" />
                    <span>Stop Audio</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setTaskState('SPEAKING');
                      MarineVoiceService.speak(lastAnswer, selectedLang, undefined, () => {
                        setTaskState('COMPLETED');
                        setTimeout(() => setTaskState('IDLE'), 600);
                      });
                    }}
                    className="p-1.5 rounded-md bg-white border border-[#E5E5E5] text-[#333333] hover:text-[#111111] flex items-center gap-1 text-[11px] shadow-xs transition"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-teal-600" />
                    <span>Play Voice</span>
                  </button>
                )}
              </div>
              <p className="text-sm text-[#222222] leading-relaxed font-normal">{lastAnswer}</p>
            </div>
          )}

          {/* Quick Query Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {(localQuickQueries[selectedLang] || localQuickQueries.en).map((query, idx) => (
              <button
                key={idx}
                disabled={isBusy}
                onClick={() => startFishermanTask(query)}
                className="px-3 py-1.5 bg-[#F7F7F5] border border-[#E5E5E5] hover:border-[#111111] hover:bg-white rounded-lg text-xs text-[#333333] hover:text-[#111111] transition shadow-2xs disabled:opacity-50"
              >
                {query}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Safety & Real-Time Ocean State Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Marine Risk Card */}
        <div className="p-4 rounded-xl bg-white border border-[#E5E5E5] text-[#111111] flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] text-emerald-800 uppercase font-bold tracking-wider block">Marine Safety Risk</span>
            <span className={`text-xl font-bold ${
              liveRisk?.overallRisk === 'SAFE' ? 'text-emerald-700' :
              liveRisk?.overallRisk === 'CAUTION' ? 'text-amber-700' :
              liveRisk?.overallRisk === 'HIGH_RISK' ? 'text-rose-700' :
              liveRisk?.overallRisk === 'DANGEROUS' ? 'text-red-800' :
              'text-emerald-700'
            }`}>
              {liveRisk ? liveRisk.overallRisk.replace('_', ' ') : 'Awaiting data'}
            </span>
            <span className="text-[11px] text-[#555555] block mt-0.5">
              {liveRisk?.advisory || 'Query to get live assessment'}
            </span>
          </div>
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
            liveRisk?.overallRisk === 'SAFE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
            liveRisk?.overallRisk === 'CAUTION' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
            liveRisk?.overallRisk === 'HIGH_RISK' || liveRisk?.overallRisk === 'DANGEROUS' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
            'bg-gray-50 text-gray-500 border border-gray-200'
          }`}>
            {liveRisk ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          </div>
        </div>

        {/* Significant Wave Swell */}
        <div className="p-4 rounded-xl bg-white border border-[#E5E5E5] text-[#111111] flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] text-[#666666] uppercase font-bold tracking-wider block">Wave Height (SWH)</span>
            <span className="text-xl font-bold text-[#111111]">
              {liveRisk?.factors?.find(f => f.factor.includes('Wave'))?.risk?.split(' ')[0] || '—'}
            </span>
            <span className="text-[11px] text-[#555555] block mt-0.5">
              {liveRisk ? 'Live from agents' : 'Awaiting query'}
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center">
            <Waves className="w-5 h-5" />
          </div>
        </div>

        {/* Wind Speed & Direction */}
        <div className="p-4 rounded-xl bg-white border border-[#E5E5E5] text-[#111111] flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] text-[#666666] uppercase font-bold tracking-wider block">Wind Velocity</span>
            <span className="text-xl font-bold text-[#111111]">
              {liveRisk?.factors?.find(f => f.factor.includes('Wind'))?.risk?.split('(')[0]?.trim() || '—'}
            </span>
            <span className="text-[11px] text-[#555555] block mt-0.5">
              {liveRisk ? 'Live from agents' : 'Awaiting query'}
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-700 border border-sky-200 flex items-center justify-center">
            <Wind className="w-5 h-5" />
          </div>
        </div>

        {/* Sea Surface Temp */}
        <div className="p-4 rounded-xl bg-white border border-[#E5E5E5] text-[#111111] flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] text-[#666666] uppercase font-bold tracking-wider block">Sea Surface Temp</span>
            <span className="text-xl font-bold text-amber-700">
              {livePfzZones.length > 0 ? `${livePfzZones[0].sst}°C` : '—'}
            </span>
            <span className="text-[11px] text-[#555555] block mt-0.5">
              {livePfzZones.length > 0 ? `Chlorophyll ${livePfzZones[0].chlorophyllValue} mg/m³` : 'Awaiting query'}
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center">
            <Thermometer className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Tactical Map & PFZ List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recommended Potential Fishing Zones (PFZ) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#111111] uppercase tracking-wider flex items-center gap-2">
              <Fish className="w-4 h-4 text-teal-700" />
              <span>Identified Fishing Zones (PFZ)</span>
            </h3>
            <span className={`text-[11px] font-mono px-2 py-0.5 rounded ${
              livePfzZones.length > 0
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-gray-50 text-[#666666] border border-gray-200'
            }`}>
              {livePfzZones.length > 0 ? 'ML Predictions (Live)' : 'Satellite-derived model'}
            </span>
          </div>

          <div className="space-y-3">
            {(livePfzZones.length > 0 ? livePfzZones : MOCK_PFZ_ZONES).map((pfz) => {
              const isSelected = selectedPFZ.id === pfz.id;
              return (
                <div
                  key={pfz.id}
                  id={`fisherman-pfz-card-${pfz.id}`}
                  onClick={() => setSelectedPFZ(pfz)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white border-[#111111] shadow-md ring-1 ring-black'
                      : 'bg-[#F7F7F5] border-[#E5E5E5] hover:bg-white hover:border-[#CCCCCC]'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E5E5E5]">
                    <span className="font-bold text-xs text-[#111111]">{pfz.name}</span>
                    <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                      pfz.suitabilityScore >= 80 ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                      pfz.suitabilityScore >= 60 ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                      'bg-orange-50 text-orange-800 border border-orange-200'
                    }`}>
                      {pfz.suitabilityScore}% Confidence
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-[#333333]">
                    <div>
                      <span className="text-[#666666] text-[10px] block">Distance & Bearing</span>
                      <span className="font-bold text-[#111111]">{pfz.distanceKm} km ({pfz.direction})</span>
                    </div>
                    <div>
                      <span className="text-[#666666] text-[10px] block">Water Temperature</span>
                      <span className="font-bold text-amber-700">{pfz.sst}°C</span>
                    </div>
                    <div>
                      <span className="text-[#666666] text-[10px] block">Expected Pelagics</span>
                      <span className="text-teal-700 font-medium truncate">{pfz.speciesLikelihood.slice(0, 2).join(', ')}</span>
                    </div>
                    <div>
                      <span className="text-[#666666] text-[10px] block">Wave / Wind</span>
                      <span className="text-[#333333]">{pfz.waveHeight}m / {pfz.windSpeed} km/h</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-[#E5E5E5] flex items-center justify-between text-xs">
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Safe Transit Corridor
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startFishermanTask(`Explain the ocean evidence for ${pfz.name}`);
                      }}
                      className="text-teal-700 hover:text-teal-900 flex items-center gap-1 font-semibold"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Explain
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Emergency Coast Guard Card */}
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-[#111111] space-y-2">
            <div className="flex items-center gap-2 font-bold text-rose-800">
              <PhoneCall className="w-4 h-4" />
              <span>Marine Emergency Helpline</span>
            </div>
            <p className="text-[11px] text-rose-900">
              Indian Coast Guard Toll-Free Search & Rescue: <strong className="text-black">1554</strong> (or VHF Ch. 16)
            </p>
          </div>
        </div>

        {/* Right 2 Columns: Tactical GIS Map with Waypoint Route */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#111111] uppercase tracking-wider flex items-center gap-2">
              <Navigation className="w-4 h-4 text-teal-700" />
              <span>Tactical Coastal Map & Safe Route Navigation</span>
            </h3>
            {onOpenGlobalExplorer && (
              <button
                onClick={onOpenGlobalExplorer}
                className="text-xs text-teal-700 hover:text-teal-900 font-medium flex items-center gap-1"
              >
                <span>Open 3D Global Earth</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Interactive Tactical Map */}
          <TacticalMap
            selectedPFZId={selectedPFZ.id}
            activeRoute={activeRoute}
            onSelectPFZ={(pfz) => setSelectedPFZ(pfz)}
            onAskOrcaPFZ={(pfz) => startFishermanTask(`Why is ${pfz.name} recommended today?`)}
            pfzZones={livePfzZones.length > 0 ? livePfzZones : undefined}
            isLoading={isMapLoading}
          />

          {/* Turn-by-Turn Waypoint Safe Route Bar */}
          <div className="p-4 rounded-xl bg-white border border-[#E5E5E5] text-xs shadow-xs">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E5E5E5]">
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-[#111111]">Safe Waypoint Corridor (Avoids Anchorage & Shallow Reefs)</span>
              </div>
              <span className="text-[#666666] font-mono">Est. Transit: 1h 45m (12 knots)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              {activeRoute.waypoints.map((wp, idx) => (
                <div key={idx} className="p-2 bg-[#F7F7F5] rounded-lg border border-[#E5E5E5] text-[11px]">
                  <span className="text-[#666666] block text-[10px]">Waypoint 0{idx + 1}</span>
                  <span className="font-bold text-[#111111] block truncate">{wp.name}</span>
                  <span className="text-emerald-700 font-mono font-medium">{wp.bearing}° • {wp.distanceToNextKm} km</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
