@echo off
echo ==========================================================
echo   WeatherGPT - Copy & Replace Existing Local Repository
echo ==========================================================
echo.
set /p TARGET_PATH="Enter the full path to your existing Git repository folder: "

if not exist "%TARGET_PATH%" (
    echo [ERROR] Folder "%TARGET_PATH%" does not exist!
    pause
    exit /b
)

echo [1/2] Removing old contents (excluding .git folder)...
for /d %%D in ("%TARGET_PATH%\*") do (
    if /i not "%%~nxD"==".git" rd /s /q "%%D"
)
for %%F in ("%TARGET_PATH%\*") do (
    del /f /q "%%F"
)

echo [2/2] Copying new WeatherGPT codebase into target folder...
xcopy "%~dp0*" "%TARGET_PATH%\" /E /H /C /I /Y

echo.
echo SUCCESS! Your existing Git folder has been completely replaced with WeatherGPT.
echo Now navigate to "%TARGET_PATH%" and run: git add -A ^& git commit -m "Update WeatherGPT" ^& git push
pause
