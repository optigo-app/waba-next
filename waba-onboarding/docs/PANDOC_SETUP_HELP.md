# Pandoc Setup & Conversion Help

## Issue
Pandoc is installed but not accessible from command line because it's not in your system PATH.

## Quick Solutions

### Option 1: Use PowerShell Script (Recommended)
Run this command in PowerShell:
```powershell
.\convert-to-word.ps1
```

This script automatically finds Pandoc in common installation locations.

### Option 2: Add Pandoc to PATH
1. Find where Pandoc is installed (usually `C:\Program Files\Pandoc\`)
2. Add it to system PATH:
   - Press `Win + X` → System → Advanced system settings
   - Click "Environment Variables"
   - Under "System variables", find "Path" and click "Edit"
   - Click "New" and add: `C:\Program Files\Pandoc`
   - Click OK on all dialogs
3. **Restart your terminal/PowerShell**
4. Run: `pandoc --version` to verify
5. Then run: `.\convert-to-word.bat`

### Option 3: Use Full Path Manually
If Pandoc is at `C:\Program Files\Pandoc\pandoc.exe`, run:

```powershell
& "C:\Program Files\Pandoc\pandoc.exe" PROJECT_DOCUMENTATION.md -o PROJECT_DOCUMENTATION.docx --toc --toc-depth=3
& "C:\Program Files\Pandoc\pandoc.exe" API_REFERENCE.md -o API_REFERENCE.docx --toc --toc-depth=2
```

### Option 4: Online Converter (No Installation)
1. Go to: https://www.markdowntoword.com/
2. Upload `PROJECT_DOCUMENTATION.md` → Download Word file
3. Upload `API_REFERENCE.md` → Download Word file

## Finding Pandoc Installation
Check these common locations:
- `C:\Program Files\Pandoc\pandoc.exe`
- `C:\Program Files (x86)\Pandoc\pandoc.exe`
- `%LOCALAPPDATA%\Pandoc\pandoc.exe`

## Verify Installation
After adding to PATH and restarting terminal:
```bash
pandoc --version
```

Should show Pandoc version information.
