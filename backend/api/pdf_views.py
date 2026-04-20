from io import BytesIO

from django.http import HttpResponse
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Course, Syllabus


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
    story.append(Paragraph(f"{course.code} - {course.name}", title_style))
    story.append(
        Paragraph(
            f"Version {syllabus.version} · Academic year {syllabus.academic_year or '-'} · "
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
                story.append(Paragraph(f"<i>Sources:</i> {w.sources}", body))

    assessments = list(syllabus.assessments.all())
    if assessments:
        story.append(Paragraph("Assessment breakdown", h2))
        for a in assessments:
            story.append(Paragraph(f"{a.title} - {a.percent}%", body))

    doc.build(story)
    buf.seek(0)
    return buf.read()


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def department_admin_course_syllabus_pdf(request, course_id):
    if request.user.role not in {"DEPARTMENT_ADMIN", "SYSTEM_ADMIN"}:
        return Response({"detail": "Forbidden."}, status=403)

    course = Course.objects.filter(pk=course_id).first()
    if not course:
        return Response({"detail": "Course not found."}, status=404)
    if (
        request.user.role == "DEPARTMENT_ADMIN"
        and request.user.department_id != course.department_id
    ):
        return Response({"detail": "Forbidden for this department."}, status=403)

    syllabus = _latest_approved_syllabus(course)
    if not syllabus:
        return Response({"detail": "No approved syllabus available yet."}, status=404)

    pdf = _syllabus_pdf_bytes(syllabus, course)
    resp = HttpResponse(pdf, content_type="application/pdf")
    resp["Content-Disposition"] = f'attachment; filename="{course.code}_syllabus.pdf"'
    return resp


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def system_admin_course_syllabus_pdf(request, course_id):
    if request.user.role != "SYSTEM_ADMIN":
        return Response({"detail": "Forbidden."}, status=403)

    course = Course.objects.filter(pk=course_id).first()
    if not course:
        return Response({"detail": "Course not found."}, status=404)

    syllabus = _latest_approved_syllabus(course)
    if not syllabus:
        return Response({"detail": "No approved syllabus available yet."}, status=404)

    pdf = _syllabus_pdf_bytes(syllabus, course)
    resp = HttpResponse(pdf, content_type="application/pdf")
    resp["Content-Disposition"] = f'attachment; filename="{course.code}_syllabus.pdf"'
    return resp


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def lecturer_syllabus_pdf(request, syllabus_id):
    if request.user.role != "LECTURER":
        return Response({"detail": "Forbidden."}, status=403)

    syllabus = (
        Syllabus.objects.filter(pk=syllabus_id, uploaded_by=request.user)
        .select_related("course")
        .prefetch_related("weeks", "assessments")
        .first()
    )
    if not syllabus:
        return Response({"detail": "Syllabus not found."}, status=404)
    if syllabus.status != "APPROVED":
        return Response({"detail": "Only approved syllabuses can be downloaded."}, status=400)

    course = syllabus.course
    pdf = _syllabus_pdf_bytes(syllabus, course)
    resp = HttpResponse(pdf, content_type="application/pdf")
    resp["Content-Disposition"] = (
        f'attachment; filename="{course.code}_v{syllabus.version}_syllabus.pdf"'
    )
    return resp
