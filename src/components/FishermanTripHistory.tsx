import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Clock,
  Navigation,
  Calendar,
  Trash2,
  ChevronRight,
  Fish,
  Shield,
  Waves
} from 'lucide-react';
import { TripHistoryService } from '../services/tripHistory';
import { FishermanTrip } from '../types/fisherman';

interface FishermanTripHistoryProps {
  fishermanName: string;
  onReuseDestination?: (destination: { lat: number; lng: number; name: string }) => void;
  language?: string;
}

export const FishermanTripHistory: React.FC<FishermanTripHistoryProps> = ({
  fishermanName,
  onReuseDestination,
  language = 'en',
}) => {
  const [trips, setTrips] = useState<FishermanTrip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<FishermanTrip | null>(null);

  useEffect(() => {
    loadTrips();
  }, [fishermanName]);

  const loadTrips = () => {
    const allTrips = TripHistoryService.getTripsByFisherman(fishermanName);
    setTrips(allTrips);
  };

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear all trip history?')) {
      TripHistoryService.clearHistory();
      setTrips([]);
      setSelectedTrip(null);
    }
  };

  const todayTrips = TripHistoryService.getTodayTrips().filter(
    (t) => t.fishermanName.toLowerCase() === fishermanName.toLowerCase()
  );
  const yesterdayTrips = TripHistoryService.getYesterdayTrips().filter(
    (t) => t.fishermanName.toLowerCase() === fishermanName.toLowerCase()
  );
  const olderTrips = trips.filter(
    (t) => !todayTrips.includes(t) && !yesterdayTrips.includes(t)
  );

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'SAFE':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'CAUTION':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'WARNING':
        return 'text-orange-700 bg-orange-50 border-orange-200';
      case 'DANGER':
        return 'text-rose-700 bg-rose-50 border-rose-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const TripCard: React.FC<{ trip: FishermanTrip }> = ({ trip }) => {
    const riskColor = getRiskColor(trip.weatherConditions.risk);
    const isSelected = selectedTrip?.id === trip.id;

    return (
      <div
        onClick={() => setSelectedTrip(isSelected ? null : trip)}
        className={`p-3 rounded-lg border-2 transition cursor-pointer ${
          isSelected
            ? 'bg-teal-50 border-teal-500 shadow-md'
            : 'bg-white border-gray-200 hover:border-teal-300'
        }`}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-teal-600" />
            <span className="text-sm font-bold text-gray-900">
              {trip.destination.name}
            </span>
          </div>
          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${riskColor}`}>
            {trip.weatherConditions.risk}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <Navigation className="w-3 h-3" />
            <span>{trip.distanceKm.toFixed(1)} km</span>
          </div>
          {trip.durationMinutes && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{trip.durationMinutes} min</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Waves className="w-3 h-3" />
            <span>{trip.weatherConditions.waveHeight}m</span>
          </div>
        </div>

        <div className="mt-2 text-[10px] text-gray-500">
          {new Date(trip.startTime).toLocaleString()}
        </div>

        {isSelected && (
          <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
            <div className="text-xs text-gray-700">
              <span className="font-semibold">Origin:</span> {trip.origin.name}
            </div>
            {trip.pfzVisited && (
              <div className="text-xs text-gray-700">
                <span className="font-semibold">PFZ:</span> {trip.pfzVisited}
              </div>
            )}
            <div className="text-xs text-gray-700">
              <span className="font-semibold">Wind:</span> {trip.weatherConditions.windSpeed} km/h
            </div>
            {onReuseDestination && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onReuseDestination(trip.destination);
                }}
                className="w-full mt-2 py-2 px-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Navigate Here Again</span>
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  if (trips.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Fish className="w-12 h-12 text-gray-400 mb-3" />
        <h3 className="text-lg font-bold text-gray-900 mb-1">No Trip History</h3>
        <p className="text-sm text-gray-600 max-w-xs">
          Your fishing trips will be recorded here. Start your first trip by asking MATSYA
          where to go!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-teal-600" />
          My Trips
        </h2>
        <button
          onClick={handleClearHistory}
          className="text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1 font-medium"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear
        </button>
      </div>

      {/* Today */}
      {todayTrips.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
            Today
          </h3>
          <div className="space-y-2">
            {todayTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        </div>
      )}

      {/* Yesterday */}
      {yesterdayTrips.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
            Yesterday
          </h3>
          <div className="space-y-2">
            {yesterdayTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        </div>
      )}

      {/* Older */}
      {olderTrips.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
            Previous Trips
          </h3>
          <div className="space-y-2">
            {olderTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
