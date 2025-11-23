from django.http import JsonResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Department, SignupRequest
from django.contrib.auth import authenticate
from rest_framework import status

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .models import Department
from .serializers import DepartmentSerializer



class DepartmentList(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        departments = Department.objects.all()
        serializer = DepartmentSerializer(departments, many=True)
        return Response(serializer.data)

# ------------------
#   DEPARTMENTS API
# ------------------
# @api_view(['GET'])
# def get_departments(request):
#     depts = Department.objects.all()
#     serializer = DepartmentSerializer(depts, many=True)
#     return Response(serializer.data)



@api_view(['POST'])
def signup_request_create(request):
    """
    Create a SignupRequest (pending user account).
    Expects JSON like:
    {
        "first_name": "...",
        "last_name": "...",
        "email": "...",
        "role": "STUDENT" | "LECTURER" | "REVIEWER" | "DEPARTMENT_ADMIN",
        "department": 1,        # department id
        "study_year": 2         # optional, only for STUDENT
    }
    """
    data = request.data

    first_name = data.get("first_name")
    last_name = data.get("last_name")
    email = data.get("email")
    role = data.get("role")
    department_id = data.get("department")
    study_year = data.get("study_year")

    # basic validation
    if not all([first_name, last_name, email, role]):
        return Response(
            {"detail": "First name, last name, email and role are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # validate role
    valid_roles = dict(SignupRequest.ROLES).keys()
    if role not in valid_roles:
        return Response(
            {"detail": "Invalid role."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # department (required for all your signup roles)
    dept_obj = None
    if department_id:
        try:
            dept_obj = Department.objects.get(id=department_id)
        except Department.DoesNotExist:
            return Response(
                {"detail": "Department not found."},
                status=status.HTTP_400_BAD_REQUEST,
            )

    # create SignupRequest
    signup = SignupRequest(
        email=email,
        first_name=first_name,
        last_name=last_name,
        role=role,
        department=dept_obj,
    )

    # only for students, store study_year
    if role == "STUDENT" and study_year:
        try:
            signup.study_year = int(study_year)
        except ValueError:
            return Response(
                {"detail": "study_year must be a number."},
                status=status.HTTP_400_BAD_REQUEST,
            )

    signup.save()

    return Response(
        {
            "id": signup.id,
            "status": signup.status,   # will be "PENDING"
            "role": signup.role,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(['GET'])
def get_years_for_department(request, dept_id):
    try:
        department = Department.objects.get(id=dept_id)
        years = list(range(1, department.years_of_study + 1))
        return Response({"years": years})
    except Department.DoesNotExist:
        return Response({"error": "Department not found"}, status=404)


@api_view(['GET'])
def get_semesters(request):
    semesters = [s[0] for s in SignupRequest._meta.get_field("student_semester").choices]
    return Response({"semesters": semesters})


# ------------------
#   ROLES API
# ------------------
@api_view(['GET'])
def get_roles(request):
    roles = [{"value": r[0], "label": r[1]} for r in SignupRequest.ROLES]
    return Response(roles)


# ------------------
#   BASIC HOME TEST
# ------------------
def home(request):
    return JsonResponse({"message": "CSMS Backend is running!"})


# backend/api/views.py
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.core.mail import send_mail
from django.conf import settings
import random

from .models import Department, SignupRequest, MagicLink, User

# ---------- LOGIN VIEW (you already have) ----------
from .models import User

@api_view(['POST'])
def login_view(request):
    """
    Simple login endpoint:
    - expects: { "identifier": "...", "password": "..." }
      (identifier can be email or username)
    """
    identifier = request.data.get("identifier") or request.data.get("email")
    password = request.data.get("password")

    if not identifier or not password:
        return Response(
            {"detail": "Identifier and password are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # find user by email or username
    user_obj = None
    if "@" in identifier:
        user_obj = User.objects.filter(email=identifier).first()
    else:
        user_obj = User.objects.filter(username=identifier).first()

    if user_obj is None:
        return Response(
            {"detail": "Invalid username/email or password."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Django's authenticate uses USERNAME_FIELD="email", so we pass email
    from django.contrib.auth import authenticate
    user = authenticate(request, username=user_obj.email, password=password)

    if user is None:
        return Response(
            {"detail": "Invalid username/email or password."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    return Response(
        {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": user.role,
        },
        status=status.HTTP_200_OK,
    )


# ---------- SIGNUP: create request + send verification code ----------
@api_view(['POST'])
def signup_request_create(request):
    """
    Create a SignupRequest and send an email verification code.
    """
    data = request.data

    first_name = data.get("first_name")
    last_name = data.get("last_name")
    email = data.get("email")
    role = data.get("role")
    department_id = data.get("department")
    study_year = data.get("study_year")

    if not all([first_name, last_name, email, role]):
        return Response(
            {"detail": "First name, last name, email and role are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    valid_roles = dict(SignupRequest.ROLES).keys()
    if role not in valid_roles:
        return Response(
            {"detail": "Invalid role."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    dept_obj = None
    if department_id:
        try:
            dept_obj = Department.objects.get(id=department_id)
        except Department.DoesNotExist:
            return Response(
                {"detail": "Department not found."},
                status=status.HTTP_400_BAD_REQUEST,
            )

    # generate 6-digit verification code
    verification_code = f"{random.randint(0, 999999):06d}"

    signup = SignupRequest(
        email=email,
        first_name=first_name,
        last_name=last_name,
        role=role,
        department=dept_obj,
        email_verification_code=verification_code,
        email_verified=False,
    )

    if role == "STUDENT" and study_year:
        try:
            signup.study_year = int(study_year)
        except ValueError:
            return Response(
                {"detail": "study_year must be a number."},
                status=status.HTTP_400_BAD_REQUEST,
            )

    signup.save()

    # send verification code via Gmail
    subject = "Verify your email for CSMS"
    message = (
        f"Hi {first_name},\n\n"
        f"Thank you for signing up to CSMS.\n"
        f"Your verification code is: {verification_code}\n\n"
        f"Please enter this code in the system to verify your email."
    )

    send_mail(
        subject=subject,
        message=message,
        from_email=getattr(settings, "DEFAULT_FROM_EMAIL", settings.EMAIL_HOST_USER),
        recipient_list=[email],
        fail_silently=False,
    )

    return Response(
        {
            "id": signup.id,
            "status": signup.status,     # PENDING
            "email": signup.email,
            "email_verified": signup.email_verified,
        },
        status=status.HTTP_201_CREATED,
    )

# ---------- VERIFY EMAIL CODE ----------
@api_view(['POST'])
def verify_signup_email(request):
    """
    POST /api/signup/verify-email/
    {
      "email": "...",
      "code": "123456"
    }
    """
    email = request.data.get("email")
    code = request.data.get("code")

    if not email or not code:
        return Response(
            {"detail": "Email and code are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        signup = SignupRequest.objects.get(email=email)
    except SignupRequest.DoesNotExist:
        return Response(
            {"detail": "Signup request not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if signup.status == "REJECTED":
        return Response(
            {"detail": "This request was rejected."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if signup.email_verified:
        return Response(
            {"detail": "Email already verified."},
            status=status.HTTP_200_OK,
        )

    if signup.email_verification_code != code:
        return Response(
            {"detail": "Invalid verification code."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    signup.email_verified = True
    signup.save(update_fields=["email_verified"])

    return Response(
        {"detail": "Email verified successfully."},
        status=status.HTTP_200_OK,
    )

# ---------- ACTIVATE WITH MAGIC LINK ----------
@api_view(["POST"])
def activate_with_magic_link(request, token):
    """
    POST /api/activate/<token>/
    Body: { "password": "...", "username": "..." }
    """
    password = request.data.get("password")
    username = request.data.get("username")

    if not password:
        return Response(
            {"detail": "Password is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # username is optional, but if provided we validate it
    if username:
        # basic validation
        if len(username) < 3:
            return Response(
                {"detail": "Username must be at least 3 characters long."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        # unique check
        from .models import User
        if User.objects.filter(username=username).exists():
            return Response(
                {"detail": "This username is already taken."},
                status=status.HTTP_400_BAD_REQUEST,
            )

    try:
        magic = MagicLink.objects.get(token=token, is_used=False)
    except MagicLink.DoesNotExist:
        return Response(
            {"detail": "Invalid or already used link."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = magic.user
    user.set_password(password)
    if username:
        user.username = username
    user.save()

    magic.is_used = True
    magic.save(update_fields=["is_used"])

    return Response(
        {"detail": "Account activated successfully. You can now log in."},
        status=status.HTTP_200_OK,
    )
