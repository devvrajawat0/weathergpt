@echo off
echo ===================================================
echo   WeatherGPT - Automated GitHub Repository Replace
echo ===================================================
echo.
echo Target Repository: https://github.com/devvrajawat0/weathergpt.git
echo.

:: Check if git is installed
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Git is not detected in your PATH.
    echo Please install Git from https://git-scm.com/download/win or use VS Code Git panel.
    pause
    exit /b
)

echo [1/4] Initializing Git repository...
git init

echo [2/4] Setting remote origin...
git remote remove origin >nul 2>nul
git remote add origin https://github.com/devvrajawat0/weathergpt.git

echo [3/4] Staging and committing all new WeatherGPT files...
git checkout -B main
git add -A
git commit -m "feat: replace repository with production WeatherGPT SIH platform"

echo [4/4] Force pushing clean code to replace old version...
git push -u origin main --force

echo.
echo ===================================================
echo SUCCESS! Your repository has been updated at:
echo https://github.com/devvrajawat0/weathergpt
echo.
echo Your GitHub Pages live site will build shortly at:
echo https://devvrajawat0.github.io/weathergpt/
echo ===================================================
pause
