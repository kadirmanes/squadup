/**
 * TripContext — Global trip state.
 *
 * Persists preferences, tripData and expenses to AsyncStorage.
 * Loads saved trip on first mount so the app survives restarts.
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { generateRoute } from '../utils/routeGenerator';
import { saveTrip, loadTrip, clearTrip } from '../utils/storage';

const TripContext = createContext(null);

const MOCK_PAST_TRIPS = [
  { id: 't1', destination: 'Kapadokya', days: 3, accommodationType: 'caravan', budget: 'standart', date: '15 Ocak 2026',   emoji: '🏜️' },
  { id: 't2', destination: 'Bodrum',    days: 5, accommodationType: 'hotel',   budget: 'lux',      date: '3 Aralık 2025',  emoji: '🏖️' },
  { id: 't3', destination: 'Pamukkale', days: 2, accommodationType: 'camping', budget: 'ekonomik', date: '10 Kasım 2025',  emoji: '🌊' },
];

export function TripProvider({ children }) {
  const [preferences, setPreferences] = useState(null);
  const [tripData, setTripData]       = useState(null);
  const [expenses, setExpenses]       = useState([]);
  const [pastTrips]                   = useState(MOCK_PAST_TRIPS);
  const [hydrated, setHydrated]       = useState(false);

  // ── Load persisted trip on mount ──────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const saved = await loadTrip();
      if (saved?.preferences && saved?.tripData) {
        setPreferences(saved.preferences);
        setTripData(saved.tripData);
        setExpenses(saved.expenses || []);
      }
      setHydrated(true);
    })();
  }, []);

  // ── Persist on every relevant change ──────────────────────────────────────
  useEffect(() => {
    if (!hydrated) return;
    if (preferences && tripData) {
      saveTrip({ preferences, tripData, expenses });
    }
  }, [preferences, tripData, expenses, hydrated]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const startTrip = useCallback((prefs) => {
    const data = generateRoute(prefs);
    setPreferences(prefs);
    setTripData(data);
    setExpenses([]);
  }, []);

  // Called by GeneratingScreen after AI returns a result
  const setTripFromAI = useCallback((prefs, aiResult) => {
    setPreferences(prefs);
    setTripData(aiResult);
    setExpenses([]);
  }, []);

  const resetTrip = useCallback(async () => {
    setPreferences(null);
    setTripData(null);
    setExpenses([]);
    await clearTrip();
  }, []);

  /**
   * @param {{ category: string, emoji: string, label: string, amount: number, note: string }} expense
   */
  const addExpense = useCallback((expense) => {
    setExpenses((prev) => [
      { id: `e-${Date.now()}`, timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }), ...expense },
      ...prev,
    ]);
  }, []);

  const removeExpense = useCallback((id) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }, []);

  // ── Derived totals ────────────────────────────────────────────────────────

  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <TripContext.Provider
      value={{
        preferences,
        tripData,
        pastTrips,
        expenses,
        totalSpent,
        hydrated,
        startTrip,
        setTripFromAI,
        resetTrip,
        addExpense,
        removeExpense,
      }}
    >
      {children}
    </TripContext.Provider>
  );
}

export function useTrip() {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error('useTrip must be used inside TripProvider');
  return ctx;
}
