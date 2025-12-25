from django.contrib import admin
from .models import (
    User, Department, Course,
    Syllabus, SyllabusWeek, SyllabusAssessment,
    SignupRequest, MagicLink,
    SyllabusChatMessage,
    SyllabusDocument, SyllabusVersion,
)

@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ("id", "code", "name", "degree", "years_of_study", "semesters_per_year")
    search_fields = ("code", "name")
    list_filter = ("degree",)

@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ("id", "code", "name", "department", "year", "semester", "credits")
    search_fields = ("code", "name", "department__name")
    list_filter = ("department", "year", "semester")
    filter_horizontal = ("lecturers", "prerequisites")  # מאוד עוזר ב-Admin

class SyllabusWeekInline(admin.TabularInline):
    model = SyllabusWeek
    extra = 0

class SyllabusAssessmentInline(admin.TabularInline):
    model = SyllabusAssessment
    extra = 0

@admin.register(Syllabus)
class SyllabusAdmin(admin.ModelAdmin):
    list_display = ("id", "course", "uploaded_by", "academic_year", "status", "version", "updated_at")
    search_fields = ("course__code", "course__name", "uploaded_by__email", "academic_year")
    list_filter = ("status", "academic_year", "course__department")
    inlines = [SyllabusWeekInline, SyllabusAssessmentInline]

@admin.register(SignupRequest)
class SignupRequestAdmin(admin.ModelAdmin):
    list_display = ("id", "email", "role", "department", "status", "email_verified", "created_at")
    search_fields = ("email", "first_name", "last_name")
    list_filter = ("role", "status", "email_verified", "department")

@admin.register(MagicLink)
class MagicLinkAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "token", "is_used", "expires_at", "created_at")
    search_fields = ("user__email", "token")
    list_filter = ("is_used",)

@admin.register(SyllabusDocument)
class SyllabusDocumentAdmin(admin.ModelAdmin):
    list_display = ("id", "course", "lecturer", "academic_year", "created_at")
    search_fields = ("course__code", "course__name", "lecturer__email", "academic_year")
    list_filter = ("academic_year", "course__department")

@admin.register(SyllabusVersion)
class SyllabusVersionAdmin(admin.ModelAdmin):
    list_display = ("id", "document", "version", "status", "updated_at")
    list_filter = ("status",)
    search_fields = ("document__course__code", "document__lecturer__email")

@admin.register(SyllabusChatMessage)
class SyllabusChatMessageAdmin(admin.ModelAdmin):
    list_display = ("id", "role", "created_at")
    search_fields = ("content",)
    list_filter = ("role",)

admin.site.register(User)  # אם תרצי נבנה UserAdmin מסודר
