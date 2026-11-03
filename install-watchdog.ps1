$ErrorActionPreference='Stop'
$projectRoot=$PSScriptRoot
$taskName='NewsAutoBear-VideoWatchdog'
$privateFolder=Join-Path $projectRoot '.bridge'
New-Item -ItemType Directory -Path $privateFolder -Force | Out-Null
$nodePath=(Get-Command node.exe).Source
$vbsPath=Join-Path $privateFolder 'video-watchdog.vbs'
$watchdogPath=Join-Path $projectRoot 'video-watchdog.mjs'
$vbs=@"
Set sh = CreateObject("WScript.Shell")
sh.CurrentDirectory = "$projectRoot"
code = sh.Run("""$nodePath"" ""$watchdogPath""", 0, True)
WScript.Quit code
"@
Set-Content -LiteralPath $vbsPath -Value $vbs -Encoding Unicode
$existing=Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if($existing -and !($existing.Actions.Arguments -contains ('//B //NoLogo "'+$vbsPath+'"'))){throw 'Tên tác vụ đã thuộc một cài đặt khác; không ghi đè.'}
$action=New-ScheduledTaskAction -Execute (Join-Path $env:WINDIR 'System32\wscript.exe') -Argument ('//B //NoLogo "'+$vbsPath+'"') -WorkingDirectory $projectRoot
$userName=[System.Security.Principal.WindowsIdentity]::GetCurrent().Name
$trigger=New-ScheduledTaskTrigger -AtLogOn -User $userName
$principal=New-ScheduledTaskPrincipal -UserId $userName -LogonType Interactive -RunLevel Limited
$settings=New-ScheduledTaskSettingsSet -ExecutionTimeLimit ([TimeSpan]::Zero) -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -MultipleInstances IgnoreNew
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Description 'Giữ cầu nối NewsAutoBear hoạt động khi người dùng đăng nhập; tự khởi động lại nếu tiến trình tắt. Chạy ẩn, không đổi cài đặt nguồn điện.' -Force | Out-Null
Start-ScheduledTask -TaskName $taskName
Get-ScheduledTask -TaskName $taskName | Select-Object TaskName,State
