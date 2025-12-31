from django.urls import path
from . import views
from django.http import JsonResponse
from django.urls import path
from . import views
from django.urls import path, include
from rest_framework import routers
from .views import DepartmentList
router = routers.DefaultRouter()
from .views import DepartmentAdminRequestsView
from .views import DepartmentAdminCourseDetail
from .views import (
    
    AdminSignupRequestList,
    AdminSignupRequestDecision,
    AdminDepartmentListCreate,
    get_department_admins,
    AdminDepartmentRetrieveUpdateDelete,
    DepartmentAdminSignupRequestList,
    DepartmentAdminRequestDecision,
    DepartmentAdminCourseListCreate,
    get_department_lecturers,
    department_course_graph,
    lecturer_courses,
    lecturer_syllabuses,
    
)
from django.urls import path
from .views import ai_syllabus_draft
from .views import syllabus_chat
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
    # Lecturer
    path("lecturer/courses/", lecturer_courses, name="lecturer-courses"),
    path("lecturer/syllabuses/", lecturer_syllabuses, name="lecturer-syllabuses"),


    # ====== SYSTEM ADMIN API ======
    path("admin/signup-requests/", AdminSignupRequestList.as_view(), name="admin-signup-requests"),
    path("admin/signup-requests/<int:pk>/decision/", AdminSignupRequestDecision.as_view(), name="admin-signup-decision"),
    path("admin/departments/", AdminDepartmentListCreate.as_view(), name="admin-departments"),
    path("admin/departments/<int:pk>/", AdminDepartmentRetrieveUpdateDelete.as_view(), name="admin-department-detail"),
    path("admin/department-admins/", get_department_admins, name="admin-department-admins"),

     # ====== DEPARTMENT ADMIN API ======
    path(
        "department-admin/requests/",
        DepartmentAdminSignupRequestList.as_view(),
        name="department-admin-requests",
    ),

    path(
        "department-admin/requests/<int:pk>/decision/",
        DepartmentAdminRequestDecision.as_view(),
        name="department-admin-request-decision",
    ),

     path(
        "department-admin/courses/",
        DepartmentAdminCourseListCreate.as_view(),
        name="department-admin-courses",
    ),

    path(
        "department-admin/lecturers/",
        get_department_lecturers,
        name="department-admin-lecturers",
    ),
    
    path(
        "department-admin/courses/<int:pk>/",
        DepartmentAdminCourseDetail.as_view(),
        name="department-admin-course-detail",
    ),
    path("department-admin/course-graph/", department_course_graph, name="department-course-graph"),
     path(
        "department-admin/courses/<int:pk>/ai-insights/",
        views.CourseAIInsightsView.as_view(),
        name="course-ai-insights",
    ),
    path("syllabus-statuses/", views.get_syllabus_statuses, name="syllabus-statuses"),
    path("course-semesters/", views.get_course_semesters),
    path("lecturer/syllabuses/filters/", views.lecturer_syllabus_filters),
    path("lecturer/syllabuses/create/", views.create_lecturer_syllabus),

    path("history/years/", views.get_history_years),
    path("history/courses/", views.get_history_courses),
    path("lecturer/syllabuses/<int:syllabus_id>/", views.lecturer_syllabus_detail),
    path("lecturer/syllabuses/<int:syllabus_id>/clone/", views.clone_lecturer_syllabus),
    path("ai/syllabus-draft/", ai_syllabus_draft),
    path("ai/syllabus-chat/", syllabus_chat),
    path("ai/syllabus/revise/", views.ai_syllabus_revise, name="ai-syllabus-revise"),
    path("lecturer/syllabuses/<int:syllabus_id>/chat/", views.syllabus_chat_history),
    path("lecturer/syllabuses/<int:syllabus_id>/chat/ask/", views.syllabus_chat_ask),

    # ====== REVIEWER API ======
    path("reviewer/syllabuses/new/", views.reviewer_new_syllabuses, name="reviewer-new-syllabuses"),
    path("reviewer/syllabuses/edited/", views.reviewer_edited_syllabuses, name="reviewer-edited-syllabuses"),
    path("reviewer/syllabuses/history/", views.reviewer_history_syllabuses, name="reviewer-history-syllabuses"),
    path("reviewer/syllabuses/<int:syllabus_id>/", views.reviewer_syllabus_detail, name="reviewer-syllabus-detail"),
    path("reviewer/syllabuses/<int:syllabus_id>/check-ai/", views.reviewer_check_syllabus_ai, name="reviewer-check-ai"),
    path("reviewer/syllabuses/<int:syllabus_id>/compare-ai/", views.reviewer_compare_versions, name="reviewer-compare-versions"),
    path("reviewer/syllabuses/<int:syllabus_id>/approve/", views.reviewer_approve_syllabus, name="reviewer-approve"),
    path("reviewer/syllabuses/<int:syllabus_id>/reject/", views.reviewer_reject_syllabus, name="reviewer-reject"),

    
]




