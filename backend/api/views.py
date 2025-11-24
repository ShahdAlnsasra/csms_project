from django.http import JsonResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Department, SignupRequest
from django.contrib.auth import authenticate
from rest_framework import status
import re
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from .models import  SignupRequest, MagicLink, User
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .models import Department
from .serializers import DepartmentSerializer
from django.utils import timezone
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError




class DepartmentList(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        departments = Department.objects.all()
        serializer = DepartmentSerializer(departments, many=True)
        return Response(serializer.data)


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
    first_name = (data.get("first_name") or "").strip()
    last_name = (data.get("last_name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    phone = (data.get("phone") or "").strip()
    role = data.get("role")
    department_id = data.get("department")
    study_year = data.get("study_year")
    semester = data.get("semester")


 # ---------- Required fields: report exactly what's missing ----------
    missing = []
    if not first_name:
        missing.append("first_name")
    if not last_name:
        missing.append("last_name")
    if not email:
        missing.append("email")
    if not phone:
        missing.append("phone")
    if not role:
        missing.append("role")
    if not department_id:
        missing.append("department")

    if missing:
        return Response(
            {"detail": f"Missing required fields: {', '.join(missing)}"},
            status=status.HTTP_400_BAD_REQUEST,
        )



    # ---------- Required fields ----------
    if not all([first_name, last_name, email, phone, role, department_id]):
        return Response(
            {"detail": "First name, last name, email, phone, role and department are required."},
            status=status.HTTP_400_BAD_REQUEST,
    )

    valid_roles = dict(SignupRequest.ROLES).keys()
    if role not in valid_roles:
        return Response(
            {"detail": "Invalid role."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    
     # ---------- Validate email format ----------
    try:
        validate_email(email)
    except ValidationError:
        return Response(
            {"detail": "Invalid email format."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # ---------- Email uniqueness ----------
    if User.objects.filter(email=email).exists() or SignupRequest.objects.filter(email=email).exists():
        return Response(
            {"detail": "An account or signup request with this email already exists."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # ---------- Validate names: only letters ----------
    name_regex = re.compile(r'^[A-Za-z]+$')
    if not name_regex.match(first_name):
        return Response(
            {"detail": "First name must contain only English letters (A–Z)."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if not name_regex.match(last_name):
        return Response(
            {"detail": "Last name must contain only English letters (A–Z)."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # ---------- Validate phone digits only ----------
    phone_regex = re.compile(r'^[0-9]+$')
    if not phone_regex.match(phone):
        return Response(
            {"detail": "Phone number must contain digits only."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # ✅ NEW: phone uniqueness check
    if User.objects.filter(phone=phone).exists() or SignupRequest.objects.filter(phone=phone).exists():
        return Response(
            {"detail": "An account or signup request with this phone number already exists."},
            status=status.HTTP_400_BAD_REQUEST,
        )


    # ---------- Department (must exist) ----------
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
        phone=phone,
        first_name=first_name,
        last_name=last_name,
        role=role,
        department=dept_obj,
        email_verification_code=verification_code,
        email_verified=False,
    )

   # ---------- STUDENT extra requirements ----------
    if role == "STUDENT":
        if not study_year or not semester:
            return Response(
                {"detail": "study_year and semester are required for students."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
    if role == "STUDENT":
        try:
            signup.study_year = int(study_year)
        except (ValueError, TypeError):
            return Response(
                {"detail": "study_year must be a number."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        signup.student_semester = str(semester)

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

    # 1) Password required
    if not password:
        return Response(
            {"detail": "Password is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # 2) Username is optional, but if provided we validate it
    if username:
        username = username.strip()

        # basic validation
        if len(username) < 3:
            return Response(
                {"detail": "Username must be at least 3 characters long."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if " " in username:
            return Response(
                {"detail": "Username cannot contain spaces."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # unique check
        if User.objects.filter(username=username).exists():
            return Response(
                {"detail": "This username is already taken."},
                status=status.HTTP_400_BAD_REQUEST,
            )

    # 3) Get magic link (must exist and not be used yet)
    try:
        magic = MagicLink.objects.get(token=token, is_used=False)
    except MagicLink.DoesNotExist:
        return Response(
            {"detail": "Invalid or already used link."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # 4) Check expiry (if field exists and is set)
    #    This assumes you added an `expires_at` DateTimeField to MagicLink.
    if hasattr(magic, "expires_at") and magic.expires_at:
        if magic.expires_at < timezone.now():
            return Response(
                {"detail": "This activation link has expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )

    user = magic.user

    # 5) Strong password validation (uses Django's password validators)
    try:
        validate_password(password, user=user)
    except DjangoValidationError as e:
        # e.messages is a list like ["This password is too short", ...]
        return Response(
            {"detail": e.messages},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # 6) Save password + username
    user.set_password(password)
    if username:
        user.username = username
    user.is_active = True
    user.save()

    # 7) Mark magic link as used
    magic.is_used = True
    magic.save(update_fields=["is_used"])

    return Response(
        {"detail": "Account activated successfully. You can now log in."},
        status=status.HTTP_200_OK,
    )
