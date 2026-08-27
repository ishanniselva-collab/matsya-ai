import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  MapPin,
  History,
  Shield,
  Sparkles,
  Navigation,
  Radio,
  Square,
  Waves,
  Wind,
  Thermometer,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  LocateFixed,
  Anchor
} from 'lucide-react';
import { PFZZone, RoutePlan, AgentOrchestrationResult } from '../types/marine';
import { SafetyAlert, NavigationState, FishermanTrip } from '../types/fisherman';
import { MOCK_PFZ_ZONES, MOCK_SAMPLE_ROUTES, SUPPORTED_LANGUAGES } from '../data/mockMarineData';
import { TacticalMap } from '../components/TacticalMap';
import { SafetyAlertComponent } from '../components/SafetyAlert';
import { FishermanTripHistory } from '../components/FishermanTripHistory';
import { FishermanNavigation } from '../components/FishermanNavigation';
import { FishermanProfile } from '../components/FishermanAuthModal';
import { MarineVoiceService } from '../services/voice';
import { runAgentOrchestration } from '../services/api';
import { GeoPosition, requestPosition, getFallbackPosition, formatLocationName } from '../services/geolocation';
import { TripHistoryService } from '../services/tripHistory';

interface FishermanViewNewProps {
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

type ViewMode = 'home' | 'trips' | 'safety';

export const FishermanViewNew: React.FC<FishermanViewNewProps> = ({
  onOpenGlobalExplorer,
  fishermanProfile
}) => {
  // Core state
  const [selectedLang, setSelectedLang] = useState<string>('ta');
  const [taskState, setTaskState] = useState<FishermanTaskState>('IDLE');
  const [voiceQuery, setVoiceQuery] = useState('');
  const [lastAnswer, setLastAnswer] = useState<string>('');
  const [hasGreeted, setHasGreeted] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('home');

  // Marine data state
  const [selectedPFZ, setSelectedPFZ] = useState<PFZZone>(MOCK_PFZ_ZONES[0]);
  const [livePfzZones, setLivePfzZones] = useState<PFZZone[]>([]);
  const [liveRisk, setLiveRisk] = useState<AgentOrchestrationResult['riskAssessment'] | null>(null);
  const [isMapLoading, setIsMapLoading] = useState(false);
  const [geoPos, setGeoPos] = useState<GeoPosition>(() => ({ ...getFallbackPosition(), status: 'loading' }));

  // Navigation state
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigationDest, setNavigationDest] = useState<{ lat: number; lng: number; name: string } | null>(null);

  // Safety alerts
  const [safetyAlerts, setSafetyAlerts] = useState<SafetyAlert[]>([]);

  const currentTaskIdRef = React.useRef<string | null>(null);
  const isExecutingRef = React.useRef<boolean>(false);

  // Initialize GPS
  useEffect(() => {
    requestPosition().then(setGeoPos);
  }, []);

  const retryGps = () => {
    setGeoPos(prev => ({ ...prev, status: 'loading' }));
    requestPosition().then(setGeoPos);
  };

  // Auto-greeting when fisherman enters
  useEffect(() => {
    if (fishermanProfile && !hasGreeted && geoPos.status !== 'loading') {
      setHasGreeted(true);

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      MarineVoiceService.stopAll();
      currentTaskIdRef.current = null;
      isExecutingRef.current = false;
    };
  }, []);

  // Monitor for safety conditions during navigation
  useEffect(() => {
    if (isNavigating && liveRisk) {
      // Check for high risk conditions
      if (liveRisk.overallRisk === 'HIGH_RISK' || liveRisk.overallRisk === 'DANGEROUS') {
        const alert: SafetyAlert = {
          id: `alert-${Date.now()}`,
          type: 'WEATHER',
          severity: 'CRITICAL',
          title: 'High Risk Conditions Detected',
          message: liveRisk.advisory || 'Marine conditions have become dangerous.',
          recommendation: 'Consider returning to shore or seeking shelter.',
          timestamp: new Date().toISOString(),
          dismissed: false,
        };
        setSafetyAlerts(prev => [alert, ...prev]);
      }
    }
  }, [isNavigating, liveRisk]);

  const startFishermanTask = async (queryText: string) => {
    const cleanQuery = queryText.trim();
    if (!cleanQuery || isExecutingRef.current) return;

    const newTaskId = `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    currentTaskIdRef.current = newTaskId;
    isExecutingRef.current = true;

    MarineVoiceService.stopAll();

    try {
      setTaskState('PLANNING');
      await new Promise((r) => setTimeout(r, 120));
      if (currentTaskIdRef.current !== newTaskId) return;

      setTaskState('EXECUTING');
      setIsMapLoading(true);
      const result = await runAgentOrchestration(cleanQuery, selectedLang, {
        lat: geoPos.latitude,
        lng: geoPos.longitude,
        name: formatLocationName(geoPos),
      });

      if (currentTaskIdRef.current !== newTaskId) return;

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

      setTaskState('SPEAKING');
      const textToSpeak = result.spokenText || result.answer;

      MarineVoiceService.speak(
        textToSpeak,
        selectedLang,
        newTaskId,
        () => {
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

  const handleNavigateToDestination = (dest: { lat: number; lng: number; name: string }) => {
    setNavigationDest(dest);
    setIsNavigating(true);

    // Start trip recording
    const trip: FishermanTrip = {
      id: `trip-${Date.now()}`,
      fishermanName: fishermanProfile?.name || 'Unknown',
      startTime: new Date().toISOString(),
      origin: {
        lat: geoPos.latitude,
        lng: geoPos.longitude,
        name: formatLocationName(geoPos),
      },
      destination: dest,
      distanceKm: 0, // Will be calculated
      weatherConditions: {
        waveHeight: liveRisk?.factors?.find(f => f.factor.includes('Wave'))?.risk?.split(' ')[0] ? parseFloat(liveRisk.factors.find(f => f.factor.includes('Wave'))!.risk.split(' ')[0]) : 0.8,
        windSpeed: 14,
        risk: liveRisk?.overallRisk === 'SAFE' ? 'SAFE' : 'CAUTION',
      },
      status: 'ONGOING',
    };

    TripHistoryService.saveTrip(trip);
  };

  const handleEndTrip = () => {
    setIsNavigating(false);
    setNavigationDest(null);
    // Update trip status to completed
    // (In production, would update the ongoing trip)
  };

  const handleContinue = () => {
    setIsNavigating(false);
    setNavigationDest(null);
    setViewMode('home');
  };

  const handleReuseDestination = (dest: { lat: number; lng: number; name: string }) => {
    setViewMode('home');
    // First check current conditions at that destination
    const query = `Is it safe to go to ${dest.name} today?`;
    startFishermanTask(query);
  };

  const dismissAlert = (id: string) => {
    setSafetyAlerts(prev => prev.map(a => a.id === id ? { ...a, dismissed: true } : a));
  };

  const isBusy = taskState === 'PLANNING' || taskState === 'EXECUTING' || taskState === 'SYNTHESIZING';

  // Navigation mode full screen
  if (isNavigating && navigationDest) {
    return (
      <FishermanNavigation
        destination={navigationDest}
        currentPosition={geoPos}
        selectedLanguage={selectedLang}
        onEndTrip={handleEndTrip}
        onContinue={handleContinue}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#F7F7F5]">
      {/* Top Header - Compact */}
      <div className="bg-gradient-to-r from-[#0F172A] to-[#1E293B] text-white px-4 py-3 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Anchor className="w-5 h-5 text-teal-400" />
            <div>
              <h1 className="text-sm font-bold">SAMUDRA AI</h1>
              <p className="text-[10px] text-teal-200">Fisherman Companion</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* GPS Status */}
            {geoPos.status === 'success' && (
              <span className="text-[10px] px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <LocateFixed className="w-3 h-3" />
                GPS
              </span>
            )}
            {(geoPos.status === 'denied' || geoPos.status === 'unavailable' || geoPos.status === 'error') && (
              <button
                onClick={retryGps}
                className="text-[10px] px-2 py-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                {geoPos.status === 'denied' ? 'Denied' : 'Demo'}
              </button>
            )}

            {/* Language Selector */}
            <select
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
              disabled={isBusy}
              className="text-[10px] px-2 py-1 rounded bg-white/10 border border-white/20 text-white disabled:opacity-50"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code} className="bg-[#1E293B] text-white">
                  {lang.nativeName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto pb-20">
        {viewMode === 'home' && (
          <div className="space-y-3">
            {/* Safety Alerts */}
            {safetyAlerts.filter(a => !a.dismissed).length > 0 && (
              <div className="px-4 pt-3 space-y-2">
                {safetyAlerts.filter(a => !a.dismissed).map((alert) => (
                  <SafetyAlertComponent
                    key={alert.id}
                    alert={alert}
                    onDismiss={dismissAlert}
                    language={selectedLang}
                  />
                ))}
              </div>
            )}

            {/* Map - Takes most space */}
            <div className="px-4">
              <TacticalMap
                selectedPFZId={selectedPFZ.id}
                onSelectPFZ={(pfz) => setSelectedPFZ(pfz)}
                onAskSamudraPFZ={(pfz) => startFishermanTask(`Why is ${pfz.name} recommended today?`)}
                pfzZones={livePfzZones.length > 0 ? livePfzZones : undefined}
                isLoading={isMapLoading}
                centerLat={geoPos.latitude}
                centerLng={geoPos.longitude}
              />
            </div>

            {/* Current Conditions Strip */}
            <div className="px-4">
              <div className="bg-white rounded-lg border border-gray-200 p-3 grid grid-cols-4 gap-2 text-center">
                <div>
                  <div className="text-[10px] text-gray-600 mb-1">Wave</div>
                  <div className="text-sm font-bold text-gray-900 flex items-center justify-center gap-1">
                    <Waves className="w-3 h-3 text-teal-600" />
                    {liveRisk?.factors?.find(f => f.factor.includes('Wave'))?.risk?.split(' ')[0] || '—'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-600 mb-1">Wind</div>
                  <div className="text-sm font-bold text-gray-900 flex items-center justify-center gap-1">
                    <Wind className="w-3 h-3 text-sky-600" />
                    {liveRisk?.factors?.find(f => f.factor.includes('Wind'))?.risk?.split('(')[0]?.trim() || '—'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-600 mb-1">Temp</div>
                  <div className="text-sm font-bold text-gray-900 flex items-center justify-center gap-1">
                    <Thermometer className="w-3 h-3 text-amber-600" />
                    {livePfzZones.length > 0 ? `${livePfzZones[0].sst}°` : '—'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-600 mb-1">Risk</div>
                  <div className={`text-sm font-bold flex items-center justify-center gap-1 ${
                    liveRisk?.overallRisk === 'SAFE' ? 'text-emerald-700' :
                    liveRisk?.overallRisk === 'CAUTION' ? 'text-amber-700' : 'text-rose-700'
                  }`}>
                    {liveRisk?.overallRisk === 'SAFE' ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                    {liveRisk?.overallRisk?.replace('_', ' ') || 'Safe'}
                  </div>
                </div>
              </div>
            </div>

            {/* Voice Interaction Card */}
            <div className="px-4 pb-4">
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="text-center space-y-3">
                  {/* Large Mic Button */}
                  <button
                    disabled={isBusy}
                    onClick={handleVoiceToggle}
                    className={`w-20 h-20 mx-auto rounded-full flex flex-col items-center justify-center gap-1 transition-all shadow-lg transform active:scale-95 disabled:opacity-50 ${
                      taskState === 'LISTENING'
                        ? 'bg-rose-600 text-white animate-pulse'
                        : 'bg-gradient-to-br from-teal-600 to-teal-700 text-white hover:from-teal-700 hover:to-teal-800'
                    }`}
                  >
                    {taskState === 'LISTENING' ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                  </button>

                  <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-1">
                      {taskState === 'LISTENING' ? 'Listening...' : 'Talk to SAMUDRA'}
                    </h3>
                    <p className="text-xs text-gray-600">
                      {taskState === 'LISTENING' && voiceQuery ? `"${voiceQuery}"` :
                       isBusy ? 'Processing your request...' :
                       'Tap and speak naturally'}
                    </p>
                  </div>

                  {/* Status Badge */}
                  {(isBusy || taskState === 'SPEAKING') && (
                    <div className="flex items-center justify-center gap-2">
                      {taskState === 'PLANNING' && (
                        <span className="text-[10px] px-2 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200 font-mono">
                          PLANNING
                        </span>
                      )}
                      {taskState === 'EXECUTING' && (
                        <span className="text-[10px] px-2 py-1 rounded bg-blue-50 text-blue-800 border border-blue-200 font-mono animate-pulse">
                          AGENTS WORKING
                        </span>
                      )}
                      {taskState === 'SYNTHESIZING' && (
                        <span className="text-[10px] px-2 py-1 rounded bg-purple-50 text-purple-800 border border-purple-200 font-mono">
                          ANALYZING
                        </span>
                      )}
                      {taskState === 'SPEAKING' && (
                        <>
                          <span className="text-[10px] px-2 py-1 rounded bg-teal-50 text-teal-800 border border-teal-200 font-mono animate-pulse">
                            SPEAKING
                          </span>
                          <button
                            onClick={handleStopSpeaking}
                            className="text-[10px] px-2 py-1 rounded bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100 flex items-center gap-1"
                          >
                            <Square className="w-3 h-3" />
                            Stop
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {/* Last Response */}
                  {lastAnswer && !isBusy && (
                    <div className="text-left p-3 rounded-lg bg-gray-50 border border-gray-200">
                      <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                        <span className="text-[10px] font-bold text-gray-900">SAMUDRA Says:</span>
                      </div>
                      <p className="text-xs text-gray-800 leading-relaxed">{lastAnswer}</p>
                    </div>
                  )}

                  {/* Navigate Button (when PFZ selected) */}
                  {selectedPFZ && !isBusy && (
                    <button
                      onClick={() => handleNavigateToDestination({
                        lat: selectedPFZ.latitude,
                        lng: selectedPFZ.longitude,
                        name: selectedPFZ.name,
                      })}
                      className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition shadow-md"
                    >
                      <Navigation className="w-4 h-4" />
                      Navigate to {selectedPFZ.name}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {viewMode === 'trips' && fishermanProfile && (
          <div className="p-4">
            <FishermanTripHistory
              fishermanName={fishermanProfile.name}
              onReuseDestination={handleReuseDestination}
              language={selectedLang}
            />
          </div>
        )}

        {viewMode === 'safety' && (
          <div className="p-4 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Shield className="w-5 h-5 text-teal-600" />
              Safety Status
            </h2>

            {/* Risk Assessment Card */}
            <div className={`p-4 rounded-xl border-2 ${
              liveRisk?.overallRisk === 'SAFE' ? 'bg-emerald-50 border-emerald-200' :
              liveRisk?.overallRisk === 'CAUTION' ? 'bg-amber-50 border-amber-200' :
              'bg-rose-50 border-rose-200'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                {liveRisk?.overallRisk === 'SAFE' ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-700" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-amber-700" />
                )}
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    {liveRisk?.overallRisk || 'Awaiting Data'}
                  </h3>
                  <p className="text-xs text-gray-700">
                    {liveRisk?.advisory || 'Ask SAMUDRA for current conditions'}
                  </p>
                </div>
              </div>

              {liveRisk?.factors && (
                <div className="space-y-2">
                  {liveRisk.factors.map((factor, idx) => (
                    <div key={idx} className="text-xs text-gray-800 flex items-start gap-2">
                      <span className="font-semibold min-w-[80px]">{factor.factor}:</span>
                      <span>{factor.risk}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Active Alerts */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-2">Active Alerts</h3>
              {safetyAlerts.filter(a => !a.dismissed).length > 0 ? (
                <div className="space-y-2">
                  {safetyAlerts.filter(a => !a.dismissed).map((alert) => (
                    <SafetyAlertComponent
                      key={alert.id}
                      alert={alert}
                      onDismiss={dismissAlert}
                      language={selectedLang}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-600 text-sm">
                  No active alerts
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation Bar - Fixed */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="flex items-center justify-around">
          <button
            onClick={() => setViewMode('home')}
            className={`flex-1 py-3 flex flex-col items-center gap-1 transition ${
              viewMode === 'home' ? 'text-teal-600' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <MapPin className="w-5 h-5" />
            <span className="text-[10px] font-semibold">HOME</span>
          </button>

          <button
            onClick={() => setViewMode('trips')}
            className={`flex-1 py-3 flex flex-col items-center gap-1 transition ${
              viewMode === 'trips' ? 'text-teal-600' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <History className="w-5 h-5" />
            <span className="text-[10px] font-semibold">MY TRIPS</span>
          </button>

          <button
            onClick={() => setViewMode('safety')}
            className={`flex-1 py-3 flex flex-col items-center gap-1 transition ${
              viewMode === 'safety' ? 'text-teal-600' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Shield className="w-5 h-5" />
            <span className="text-[10px] font-semibold">SAFETY</span>
          </button>
        </div>
      </div>
    </div>
  );
};
