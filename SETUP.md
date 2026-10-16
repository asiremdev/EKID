# Kiddy – Phase 1 Setup Guide

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 20 LTS+ |
| npm / yarn | latest |
| Expo CLI | `npm i -g expo-cli` |
| EAS CLI | `npm i -g eas-cli` |
| Android Studio | Hedgehog 2023.1+ |
| JDK | 17 |
| Android SDK | API 35 |
| ADB | included with Android Studio |

---

## 1. Install dependencies

```bash
cd C:\Projects\Kiddy
npm install
```

---

## 2. Generate the native Android project (Expo Prebuild)

Prebuild generates the `android/` folder from `app.json`.  
Because this project already has a hand-crafted `android/` folder you only  
need to run prebuild once to merge Expo's boilerplate – your Kotlin files  
inside `android/app/src/main/java/com/kiddy/app/` are preserved.

```bash
npx expo prebuild --platform android
```

> If you need a completely fresh native project:
> ```bash
> npx expo prebuild --platform android --clean
> ```
> Then re-copy the Kotlin source files into the regenerated structure.

---

## 3. Build & run on a device / emulator

```bash
# Run on connected device (recommended – emulators can't simulate all permissions)
npx expo run:android

# Or open in Android Studio and run from there
open android/ -a "Android Studio"
```

---

## 4. Grant Required Permissions (ON THE DEVICE)

After installing, open Kiddy and go to **Permission Center** tab.

Grant each permission in order:

### 4a. Usage Access
- **Settings → Apps → Special app access → Usage access → Kiddy → Allow**
- Or tap "Open Settings" inside the app

### 4b. Accessibility Service
- **Settings → Accessibility → Installed services → Kiddy App Blocker → Turn ON**
- Read the dialog and confirm

### 4c. Display Over Other Apps
- **Settings → Apps → Special app access → Display over other apps → Kiddy → Allow**

### 4d. Battery Optimization (recommended)
- **Settings → Apps → Kiddy → Battery → Unrestricted** (or "Don't optimise")
- On MIUI: Battery & performance → App battery saver → Kiddy → No restrictions

### 4e. Auto-start (MIUI / ColorOS / OneUI only)
These OEM skins aggressively kill background processes.

| OEM | Path |
|-----|------|
| Xiaomi (MIUI) | Settings → Apps → Manage apps → Kiddy → Autostart ON |
| Samsung (OneUI) | Settings → Device care → Battery → Background usage limits → Never sleeping apps → Add Kiddy |
| Oppo / Realme (ColorOS) | Settings → Battery → Energy saver → Kiddy → Allow background activity |

---

## 5. Verify the lock works

1. Lock **YouTube** from the Apps screen
2. Exit Kiddy and open YouTube
3. The lock overlay should appear immediately
4. Tap "Return Home"
5. Go back to Kiddy → Locked Apps → Unlock YouTube for 5 minutes
6. Open YouTube – it should open normally
7. Wait 5 minutes or return to Kiddy and tap "Relock Now"
8. Open YouTube again – lock overlay should reappear

---

## Architecture Overview

```
React Native (JS/TS)
│
├── Expo Router (navigation)
├── Zustand store (app state + lock registry)
├── React Query (installed apps cache)
└── AppLockBridge.ts (JS bridge)
        │
        ├── NativeModules.UsageTrackerModule   → UsageTrackerModule.kt
        │     getInstalledApps()
        │     getCurrentForegroundApp()
        │     getUsageStats()
        │     watchForegroundApp() → NativeEventEmitter "onForegroundAppChanged"
        │
        └── NativeModules.AppLockModule        → AppLockModule.kt
              lockApp() / unlockApp()
              checkPermissions()
              startForegroundService()

Android Native
│
├── AppBlockerAccessibilityService.kt
│     Detects foreground app changes
│     Calls OverlayLockService when locked app detected
│
├── OverlayLockService.kt (Foreground Service)
│     Draws TYPE_APPLICATION_OVERLAY full-screen lock window
│     Shows "Application Locked" UI
│     Persistent notification keeps service alive
│
├── UnlockTimerManager.kt (Singleton)
│     Countdown timers per package
│     Emits "onTimerTick" and "onTimerExpired" events
│
└── BootReceiver.kt
      Restarts OverlayLockService on device reboot
```

---

## Folder Structure

```
C:\Projects\Kiddy\
├── app.json                    Expo config
├── package.json
├── tsconfig.json
├── babel.config.js
│
├── app/
│   ├── _layout.tsx             Root layout, service init
│   └── (tabs)/
│       ├── _layout.tsx         Tab navigator
│       ├── index.tsx           Dashboard
│       ├── apps.tsx            Installed Apps (select to lock)
│       ├── locked.tsx          Locked Apps management
│       └── permissions.tsx     Permission Center
│
├── components/
│   ├── AppCard.tsx
│   ├── AppIcon.tsx
│   ├── DashboardCard.tsx
│   ├── LockedAppCard.tsx
│   ├── PermissionCard.tsx
│   └── StatusBadge.tsx
│
├── constants/
│   └── theme.ts                Colors, spacing, typography
│
├── hooks/
│   ├── useAppLock.ts
│   ├── useForegroundApp.ts
│   ├── useInstalledApps.ts
│   └── usePermissions.ts
│
├── services/
│   └── AppLockBridge.ts        JS ↔ Native bridge
│
├── store/
│   └── useAppLockStore.ts      Zustand store
│
├── types/
│   └── index.ts                All TypeScript interfaces
│
└── android/
    └── app/src/main/
        ├── AndroidManifest.xml
        ├── java/com/kiddy/app/
        │   ├── MainApplication.kt
        │   ├── MainActivity.kt
        │   ├── BootReceiver.kt
        │   ├── native/
        │   │   ├── UsageTrackerModule.kt
        │   │   ├── UsageTrackerPackage.kt
        │   │   ├── AppLockModule.kt
        │   │   └── AppLockPackage.kt
        │   ├── accessibility/
        │   │   └── AppBlockerAccessibilityService.kt
        │   ├── overlay/
        │   │   └── OverlayLockService.kt
        │   └── timer/
        │       └── UnlockTimerManager.kt
        └── res/
            ├── xml/accessibility_service_config.xml
            └── values/{strings,styles,colors}.xml
```

---

## Testing Checklist

### Pixel (Stock Android) ✅ Reference device
- [ ] Usage Access granted
- [ ] Accessibility Service enabled
- [ ] Overlay permission granted
- [ ] Locking YouTube blocks immediately
- [ ] Unlock timer counts down correctly
- [ ] Auto-relock on timer expiry
- [ ] Service survives app backgrounding
- [ ] Service restarts after reboot

### Samsung (OneUI)
- [ ] All of the above
- [ ] Enable "Never sleeping" for Kiddy in battery settings
- [ ] Verify lock overlay appears (Samsung sometimes interferes with TYPE_APPLICATION_OVERLAY)
- [ ] Test with Secure Folder disabled
- [ ] Verify Bixby Home doesn't bypass lock

### Xiaomi (MIUI / HyperOS)
- [ ] All of the above
- [ ] Enable Autostart in MIUI settings
- [ ] Set battery saver to "No restrictions"
- [ ] Verify lock on MIUI launcher
- [ ] Check with "Floating windows" permission (MIUI 12+)

### Oppo / Realme (ColorOS)
- [ ] All of the above
- [ ] Allow background activity in Energy Saver
- [ ] Enable "Allow auto-launch"
- [ ] Check "Allow other apps to appear on top"

### OnePlus (OxygenOS)
- [ ] All of the above
- [ ] Battery optimization → Don't optimize

---

## Known Android Limitations

| Issue | Cause | Workaround |
|-------|-------|------------|
| Lock overlay not showing on some Samsung | Knox security policy restricts SYSTEM_ALERT_WINDOW | Ensure permission granted; test on non-Knox devices |
| Service killed on MIUI in <1 min | Aggressive memory management | Autostart + battery unrestricted |
| `getUsageStats` returns empty | Usage Access not granted | Show clear instructions in Permission Center |
| Accessibility service disabled after update | Android security | Show persistent notification to re-enable |
| Lock overlay briefly visible then dismissed | Home screen launcher detected as window change | Add launcher packages to `shouldIgnorePackage()` whitelist |
| App icon not loading | System app icon retrieval edge case | Gracefully fallback to initials (already implemented) |
| Timer drifts on doze mode | Android Doze restricts timers | Use `AlarmManager.setExactAndAllowWhileIdle` for production timers |

---

## Next Steps (Phase 2)

- [ ] PIN-protected parent unlock
- [ ] Remote control via Supabase / Firebase
- [ ] Daily screen time limits (not just unlock timers)
- [ ] App categories and scheduled lock windows
- [ ] Child profile management
- [ ] Educational content unlock rewards
