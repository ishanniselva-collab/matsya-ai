import React from 'react';
import {
  AlertTriangle,
  Wind,
  Waves,
  Cloud,
  Zap,
  MapPin,
  X,
  AlertCircle,
  Info
} from 'lucide-react';
import { SafetyAlert as SafetyAlertType } from '../types/fisherman';
import { MarineVoiceService } from '../services/voice';

interface SafetyAlertProps {
  alert: SafetyAlertType;
  onDismiss: (id: string) => void;
  language?: string;
}

const ALERT_ICONS = {
  WEATHER: Cloud,
  WAVE: Waves,
  WIND: Wind,
  GEOFENCE: MapPin,
  CYCLONE: Cloud,
  LIGHTNING: Zap,
};

export const SafetyAlertComponent: React.FC<SafetyAlertProps> = ({
  alert,
  onDismiss,
  language = 'en',
}) => {
  const Icon = ALERT_ICONS[alert.type] || AlertTriangle;

  // Announce alert via voice when it appears
  React.useEffect(() => {
    if (!alert.dismissed && alert.severity !== 'INFO') {
      const message = `${alert.title}. ${alert.message}`;
      MarineVoiceService.speak(message, language);
    }
  }, [alert.id, alert.dismissed]);

  if (alert.dismissed) return null;

  const severityStyles = {
    INFO: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-900',
      icon: 'text-blue-600',
      badge: 'bg-blue-100 text-blue-800',
    },
    WARNING: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-900',
      icon: 'text-amber-600',
      badge: 'bg-amber-100 text-amber-800',
    },
    CRITICAL: {
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      text: 'text-rose-900',
      icon: 'text-rose-600',
      badge: 'bg-rose-100 text-rose-800',
    },
  };

  const style = severityStyles[alert.severity];

  return (
    <div
      className={`${style.bg} ${style.border} border-2 rounded-xl p-4 shadow-md animate-in slide-in-from-top duration-300`}
    >
      <div className="flex items-start gap-3">
        <div className={`${style.icon} shrink-0 mt-0.5`}>
          <Icon className="w-6 h-6" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <h3 className={`text-sm font-bold ${style.text}`}>
                {alert.title}
              </h3>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${style.badge}`}>
                {alert.severity}
              </span>
            </div>
            <button
              onClick={() => onDismiss(alert.id)}
              className={`${style.icon} hover:opacity-70 transition`}
              aria-label="Dismiss alert"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className={`text-sm ${style.text} leading-relaxed mb-2`}>
            {alert.message}
          </p>

          {alert.recommendation && (
            <div className={`text-xs ${style.text} bg-white/50 rounded-lg p-2 flex items-start gap-2`}>
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Recommendation: </span>
                {alert.recommendation}
              </div>
            </div>
          )}

          <div className="mt-2 text-[10px] text-gray-600">
            {new Date(alert.timestamp).toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
};
