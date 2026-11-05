$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
$desktop = [Environment]::GetFolderPath('Desktop')
$ws = New-Object -ComObject WScript.Shell
$lnk = $ws.CreateShortcut("$desktop\Al-Hamam.lnk")
$lnk.TargetPath = Join-Path $dir 'start-local.bat'
$lnk.WorkingDirectory = $dir
$lnk.IconLocation = Join-Path $dir 'alhamam.ico'
$lnk.WindowStyle = 7
$lnk.Save()
Write-Host "Desktop icon created: Al-Hamam"
