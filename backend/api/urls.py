from django.urls import path
from . import views
from django.http import JsonResponse
from django.urls import path
from . import views

from django.urls import path, include
from rest_framework import routers
from .views import DepartmentList
router = routers.DefaultRouter()



urlpatterns = [
    path("", include(router.urls)),
    path("login/", views.login_view, name="login"),
    path("roles/", views.get_roles, name="roles"),
     path("departments/", DepartmentList.as_view(), name="department-list"),
    path("departments/", views.get_departments, name="departments"),
    path("departments/<int:dept_id>/years/", views.get_years_for_department, name="dept-years"),
    path("semesters/", views.get_semesters, name="semesters"),
]




