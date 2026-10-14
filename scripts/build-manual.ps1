# 사용설명서 PDF 다시 만들기 (Windows, Chrome 또는 Edge 필요)
#   .\scripts\build-manual.ps1               docs\manual-src\manual.html -> public\manual.pdf
#   .\scripts\build-manual.ps1 -Screenshots  공개 사이트에서 화면 캡처를 먼저 다시 찍는다
param(
  [switch]$Screenshots,
  [string]$Site = 'https://daniallee5355-art.github.io/icon-system-studio/'
)
$ErrorActionPreference = 'Stop'

$root = Split-Path $PSScriptRoot -Parent
$src = Join-Path $root 'docs\manual-src'
$browser = @(
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
  "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
  "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $browser) { throw 'Chrome 또는 Edge를 찾지 못했습니다.' }

# 실행마다 새 브라우저 프로필을 써서, 이전에 저장된 앱 설정이 캡처에 섞이지 않게 한다
$prof = Join-Path $env:TEMP ('iss-manual-' + [guid]::NewGuid())

function Invoke-Headless([string[]]$Extra) {
  $argList = @('--headless=new', '--disable-gpu', '--hide-scrollbars', "--user-data-dir=$prof", '--virtual-time-budget=15000') + $Extra
  Start-Process -FilePath $browser -ArgumentList $argList -Wait -WindowStyle Hidden | Out-Null
}

if ($Screenshots) {
  $token = node (Join-Path $src 'share-token.mjs')
  $shots = [ordered]@{ recommend = 'recommend'; compare = 'compare'; states = 'states'; variable = 'variable'; search = 'search'; share = "share=$token" }
  foreach ($k in $shots.Keys) {
    Invoke-Headless @('--window-size=1280,900', '--force-device-scale-factor=2', "--screenshot=$src\img\$k.png", "$Site#$($shots[$k])")
    Write-Host "캡처: $k.png"
  }
}

$out = Join-Path $root 'public\manual.pdf'
Invoke-Headless @('--no-pdf-header-footer', "--print-to-pdf=$out", ('file:///' + ($src -replace '\\', '/') + '/manual.html'))
Write-Host "완료: $out"
