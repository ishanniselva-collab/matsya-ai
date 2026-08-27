// Fisherman-specific types for trip tracking and navigation

export interface FishermanTrip {
  id: string;
  fishermanName: string;
  startTime: string;
  endTime?: string;
  origin: {
    lat: number;
    lng: number;
    name: string;
  };
  destination: {
    lat: number;
    lng: number;
    name: string;
  };
  distanceKm: number;
  durationMinutes?: number;
  maxSpeed?: number;
  averageSpeed?: number;
  pfzVisited?: string;
  weatherConditions: {
    waveHeight: number;
    windSpeed: number;
    risk: 'SAFE' | 'CAUTION' | 'WARNING' | 'DANGER';
  };
  status: 'ONGOING' | 'COMPLETED' | 'ABORTED';
}

export interface NavigationState {
  isNavigating: boolean;
  destination: {
    lat: number;
    lng: number;
    name: string;
  } | null;
  distanceRemaining: number;
  distanceTotal: number;
  eta: number; // minutes
  lastAnnouncedDistance: number | null;
  route: {
    lat: number;
    lng: number;
  }[];
}

export interface SafetyAlert {
  id: string;
  type: 'WEATHER' | 'WAVE' | 'WIND' | 'GEOFENCE' | 'CYCLONE' | 'LIGHTNING';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  message: string;
  recommendation?: string;
  timestamp: string;
  dismissed: boolean;
}

export type DataSourceStatus = 'LIVE' | 'CACHED' | 'SIMULATED' | 'OFFLINE';

export interface DataSourceInfo {
  name: string;
  status: DataSourceStatus;
  lastUpdated?: string;
  source?: string;
}
