@echo off
echo ========================================
echo Converting Markdown to Word Documents
echo ========================================
echo.

REM Check if pandoc is installed
where pandoc >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Pandoc is not installed!
    echo.
    echo Please install Pandoc first:
    echo 1. Download from: https://pandoc.org/installing.html
    echo 2. Or use Chocolatey: choco install pandoc
    echo.
    pause
    exit /b 1
)

echo Pandoc found! Converting files...
echo.

REM Convert PROJECT_DOCUMENTATION.md
if exist "PROJECT_DOCUMENTATION.md" (
    echo Converting PROJECT_DOCUMENTATION.md...
    pandoc PROJECT_DOCUMENTATION.md -o PROJECT_DOCUMENTATION.docx --toc --toc-depth=3
    if %ERRORLEVEL% EQU 0 (
        echo ✓ Created: PROJECT_DOCUMENTATION.docx
    ) else (
        echo ✗ Failed to convert PROJECT_DOCUMENTATION.md
    )
) else (
    echo ✗ PROJECT_DOCUMENTATION.md not found
)

echo.

REM Convert API_REFERENCE.md
if exist "API_REFERENCE.md" (
    echo Converting API_REFERENCE.md...
    pandoc API_REFERENCE.md -o API_REFERENCE.docx --toc --toc-depth=2
    if %ERRORLEVEL% EQU 0 (
        echo ✓ Created: API_REFERENCE.docx
    ) else (
        echo ✗ Failed to convert API_REFERENCE.md
    )
) else (
    echo ✗ API_REFERENCE.md not found
)

echo.
echo ========================================
echo Conversion Complete!
echo ========================================
echo.
echo Word documents created in current directory.
echo.
pause
