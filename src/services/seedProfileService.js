import { generateSeedProfiles } from '../constants/seeds';
import {
  seedProfilesExist,
  writeSeedProfiles,
  updateSeedOnlineStatus,
  autoDeclineRequest,
} from './firestoreService';
import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';

class SeedProfileService {
  constructor() {
    this._rotationTimer = null;
    this._initialized = false;
  }

  // ── Initialization ────────────────────────────────────────────────────────

  async initialize() {
    if (this._initialized) return;

    try {
      const exists = await seedProfilesExist();
      if (!exists) {
        console.log('[Seeds] Populating 60 seed profiles...');
        const profiles = generateSeedProfiles();
        await writeSeedProfiles(profiles);
        console.log('[Seeds] Seed profiles created successfully.');
      } else {
        console.log('[Seeds] Seed profiles already exist.');
      }

      this._startOnlineRotation();
      this._initialized = true;
    } catch (err) {
      console.warn('[Seeds] Initialization error:', err.message);
    }
  }

  // ── Online/Offline Rotation ───────────────────────────────────────────────
  // Rotate seed online statuses every 10 minutes randomly

  _startOnlineRotation() {
    this._rotationTimer = setInterval(async () => {
      try {
        const snap = await getDocs(collection(db, 'seed_profiles'));
        const seeds = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

        // Randomly toggle ~30% of seeds
        const toToggle = seeds.filter(() => Math.random() < 0.3);
        const updates = toToggle.map((s) =>
          updateSeedOnlineStatus(s.id, !s.isOnline),
        );
        await Promise.allSettled(updates);
      } catch (err) {
        console.warn('[Seeds] Rotation error:', err.message);
      }
    }, 10 * 60 * 1000); // 10 minutes
  }

  stopOnlineRotation() {
    if (this._rotationTimer) {
      clearInterval(this._rotationTimer);
      this._rotationTimer = null;
    }
  }

  // ── Seed Invite Simulation ────────────────────────────────────────────────
  // When a real user invites a seed, auto-decline after 30-120 seconds

  handleSeedInvite(requestId) {
    const delay = Math.floor(Math.random() * 90_000) + 30_000; // 30–120s
    setTimeout(async () => {
      try {
        await autoDeclineRequest(requestId);
        console.log(`[Seeds] Auto-declined request ${requestId} after ${Math.round(delay / 1000)}s`);
      } catch (err) {
        console.warn('[Seeds] Auto-decline error:', err.message);
      }
    }, delay);
  }
}

export const seedProfileService = new SeedProfileService();
