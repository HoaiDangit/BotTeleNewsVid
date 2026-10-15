$ErrorActionPreference = 'Stop'
$base = $PSScriptRoot
$mutex = New-Object System.Threading.Mutex($false, 'Local\NewsAutoBearLauncher')
if (-not $mutex.WaitOne(0)) { exit }
try {
  $privateDir = Join-Path $base '.bridge'
  $config = Get-Content -LiteralPath (Join-Path $privateDir 'config.json') -Raw | ConvertFrom-Json
  $nodeExe = (Get-Command node.exe -ErrorAction Stop).Source
  if (!(Test-Path -LiteralPath (Join-Path $config.appRoot 'scripts\ui-server.mjs'))) { throw 'Khong tim thay KT AI Video Studio.' }
  function Test-Studio {
    try {
      $response = Invoke-WebRequest 'http://127.0.0.1:4000/api/templates' -UseBasicParsing -TimeoutSec 2
      return ($response.StatusCode -eq 200 -and $response.Headers['Content-Type'] -match 'application/json')
    } catch { return $false }
  }
  if (!(Test-Studio)) {
    $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
    $studioProcess = Start-Process -FilePath $nodeExe -ArgumentList 'scripts/ui-server.mjs' -WorkingDirectory $config.appRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $privateDir "studio-$stamp.log") -RedirectStandardError (Join-Path $privateDir "studio-$stamp-error.log") -PassThru
    $ready = $false
    for ($i=0; $i -lt 15; $i++) {
      Start-Sleep -Seconds 1
      if (Test-Studio) { $ready=$true; break }
      if ($studioProcess.HasExited) { break }
    }
    if (!$ready) { throw 'App chua phan hoi tren cong 4000. Xem log studio trong .bridge. Neu app da mo, hay khoi dong lai app.' }
  }
  $previousFile = Join-Path $privateDir 'previous-runtime.txt'
  if (Test-Path -LiteralPath $previousFile) {
    $previousLock = Join-Path ((Get-Content -LiteralPath $previousFile -Raw).Trim()) 'agent.pid'
    if (Test-Path -LiteralPath $previousLock) {
      $previousProcessId = 0
      if ([int]::TryParse((Get-Content -LiteralPath $previousLock -Raw).Trim(), [ref]$previousProcessId)) {
        $previousProcess = Get-Process -Id $previousProcessId -ErrorAction SilentlyContinue
        if ($null -ne $previousProcess -and $previousProcess.ProcessName -eq 'node') {
          Start-Process 'http://127.0.0.1:4000'
          exit 0
        }
      }
    }
    Remove-Item -LiteralPath $previousFile
  }
  $lock = Join-Path $privateDir 'agent.pid'
  $alive = $false
  if (Test-Path -LiteralPath $lock) {
    $agentProcessId = 0
    if ([int]::TryParse((Get-Content -LiteralPath $lock -Raw).Trim(), [ref]$agentProcessId)) {
      $running = Get-Process -Id $agentProcessId -ErrorAction SilentlyContinue
      $alive = ($null -ne $running -and $running.ProcessName -eq 'node')
    }
    if (!$alive) { Remove-Item -LiteralPath $lock }
  }
  if (!$alive) {
    $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
    $agentProcess = Start-Process -FilePath $nodeExe -ArgumentList 'video-agent.mjs' -WorkingDirectory $base -WindowStyle Hidden -RedirectStandardOutput (Join-Path $privateDir "agent-$stamp.log") -RedirectStandardError (Join-Path $privateDir "agent-$stamp-error.log") -PassThru
    Start-Sleep -Seconds 2
    if ($agentProcess.HasExited) { throw 'Cau noi chua chay duoc. Xem log agent trong .bridge.' }
  }
  Start-Process 'http://127.0.0.1:4000'
} catch {
  Add-Type -AssemblyName System.Windows.Forms
  [System.Windows.Forms.MessageBox]::Show($_.Exception.Message, 'NewsAutoBear - Khoi dong chua hoan tat') | Out-Null
  exit 1
} finally { $mutex.ReleaseMutex(); $mutex.Dispose() }
