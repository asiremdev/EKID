# Build and install Kiddy on a connected Android phone
# Run from PowerShell: .\scripts\build-android.ps1
#
# IMPORTANT: If build still fails, run this from Windows PowerShell
# (Start menu -> PowerShell), NOT from inside Cursor's terminal.

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

# ── Force short paths (fixes Windows 260-char limit) ─────────────────────────
$env:GRADLE_USER_HOME = "C:\gradle"
$env:TEMP = "C:\tmp"
$env:TMP  = "C:\tmp"
New-Item -ItemType Directory -Force -Path $env:GRADLE_USER_HOME | Out-Null
New-Item -ItemType Directory -Force -Path $env:TEMP | Out-Null

# ── JDK 17 from Android Studio ───────────────────────────────────────────────
$jbrCandidates = @(
    "$env:LOCALAPPDATA\Programs\Android\Android Studio\jbr",
    "${env:ProgramFiles}\Android\Android Studio\jbr",
    "${env:ProgramFiles(x86)}\Android\Android Studio\jbr"
)
foreach ($jbr in $jbrCandidates) {
    if (Test-Path "$jbr\bin\java.exe") {
        $env:JAVA_HOME = $jbr
        $env:PATH = "$jbr\bin;$env:PATH"
        break
    }
}
if (-not $env:JAVA_HOME) {
    Write-Host "ERROR: JDK 17 not found. Install Android Studio first." -ForegroundColor Red
    exit 1
}

Write-Host "GRADLE_USER_HOME = $env:GRADLE_USER_HOME"
Write-Host "JAVA_HOME          = $env:JAVA_HOME"
Write-Host "TEMP               = $env:TEMP"

# ── Wipe native build caches (they hardcode old long paths) ──────────────────
Write-Host "`nCleaning native build caches..."
$cxxDirs = @(
    "node_modules\expo-modules-core\android\.cxx",
    "node_modules\react-native-reanimated\android\.cxx",
    "node_modules\react-native-screens\android\.cxx",
    "android\.gradle",
    "android\app\build"
)
foreach ($dir in $cxxDirs) {
    if (Test-Path $dir) {
        Remove-Item -Recurse -Force $dir
        Write-Host "  removed $dir"
    }
}

Write-Host "`nStopping Gradle daemons..."
Push-Location android
.\gradlew.bat --stop 2>$null
Pop-Location

Write-Host "Checking connected devices..."
adb devices
$devices = adb devices | Select-String "\tdevice$"
if (-not $devices) {
    Write-Host "`nNo phone detected. Plug in USB, enable USB debugging, tap Allow." -ForegroundColor Yellow
    exit 1
}

Write-Host "`nBuilding APK (arm64-v8a only, no daemon)..." -ForegroundColor Cyan
Push-Location android
.\gradlew.bat --no-daemon `
    "-Dorg.gradle.user.home=C:\gradle" `
    app:assembleDebug `
    -PreactNativeArchitectures=arm64-v8a `
    -PreactNativeDevServerPort=8081 `
    -x lint -x test

if ($LASTEXITCODE -ne 0) {
    Pop-Location
    Write-Host "`nBUILD FAILED." -ForegroundColor Red
    Write-Host ""
    Write-Host "If you see 'Filename longer than 260 characters':" -ForegroundColor Yellow
    Write-Host "  1. Close Cursor completely" -ForegroundColor Yellow
    Write-Host "  2. Open Windows PowerShell from Start menu (not Cursor terminal)" -ForegroundColor Yellow
    Write-Host "  3. Run: cd C:\Projects\Kiddy; .\scripts\build-android.ps1" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Or enable Windows long paths (Admin PowerShell):" -ForegroundColor Yellow
    Write-Host '  New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name LongPathsEnabled -Value 1 -PropertyType DWORD -Force' -ForegroundColor Gray
    exit 1
}
Pop-Location

Write-Host "`nInstalling APK on phone..." -ForegroundColor Cyan
adb install -r android\app\build\outputs\apk\debug\app-debug.apk

Write-Host "`nStarting Metro for development build..." -ForegroundColor Cyan
Write-Host "Opening the Kiddy app (NOT Expo Go)..." -ForegroundColor Green
adb shell am start -n com.kiddy.app/.MainActivity

Write-Host "Keep this terminal open. Press 'r' to reload if needed." -ForegroundColor Green
npx expo start --dev-client --clear
