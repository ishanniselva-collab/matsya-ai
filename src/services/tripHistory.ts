import { FishermanTrip } from '../types/fisherman';

const STORAGE_KEY = 'samudra_fisherman_trips';

export class TripHistoryService {
  static saveTrip(trip: FishermanTrip): void {
    try {
      const trips = this.getAllTrips();
      trips.unshift(trip);
      // Keep only last 50 trips
      const trimmed = trips.slice(0, 50);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch (error) {
      console.warn('[TripHistory] Failed to save trip:', error);
    }
  }

  static getAllTrips(): FishermanTrip[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('[TripHistory] Failed to load trips:', error);
      return [];
    }
  }

  static getTripsByFisherman(fishermanName: string): FishermanTrip[] {
    return this.getAllTrips().filter(
      (trip) => trip.fishermanName.toLowerCase() === fishermanName.toLowerCase()
    );
  }

  static getRecentTrips(limit: number = 10): FishermanTrip[] {
    return this.getAllTrips().slice(0, limit);
  }

  static getTodayTrips(): FishermanTrip[] {
    const today = new Date().toDateString();
    return this.getAllTrips().filter((trip) => {
      const tripDate = new Date(trip.startTime).toDateString();
      return tripDate === today;
    });
  }

  static getYesterdayTrips(): FishermanTrip[] {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    return this.getAllTrips().filter((trip) => {
      const tripDate = new Date(trip.startTime).toDateString();
      return tripDate === yesterdayStr;
    });
  }

  static getLastDestination(): FishermanTrip['destination'] | null {
    const trips = this.getAllTrips();
    return trips.length > 0 ? trips[0].destination : null;
  }

  static updateTrip(tripId: string, updates: Partial<FishermanTrip>): void {
    try {
      const trips = this.getAllTrips();
      const index = trips.findIndex((t) => t.id === tripId);
      if (index !== -1) {
        trips[index] = { ...trips[index], ...updates };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
      }
    } catch (error) {
      console.warn('[TripHistory] Failed to update trip:', error);
    }
  }

  static clearHistory(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn('[TripHistory] Failed to clear history:', error);
    }
  }
}
