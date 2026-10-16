# Clears corrupted Gradle transform cache on Windows (long paths + Avast safe).
# Run: powershell -ExecutionPolicy Bypass -File scripts/clean-gradle-cache.ps1

$ErrorActionPreference = 'SilentlyContinue'

Write-Host 'Stopping Gradle...'
if (Test-Path 'android/gradlew.bat') {
  Push-Location android
  .\gradlew.bat --stop | Out-Null
  Pop-Location
}

Get-Process -Name java -ErrorAction SilentlyContinue |
  Where-Object { $_.Path -like '*jdk*' -or $_.MainWindowTitle -like '*Gradle*' } |
  Stop-Process -Force

Start-Sleep -Seconds 2

$empty = Join-Path $env:TEMP "gradle-empty-$(Get-Random)"
New-Item -ItemType Directory -Path $empty -Force | Out-Null

$targets = @(
  "$env:USERPROFILE\.gradle\caches\8.10.2\transforms",
  "$env:USERPROFILE\.gradle\caches\8.10.2\build-cache-1"
)

foreach ($target in $targets) {
  if (-not (Test-Path $target)) {
    Write-Host "Skip (not found): $target"
    continue
  }
  Write-Host "Clearing: $target"
  robocopy $empty $target /MIR /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
  cmd /c "rmdir /s /q `"$target`"" | Out-Null
  if (Test-Path $target) {
    cmd /c "rmdir /s /q `"\\?\$target`"" | Out-Null
  }
  if (Test-Path $target) {
    Write-Host "  FAILED - close Android Studio / Avast and retry"
  } else {
    Write-Host "  OK"
  }
}

Remove-Item $empty -Force
Write-Host 'Done. Now run: npx expo run:android --device'
