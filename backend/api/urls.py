from django.urls import path
from . import views
from django.http import JsonResponse
from django.urls import path
from . import views
from django.urls import path, include
from rest_framework import routers
from .views import DepartmentList
router = routers.DefaultRouter()

from .views import (
    
    AdminSignupRequestList,
    AdminSignupRequestDecision,
    AdminDepartmentListCreate,
    get_department_admins,
    AdminDepartmentRetrieveUpdateDelete,
)

urlpatterns = [
    path("", include(router.urls)),
    path("signup/", views.signup_request_create, name="signup"),
    path("signup/verify-email/", views.verify_signup_email, name="signup-verify-email"),
    path("login/", views.login_view, name="login"),
    path("roles/", views.get_roles, name="roles"),
     path("departments/", DepartmentList.as_view(), name="department-list"),
    path("departments/<int:dept_id>/years/", views.get_years_for_department, name="dept-years"),
    path("semesters/", views.get_semesters, name="semesters"),
    path("activate/<uuid:token>/", views.activate_with_magic_link, name="activate"),


    # ====== SYSTEM ADMIN API ======
    path("admin/signup-requests/", AdminSignupRequestList.as_view(), name="admin-signup-requests"),
    path("admin/signup-requests/<int:pk>/decision/", AdminSignupRequestDecision.as_view(), name="admin-signup-decision"),
    path("admin/departments/", AdminDepartmentListCreate.as_view(), name="admin-departments"),
    path("admin/departments/<int:pk>/", AdminDepartmentRetrieveUpdateDelete.as_view(), name="admin-department-detail"),
    path("admin/department-admins/", get_department_admins, name="admin-department-admins"),

    
]




