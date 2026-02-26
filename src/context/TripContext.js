/**
 * TripContext — Global trip state shared across all screens.
 *
 * Replaces navigation param passing. All screens read from here.
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { generateRoute } from '../utils/routeGenerator';

const TripContext = createContext(null);

const MOCK_PAST_TRIPS = [
  {
    id: 't1',
    destination: 'Kapadokya',
    days: 3,
    accommodationType: 'caravan',
    budget: 'standart',
    date: '15 Ocak 2026',
    emoji: '🏜️',
  },
  {
    id: 't2',
    destination: 'Bodrum',
    days: 5,
    accommodationType: 'hotel',
    budget: 'lux',
    date: '3 Aralık 2025',
    emoji: '🏖️',
  },
  {
    id: 't3',
    destination: 'Pamukkale',
    days: 2,
    accommodationType: 'camping',
    budget: 'ekonomik',
    date: '10 Kasım 2025',
    emoji: '🌊',
  },
];

export function TripProvider({ children }) {
  const [preferences, setPreferences] = useState(null);
  const [tripData, setTripData] = useState(null);
  const [pastTrips] = useState(MOCK_PAST_TRIPS);

  const startTrip = useCallback((prefs) => {
    setPreferences(prefs);
    const data = generateRoute(prefs);
    setTripData(data);
  }, []);

  const resetTrip = useCallback(() => {
    setPreferences(null);
    setTripData(null);
  }, []);

  return (
    <TripContext.Provider value={{ preferences, tripData, startTrip, resetTrip, pastTrips }}>
      {children}
    </TripContext.Provider>
  );
}

export function useTrip() {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error('useTrip must be used inside TripProvider');
  return ctx;
}
