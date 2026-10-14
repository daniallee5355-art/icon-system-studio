@echo off
rem Icon System Studio 실행: 더블클릭하면 개발 서버를 켜고 브라우저를 엽니다. 끌 때는 이 창을 닫으세요.
chcp 65001 > nul
cd /d "%~dp0"
if not exist node_modules (
  echo 처음 실행이라 필요한 패키지를 설치합니다...
  call npm install || goto :error
)
call npm run dev -- --open
goto :eof

:error
echo.
echo 설치에 실패했습니다. Node.js(https://nodejs.org)가 설치돼 있는지 확인하세요.
pause
