# Copies the game to Documents\IronMeridian and creates a desktop shortcut that opens it as an app window (Microsoft Edge).
# Usage: powershell -ExecutionPolicy Bypass -File tools\install-desktop.ps1
$ErrorActionPreference = 'Stop'
$src = Split-Path -Parent $PSScriptRoot
$dst = Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'IronMeridian'

New-Item -ItemType Directory -Force $dst | Out-Null
foreach ($item in 'index.html', 'manifest.webmanifest', 'css', 'js', 'assets') {
  Copy-Item -Path (Join-Path $src $item) -Destination $dst -Recurse -Force
}

# Windows shortcuts need an .ico: render the emblem and store it as a PNG-compressed icon.
Add-Type -AssemblyName System.Drawing
$size = 256
$bmp = New-Object System.Drawing.Bitmap $size, $size
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = 'AntiAlias'
$g.Clear([System.Drawing.Color]::Transparent)
$bg = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 11, 20, 27))
$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$r = 44
$path.AddArc(0, 0, $r, $r, 180, 90); $path.AddArc($size - $r, 0, $r, $r, 270, 90)
$path.AddArc($size - $r, $size - $r, $r, $r, 0, 90); $path.AddArc(0, $size - $r, $r, $r, 90, 90); $path.CloseFigure()
$g.FillPath($bg, $path)
$gold = [System.Drawing.Color]::FromArgb(255, 232, 181, 74)
$grid = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 44, 66, 82)), 6
$g.DrawEllipse($grid, 40, 40, 176, 176)
$g.DrawLine($grid, 40, 128, 216, 128); $g.DrawLine($grid, 128, 40, 128, 216)
$c = 128
$outer = [System.Drawing.PointF[]]@((New-Object System.Drawing.PointF $c, 54), (New-Object System.Drawing.PointF 202, $c), (New-Object System.Drawing.PointF $c, 202), (New-Object System.Drawing.PointF 54, $c))
$inner = [System.Drawing.PointF[]]@((New-Object System.Drawing.PointF $c, 104), (New-Object System.Drawing.PointF 152, $c), (New-Object System.Drawing.PointF $c, 152), (New-Object System.Drawing.PointF 104, $c))
$g.DrawPolygon((New-Object System.Drawing.Pen $gold, 12), $outer)
$g.FillPolygon((New-Object System.Drawing.SolidBrush $gold), $inner)
$g.Dispose()
$ms = New-Object System.IO.MemoryStream
$bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
$png = $ms.ToArray()
$ico = New-Object System.IO.MemoryStream
$w = New-Object System.IO.BinaryWriter $ico
$w.Write([UInt16]0); $w.Write([UInt16]1); $w.Write([UInt16]1)          # ICONDIR
$w.Write([Byte]0); $w.Write([Byte]0); $w.Write([Byte]0); $w.Write([Byte]0) # 256x256, no palette
$w.Write([UInt16]1); $w.Write([UInt16]32); $w.Write([UInt32]$png.Length); $w.Write([UInt32]22)
$w.Write($png); $w.Flush()
$icoPath = Join-Path $dst 'assets\icon.ico'
[System.IO.File]::WriteAllBytes($icoPath, $ico.ToArray())

$edge = @("${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe", "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe") | Where-Object { Test-Path $_ } | Select-Object -First 1
$url = 'file:///' + ((Join-Path $dst 'index.html') -replace '\\', '/')
$lnk = Join-Path ([Environment]::GetFolderPath('Desktop')) 'Iron Meridian.lnk'
$sh = (New-Object -ComObject WScript.Shell).CreateShortcut($lnk)
if ($edge) {
  $sh.TargetPath = $edge
  $sh.Arguments = "--app=`"$url`" --start-maximized"
} else {
  $sh.TargetPath = Join-Path $dst 'index.html'
}
$sh.WorkingDirectory = $dst
$sh.IconLocation = "$icoPath,0"
$sh.Description = 'Iron Meridian - Globaler Konflikt 2026 (Alpha)'
$sh.Save()
Write-Output "Installed to $dst"
Write-Output "Shortcut: $lnk"
