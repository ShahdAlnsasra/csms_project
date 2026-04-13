@echo off
echo ========================================
echo CSMS - Complete Test Suite
echo ========================================
echo.

echo [1/3] Running Backend Tests with Coverage...
echo ----------------------------------------
cd backend
python -m coverage run --source='api' manage.py test api
python -m coverage report
python -m coverage html
cd ..
echo.
echo Backend coverage report generated at: backend\htmlcov\index.html
echo.

echo [2/3] Running Frontend Tests with Coverage...
echo ----------------------------------------
cd frontend
call npm test -- --coverage --watchAll=false --passWithNoTests
cd ..
echo.
echo Frontend coverage report generated at: frontend\coverage\index.html
echo.

echo [3/3] Summary
echo ----------------------------------------
echo All tests completed!
echo.
echo To view coverage reports:
echo   - Backend: Open backend\htmlcov\index.html in your browser
echo   - Frontend: Open frontend\coverage\index.html in your browser
echo.
pause


