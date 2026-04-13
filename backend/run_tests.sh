#!/bin/bash
# Test runner script for Django backend

echo "=========================================="
echo "Running Django Tests with Coverage"
echo "=========================================="

# Install dependencies if needed
pip install -q coverage pytest pytest-django pytest-cov

# Run tests with coverage
coverage run --source='api' manage.py test api

# Generate coverage report
echo ""
echo "=========================================="
echo "Coverage Report"
echo "=========================================="
coverage report

# Generate HTML coverage report
coverage html

echo ""
echo "=========================================="
echo "HTML coverage report generated in htmlcov/"
echo "Open htmlcov/index.html in your browser"
echo "=========================================="



