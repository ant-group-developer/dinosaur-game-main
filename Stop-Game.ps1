$gameRoot=$PSScriptRoot
$prefix=($gameRoot -replace '\\','/')+'/'
$nginx=Join-Path $gameRoot 'runtime/nginx/nginx.exe'
if (Test-Path -LiteralPath (Join-Path $gameRoot 'logs/nginx.pid')) { & $nginx -p $prefix -c nginx.conf -s quit }
$pidFile=Join-Path $gameRoot 'logs/helper.pid'
if (Test-Path -LiteralPath $pidFile) {
    $helperId=[int](Get-Content -LiteralPath $pidFile)
    $helperProcess=Get-Process -Id $helperId -ErrorAction SilentlyContinue
    $pidWritten=(Get-Item -LiteralPath $pidFile).LastWriteTimeUtc
    if ($helperProcess.ProcessName -eq 'node' -and [Math]::Abs(($helperProcess.StartTime.ToUniversalTime()-$pidWritten).TotalSeconds) -lt 15) { Stop-Process -Id $helperId -ErrorAction SilentlyContinue }
    Remove-Item -LiteralPath $pidFile -Force
}
