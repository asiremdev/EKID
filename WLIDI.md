# WLIDI — Single App Architecture

One **WLIDI** app installed on both the parent's phone and the child's tablet. On first launch, pick your role.

## Modes

| Mode | Device | What it does |
|------|--------|--------------|
| **Parent phone** | Parent's phone | Login, onboarding, block apps, toggle protection, generate pairing code |
| **Child's tablet** | Child device | Enter pairing code, grant permissions, play educative games, native app blocking |

Package: `com.wlidi.app` on both devices.

## Workflow

1. **Parent phone** — install WLIDI → choose **Parent phone** → sign up → onboarding
2. Create child (age **3–5**, **5–7**, or **7–10**)
3. Parent gets a **6-digit pairing code**
4. **Child tablet** — install the same WLIDI app → choose **Child's tablet** → enter code → grant permissions
5. Parent picks apps to block (YouTube, TikTok, etc.)
6. Parent sets star rules (e.g. 20 ⭐ = 10 min)
7. Parent hides WLIDI on the child device (guide in onboarding)
8. Parent toggles **Blocking ON** from dashboard
9. Child device syncs config every **15 minutes**
10. Child opens blocked app → popup → play game or spend ⭐

## Educative games (1 per age, 3 levels)

| Age | Game | Levels |
|-----|------|--------|
| 3–5 | **Color Garden** | Match → Sort → Pattern |
| 5–7 | **Number Quest** | Count → Add → Order |
| 7–10 | **Word Lab** | Match → Fill → Spell |

Stars only — no XP, streaks, or achievements.

## Backend

```bash
cd backend
npx prisma db push
npm run start:dev
```

Key endpoints:
- `POST /parents/me/pairing/code` — parent generates code
- `POST /pairing/claim` — child device pairs
- `GET /device/sync` — child pulls lock config
- `GET /device/games` / `POST /device/games/complete` — educative games
- `POST /device/protection/auto-unlock` — spend stars

## Run the app

```bash
npm install
npx expo run:android
```

## Project structure

```
app/
  setup/           # First-launch mode picker
  (auth)/          # Parent login/register
  onboarding/      # Parent setup flow
  (parent)/        # Parent dashboard
  (device)/        # Child tablet: pair, home, game
components/
  games/           # ColorGarden, NumberQuest, WordLab
  DeviceProtectionEngine.tsx
  DeviceLockOverlay.tsx
  RootGate.tsx     # Routes by app mode
lib/
  deviceApi.ts     # Device-token API client
  deviceStorage.ts
services/
  WlidiSync.ts     # 15-min sync on child device
```

## Removed

- Separate WLIDI-kids app (merged into one)
- Single-phone handoff mode
- Activity catalog, XP, streaks, achievements
- Parent-side native app locking (only on child device)
