Add-Type -AssemblyName System.Drawing

$green = [System.Drawing.Color]::FromArgb(15, 110, 86)

$img1 = New-Object System.Drawing.Bitmap(1024, 1024)
$gr1 = [System.Drawing.Graphics]::FromImage($img1)
$gr1.Clear($green)
$img1.Save("C:\MasjidConnect\assets\icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$img1.Save("C:\MasjidConnect\assets\adaptive-icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
Write-Host "icon.png e adaptive-icon.png creati"

$img2 = New-Object System.Drawing.Bitmap(1284, 2778)
$gr2 = [System.Drawing.Graphics]::FromImage($img2)
$gr2.Clear($green)
$img2.Save("C:\MasjidConnect\assets\splash.png", [System.Drawing.Imaging.ImageFormat]::Png)
Write-Host "splash.png creato"

$img3 = New-Object System.Drawing.Bitmap(48, 48)
$gr3 = [System.Drawing.Graphics]::FromImage($img3)
$gr3.Clear($green)
$img3.Save("C:\MasjidConnect\assets\favicon.png", [System.Drawing.Imaging.ImageFormat]::Png)
Write-Host "favicon.png creato"

Write-Host "Tutte le icone create con successo!"