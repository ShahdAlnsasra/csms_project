@echo off
REM Test runner script for Django backend (Windows)

echo ==========================================
echo Running Django Tests with Coverage
echo ==========================================

REM Install dependencies if needed
pip install -q coverage pytest pytest-django pytest-cov

REM Run tests with coverage
coverage run --source=api manage.py test api

REM Generate coverage report
echo.
echo ==========================================
echo Coverage Report
echo ==========================================
coverage report

REM Generate HTML coverage report
coverage html

echo.
echo ==========================================
echo HTML coverage report generated in htmlcov\
echo Open htmlcov\index.html in your browser
echo ==========================================
pause



