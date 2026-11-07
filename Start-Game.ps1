$ErrorActionPreference = 'Stop'
$gameRoot = $PSScriptRoot
Set-Location -LiteralPath $gameRoot
$config = Get-Content -LiteralPath (Join-Path $gameRoot 'game-config.json') -Raw | ConvertFrom-Json
$prefix = ($gameRoot -replace '\\','/') + '/'
$nginx = Join-Path $gameRoot 'runtime/nginx/nginx.exe'
function Test-LocalPort([int]$port) {
 $client = [Net.Sockets.TcpClient]::new()
 try { return $client.ConnectAsync('127.0.0.1',$port).Wait(500) -and $client.Connected } catch { return $false } finally { $client.Dispose() }
}
if (-not (Test-LocalPort $config.helperPort)) {
 $node = (Get-Command node.exe -ErrorAction Stop).Source
 $helper = Start-Process -FilePath $node -ArgumentList ('"' + (Join-Path $gameRoot 'cache-game.cjs') + '"') -WorkingDirectory $gameRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $gameRoot 'logs/helper-out.log') -RedirectStandardError (Join-Path $gameRoot 'logs/helper-error.log') -PassThru
 $helper.Id | Set-Content -LiteralPath (Join-Path $gameRoot 'logs/helper.pid')
}
& $nginx -p $prefix -c nginx.conf -t
if ($LASTEXITCODE -ne 0) { throw 'nginx configuration failed' }
if (-not (Test-LocalPort $config.port)) {
 Start-Process -FilePath $nginx -ArgumentList @('-p',('"'+$prefix+'"'),'-c','nginx.conf') -WorkingDirectory $gameRoot -WindowStyle Hidden
}
$url = 'http://localhost:' + $config.port + '/'
Write-Host ($config.name + ': ' + $url)
if (-not $env:GAME_NO_BROWSER) { Start-Process $url }
