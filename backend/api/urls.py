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
from .student_views import (
    StudentCourseAIInsightsView,
    student_course_detail,
    student_course_syllabus_pdf,
    student_department_courses,
    student_my_courses,
    student_my_department,
    student_notifications,
    student_notification_detail,
    student_notification_mark_read,
    student_notifications_mark_all_read,
    student_notification_unread_count,
)
from .role_notifications import (
    lecturer_notifications,
    lecturer_notification_detail,
    lecturer_notification_mark_read,
    lecturer_notifications_mark_all_read,
    lecturer_notification_unread_count,
    reviewer_notifications,
    reviewer_notification_detail,
    reviewer_notification_mark_read,
    reviewer_notification_unread_count,
)
from .pdf_views import (
    department_admin_course_syllabus_pdf,
    lecturer_syllabus_pdf,
    system_admin_course_syllabus_pdf,
)
from .term_degree_views import (
    current_term,
    department_admin_term_edit_window,
    department_admin_offering_detail,
    department_admin_offerings,
    lecturer_offerings,
    list_terms,
    next_term,
    reviewer_department_courses_by_term,
    set_current_term,
    student_next_semester_plan,
    student_next_term_courses,
    student_save_next_semester_plan,
    student_submit_next_semester_plan,
)
urlpatterns = [
    path("", include(router.urls)),
    path("signup/", views.signup_request_create, name="signup"),
    path("signup/verify-email/", views.verify_signup_email, name="signup-verify-email"),
    path(
        "signup/resend-verification-code/",
        views.resend_signup_verification_code,
        name="signup-resend-verification-code",
    ),
    path("login/", views.login_view, name="login"),
    path("roles/", views.get_roles, name="roles"),
    path("departments/", DepartmentList.as_view(), name="department-list"),
    path("departments/<int:dept_id>/years/", views.get_years_for_department, name="dept-years"),
    path("semesters/", views.get_semesters, name="semesters"),
    path("activate/<uuid:token>/", views.activate_with_magic_link, name="activate"),
    path("forgot-password/", views.forgot_password_request, name="forgot-password"),
    path("reset-password/<uuid:token>/", views.reset_password_with_magic_link, name="reset-password"),
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
    path("terms/", list_terms, name="terms-list"),
    path("terms/current/", current_term, name="terms-current"),
    path("terms/next/", next_term, name="terms-next"),
    path("admin/terms/current/", set_current_term, name="terms-set-current"),
    path("department-admin/course-offerings/", department_admin_offerings, name="department-admin-offerings"),
    path(
        "department-admin/term-edit-window/",
        department_admin_term_edit_window,
        name="department-admin-term-edit-window",
    ),
    path(
        "department-admin/course-offerings/<int:offering_id>/",
        department_admin_offering_detail,
        name="department-admin-offering-detail",
    ),
    path("lecturer/course-offerings/", lecturer_offerings, name="lecturer-offerings"),
    path(
        "reviewer/department-courses/",
        reviewer_department_courses_by_term,
        name="reviewer-department-courses-by-term",
    ),
    path("lecturer/syllabuses/filters/", views.lecturer_syllabus_filters),
    path("lecturer/syllabuses/create/", views.create_lecturer_syllabus),

    path("history/years/", views.get_history_years),
    path("history/courses/", views.get_history_courses),
    path("lecturer/syllabuses/<int:syllabus_id>/", views.lecturer_syllabus_detail),
    path(
        "lecturer/syllabuses/<int:syllabus_id>/download-pdf/",
        lecturer_syllabus_pdf,
        name="lecturer-syllabus-pdf",
    ),
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
    path("reviewer/notifications/", reviewer_notifications, name="reviewer-notifications"),
    path(
        "reviewer/notifications/unread-count/",
        reviewer_notification_unread_count,
        name="reviewer-notifications-unread",
    ),
    path(
        "reviewer/notifications/<int:notification_id>/",
        reviewer_notification_detail,
        name="reviewer-notification-detail",
    ),
    path(
        "reviewer/notifications/<int:notification_id>/read/",
        reviewer_notification_mark_read,
        name="reviewer-notification-read",
    ),

    # ====== STUDENT API ======
    path("student/my-courses/", student_my_courses, name="student-my-courses"),
    path("student/my-department/", student_my_department, name="student-my-department"),
    path("student/department-courses/", student_department_courses, name="student-dept-courses"),
    path("student/courses/<int:course_id>/", student_course_detail, name="student-course-detail"),
    path(
        "student/courses/<int:course_id>/syllabus-pdf/",
        student_course_syllabus_pdf,
        name="student-syllabus-pdf",
    ),
    path(
        "student/courses/<int:pk>/ai-insights/",
        StudentCourseAIInsightsView.as_view(),
        name="student-course-ai-insights",
    ),
    path("student/notifications/", student_notifications, name="student-notifications"),
    path("student/next-semester-plan/", student_next_semester_plan, name="student-next-plan"),
    path("student/next-semester-plan/save/", student_save_next_semester_plan, name="student-next-plan-save"),
    path(
        "student/next-semester-plan/submit/",
        student_submit_next_semester_plan,
        name="student-next-plan-submit",
    ),
    path("student/my-courses/next-term/", student_next_term_courses, name="student-next-term-courses"),
    path(
        "student/notifications/unread-count/",
        student_notification_unread_count,
        name="student-notifications-unread",
    ),
    path(
        "student/notifications/<int:notification_id>/",
        student_notification_detail,
        name="student-notification-detail",
    ),
    path(
        "student/notifications/<int:notification_id>/read/",
        student_notification_mark_read,
        name="student-notification-read",
    ),
    path(
        "student/notifications/mark-all-read/",
        student_notifications_mark_all_read,
        name="student-notifications-mark-all-read",
    ),
    path(
        "department-admin/courses/<int:course_id>/syllabus-pdf/",
        department_admin_course_syllabus_pdf,
        name="department-admin-syllabus-pdf",
    ),
    path(
        "admin/courses/<int:course_id>/syllabus-pdf/",
        system_admin_course_syllabus_pdf,
        name="admin-syllabus-pdf",
    ),
    path("lecturer/notifications/", lecturer_notifications, name="lecturer-notifications"),
    path(
        "lecturer/notifications/unread-count/",
        lecturer_notification_unread_count,
        name="lecturer-notifications-unread",
    ),
    path(
        "lecturer/notifications/<int:notification_id>/",
        lecturer_notification_detail,
        name="lecturer-notification-detail",
    ),
    path(
        "lecturer/notifications/<int:notification_id>/read/",
        lecturer_notification_mark_read,
        name="lecturer-notification-read",
    ),
    path(
        "lecturer/notifications/mark-all-read/",
        lecturer_notifications_mark_all_read,
        name="lecturer-notifications-mark-all-read",
    ),
    
]




