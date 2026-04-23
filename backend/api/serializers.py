from rest_framework import serializers
from .models import Department,SignupRequest
from django.utils import timezone


# backend/api/serializers.py
from rest_framework import serializers
from .models import (
    Department,
    SignupRequest,
    User,
    Course,
    AcademicTerm,
    CourseOffering,
    StudentSemesterPlan,
    StudentPlannedCourse,
)
from .academic_term_utils import get_current_term


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
            "bsc_required_credits",
            "msc_required_credits",
            "bsc_max_counted_elective_credits",
            "msc_max_counted_elective_credits",
            'department_admin_name',
            'department_admin_email',
        ]
        
        extra_kwargs = {
            # 👇 make description optional in the API
            "description": {"required": False, "allow_blank": True},
        }


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
            "study_year",
            "student_semester",
            "degree_track",
            "major",
            "id_number",
        ]

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()

    def get_created_at_display(self, obj):
        return timezone.localtime(obj.created_at).strftime("%Y-%m-%d %H:%M")


class LecturerMiniSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "full_name", "email"]

    def get_full_name(self, obj):
        name = f"{obj.first_name} {obj.last_name}".strip()
        return name or obj.email



# backend/api/serializers.py (or wherever it is)
from rest_framework import serializers
from .models import Course, User, Syllabus


class CourseSerializer(serializers.ModelSerializer):
    prerequisite_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Course.objects.all(),
        write_only=True,
        source="prerequisites",
        required=False,
    )

    # ---------- read-only display fields ----------
    lecturers_display = serializers.SerializerMethodField(read_only=True)
    prerequisites_display = serializers.SerializerMethodField(read_only=True)
    has_approved_syllabus = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Course
        fields = [
            "id",
            "name",
            "code",
            "department",
            "description",
            "credits",
            "year",
            "semester",
            "degree_track",
            "planning_type",
            "prerequisite_ids",
            # read-only display:
            "lecturers_display",
            "prerequisites_display",
            "has_approved_syllabus",
        ]

    # ---------- create / update ----------
    def create(self, validated_data):
        prerequisites = validated_data.pop("prerequisites", [])

        course = Course.objects.create(**validated_data)

        if prerequisites:
            course.prerequisites.set(prerequisites)

        return course

    def update(self, instance, validated_data):
        prerequisites = validated_data.pop("prerequisites", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if prerequisites is not None:
            instance.prerequisites.set(prerequisites)

        return instance

    # ---------- display helpers ----------
    def get_lecturers_display(self, obj):
        """Lecturers assigned on the current academic term offering (if any)."""
        term = get_current_term()
        if not term:
            return []
        off = (
            CourseOffering.objects.filter(course=obj, term=term)
            .prefetch_related("lecturers")
            .first()
        )
        if not off:
            return []
        result = []
        for u in off.lecturers.all():
            full_name = f"{u.first_name} {u.last_name}".strip() or u.email
            result.append(
                {
                    "id": u.id,
                    "full_name": full_name,
                    "email": u.email,
                }
            )
        return result

    def get_prerequisites_display(self, obj):
        result = []
        for c in obj.prerequisites.all():
            result.append(
                {
                    "id": c.id,
                    "code": c.code,
                    "name": c.name,
                }
            )
        return result

    def get_has_approved_syllabus(self, obj):
        return obj.syllabuses.filter(status="APPROVED").exists()



from rest_framework import serializers
from .models import Syllabus, SyllabusWeek, SyllabusAssessment

from rest_framework import serializers
from .models import Syllabus, SyllabusWeek, SyllabusAssessment
from rest_framework import serializers


class SyllabusWeekSerializer(serializers.ModelSerializer):
    class Meta:
        model = SyllabusWeek
        fields = ["week_number", "topic", "sources"]


class SyllabusAssessmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = SyllabusAssessment
        fields = ["title", "percent"]


class SyllabusSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source="course.name", read_only=True)
    course_code = serializers.CharField(source="course.code", read_only=True)
    course_year = serializers.IntegerField(source="course.year", read_only=True)
    course_semester = serializers.CharField(source="course.semester", read_only=True)
    department_id = serializers.IntegerField(source="course.department_id", read_only=True)

    # ✅ חשוב: required=False כדי לא לחייב תמיד nested בשמירה כטיוטה
    weeks = SyllabusWeekSerializer(many=True, required=False)
    assessments = SyllabusAssessmentSerializer(many=True, required=False)

    class Meta:
        model = Syllabus
        fields = [
            "id",
            "course",
            "course_name",
            "course_code",
            "course_year",
            "course_semester",
            "department_id",
            "uploaded_by",
            "version",
            "status",
            "reviewer_comment",
            "created_at",
            "updated_at",

            "academic_year",
            "level",
            "course_type",
            "delivery",
            "instructor_email",
            "language",
            "purpose",
            "learning_outputs",
            "course_description",
            "literature",
            "teaching_methods_planned",
            "guidelines",

            "weeks",
            "assessments",
        ]

        read_only_fields = ["uploaded_by", "version", "created_at", "updated_at"]

    def validate(self, attrs):
        save_as = (
        self.context.get("save_as")
        or self.initial_data.get("save_as")
        or self.initial_data.get("saveAs")
        or "SUBMIT"
        )
        is_draft = (save_as == "DRAFT")
               # ✅ בדראפט לא דורשים "100%"
        if is_draft:
            return attrs
        assessments = attrs.get("assessments", None)

        # אם לא שלחו assessments בכלל (למשל draft חלקי) -> לא בודקים 100%
        if assessments is None:
            return attrs

        total = 0
        for a in assessments:
            try:
                total += int(a.get("percent", 0) or 0)
            except Exception:
                total += 0

        if assessments and total != 100:
            raise serializers.ValidationError(
                {"assessments": "Assessment percentages must total exactly 100%."}
            )

        return attrs

    def create(self, validated_data):
        weeks_data = validated_data.pop("weeks", [])
        assessments_data = validated_data.pop("assessments", [])

        syllabus = Syllabus.objects.create(**validated_data)

        if weeks_data:
            SyllabusWeek.objects.bulk_create([
                SyllabusWeek(
                    syllabus=syllabus,
                    week_number=w.get("week_number"),
                    topic=w.get("topic", ""),
                    sources=w.get("sources", ""),
                )
                for w in weeks_data
            ])

        if assessments_data:
            SyllabusAssessment.objects.bulk_create([
                SyllabusAssessment(
                    syllabus=syllabus,
                    title=a.get("title", ""),
                    percent=int(a.get("percent", 0) or 0),
                )
                for a in assessments_data
            ])

        return syllabus

    def update(self, instance, validated_data):
        # ✅ זה התיקון העיקרי ל־500
        weeks_data = validated_data.pop("weeks", None)
        assessments_data = validated_data.pop("assessments", None)

        # update שדות רגילים
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # אם שלחו weeks — נחליף את כולם
        if weeks_data is not None:
            instance.weeks.all().delete()
            if weeks_data:
                SyllabusWeek.objects.bulk_create([
                    SyllabusWeek(
                        syllabus=instance,
                        week_number=w.get("week_number"),
                        topic=w.get("topic", ""),
                        sources=w.get("sources", ""),
                    )
                    for w in weeks_data
                ])

        # אם שלחו assessments — נחליף את כולם
        if assessments_data is not None:
            instance.assessments.all().delete()
            if assessments_data:
                SyllabusAssessment.objects.bulk_create([
                    SyllabusAssessment(
                        syllabus=instance,
                        title=a.get("title", ""),
                        percent=int(a.get("percent", 0) or 0),
                    )
                    for a in assessments_data
                ])
            # ✅ פה מוסיפים מעבר סטטוס לפי save_as
        save_as = (
             self.context.get("save_as")
             or self.initial_data.get("save_as")
             or self.initial_data.get("saveAs")
             or "SUBMIT"
              )

        if save_as == "SUBMIT":
            instance.status = "PENDING_REVIEW"
            instance.reviewer_comment = ""  # לנקות הערות קודמות
            instance.save(update_fields=["status", "reviewer_comment"])
            
        elif save_as == "DRAFT":
            instance.status = "DRAFT"
            # ✅ Don't clear reviewer_comment when saving as DRAFT - preserve it for reference
            instance.save(update_fields=["status"])
        return instance



# api/serializers.py
from rest_framework import serializers
from .models import SyllabusChatMessage

class SyllabusChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = SyllabusChatMessage
        fields = ["id", "syllabus", "role", "content", "created_at"]
        read_only_fields = ["id", "created_at"]


from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    course_code = serializers.SerializerMethodField()
    course_name = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            "id",
            "title",
            "body",
            "notification_type",
            "course",
            "sender_name",
            "course_code",
            "course_name",
            "created_at",
            "read_at",
        ]

    def get_sender_name(self, obj):
        if obj.sender_id:
            return (
                f"{obj.sender.first_name} {obj.sender.last_name}".strip()
                or obj.sender.email
            )
        return None

    def get_course_code(self, obj):
        return obj.course.code if obj.course_id else None

    def get_course_name(self, obj):
        return obj.course.name if obj.course_id else None


class AcademicTermSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicTerm
        fields = ["id", "academic_year", "semester", "is_current"]


class CourseOfferingSerializer(serializers.ModelSerializer):
    lecturer_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        write_only=True,
        source="lecturers",
        queryset=User.objects.filter(role="LECTURER", status="APPROVED"),
        required=False,
    )
    lecturers_display = LecturerMiniSerializer(source="lecturers", many=True, read_only=True)
    course_name = serializers.CharField(source="course.name", read_only=True)
    course_code = serializers.CharField(source="course.code", read_only=True)
    term_display = serializers.SerializerMethodField()

    class Meta:
        model = CourseOffering
        fields = [
            "id",
            "course",
            "course_name",
            "course_code",
            "term",
            "term_display",
            "department",
            "lecturer_ids",
            "lecturers_display",
            "student_edit_start",
            "student_edit_end",
        ]

    def get_term_display(self, obj):
        return f"{obj.term.academic_year} · {obj.term.semester}"

    def create(self, validated_data):
        lecturers = validated_data.pop("lecturers", [])
        offering = CourseOffering.objects.create(**validated_data)
        if lecturers:
            offering.lecturers.set(lecturers)
        return offering

    def update(self, instance, validated_data):
        lecturers = validated_data.pop("lecturers", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if lecturers is not None:
            instance.lecturers.set(lecturers)
        return instance


class StudentPlannedCourseSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source="course.name", read_only=True)
    course_code = serializers.CharField(source="course.code", read_only=True)
    credits = serializers.DecimalField(
        source="course.credits", max_digits=3, decimal_places=1, read_only=True
    )

    class Meta:
        model = StudentPlannedCourse
        fields = [
            "id",
            "course",
            "course_name",
            "course_code",
            "credits",
            "selection_type",
            "counts_toward_degree_elective",
        ]


class StudentSemesterPlanSerializer(serializers.ModelSerializer):
    planned_courses = StudentPlannedCourseSerializer(many=True, read_only=True)
    term_display = serializers.SerializerMethodField()

    class Meta:
        model = StudentSemesterPlan
        fields = [
            "id",
            "student",
            "term",
            "term_display",
            "degree_track",
            "status",
            "submitted_at",
            "planned_courses",
        ]
        read_only_fields = ["status", "submitted_at"]

    def get_term_display(self, obj):
        return f"{obj.term.academic_year} · {obj.term.semester}"
