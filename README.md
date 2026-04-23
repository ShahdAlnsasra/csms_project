# CSMS Project

AI-Based Curriculum and Syllabus Management System (CSMS) with role-based workflows for:
- System Admin
- Department Admin
- Lecturer
- Reviewer
- Student

## Tech Stack

- Backend: Django + Django REST Framework
- Frontend: React (Create React App) + Tailwind CSS
- DB (dev): SQLite

## Main Modules

- Authentication and role-based onboarding
- Department and curriculum management
- Course offerings by academic term
- Syllabus authoring, review, and status workflow
- Student next-semester planning (mandatory/elective)
- Role-based notifications
- Curriculum diagrams and insights

## Project Structure

- `backend/` Django project and API
- `frontend/` React application

## Prerequisites

- Python 3.11+ (or compatible with your environment)
- Node.js 18+ and npm

## Backend Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Backend default URL: `http://127.0.0.1:8000`

## Frontend Setup

```bash
cd frontend
npm install
npm start
```

Frontend default URL: `http://localhost:3000`

## Running Both (development)

Use two terminals:
1. `backend`: `python manage.py runserver`
2. `frontend`: `npm start`

## Common Commands

### Backend

```bash
cd backend
python manage.py makemigrations
python manage.py migrate
python manage.py check
```

### Frontend

```bash
cd frontend
npm start
npm run build
npm test
```

## Notes

- Academic term and offerings drive role-specific course visibility.
- Student planning is synchronized with latest department term offerings.
- Notifications support mark-as-read and detail pages by role.

