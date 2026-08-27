import React, { useEffect, useState } from 'react';
import { Navigation, MapPin, Clock, Gauge, AlertTriangle, CheckCircle2, Square } from 'lucide-react';
import { GeoPosition } from '../services/geolocation';
import { MarineVoiceService } from '../services/voice';

interface FishermanNavigationProps {
  destination: {
    lat: number;
    lng: number;
    name: string;
  };
  currentPosition: GeoPosition;
  selectedLanguage: string;
  onEndTrip: () => void;
  onContinue: () => void;
}

export const FishermanNavigation: React.FC<FishermanNavigationProps> = ({
  destination,
  currentPosition,
  selectedLanguage,
  onEndTrip,
  onContinue,
}) => {
  const [distanceRemaining, setDistanceRemaining] = useState<number>(0);
  const [lastAnnouncedDistance, setLastAnnouncedDistance] = useState<number | null>(null);
  const [hasArrived, setHasArrived] = useState(false);
  const [estimatedSpeed] = useState(12); // 12 knots average

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  useEffect(() => {
    const dist = calculateDistance(
      currentPosition.latitude,
      currentPosition.longitude,
      destination.lat,
      destination.lng
    );
    setDistanceRemaining(dist);

    // Arrival detection (within 500m)
    if (dist < 0.5 && !hasArrived) {
      setHasArrived(true);
      announceArrival();
    }

    // Distance announcements
    if (!hasArrived) {
      const thresholds = [10, 5, 3, 1, 0.5];
      for (const threshold of thresholds) {
        if (
          dist <= threshold &&
          (lastAnnouncedDistance === null || lastAnnouncedDistance > threshold)
        ) {
          announceDistance(threshold);
          setLastAnnouncedDistance(threshold);
          break;
        }
      }
    }
  }, [currentPosition, destination, hasArrived, lastAnnouncedDistance]);

  const announceDistance = (distanceKm: number) => {
    const announcements: Record<string, Record<number, string>> = {
      en: {
        10: 'You are 10 kilometres away from your destination.',
        5: 'You are 5 kilometres away.',
        3: 'You are 3 kilometres away.',
        1: 'You are 1 kilometre away.',
        0.5: 'You are approaching your fishing zone.',
      },
      ta: {
        10: 'நீங்கள் 10 கிலோமீட்டர் தொலைவில் உள்ளீர்கள்.',
        5: 'நீங்கள் 5 கிலோமீட்டர் தொலைவில் உள்ளீர்கள்.',
        3: 'நீங்கள் 3 கிலோமீட்டர் தொலைவில் உள்ளீர்கள்.',
        1: 'நீங்கள் 1 கிலோமீட்டர் தொலைவில் உள்ளீர்கள்.',
        0.5: 'நீங்கள் மீன்பிடி மண்டலத்தை நெருங்குகிறீர்கள்.',
      },
      hi: {
        10: 'आप 10 किलोमीटर दूर हैं।',
        5: 'आप 5 किलोमीटर दूर हैं।',
        3: 'आप 3 किलोमीटर दूर हैं।',
        1: 'आप 1 किलोमीटर दूर हैं।',
        0.5: 'आप मत्स्य क्षेत्र के करीब पहुंच रहे हैं।',
      },
    };

    const message =
      announcements[selectedLanguage]?.[distanceKm] ||
      announcements['en'][distanceKm];

    if (message) {
      MarineVoiceService.speak(message, selectedLanguage);
    }
  };

  const announceArrival = () => {
    const arrivals: Record<string, string> = {
      en: 'You have reached the fishing zone. Would you like to end your trip or continue?',
      ta: 'நீங்கள் மீன்பிடி மண்டலத்தை அடைந்துவிட்டீர்கள். பயணத்தை முடிக்கலாமா அல்லது தொடரலாமா?',
      hi: 'आप मत्स्य क्षेत्र पहुंच गए हैं। क्या आप अपनी यात्रा समाप्त करना चाहेंगे या जारी रखना चाहेंगे?',
      te: 'మీరు చేపల వేట ప్రాంతానికి చేరుకున్నారు. మీరు ప్రయాణాన్ని ముగించాలనుకుంటున్నారా లేదా కొనసాగించాలనుకుంటున్నారా?',
      ml: 'നിങ്ങൾ മത്സ്യബന്ധന മേഖലയിൽ എത്തി. യാത്ര അവസാനിപ്പിക്കണോ അല്ലെങ്കിൽ തുടരണോ?',
      kn: 'ನೀವು ಮೀನುಗಾರಿಕೆ ವಲಯವನ್ನು ತಲುಪಿದ್ದೀರಿ. ನೀವು ಪ್ರಯಾಣವನ್ನು ಕೊನೆಗೊಳಿಸಲು ಅಥವಾ ಮುಂದುವರಿಸಲು ಬಯಸುವಿರಾ?',
    };

    const message = arrivals[selectedLanguage] || arrivals['en'];
    MarineVoiceService.speak(message, selectedLanguage);
  };

  const eta = distanceRemaining > 0 ? (distanceRemaining / (estimatedSpeed * 1.852)) * 60 : 0; // Convert knots to km/h

  return (
    <div className="fixed inset-0 z-40 bg-white flex flex-col">
      {/* Navigation Header */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white p-4 shadow-md">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Navigation className="w-5 h-5" />
            <span className="text-sm font-bold uppercase tracking-wider">
              {hasArrived ? 'ARRIVED' : 'NAVIGATING'}
            </span>
          </div>
          <button
            onClick={onContinue}
            className="p-1.5 rounded-md bg-white/20 hover:bg-white/30 transition"
          >
            <Square className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-teal-100">
            <MapPin className="w-4 h-4" />
            <span className="text-xs font-medium">{destination.name}</span>
          </div>
        </div>
      </div>

      {/* Navigation Stats */}
      <div className="grid grid-cols-3 gap-3 p-4 bg-[#F7F7F5]">
        <div className="bg-white p-3 rounded-xl border border-[#E5E5E5] text-center">
          <div className="text-[10px] text-[#666666] uppercase tracking-wider mb-1">Distance</div>
          <div className="text-xl font-bold text-[#111111]">
            {distanceRemaining.toFixed(1)} km
          </div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-[#E5E5E5] text-center">
          <div className="text-[10px] text-[#666666] uppercase tracking-wider mb-1">ETA</div>
          <div className="text-xl font-bold text-[#111111]">
            {Math.ceil(eta)} min
          </div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-[#E5E5E5] text-center">
          <div className="text-[10px] text-[#666666] uppercase tracking-wider mb-1">Speed</div>
          <div className="text-xl font-bold text-[#111111]">{estimatedSpeed} kn</div>
        </div>
      </div>

      {/* Arrival Card */}
      {hasArrived && (
        <div className="m-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-700" />
            <span className="text-sm font-bold text-emerald-900">Destination Reached</span>
          </div>
          <p className="text-xs text-emerald-800 mb-3">
            You have successfully reached {destination.name}. Would you like to end this trip or continue exploring?
          </p>
          <div className="flex gap-2">
            <button
              onClick={onEndTrip}
              className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-sm transition"
            >
              End Trip
            </button>
            <button
              onClick={onContinue}
              className="flex-1 py-2.5 px-4 bg-white hover:bg-gray-50 border border-[#E5E5E5] text-[#111111] rounded-lg font-semibold text-sm transition"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Map Placeholder */}
      <div className="flex-1 bg-[#EBF4F6] flex items-center justify-center text-[#666666]">
        <div className="text-center">
          <MapPin className="w-12 h-12 mx-auto mb-2 text-teal-600" />
          <p className="text-sm font-medium">Navigation Map</p>
          <p className="text-xs text-[#999999]">Real-time route tracking active</p>
        </div>
      </div>
    </div>
  );
};
