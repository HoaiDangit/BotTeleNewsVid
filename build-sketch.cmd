@echo off
"%WINDIR%\Microsoft.NET\Framework64\v4.0.30319\csc.exe" /nologo /reference:System.Drawing.dll /reference:System.Web.Extensions.dll /out:"%~dp0SketchRenderer.exe" "%~dp0SketchRenderer.cs"
if errorlevel 1 exit /b 1
