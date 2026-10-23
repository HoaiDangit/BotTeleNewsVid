$ErrorActionPreference='Stop'
$launcher=Join-Path $PSScriptRoot 'NewsAutoBear-Start.exe'
if(!(Test-Path -LiteralPath $launcher)){throw 'Missing NewsAutoBear-Start.exe. Compile Launcher.cs in teleSetup.'}
Start-Process -FilePath $launcher -WorkingDirectory $PSScriptRoot
