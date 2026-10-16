package com.wlidi.app.native

import android.app.AppOpsManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import androidx.core.app.NotificationManagerCompat
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.wlidi.app.overlay.OverlayLockService
import com.wlidi.app.timer.UnlockTimerManager
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.Executors

class AppLockModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val MODULE_NAME = "AppLockModule"
        /** Sentinel: app is locked with no active unlock timer */
        const val LOCKED_PERMANENT = 0L
        val lockedPackages: ConcurrentHashMap<String, Long> = ConcurrentHashMap()

        /** Master switch — when false, no apps are blocked (Phase 2C). */
        @Volatile
        var protectionActive: Boolean = false

        /** Protected app package names synced from backend. */
        val protectedPackages: MutableSet<String> = java.util.Collections.newSetFromMap(ConcurrentHashMap())

        @Volatile var starBalance: Int = 0
        @Volatile var starsRequired: Int = 20
        @Volatile var minutesGranted: Int = 10

        @Volatile
        private var reactContextRef: ReactApplicationContext? = null

        private var pendingBlock: WritableMap? = null

        fun setReactContext(ctx: ReactApplicationContext) {
            reactContextRef = ctx
            flushPendingBlock()
        }

        private fun flushPendingBlock() {
            val pending = pendingBlock ?: return
            val ctx = reactContextRef ?: return
            if (!ctx.hasActiveReactInstance()) return
            pendingBlock = null
            ctx.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit("onAppBlocked", pending)
        }

        /** Optimistic native auto-unlock using cached star balance (works offline). */
        fun tryAutoUnlockPackage(context: Context, packageName: String): String {
            if (!protectionActive) return "inactive"
            if (protectedPackages.isNotEmpty() && !protectedPackages.contains(packageName)) return "not_protected"

            val entry = lockedPackages[packageName]
            if (entry != null && entry != LOCKED_PERMANENT && entry > System.currentTimeMillis()) {
                return "already_unlocked"
            }

            if (starBalance >= starsRequired) {
                starBalance -= starsRequired
                val expiryMs = System.currentTimeMillis() + minutesGranted * 60_000L
                lockedPackages[packageName] = expiryMs
                UnlockTimerManager.startTimer(context, packageName, minutesGranted)
                emitNativeAutoUnlock(packageName)
                return "unlocked"
            }
            return "insufficient_stars"
        }

        fun emitAppBlocked(packageName: String, reason: String, appLabel: String?) {
            val map = WritableNativeMap().apply {
                putString("packageName", packageName)
                putString("reason", reason)
                putString("appLabel", appLabel ?: packageName)
                putInt("currentStars", starBalance)
                putInt("requiredStars", starsRequired)
            }
            val ctx = reactContextRef
            if (ctx == null || !ctx.hasActiveReactInstance()) {
                pendingBlock = map
                return
            }
            ctx.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit("onAppBlocked", map)
        }

        fun emitSpendAndOpen(packageName: String, appLabel: String?) {
            val ctx = reactContextRef ?: return
            val map = WritableNativeMap().apply {
                putString("packageName", packageName)
                putString("appLabel", appLabel ?: packageName)
            }
            if (!ctx.hasActiveReactInstance()) return
            ctx.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit("onSpendAndOpen", map)
        }

        fun emitNativeAutoUnlock(packageName: String) {
            val ctx = reactContextRef ?: return
            val map = WritableNativeMap().apply {
                putString("packageName", packageName)
                putInt("starsRemaining", starBalance)
                putInt("starsSpent", starsRequired)
                putInt("minutesGranted", minutesGranted)
            }
            ctx.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit("onNativeAutoUnlock", map)
        }

        fun isPackageLocked(packageName: String): Boolean {
            // Parent deactivated protection — phone usable normally.
            if (!protectionActive) return false

            // Only block apps in the protected list (when list is populated).
            if (protectedPackages.isNotEmpty() && !protectedPackages.contains(packageName)) {
                return false
            }

            val entry = lockedPackages[packageName] ?: return protectedPackages.contains(packageName)
            if (entry == LOCKED_PERMANENT) return true
            val now = System.currentTimeMillis()
            if (entry > now) return false
            lockedPackages[packageName] = LOCKED_PERMANENT
            return true
        }
    }

    private val executor = Executors.newSingleThreadExecutor()

    init {
        setReactContext(reactContext)
        UnlockTimerManager.setReactContext(reactContext)
    }

    override fun getName() = MODULE_NAME

    @ReactMethod
    fun lockApp(packageName: String, promise: Promise) {
        if (packageName.isBlank()) {
            promise.reject("ERR_LOCK", "Package name is required")
            return
        }
        lockedPackages[packageName] = LOCKED_PERMANENT
        UnlockTimerManager.cancelTimer(packageName)
        OverlayLockService.ensureRunning(reactContext)
        OverlayLockService.requestStatusUpdate(reactContext)
        promise.resolve(null)
    }

    @ReactMethod
    fun unlockApp(packageName: String, minutes: Int, promise: Promise) {
        if (packageName.isBlank()) {
            promise.reject("ERR_UNLOCK", "Package name is required")
            return
        }
        if (minutes <= 0) {
            promise.reject("ERR_UNLOCK", "Minutes must be positive")
            return
        }
        val expiryMs = System.currentTimeMillis() + minutes * 60_000L
        lockedPackages[packageName] = expiryMs
        UnlockTimerManager.startTimer(reactContext, packageName, minutes)
        OverlayLockService.ensureRunning(reactContext)
        OverlayLockService.requestStatusUpdate(reactContext)
        promise.resolve(null)
    }

    @ReactMethod
    fun removeAppFromLock(packageName: String, promise: Promise) {
        if (packageName.isBlank()) {
            promise.reject("ERR_REMOVE", "Package name is required")
            return
        }
        lockedPackages.remove(packageName)
        UnlockTimerManager.cancelTimer(packageName)
        val intent = Intent(reactContext, OverlayLockService::class.java).apply {
            action = OverlayLockService.ACTION_DISMISS
            putExtra(OverlayLockService.EXTRA_PACKAGE_NAME, packageName)
        }
        reactContext.startService(intent)
        OverlayLockService.requestStatusUpdate(reactContext)
        promise.resolve(null)
    }

    @ReactMethod
    fun lockAppImmediately(packageName: String, promise: Promise) {
        if (packageName.isBlank()) {
            promise.reject("ERR_LOCK", "Package name is required")
            return
        }
        lockedPackages[packageName] = LOCKED_PERMANENT
        UnlockTimerManager.cancelTimer(packageName)
        val intent = Intent(reactContext, OverlayLockService::class.java).apply {
            action = OverlayLockService.ACTION_DISMISS
            putExtra(OverlayLockService.EXTRA_PACKAGE_NAME, packageName)
        }
        reactContext.stopService(intent)
        promise.resolve(null)
    }

    @ReactMethod
    fun getRemainingTime(packageName: String, promise: Promise) {
        val entry = lockedPackages[packageName]
        if (entry == null || entry == LOCKED_PERMANENT) {
            promise.resolve(0.0)
            return
        }
        val remaining = ((entry - System.currentTimeMillis()) / 1000.0).coerceAtLeast(0.0)
        promise.resolve(remaining)
    }

    @ReactMethod
    fun getLockedApps(promise: Promise) {
        val arr = WritableNativeArray()
        lockedPackages.keys.forEach { arr.pushString(it) }
        promise.resolve(arr)
    }

    @ReactMethod
    fun isAppLocked(packageName: String, promise: Promise) {
        promise.resolve(isPackageLocked(packageName))
    }

    @ReactMethod
    fun checkPermissions(promise: Promise) {
        executor.execute {
            try {
                val result = WritableNativeMap()
                result.putString("usageStatsAccess", if (hasUsageStatsPermission()) "granted" else "denied")
                result.putString("accessibilityService", if (isAccessibilityEnabled()) "granted" else "denied")
                result.putString("displayOverOtherApps", if (Settings.canDrawOverlays(reactContext)) "granted" else "denied")
                result.putString("batteryOptimizationIgnored", if (isBatteryOptimizationIgnored()) "granted" else "denied")
                result.putString("notificationPermission", if (areNotificationsEnabled()) "granted" else "denied")
                promise.resolve(result)
            } catch (e: Exception) {
                promise.reject("ERR_PERMISSIONS", e.message, e)
            }
        }
    }

    private fun hasUsageStatsPermission(): Boolean {
        val appOps = reactContext.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
        val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            appOps.unsafeCheckOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                android.os.Process.myUid(),
                reactContext.packageName
            )
        } else {
            @Suppress("DEPRECATION")
            appOps.checkOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                android.os.Process.myUid(),
                reactContext.packageName
            )
        }
        return mode == AppOpsManager.MODE_ALLOWED
    }

    private fun isAccessibilityEnabled(): Boolean {
        val service =
            "${reactContext.packageName}/${reactContext.packageName}.accessibility.AppBlockerAccessibilityService"
        val enabled = Settings.Secure.getString(
            reactContext.contentResolver,
            Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
        ) ?: return false
        return enabled.contains(service, ignoreCase = true)
    }

    private fun isBatteryOptimizationIgnored(): Boolean {
        val pm = reactContext.getSystemService(Context.POWER_SERVICE) as PowerManager
        return pm.isIgnoringBatteryOptimizations(reactContext.packageName)
    }

    private fun areNotificationsEnabled(): Boolean {
        return NotificationManagerCompat.from(reactContext).areNotificationsEnabled()
    }

    @ReactMethod
    fun openUsageAccessSettings(promise: Promise) {
        openIntent(Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS), promise)
    }

    @ReactMethod
    fun openAccessibilitySettings(promise: Promise) {
        openIntent(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS), promise)
    }

    @ReactMethod
    fun openOverlaySettings(promise: Promise) {
        val intent = Intent(
            Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
            Uri.parse("package:${reactContext.packageName}")
        )
        openIntent(intent, promise)
    }

    @ReactMethod
    fun openBatteryOptimizationSettings(promise: Promise) {
        val intent = Intent(
            Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS,
            Uri.parse("package:${reactContext.packageName}")
        )
        openIntent(intent, promise)
    }

    @ReactMethod
    fun openNotificationSettings(promise: Promise) {
        try {
            val intent = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).apply {
                    putExtra(Settings.EXTRA_APP_PACKAGE, reactContext.packageName)
                }
            } else {
                Intent(
                    Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
                    Uri.parse("package:${reactContext.packageName}")
                )
            }
            openIntent(intent, promise)
        } catch (e: Exception) {
            // Fallback to app details if notification settings unavailable.
            val fallback = Intent(
                Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
                Uri.parse("package:${reactContext.packageName}")
            )
            openIntent(fallback, promise)
        }
    }

    private fun openIntent(intent: Intent, promise: Promise) {
        try {
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactContext.startActivity(intent)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("ERR_OPEN_SETTINGS", e.message, e)
        }
    }

    @ReactMethod
    fun startForegroundService(promise: Promise) {
        try {
            OverlayLockService.ensureRunning(reactContext)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("ERR_START_SERVICE", e.message, e)
        }
    }

    @ReactMethod
    fun stopForegroundService(promise: Promise) {
        try {
            val intent = Intent(reactContext, OverlayLockService::class.java).apply {
                action = OverlayLockService.ACTION_STOP_MONITORING
            }
            reactContext.stopService(intent)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("ERR_STOP_SERVICE", e.message, e)
        }
    }

    /** Master protection switch (Phase 2C). */
    @ReactMethod
    fun setProtectionActive(active: Boolean, promise: Promise) {
        protectionActive = active
        OverlayLockService.requestStatusUpdate(reactContext)
        promise.resolve(null)
    }

    /** Sync stars, rules, and protected apps from JS/backend. */
    @ReactMethod
    fun syncLockConfig(config: ReadableMap, promise: Promise) {
        try {
            protectionActive = config.getBoolean("protectionActive")
            starBalance = config.getInt("starBalance")
            starsRequired = config.getInt("starsRequired")
            minutesGranted = config.getInt("minutesGranted")

            val packages = config.getArray("protectedPackages")
            protectedPackages.clear()
            if (packages != null) {
                for (i in 0 until packages.size()) {
                    packages.getString(i)?.let { protectedPackages.add(it) }
                }
            }

            // Ensure every protected app is in the lock map (permanently locked until unlocked).
            for (pkg in protectedPackages) {
                if (!lockedPackages.containsKey(pkg)) {
                    lockedPackages[pkg] = LOCKED_PERMANENT
                }
            }

            // Remove apps no longer protected.
            val toRemove = lockedPackages.keys.filter { it !in protectedPackages }
            for (pkg in toRemove) {
                lockedPackages.remove(pkg)
                UnlockTimerManager.cancelTimer(pkg)
            }

            OverlayLockService.ensureRunning(reactContext)
            OverlayLockService.requestStatusUpdate(reactContext)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("ERR_SYNC", e.message, e)
        }
    }

    @ReactMethod
    fun launchApp(packageName: String, promise: Promise) {
        if (packageName.isBlank()) {
            promise.reject("ERR_LAUNCH", "Package name is required")
            return
        }
        try {
            val launchIntent = reactContext.packageManager.getLaunchIntentForPackage(packageName)
            if (launchIntent == null) {
                promise.reject("ERR_LAUNCH", "App not installed or cannot be launched")
                return
            }
            launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactContext.startActivity(launchIntent)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("ERR_LAUNCH", e.message, e)
        }
    }

    @ReactMethod
    fun dismissBlockOverlay(promise: Promise) {
        try {
            val intent = Intent(reactContext, OverlayLockService::class.java).apply {
                action = OverlayLockService.ACTION_DISMISS
            }
            reactContext.startService(intent)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("ERR_DISMISS", e.message, e)
        }
    }

    @ReactMethod
    fun consumePendingBlock(promise: Promise) {
        val pending = pendingBlock
        pendingBlock = null
        promise.resolve(pending)
    }
}
