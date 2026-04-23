"""
Student-facing API: courses, syllabus PDF, curriculum insights, notifications.
"""
from io import BytesIO

from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer

from .models import Course, CourseOffering, Notification, Syllabus
from .academic_term_utils import SEM_ORDER, get_current_term
from .serializers import (
    CourseSerializer,
    DepartmentSerializer,
    NotificationSerializer,
    SyllabusSerializer,
)
from .views import CourseAIInsightsView


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def student_my_department(request):
    user, err = _student_user(request)
    if err:
        return err
    dept = user.department
    if not dept:
        return Response(
            {"detail": "No department assigned."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    return Response(DepartmentSerializer(dept).data)


def _student_user(request):
    if not request.user.is_authenticated:
        return None, Response(
            {"detail": "Authentication required."},
            status=status.HTTP_401_UNAUTHORIZED,
        )
    if getattr(request.user, "role", None) != "STUDENT":
        return None, Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)
    if not request.user.department_id:
        return None, Response(
            {"detail": "No department on your profile."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    return request.user, None


def _latest_approved_syllabus(course: Course):
    return (
        Syllabus.objects.filter(course=course, status="APPROVED")
        .select_related("uploaded_by", "course")
        .prefetch_related("weeks", "assessments")
        .order_by("-academic_year", "-version", "-updated_at")
        .first()
    )


def _syllabus_pdf_bytes(syllabus: Syllabus, course: Course) -> bytes:
    buf = BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        rightMargin=2 * cm,
        leftMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
    )
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "T",
        parent=styles["Heading1"],
        fontSize=16,
        spaceAfter=12,
        textColor="#111827",
    )
    h2 = ParagraphStyle(
        "H2",
        parent=styles["Heading2"],
        fontSize=12,
        spaceBefore=10,
        spaceAfter=6,
        textColor="#312e81",
    )
    body = ParagraphStyle(
        "Body",
        parent=styles["Normal"],
        fontSize=10,
        leading=14,
        textColor="#334155",
    )

    story = []
    story.append(Paragraph(f"{course.code} — {course.name}", title_style))
    story.append(
        Paragraph(
            f"Version {syllabus.version} · Academic year {syllabus.academic_year or '—'} · "
            f"Status {syllabus.status}",
            body,
        )
    )
    story.append(Spacer(1, 8))

    fields = [
        ("Purpose", syllabus.purpose),
        ("Learning outcomes", syllabus.learning_outputs),
        ("Course description", syllabus.course_description),
        ("Literature", syllabus.literature),
        ("Teaching methods", syllabus.teaching_methods_planned),
        ("Guidelines", syllabus.guidelines),
    ]
    for label, text in fields:
        if text:
            story.append(Paragraph(label, h2))
            story.append(Paragraph(str(text).replace("\n", "<br/>"), body))

    weeks = list(syllabus.weeks.all().order_by("week_number"))
    if weeks:
        story.append(Paragraph("Weekly plan", h2))
        for w in weeks:
            story.append(
                Paragraph(
                    f"<b>Week {w.week_number}</b>: {str(w.topic or '').replace(chr(10), '<br/>')}",
                    body,
                )
            )
            if w.sources:
                story.append(
                    Paragraph(f"<i>Sources:</i> {w.sources}", body),
                )

    assessments = list(syllabus.assessments.all())
    if assessments:
        story.append(Paragraph("Assessment breakdown", h2))
        for a in assessments:
            story.append(
                Paragraph(f"{a.title} — {a.percent}%", body),
            )

    doc.build(story)
    buf.seek(0)
    return buf.read()


class StudentCourseAIInsightsView(CourseAIInsightsView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        user, err = _student_user(request)
        if err:
            return err
        exists = Course.objects.filter(pk=pk, department_id=user.department_id).exists()
        if not exists:
            return Response({"detail": "Course not found."}, status=status.HTTP_404_NOT_FOUND)
        return super().get(request, pk)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def student_my_courses(request):
    user, err = _student_user(request)
    if err:
        return err

    term = get_current_term()
    if not term:
        return Response([])
    offerings = CourseOffering.objects.filter(
        department_id=user.department_id,
        term=term,
    ).select_related("course")
    courses = []
    for off in offerings:
        c = off.course
        if user.degree_track and c.degree_track not in [user.degree_track, "BOTH"]:
            continue
        if user.study_year is not None and c.year != user.study_year:
            continue
        courses.append(c)
    courses = sorted({c.id: c for c in courses}.values(), key=lambda x: (x.year, x.code))
    return Response(CourseSerializer(courses, many=True).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def student_department_courses(request):
    """All courses in the student's department (for curriculum diagram)."""
    user, err = _student_user(request)
    if err:
        return err

    qs = (
        Course.objects.filter(department_id=user.department_id)
        .filter(degree_track__in=[user.degree_track, "BOTH"] if user.degree_track else ["BSC", "MSC", "BOTH"])
        .order_by("year", "semester", "code")
    )
    return Response(CourseSerializer(qs, many=True).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def student_course_detail(request, course_id):
    user, err = _student_user(request)
    if err:
        return err

    course_qs = Course.objects.filter(pk=course_id, department_id=user.department_id)
    if user.degree_track:
        course_qs = course_qs.filter(degree_track__in=[user.degree_track, "BOTH"])
    course = course_qs.first()
    if not course:
        return Response({"detail": "Course not found."}, status=status.HTTP_404_NOT_FOUND)

    syllabus = _latest_approved_syllabus(course)
    primary_lecturer = None

    current = get_current_term()
    preferred_terms = []
    if current:
        preferred_terms.append(current)
        idx = SEM_ORDER.index(current.semester)
        if idx < len(SEM_ORDER) - 1:
            next_sem = SEM_ORDER[idx + 1]
            next_year = current.academic_year
        else:
            next_sem = "A"
            start, end = current.academic_year.split("-")
            next_year = f"{int(start) + 1}-{int(end) + 1}"
        from .models import AcademicTerm

        next_term = AcademicTerm.objects.filter(academic_year=next_year, semester=next_sem).first()
        if next_term:
            preferred_terms.append(next_term)

    off = None
    for t in preferred_terms:
        off = CourseOffering.objects.filter(course=course, term=t).prefetch_related("lecturers").first()
        if off and off.lecturers.exists():
            break
        off = None
    if not off:
        # Fallback: any available offering for this course (latest updated first)
        off = (
            CourseOffering.objects.filter(course=course)
            .prefetch_related("lecturers")
            .order_by("-updated_at")
            .first()
        )
    lecturer_contacts = []
    if off:
        for lec in off.lecturers.all():
            full_name = f"{lec.first_name} {lec.last_name}".strip() or lec.email
            lecturer_contacts.append({"id": lec.id, "full_name": full_name, "email": lec.email})
        primary_lecturer = off.lecturers.first()
    lec_name = (
        f"{primary_lecturer.first_name} {primary_lecturer.last_name}".strip()
        if primary_lecturer
        else None
    )
    lec_email = primary_lecturer.email if primary_lecturer else None

    return Response(
        {
            "course": CourseSerializer(course).data,
            "lecturer_name": lec_name,
            "lecturer_email": lec_email,
            "lecturer_contacts": lecturer_contacts,
            "latest_syllabus": SyllabusSerializer(syllabus).data if syllabus else None,
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def student_course_syllabus_pdf(request, course_id):
    user, err = _student_user(request)
    if err:
        return err

    course = Course.objects.filter(pk=course_id, department_id=user.department_id).first()
    if not course:
        return Response({"detail": "Course not found."}, status=status.HTTP_404_NOT_FOUND)

    syllabus = _latest_approved_syllabus(course)
    if not syllabus:
        return Response(
            {"detail": "No approved syllabus is available for this course yet."},
            status=status.HTTP_404_NOT_FOUND,
        )

    pdf = _syllabus_pdf_bytes(syllabus, course)
    resp = HttpResponse(pdf, content_type="application/pdf")
    resp["Content-Disposition"] = f'attachment; filename="{course.code}_syllabus.pdf"'
    return resp


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def student_notifications(request):
    user, err = _student_user(request)
    if err:
        return err

    qs = Notification.objects.filter(recipient=user)
    unread_only = request.query_params.get("unread")
    if unread_only in ("1", "true", "yes"):
        qs = qs.filter(read_at__isnull=True)
    qs = qs.select_related("sender", "course")[:200]
    return Response(NotificationSerializer(qs, many=True).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def student_notification_detail(request, notification_id):
    user, err = _student_user(request)
    if err:
        return err

    n = get_object_or_404(Notification, pk=notification_id, recipient=user)
    return Response(NotificationSerializer(n).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def student_notification_mark_read(request, notification_id):
    user, err = _student_user(request)
    if err:
        return err

    n = get_object_or_404(Notification, pk=notification_id, recipient=user)
    if not n.read_at:
        n.read_at = timezone.now()
        n.save(update_fields=["read_at"])
    return Response({"detail": "Marked as read."})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def student_notification_unread_count(request):
    user, err = _student_user(request)
    if err:
        return err

    n = Notification.objects.filter(recipient=user, read_at__isnull=True).count()
    return Response({"unread": n})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def student_notifications_mark_all_read(request):
    user, err = _student_user(request)
    if err:
        return err
    now = timezone.now()
    updated = Notification.objects.filter(recipient=user, read_at__isnull=True).update(read_at=now)
    return Response({"detail": "All marked as read.", "updated": updated})
