$ErrorActionPreference = 'Stop'
$env:GAME_NO_BROWSER = '1'
& (Join-Path $PSScriptRoot 'Start-Game.ps1')
& node (Join-Path $PSScriptRoot 'download-all.cjs')
if ($LASTEXITCODE -ne 0) { throw 'Some assets could not be downloaded. See logs/prefetch.json.' }
