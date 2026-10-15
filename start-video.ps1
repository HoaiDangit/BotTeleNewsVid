$ErrorActionPreference = 'Stop'
$base = $PSScriptRoot
$nodeExe = (Get-Command node -ErrorAction Stop).Source
$privateDir = Join-Path $base '.bridge'
if (!(Test-Path -LiteralPath (Join-Path $privateDir 'config.json'))) { throw 'Missing private video bridge configuration.' }
$process = Start-Process -FilePath $nodeExe -ArgumentList 'video-agent.mjs' -WorkingDirectory $base -WindowStyle Hidden -RedirectStandardOutput (Join-Path $privateDir 'agent.log') -RedirectStandardError (Join-Path $privateDir 'agent-error.log') -PassThru
Write-Host "NewsAutoBear started (PID $($process.Id)). Send /video_status to the Telegram bot."
