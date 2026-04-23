from decimal import Decimal

from django.db import transaction
from django.utils.dateparse import parse_datetime
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .academic_term_utils import SEM_ORDER, get_current_term
from .models import (
    AcademicTerm,
    Course,
    CourseOffering,
    Department,
    DepartmentTermEditWindow,
    Notification,
    StudentPlannedCourse,
    StudentSemesterPlan,
    User,
)
from .serializers import (
    AcademicTermSerializer,
    CourseOfferingSerializer,
    CourseSerializer,
    StudentSemesterPlanSerializer,
)


MAX_ELECTIVE_COURSES = 7
MAX_ELECTIVE_CREDITS = Decimal("21")
MAX_TERM_DEPARTMENT_CREDITS = Decimal("20")


def _department_term_credits_total(department_id, term_id, year=None, exclude_course_id=None):
    qs = CourseOffering.objects.filter(department_id=department_id, term_id=term_id).select_related(
        "course"
    )
    if year is not None:
        qs = qs.filter(course__year=year)
    if exclude_course_id is not None:
        qs = qs.exclude(course_id=exclude_course_id)
    return sum((Decimal(o.course.credits) for o in qs), Decimal("0"))


def _student_edit_window_state(department_id, term):
    window = DepartmentTermEditWindow.objects.filter(department_id=department_id, term=term).first()
    if not window or not window.student_edit_start or not window.student_edit_end:
        return {
            "can_edit_electives": True,
            "edit_window_start": None,
            "edit_window_end": None,
            "edit_window_message": "No edit window is configured. You can edit electives now.",
        }
    start = window.student_edit_start
    end = window.student_edit_end
    now = timezone.now()
    can_edit = bool(start and end and start <= now <= end)
    msg = (
        "Elective editing is open."
        if can_edit
        else "Elective editing is currently closed. Contact your department admin for the allowed edit window."
    )
    return {
        "can_edit_electives": can_edit,
        "edit_window_start": start,
        "edit_window_end": end,
        "edit_window_message": msg,
    }


@api_view(["GET", "PUT"])
@permission_classes([IsAuthenticated])
def department_admin_term_edit_window(request):
    if request.user.role != "DEPARTMENT_ADMIN":
        return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)
    term_id = request.query_params.get("term_id") or request.data.get("term_id")
    if not term_id:
        return Response({"detail": "term_id is required."}, status=status.HTTP_400_BAD_REQUEST)
    term = AcademicTerm.objects.filter(id=term_id).first()
    if not term:
        return Response({"detail": "Term not found."}, status=status.HTTP_404_NOT_FOUND)

    window, _ = DepartmentTermEditWindow.objects.get_or_create(
        department_id=request.user.department_id,
        term=term,
    )
    if request.method == "GET":
        return Response(
            {
                "term_id": term.id,
                "student_edit_start": window.student_edit_start,
                "student_edit_end": window.student_edit_end,
            }
        )

    start_raw = request.data.get("student_edit_start")
    end_raw = request.data.get("student_edit_end")
    start_val = parse_datetime(start_raw) if start_raw else None
    end_val = parse_datetime(end_raw) if end_raw else None
    if start_val and end_val and end_val <= start_val:
        return Response(
            {"detail": "Student edit end time must be after start time."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    window.student_edit_start = start_val
    window.student_edit_end = end_val
    window.save(update_fields=["student_edit_start", "student_edit_end", "updated_at"])
    return Response(
        {
            "term_id": term.id,
            "student_edit_start": window.student_edit_start,
            "student_edit_end": window.student_edit_end,
        }
    )


def _student_progress_summary(user):
    degree_track = user.degree_track or "BSC"
    dept = user.department
    if not dept:
        return {
            "completed_courses_count": 0,
            "completed_credits": "0",
            "required_credits": "0",
            "progress_percent": 0,
            "remaining_credits": "0",
        }
    required_credits = Decimal(
        dept.bsc_required_credits if degree_track == "BSC" else dept.msc_required_credits
    )
    submitted_plans = StudentSemesterPlan.objects.filter(student=user, status="SUBMITTED")
    completed_courses = Course.objects.filter(planned_in__plan__in=submitted_plans).distinct()
    regular_credits = sum((Decimal(c.credits) for c in completed_courses), Decimal("0"))
    counted_elective_credits = sum(
        (
            Decimal(pc.course.credits)
            for pc in StudentPlannedCourse.objects.filter(
                plan__in=submitted_plans,
                selection_type="ELECTIVE",
                counts_toward_degree_elective=True,
            ).select_related("course")
        ),
        Decimal("0"),
    )
    non_counted_elective_credits = sum(
        (
            Decimal(pc.course.credits)
            for pc in StudentPlannedCourse.objects.filter(
                plan__in=submitted_plans,
                selection_type="ELECTIVE",
                counts_toward_degree_elective=False,
            ).select_related("course")
        ),
        Decimal("0"),
    )
    effective = max(Decimal("0"), regular_credits - non_counted_elective_credits)
    completed_credits = effective
    percent = (
        min(100, int((completed_credits / required_credits) * 100))
        if required_credits > 0
        else 0
    )
    remaining = max(Decimal("0"), required_credits - completed_credits)
    return {
        "completed_courses_count": completed_courses.count(),
        "completed_credits": str(completed_credits),
        "required_credits": str(required_credits),
        "progress_percent": percent,
        "remaining_credits": str(remaining),
        "counted_elective_credits": str(counted_elective_credits),
    }


def _next_term_from_current(current_term):
    idx = SEM_ORDER.index(current_term.semester)
    if idx < len(SEM_ORDER) - 1:
        next_sem = SEM_ORDER[idx + 1]
        next_year = current_term.academic_year
    else:
        next_sem = "A"
        start, end = current_term.academic_year.split("-")
        next_year = f"{int(start) + 1}-{int(end) + 1}"
    term, _ = AcademicTerm.objects.get_or_create(academic_year=next_year, semester=next_sem)
    return term


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_terms(request):
    get_current_term()
    terms = AcademicTerm.objects.all().order_by("-academic_year", "semester")
    return Response(AcademicTermSerializer(terms, many=True).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def current_term(request):
    term = get_current_term()
    if not term:
        return Response({"detail": "Current term is not configured."}, status=status.HTTP_404_NOT_FOUND)
    return Response(AcademicTermSerializer(term).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def next_term(request):
    term = get_current_term()
    if not term:
        return Response({"detail": "Current term is not configured."}, status=status.HTTP_404_NOT_FOUND)
    next_t = _next_term_from_current(term)
    return Response(AcademicTermSerializer(next_t).data)


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def set_current_term(request):
    if request.user.role != "SYSTEM_ADMIN":
        return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)
    term_id = request.data.get("term_id")
    if not term_id:
        return Response({"detail": "term_id is required."}, status=status.HTTP_400_BAD_REQUEST)
    term = AcademicTerm.objects.filter(id=term_id).first()
    if not term:
        return Response({"detail": "Term not found."}, status=status.HTTP_404_NOT_FOUND)
    AcademicTerm.objects.filter(is_current=True).update(is_current=False)
    term.is_current = True
    term.save(update_fields=["is_current"])
    return Response(AcademicTermSerializer(term).data)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def department_admin_offerings(request):
    if request.user.role != "DEPARTMENT_ADMIN":
        return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)
    department_id = request.query_params.get("department_id") or request.data.get("department")
    term_id = request.query_params.get("term_id") or request.data.get("term")
    if request.method == "GET":
        qs = CourseOffering.objects.filter(department_id=request.user.department_id).select_related(
            "course", "term", "department"
        ).prefetch_related("lecturers")
        if department_id:
            qs = qs.filter(department_id=department_id)
        if term_id:
            qs = qs.filter(term_id=term_id)
        return Response(CourseOfferingSerializer(qs, many=True).data)

    course_id = request.data.get("course")
    department_id_raw = request.data.get("department")
    term_id_raw = request.data.get("term")
    lecturer_ids = request.data.get("lecturer_ids") or []
    student_edit_start = request.data.get("student_edit_start")
    student_edit_end = request.data.get("student_edit_end")
    if not course_id or not department_id_raw or not term_id_raw:
        return Response(
            {"detail": "course, department and term are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    course = Course.objects.filter(id=course_id).first()
    department_obj = Department.objects.filter(id=department_id_raw).first()
    term_obj = AcademicTerm.objects.filter(id=term_id_raw).first()
    if not course or not department_obj or not term_obj:
        return Response({"detail": "Invalid course, department or term."}, status=status.HTTP_400_BAD_REQUEST)
    if department_obj.id != request.user.department_id or course.department_id != request.user.department_id:
        return Response({"detail": "Only your department is allowed."}, status=status.HTTP_403_FORBIDDEN)

    total_without = _department_term_credits_total(
        department_obj.id, term_obj.id, year=course.year, exclude_course_id=course.id
    )
    if total_without + course.credits > MAX_TERM_DEPARTMENT_CREDITS:
        return Response(
            {
                "detail": (
                    f"Year {course.year} already has {total_without} credits scheduled for "
                    f"{term_obj.academic_year} {term_obj.semester}. Adding {course.code} "
                    f"({course.credits} cr.) would exceed the {MAX_TERM_DEPARTMENT_CREDITS}-credit limit for this year and term."
                )
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    offering, created = CourseOffering.objects.get_or_create(
        course=course,
        term=term_obj,
        defaults={"department": department_obj},
    )
    old_ids = set(offering.lecturers.values_list("id", flat=True))
    lecturer_users = User.objects.filter(
        id__in=lecturer_ids,
        role="LECTURER",
        status="APPROVED",
        department_id=request.user.department_id,
    )
    new_ids = set(lecturer_users.values_list("id", flat=True))
    offering.lecturers.set(lecturer_users)
    if student_edit_start is not None:
        offering.student_edit_start = parse_datetime(student_edit_start) if student_edit_start else None
    if student_edit_end is not None:
        offering.student_edit_end = parse_datetime(student_edit_end) if student_edit_end else None
    if offering.student_edit_start and offering.student_edit_end:
        if offering.student_edit_end <= offering.student_edit_start:
            return Response(
                {"detail": "Student edit end time must be after start time."},
                status=status.HTTP_400_BAD_REQUEST,
            )
    offering.save(update_fields=["student_edit_start", "student_edit_end", "updated_at"])
    added = new_ids - old_ids
    removed = old_ids - new_ids
    for user_id in added:
        Notification.objects.create(
            recipient_id=user_id,
            sender=request.user,
            course=offering.course,
            notification_type="LECTURER_ASSIGNED_NEXT_TERM",
            title="New next-semester assignment",
            body=f"You were assigned to {offering.course.code} for {offering.term.academic_year} {offering.term.semester}.",
        )
    for user_id in removed:
        Notification.objects.create(
            recipient_id=user_id,
            sender=request.user,
            course=offering.course,
            notification_type="LECTURER_UNASSIGNED_NEXT_TERM",
            title="Assignment updated",
            body=f"You were unassigned from {offering.course.code} for {offering.term.academic_year} {offering.term.semester}.",
        )
    output = CourseOfferingSerializer(offering).data
    return Response(output, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


@api_view(["PUT", "DELETE"])
@permission_classes([IsAuthenticated])
def department_admin_offering_detail(request, offering_id):
    if request.user.role != "DEPARTMENT_ADMIN":
        return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)
    offering = CourseOffering.objects.filter(id=offering_id, department_id=request.user.department_id).first()
    if not offering:
        return Response({"detail": "Offering not found."}, status=status.HTTP_404_NOT_FOUND)
    if request.method == "DELETE":
        removed_ids = list(offering.lecturers.values_list("id", flat=True))
        course = offering.course
        term = offering.term
        offering.delete()
        for user_id in removed_ids:
            Notification.objects.create(
                recipient_id=user_id,
                sender=request.user,
                course=course,
                notification_type="LECTURER_UNASSIGNED_NEXT_TERM",
                title="Assignment removed",
                body=f"{course.code} was removed from {term.academic_year} {term.semester}.",
            )
        return Response(status=status.HTTP_204_NO_CONTENT)
    serializer = CourseOfferingSerializer(offering, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    updated = serializer.save()
    return Response(CourseOfferingSerializer(updated).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def lecturer_offerings(request):
    if request.user.role != "LECTURER":
        return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)
    term_id = request.query_params.get("term_id")
    qs = CourseOffering.objects.filter(lecturers=request.user).select_related("course", "term", "department")
    if term_id:
        qs = qs.filter(term_id=term_id)
    return Response(CourseOfferingSerializer(qs, many=True).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def reviewer_department_courses_by_term(request):
    if request.user.role != "REVIEWER":
        return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)
    term_id = request.query_params.get("term_id")
    if not term_id:
        return Response({"detail": "term_id is required."}, status=status.HTTP_400_BAD_REQUEST)
    offerings = CourseOffering.objects.filter(
        department_id=request.user.department_id, term_id=term_id
    ).select_related("course")
    course_ids = offerings.values_list("course_id", flat=True)
    courses = Course.objects.filter(id__in=course_ids).order_by("year", "semester", "code")
    return Response(CourseSerializer(courses, many=True).data)


def _prior_degree_elective_usage(student):
    prior = StudentPlannedCourse.objects.filter(
        plan__student=student,
        plan__status="SUBMITTED",
        selection_type="ELECTIVE",
    ).select_related("course")
    count = prior.count()
    credits = sum((Decimal(pc.course.credits) for pc in prior), Decimal("0"))
    return count, credits


def _ordered_elective_courses(elective_course_ids, offered_ids):
    filtered_ids = [cid for cid in elective_course_ids if cid in offered_ids]
    if not filtered_ids:
        return []
    courses = list(
        Course.objects.filter(id__in=filtered_ids, planning_type="ELECTIVE")
    )
    order_map = {cid: i for i, cid in enumerate(filtered_ids)}
    courses.sort(key=lambda c: order_map.get(c.id, 10**9))
    return courses


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def student_next_semester_plan(request):
    if request.user.role != "STUDENT":
        return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)
    current = get_current_term()
    if not current:
        return Response({"detail": "Current term is not configured."}, status=status.HTTP_400_BAD_REQUEST)
    next_t = _next_term_from_current(current)
    degree_track = request.user.degree_track or "BSC"
    plan, _ = StudentSemesterPlan.objects.get_or_create(
        student=request.user, term=next_t, degree_track=degree_track
    )

    offerings = CourseOffering.objects.filter(
        department_id=request.user.department_id, term=next_t
    ).select_related("course")
    if request.user.study_year:
        offerings = offerings.filter(course__year=request.user.study_year)
    offered_courses = [
        o.course
        for o in offerings
        if o.course.degree_track in {degree_track, "BOTH"}
    ]
    mandatory = [c for c in offered_courses if c.planning_type == "MANDATORY"]
    previously_taken_elective_ids = set(
        StudentPlannedCourse.objects.filter(
            plan__student=request.user,
            plan__status="SUBMITTED",
            selection_type="ELECTIVE",
        ).values_list("course_id", flat=True)
    )
    electives = [c for c in offered_courses if c.planning_type == "ELECTIVE"]

    offered_ids = {c.id for c in offered_courses}
    mandatory_ids = {c.id for c in mandatory}
    elective_ids = {c.id for c in electives}
    with transaction.atomic():
        # Keep plan synced with latest offerings for this year+term.
        plan.planned_courses.exclude(course_id__in=offered_ids).delete()
        plan.planned_courses.filter(selection_type="MANDATORY").exclude(course_id__in=mandatory_ids).delete()
        plan.planned_courses.filter(selection_type="ELECTIVE").exclude(course_id__in=elective_ids).delete()
        existing_ids = set(plan.planned_courses.values_list("course_id", flat=True))
        for c in mandatory:
            if c.id not in existing_ids:
                StudentPlannedCourse.objects.create(plan=plan, course=c, selection_type="MANDATORY")

    plan.refresh_from_db()
    mandatory_credits = sum((c.credits for c in mandatory), Decimal("0"))
    selected_elective_credits = sum(
        (
            pc.course.credits
            for pc in plan.planned_courses.filter(selection_type="ELECTIVE", course_id__in=elective_ids).select_related(
                "course"
            )
        ),
        Decimal("0"),
    )
    prior_elective_count, prior_elective_credits = _prior_degree_elective_usage(request.user)
    remaining_degree_courses = max(0, MAX_ELECTIVE_COURSES - prior_elective_count)
    remaining_degree_credits = max(Decimal("0"), MAX_ELECTIVE_CREDITS - prior_elective_credits)
    edit_window = _student_edit_window_state(request.user.department_id, next_t)
    progress = _student_progress_summary(request.user)

    return Response(
        {
            "plan": StudentSemesterPlanSerializer(plan).data,
            "mandatory_courses": CourseSerializer(mandatory, many=True).data,
            "elective_options": CourseSerializer(electives, many=True).data,
            "already_taken_elective_ids": sorted(list(previously_taken_elective_ids)),
            "elective_credit_cap": remaining_degree_credits,
            "max_elective_courses": MAX_ELECTIVE_COURSES,
            "prior_elective_courses_used": prior_elective_count,
            "prior_elective_credits_used": str(prior_elective_credits),
            "remaining_degree_elective_courses": remaining_degree_courses,
            "remaining_degree_elective_credits": str(remaining_degree_credits),
            "mandatory_credits_total": str(mandatory_credits),
            "max_semester_credits": str(MAX_TERM_DEPARTMENT_CREDITS),
            "selected_elective_credits": selected_elective_credits,
            "selected_semester_credits_total": str(mandatory_credits + selected_elective_credits),
            "can_edit_electives": edit_window["can_edit_electives"],
            "edit_window_start": edit_window["edit_window_start"],
            "edit_window_end": edit_window["edit_window_end"],
            "edit_window_message": edit_window["edit_window_message"],
            "progress": progress,
            "warning_message": "These courses are available only if you successfully pass all previous-semester prerequisite courses.",
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def student_save_next_semester_plan(request):
    if request.user.role != "STUDENT":
        return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)
    plan_id = request.data.get("plan_id")
    elective_course_ids = request.data.get("elective_course_ids") or []
    plan = StudentSemesterPlan.objects.filter(id=plan_id, student=request.user).first()
    if not plan:
        return Response({"detail": "Plan not found."}, status=status.HTTP_404_NOT_FOUND)
    edit_window = _student_edit_window_state(request.user.department_id, plan.term)
    if not edit_window["can_edit_electives"]:
        return Response(
            {"detail": edit_window["edit_window_message"]},
            status=status.HTTP_400_BAD_REQUEST,
        )

    offered_qs = CourseOffering.objects.filter(term=plan.term, department_id=request.user.department_id)
    if request.user.study_year:
        offered_qs = offered_qs.filter(course__year=request.user.study_year)
    offered_ids = set(offered_qs.values_list("course_id", flat=True))
    previously_taken_elective_ids = set(
        StudentPlannedCourse.objects.filter(
            plan__student=request.user,
            plan__status="SUBMITTED",
            selection_type="ELECTIVE",
        ).values_list("course_id", flat=True)
    )
    requested_ids = [int(cid) for cid in elective_course_ids if str(cid).isdigit()]
    dup_ids = [cid for cid in requested_ids if cid in previously_taken_elective_ids]
    if dup_ids:
        dup_courses = Course.objects.filter(id__in=dup_ids).order_by("code")
        names = ", ".join([f"{c.code}" for c in dup_courses]) or "selected electives"
        return Response(
            {"detail": f"You already selected these elective courses in a previous submitted plan: {names}."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    courses_list = _ordered_elective_courses(elective_course_ids, offered_ids)

    mandatory_credits = sum(
        (
            pc.course.credits
            for pc in plan.planned_courses.filter(selection_type="MANDATORY").select_related("course")
        ),
        Decimal("0"),
    )
    elective_total = sum((c.credits for c in courses_list), Decimal("0"))
    if mandatory_credits + elective_total > MAX_TERM_DEPARTMENT_CREDITS:
        return Response(
            {
                "detail": (
                    f"Semester total is {mandatory_credits + elective_total} credits; "
                    f"maximum allowed is {MAX_TERM_DEPARTMENT_CREDITS} (mandatory + electives)."
                )
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    prior_count, prior_credits = _prior_degree_elective_usage(request.user)
    rem_courses = max(0, MAX_ELECTIVE_COURSES - prior_count)
    rem_credits = max(Decimal("0"), MAX_ELECTIVE_CREDITS - prior_credits)

    plan.planned_courses.filter(selection_type="ELECTIVE").delete()
    rows = []
    rc, rcr = rem_courses, rem_credits
    for c in courses_list:
        toward = rc > 0 and rcr >= Decimal(c.credits)
        rows.append(
            StudentPlannedCourse(
                plan=plan,
                course=c,
                selection_type="ELECTIVE",
                counts_toward_degree_elective=toward,
            )
        )
        if toward:
            rc -= 1
            rcr -= Decimal(c.credits)
    if rows:
        StudentPlannedCourse.objects.bulk_create(rows)

    plan = StudentSemesterPlan.objects.prefetch_related("planned_courses__course").get(pk=plan.pk)
    return Response(StudentSemesterPlanSerializer(plan).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def student_submit_next_semester_plan(request):
    if request.user.role != "STUDENT":
        return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)
    plan_id = request.data.get("plan_id")
    plan = (
        StudentSemesterPlan.objects.filter(id=plan_id, student=request.user)
        .prefetch_related("planned_courses__course")
        .first()
    )
    if not plan:
        return Response({"detail": "Plan not found."}, status=status.HTTP_404_NOT_FOUND)
    edit_window = _student_edit_window_state(request.user.department_id, plan.term)
    if not edit_window["can_edit_electives"]:
        return Response(
            {"detail": edit_window["edit_window_message"]},
            status=status.HTTP_400_BAD_REQUEST,
        )

    mandatory_credits = sum(
        (
            pc.course.credits
            for pc in plan.planned_courses.filter(selection_type="MANDATORY")
        ),
        Decimal("0"),
    )
    elective_credits = sum(
        (pc.course.credits for pc in plan.planned_courses.filter(selection_type="ELECTIVE")),
        Decimal("0"),
    )
    if mandatory_credits + elective_credits > MAX_TERM_DEPARTMENT_CREDITS:
        return Response(
            {
                "detail": (
                    f"Cannot submit: semester total is {mandatory_credits + elective_credits} credits; "
                    f"maximum is {MAX_TERM_DEPARTMENT_CREDITS}. Adjust your electives and save again."
                )
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    plan.status = "SUBMITTED"
    plan.submitted_at = timezone.now()
    plan.save(update_fields=["status", "submitted_at"])
    Notification.objects.create(
        recipient=request.user,
        title="Plan submitted",
        body=f"Your plan for {plan.term.academic_year} {plan.term.semester} is now locked.",
        notification_type="STUDENT_PLAN_SUBMITTED",
    )
    return Response(StudentSemesterPlanSerializer(plan).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def student_next_term_courses(request):
    if request.user.role != "STUDENT":
        return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)
    current = get_current_term()
    if not current:
        return Response({"detail": "Current term is not configured."}, status=status.HTTP_400_BAD_REQUEST)
    next_t = _next_term_from_current(current)
    degree_track = request.user.degree_track or "BSC"
    plan = StudentSemesterPlan.objects.filter(
        student=request.user, term=next_t, degree_track=degree_track
    ).first()
    if not plan:
        return Response([])
    courses = Course.objects.filter(
        planned_in__plan=plan,
    ).distinct()
    return Response(CourseSerializer(courses, many=True).data)
