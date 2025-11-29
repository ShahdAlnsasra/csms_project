from rest_framework import serializers
from .models import Department,SignupRequest
from django.utils import timezone


# backend/api/serializers.py
from rest_framework import serializers
from .models import Department, SignupRequest, User   # 👈 להוסיף User

class DepartmentSerializer(serializers.ModelSerializer):
    department_admin_name = serializers.SerializerMethodField()
    department_admin_email = serializers.SerializerMethodField()

    class Meta:
        model = Department
        fields = [
            'id',
            'code',
            'name',
            'degree',
            'years_of_study',
            'semesters_per_year',
            'description',
            'department_admin_name',
            'department_admin_email',
        ]

    def get_department_admin_name(self, obj):
        admin = User.objects.filter(
            role="DEPARTMENT_ADMIN",
            status="APPROVED",
            department=obj
        ).first()
        if not admin:
            return None
        full = f"{admin.first_name} {admin.last_name}".strip()
        return full or admin.email

    def get_department_admin_email(self, obj):
        admin = User.objects.filter(
            role="DEPARTMENT_ADMIN",
            status="APPROVED",
            department=obj
        ).first()
        return admin.email if admin else None


from django.utils import timezone

class SignupRequestSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source="department.name", read_only=True)
    full_name = serializers.SerializerMethodField()
    created_at_display = serializers.SerializerMethodField()

    class Meta:
        model = SignupRequest
        fields = [
            "id",
            "first_name",
            "last_name",
            "full_name",
            "email",
            "phone",
            "role",
            "department",
            "department_name",
            "status",
            "rejection_reason",
            "created_at",
            "created_at_display",
            "email_verified",
        ]

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()

    def get_created_at_display(self, obj):
        return timezone.localtime(obj.created_at).strftime("%Y-%m-%d %H:%M")

