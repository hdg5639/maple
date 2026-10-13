@echo off
chcp 65001 > nul
title OpenMaple Classic - Local Web Server
echo ========================================================
echo   클래식 메이플스토리 웹 (OpenMaple Classic) 실행기
echo ========================================================
echo.
echo 1. Python 로컬 웹 서버 실행 중...
python server.py
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [안내] Python 실행이 불가능하여 기본 브라우저로 index.html 을 직접 엽니다.
    start index.html
)
pause
