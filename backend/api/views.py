from django.http import JsonResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Course, User
from .serializers import CourseSerializer
from rest_framework import status
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
from django.contrib.auth import authenticate
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token

# Lecturer / syllabus utilities
from .models import Syllabus
from .serializers import SyllabusSerializer
from .serializers import DepartmentSerializer
from django.utils import timezone
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from .serializers import SyllabusSerializer

from django.db.models import Q
from .serializers import DepartmentSerializer, SignupRequestSerializer

# Lecturer / syllabus
from .models import Syllabus
from .serializers import SyllabusSerializer



from rest_framework import status
from .models import Department


class DepartmentList(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        departments = Department.objects.all()
        serializer = DepartmentSerializer(departments, many=True)
        return Response(serializer.data)

    def post(self, request):
        """
        Create a new Department (SYSTEM_ADMIN only בעתיד נעשה הרשאות).
        """
        serializer = DepartmentSerializer(data=request.data)
        if serializer.is_valid():
            dept = serializer.save()
            return Response(DepartmentSerializer(dept).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


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
    token, _ = Token.objects.get_or_create(user=user)


    return Response(
        {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "phone": user.phone,
            "id_number": user.id_number,
            "role": user.role,
            "token": token.key,
            "status": user.status,
            "department": user.department_id,
            "department_name": user.department.name if user.department else None,
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
    id_number = (data.get("id_number") or "").strip()

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
    if not id_number:
        missing.append("id_number")
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
    if not all([first_name, last_name, email, phone, role, department_id ,id_number]):
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

    # ---------- Validate phone: 10 digits ----------
    if not re.fullmatch(r'\d{10}', phone):
        return Response(
            {"detail": "Phone number must be exactly 10 digits."},
            status=status.HTTP_400_BAD_REQUEST,
        )   


    # ✅ NEW: phone uniqueness check
    if User.objects.filter(phone=phone).exists() or SignupRequest.objects.filter(phone=phone).exists():
        return Response(
            {"detail": "An account or signup request with this phone number already exists."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    
        # ---------- Validate phone: 10 digits ----------
    if not re.fullmatch(r'\d{10}', phone):
        return Response(
            {"detail": "Phone number must be exactly 10 digits."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # ✅ NEW: phone uniqueness (already exist in your code)
    if User.objects.filter(phone=phone).exists() or SignupRequest.objects.filter(phone=phone).exists():
        return Response(
            {"detail": "An account or signup request with this phone number already exists."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # ---------- Validate ID number: 9 digits ----------
    if not re.fullmatch(r'\d{9}', id_number):
        return Response(
            {"detail": "ID number must be exactly 9 digits."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # ✅ NEW: ID uniqueness
    if User.objects.filter(id_number=id_number).exists() or SignupRequest.objects.filter(id_number=id_number).exists():
        return Response(
            {"detail": "An account or signup request with this ID number already exists."},
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
    
      # ✅ NEW: only one Department Admin per department
    if role == "DEPARTMENT_ADMIN":
        # if there is already an APPROVED Department Admin for this dept, block signup
        if User.objects.filter(
            role="DEPARTMENT_ADMIN",
            department=dept_obj,
            status="APPROVED",
        ).exists():
            return Response(
                {"detail": "This department already has an approved Department Admin."},
                status=status.HTTP_400_BAD_REQUEST,
            )

    # generate 6-digit verification code
    verification_code = f"{random.randint(0, 999999):06d}"

    signup = SignupRequest(
        email=email,
        phone=phone,
        first_name=first_name,
        last_name=last_name,
        id_number=id_number,
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




from rest_framework.views import APIView
from rest_framework.permissions import AllowAny  # יש לך את זה כבר

class AdminSignupRequestList(APIView):
    """
    GET /api/admin/signup-requests/?status=PENDING&search=...
    מחזיר את כל הבקשות של Department Admins (אפשר לסנן לפי סטטוס וחיפוש).
    """
    permission_classes = [AllowAny]  # בהמשך אפשר IsAdminUser

    def get(self, request):
        qs = SignupRequest.objects.filter(role="DEPARTMENT_ADMIN")

        status_param = request.query_params.get("status")
        search = request.query_params.get("search")

        if status_param in ["PENDING", "APPROVED", "REJECTED"]:
            qs = qs.filter(status=status_param)

        if search:
            qs = qs.filter(
                Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
                | Q(email__icontains=search)
                | Q(department__name__icontains=search)
            )

        qs = qs.order_by("-created_at")
        serializer = SignupRequestSerializer(qs, many=True)
        return Response(serializer.data)

class DepartmentAdminSignupRequestList(APIView):
    """
    GET /api/department-admin/requests/?department_id=...&status=PENDING&role=STUDENT&search=...
    Returns all signup requests (students/lecturers/reviewers) for a specific department.
    """
    permission_classes = [AllowAny]  # later you can tighten this

    def get(self, request):
        dept_id = request.query_params.get("department_id")
        if not dept_id:
            return Response(
                {"detail": "department_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            dept_id_int = int(dept_id)
        except ValueError:
            return Response(
                {"detail": "department_id must be an integer."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        qs = SignupRequest.objects.filter(
            department_id=dept_id_int
        ).exclude(role="DEPARTMENT_ADMIN")

        status_param = request.query_params.get("status")
        if status_param in ["PENDING", "APPROVED", "REJECTED"]:
            qs = qs.filter(status=status_param)

        role_param = request.query_params.get("role")
        if role_param in ["STUDENT", "LECTURER", "REVIEWER"]:
            qs = qs.filter(role=role_param)

        search = request.query_params.get("search")
        if search:
            qs = qs.filter(
                Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
                | Q(email__icontains=search)
            )

        qs = qs.order_by("-created_at")
        serializer = SignupRequestSerializer(qs, many=True)
        return Response(serializer.data)

# backend/api/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q

from .models import SignupRequest
from .serializers import SignupRequestSerializer


class DepartmentAdminRequestsView(APIView):
    """
    Returns signup requests (STUDENT / LECTURER / REVIEWER)
    for a given department.
    """

    def get(self, request):
        dept_id = request.query_params.get("department_id")
        status_param = request.query_params.get("status")  # PENDING/APPROVED/REJECTED
        role_param = request.query_params.get("role")      # optional LECTURER/STUDENT/REVIEWER
        search = request.query_params.get("search", "")

        if not dept_id:
            return Response(
                {"detail": "department_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        qs = SignupRequest.objects.filter(
            department_id=dept_id
        ).exclude(role="DEPARTMENT_ADMIN")

        if status_param:
            qs = qs.filter(status=status_param)

        if role_param:
            qs = qs.filter(role=role_param)

        if search:
            qs = qs.filter(
                Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
                | Q(email__icontains=search)
            )

        qs = qs.order_by("-created_at")

        serializer = SignupRequestSerializer(qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    
from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone
from datetime import timedelta
from .models import MagicLink, User


class AdminSignupRequestDecision(APIView):
    """
    POST /api/admin/signup-requests/<pk>/decision/
    body: { "action": "APPROVE" or "REJECT", "reason": "..." }
    """
    permission_classes = [AllowAny]  # בהמשך נקשיח

    def post(self, request, pk):
        action = (request.data.get("action") or "").upper()
        reason = (request.data.get("reason") or "").strip()

        try:
            signup = SignupRequest.objects.get(pk=pk, role="DEPARTMENT_ADMIN")
        except SignupRequest.DoesNotExist:
            return Response(
                {"detail": "Signup request not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if signup.status != "PENDING":
            return Response(
                {"detail": "This request was already processed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ========== APPROVE ==========
        if action == "APPROVE":
            if not signup.email_verified:
                return Response(
                    {"detail": "Cannot approve request before email is verified."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            # ✅ NEW: double-check department has no existing approved admin
            if User.objects.filter(
                role="DEPARTMENT_ADMIN",
                department=signup.department,
                status="APPROVED",
            ).exists():
                return Response(
                    {"detail": "This department already has an approved Department Admin."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            # יצירת משתמש חדש במערכת
            user = User.objects.create_user(
                email=signup.email,
                first_name=signup.first_name,
                last_name=signup.last_name,
                phone=signup.phone,
                id_number=signup.id_number,
                role="DEPARTMENT_ADMIN",
                department=signup.department,
                status="APPROVED",
            )

            # יצירת magic link + תוקף
            expires_at = timezone.now() + timedelta(days=7)
            magic = MagicLink.objects.create(
                user=user,
                expires_at=expires_at,
            )

            # נבנה לינק להפעלה (פרונט)
            frontend_base = getattr(
                settings, "FRONTEND_BASE_URL", "http://localhost:3000"
            )
            activate_url = f"{frontend_base}/activate/{magic.token}/"

            # מייל – אושר
            subject = "Your CSMS Department Admin request was approved"

            lines = [
                f"Hi {signup.first_name} {signup.last_name},",
                "",
                "Your signup request as Department Admin was approved.",
            ]

            if reason:
                lines.append("")
                lines.append("Message from System Admin:")
                lines.append(reason)

            lines.extend(
                [
                    "",
                    "To activate your account and set a password, please click the link below:",
                    "",
                    activate_url,
                    "",
                    f"This link will expire on {expires_at.strftime('%Y-%m-%d %H:%M')}.",
                    "",
                    "Best regards,",
                    "CSMS Team",
                ]
            )

            message = "\n".join(lines)

            send_mail(
                subject=subject,
                message=message,
                from_email=getattr(
                    settings, "DEFAULT_FROM_EMAIL", settings.EMAIL_HOST_USER
                ),
                recipient_list=[signup.email],
                fail_silently=False,
            )

            signup.status = "APPROVED"
            signup.rejection_reason = ""
            signup.magic_link_sent = True
            signup.save(
                update_fields=["status", "rejection_reason", "magic_link_sent"]
            )

            return Response(
                {"detail": "Request approved and activation email sent."},
                status=status.HTTP_200_OK,
            )

        # ========== REJECT ==========
        elif action == "REJECT":
            if not reason:
                reason = "No specific reason was provided."

            signup.status = "REJECTED"
            signup.rejection_reason = reason
            signup.save(update_fields=["status", "rejection_reason"])

            # מייל – נדחה
            subject = "Your CSMS Department Admin request was rejected"

            lines = [
                f"Hi {signup.first_name} {signup.last_name},",
                "",
                "Unfortunately, your signup request as Department Admin was rejected.",
            ]

            if reason:
                lines.append("")
                lines.append("Message from System Admin:")
                lines.append(reason)

            lines.extend(
                [
                    "",
                    "Best regards,",
                    "CSMS Team",
                ]
            )

            message = "\n".join(lines)

            send_mail(
                subject=subject,
                message=message,
                from_email=getattr(
                    settings, "DEFAULT_FROM_EMAIL", settings.EMAIL_HOST_USER
                ),
                recipient_list=[signup.email],
                fail_silently=False,
            )

            return Response(
                {"detail": "Request rejected and email sent to the user."},
                status=status.HTTP_200_OK,
            )

        else:
            return Response(
                {"detail": "Invalid action. Use APPROVE or REJECT."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        

# backend/api/views.py

class DepartmentAdminRequestDecision(APIView):
    """
    POST /api/department-admin/requests/<pk>/decision/
    body: { "action": "APPROVE" or "REJECT", "reason": "..." }

    Used by Department Admin to approve/reject STUDENT / LECTURER / REVIEWER signup requests.
    """
    permission_classes = [AllowAny]  # later you can restrict

    def post(self, request, pk):
        action = (request.data.get("action") or "").upper()
        reason = (request.data.get("reason") or "").strip()

        try:
            signup = SignupRequest.objects.get(pk=pk)
        except SignupRequest.DoesNotExist:
            return Response(
                {"detail": "Signup request not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # ✅ Department Admin must NOT use this endpoint for Department Admin requests
        if signup.role == "DEPARTMENT_ADMIN":
            return Response(
                {"detail": "This endpoint is not for Department Admin signup requests."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if signup.status != "PENDING":
            return Response(
                {"detail": "This request was already processed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ========== APPROVE ==========
        if action == "APPROVE":
            # optional but recommended – only after email verified
            if not signup.email_verified:
                return Response(
                    {"detail": "Cannot approve request before email is verified."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # create user with same department + role as in signup
            user = User.objects.create_user(
                email=signup.email,
                first_name=signup.first_name,
                last_name=signup.last_name,
                phone=signup.phone,
                id_number=signup.id_number,
                role=signup.role,               # STUDENT / LECTURER / REVIEWER
                department=signup.department,   # same department
                status="APPROVED",
            )

            # create magic link so they can set password
            expires_at = timezone.now() + timedelta(days=7)
            magic = MagicLink.objects.create(
                user=user,
                expires_at=expires_at,
            )

            frontend_base = getattr(
                settings, "FRONTEND_BASE_URL", "http://localhost:3000"
            )
            activate_url = f"{frontend_base}/activate/{magic.token}/"

            subject = "Your CSMS account request was approved"

            lines = [
                f"Hi {signup.first_name} {signup.last_name},",
                "",
                f"Your signup request as {signup.role} in {signup.department.name if signup.department else 'your department'} was approved.",
            ]

            if reason:
                lines.append("")
                lines.append("Message from Department Admin:")
                lines.append(reason)

            lines.extend(
                [
                    "",
                    "To activate your account and set a password, please click the link below:",
                    "",
                    activate_url,
                    "",
                    f"This link will expire on {expires_at.strftime('%Y-%m-%d %H:%M')}.",
                    "",
                    "Best regards,",
                    "CSMS Team",
                ]
            )

            message = "\n".join(lines)

            send_mail(
                subject=subject,
                message=message,
                from_email=getattr(
                    settings, "DEFAULT_FROM_EMAIL", settings.EMAIL_HOST_USER
                ),
                recipient_list=[signup.email],
                fail_silently=False,
            )

            signup.status = "APPROVED"
            signup.rejection_reason = ""
            signup.magic_link_sent = True
            signup.save(
                update_fields=["status", "rejection_reason", "magic_link_sent"]
            )

            return Response(
                {"detail": "Request approved and activation email sent."},
                status=status.HTTP_200_OK,
            )

        # ========== REJECT ==========
        elif action == "REJECT":
            if not reason:
                reason = "No specific reason was provided."

            signup.status = "REJECTED"
            signup.rejection_reason = reason
            signup.save(update_fields=["status", "rejection_reason"])

            subject = "Your CSMS account request was rejected"

            lines = [
                f"Hi {signup.first_name} {signup.last_name},",
                "",
                f"Unfortunately, your signup request as {signup.role} was rejected.",
            ]

            if reason:
                lines.append("")
                lines.append("Message from Department Admin:")
                lines.append(reason)

            lines.extend(
                [
                    "",
                    "Best regards,",
                    "CSMS Team",
                ]
            )

            message = "\n".join(lines)

            send_mail(
                subject=subject,
                message=message,
                from_email=getattr(
                    settings, "DEFAULT_FROM_EMAIL", settings.EMAIL_HOST_USER
                ),
                recipient_list=[signup.email],
                fail_silently=False,
            )

            return Response(
                {"detail": "Request rejected and email sent to the user."},
                status=status.HTTP_200_OK,
            )

        else:
            return Response(
                {"detail": "Invalid action. Use APPROVE or REJECT."},
                status=status.HTTP_400_BAD_REQUEST,
            )




@api_view(["GET"])
def get_department_admins(request):
    """
    GET /api/admin/department-admins/
    מחזיר את כל המשתמשים שהם Department Admin מאושרים.
    """
    admins = User.objects.filter(
        role="DEPARTMENT_ADMIN",
        status="APPROVED",
    ).select_related("department").order_by("first_name", "last_name")

    data = []
    for u in admins:
        full_name = f"{u.first_name} {u.last_name}".strip() or u.email
        data.append(
            {
                "id": u.id,
                "full_name": full_name,
                "email": u.email,
                "department_id": u.department_id,
                "department_name": u.department.name if u.department else None,
            }
        )

    return Response(data)


class AdminDepartmentListCreate(APIView):
    """
    GET  /api/admin/departments/    -> רשימת מחלקות
    POST /api/admin/departments/    -> יצירת מחלקה חדשה
    """
    permission_classes = [AllowAny]  # בעתיד אפשר להקשיח ל־IsAdminUser

    def get(self, request):
        departments = Department.objects.all().order_by("code")
        serializer = DepartmentSerializer(departments, many=True)
        return Response(serializer.data)

    def post(self, request):
        print("=== ADMIN DEPT CREATE PAYLOAD ===")
        print(request.data)

        admin_user_id = request.data.get("admin_user_id")
        serializer = DepartmentSerializer(data=request.data)

        if not serializer.is_valid():
            print("=== ADMIN DEPT CREATE ERRORS ===")
            print(serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        dept = serializer.save()

        if admin_user_id:
            try:
                admin_user = User.objects.get(
                    id=admin_user_id, role="DEPARTMENT_ADMIN"
                )
                admin_user.department = dept
                admin_user.save(update_fields=["department"])
            except User.DoesNotExist:
                return Response(
                    {"detail": "Selected department admin does not exist."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        return Response(DepartmentSerializer(dept).data, status=status.HTTP_201_CREATED)




# backend/api/views.py – אחרי AdminDepartmentListCreate


from rest_framework.views import APIView
from rest_framework import status
from .models import Department
from .serializers import DepartmentSerializer

# class AdminDepartmentRetrieveUpdateDelete(APIView):
#     """
#     GET    /api/admin/departments/<pk>/
#     PUT    /api/admin/departments/<pk>/
#     DELETE /api/admin/departments/<pk>/
#     """
#     permission_classes = [AllowAny]

#     def get_object(self, pk):
#         try:
#             return Department.objects.get(pk=pk)
#         except Department.DoesNotExist:
#        	    return None

#     def get(self, request, pk):
#         dept = self.get_object(pk)
#         if not dept:
#             return Response({"detail": "Department not found."}, status=status.HTTP_404_NOT_FOUND)
#         serializer = DepartmentSerializer(dept)
#         return Response(serializer.data)

#     def put(self, request, pk):
#         dept = self.get_object(pk)
#         if not dept:
#             return Response({"detail": "Department not found."}, status=status.HTTP_404_NOT_FOUND)

#         serializer = DepartmentSerializer(dept, data=request.data)
#         if serializer.is_valid():
#             serializer.save()
#             return Response(serializer.data)
#         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

#     def delete(self, request, pk):
#         dept = self.get_object(pk)
#         if not dept:
#             return Response({"detail": "Department not found."}, status=status.HTTP_404_NOT_FOUND)
#         dept.delete()
#         return Response(status=status.HTTP_204_NO_CONTENT)

class AdminDepartmentRetrieveUpdateDelete(APIView):
    permission_classes = [AllowAny]

    def get_object(self, pk):
        try:
            return Department.objects.get(pk=pk)
        except Department.DoesNotExist:
            return None

    def get(self, request, pk):
        dept = self.get_object(pk)
        if not dept:
            return Response(
                {"detail": "Department not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = DepartmentSerializer(dept)
        return Response(serializer.data)

    def put(self, request, pk):
        dept = self.get_object(pk)
        if not dept:
            return Response(
                {"detail": "Department not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = DepartmentSerializer(dept, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        dept = self.get_object(pk)
        if not dept:
            return Response(
                {"detail": "Department not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        dept.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    

class DepartmentAdminCoursesView(APIView):
    """
    GET  /api/department-admin/courses/?department_id=1&year=2
    POST /api/department-admin/courses/
    """

    def get(self, request):
        dept_id = request.query_params.get("department_id")
        year = request.query_params.get("year")

        if not dept_id:
            return Response(
                {"detail": "department_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        qs = Course.objects.filter(department_id=dept_id).order_by("year", "semester", "code")

        if year:
            qs = qs.filter(year=year)

        serializer = CourseSerializer(qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        """
        Create a course for a given department & year.
        Expect `prerequisite_ids: [..]` in the payload.
        """
        serializer = CourseSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        course = serializer.save()

        return Response(CourseSerializer(course).data, status=status.HTTP_201_CREATED)


class DepartmentAdminCourseListCreate(APIView):
    """
    GET  /api/department-admin/courses/?department_id=..&year=1
      -> list courses for that department (optionally filter by year)

    POST /api/department-admin/courses/
      body: {
        "name": "...",
        "code": "...",
        "department": <id>,
        "description": "...",
        "credits": 3.0,
        "year": 1,
        "semester": "A",
        "lecturer_ids": [userId1, userId2],
        "prerequisite_ids": [courseId1, courseId2]
      }
    """
    permission_classes = [AllowAny]  # later you can restrict to dept admins

    def get(self, request):
        dept_id = request.query_params.get("department_id")
        year = request.query_params.get("year")

        if not dept_id:
            return Response(
                {"detail": "department_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        qs = Course.objects.filter(department_id=dept_id)

        if year:
            try:
                year_int = int(year)
                qs = qs.filter(year=year_int)
            except ValueError:
                return Response(
                    {"detail": "year must be an integer."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        qs = qs.order_by("year", "semester", "code")
        serializer = CourseSerializer(qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = CourseSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        course = serializer.save()
        return Response(
            CourseSerializer(course).data,
            status=status.HTTP_201_CREATED,
        )


@api_view(["GET"])
def get_department_lecturers(request):
    """
    GET /api/department-admin/lecturers/?department_id=...
    -> all APPROVED lecturers for that department
    """
    dept_id = request.query_params.get("department_id")
    if not dept_id:
        return Response(
            {"detail": "department_id is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    qs = User.objects.filter(
        role="LECTURER",
        status="APPROVED",
        department_id=dept_id,
    ).order_by("first_name", "last_name")

    data = []
    for u in qs:
        full_name = f"{u.first_name} {u.last_name}".strip() or u.email
        data.append(
            {
                "id": u.id,
                "full_name": full_name,
                "email": u.email,
            }
        )
    return Response(data, status=status.HTTP_200_OK)



class DepartmentAdminCourseDetail(APIView):
    """
    PUT /api/department-admin/courses/<pk>/
    DELETE /api/department-admin/courses/<pk>/
    """

    permission_classes = [AllowAny]  # later you can restrict to Dept Admin

    def get_object(self, pk):
        try:
            return Course.objects.get(pk=pk)
        except Course.DoesNotExist:
            return None

    def put(self, request, pk):
        course = self.get_object(pk)
        if not course:
            return Response(
                {"detail": "Course not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # partial=True → you can send only some fields
        serializer = CourseSerializer(course, data=request.data, partial=True)
        if serializer.is_valid():
            updated = serializer.save()
            return Response(CourseSerializer(updated).data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        course = self.get_object(pk)
        if not course:
            return Response(
                {"detail": "Course not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        course.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    




# backend/api/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from .models import Course

@api_view(["GET"])
@permission_classes([AllowAny])  # later you can restrict to dept admins
def department_course_graph(request):
    """
    GET /api/department-admin/course-graph/?department_id=1&year=2

    Returns:
    {
      "nodes": [
        { "id": 1, "code": "CS101", "name": "...", "credits": 4.0,
          "year": 1, "semester": "A" },
        ...
      ],
      "edges": [
        { "from": 1, "to": 5 },   // 1 is prerequisite of 5
        ...
      ]
    }
    """
    dept_id = request.query_params.get("department_id")
    year = request.query_params.get("year")

    if not dept_id:
        return Response(
            {"detail": "department_id is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        dept_id_int = int(dept_id)
    except ValueError:
        return Response(
            {"detail": "department_id must be an integer."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    qs = Course.objects.filter(department_id=dept_id_int).prefetch_related("prerequisites")

    if year:
        try:
            year_int = int(year)
            qs = qs.filter(year=year_int)
        except ValueError:
            return Response(
                {"detail": "year must be an integer."},
                status=status.HTTP_400_BAD_REQUEST,
            )

    # -------- nodes --------
    nodes = []
    for c in qs:
        nodes.append({
            "id": c.id,
            "code": c.code,
            "name": c.name,
            "credits": float(c.credits),
            "year": c.year,
            "semester": c.semester,
        })

    # -------- edges (prerequisites) --------
    edges = []
    course_ids = {c.id for c in qs}  # so we only connect inside this dept/year filter

    for c in qs:
        for p in c.prerequisites.all():
            if p.id in course_ids:
                edges.append({
                    "from": p.id,   # prerequisite course
                    "to": c.id,     # target course
                })

    return Response({"nodes": nodes, "edges": edges}, status=status.HTTP_200_OK)



# backend/api/views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import Course


class CourseAIInsightsView(APIView):
    """
    GET /api/department-admin/courses/<pk>/ai-insights/

    Returns a small "AI-like" analysis of the course in the curriculum graph:
    - How central it is
    - How strong its prerequisites chain is
    - Suggestions for the curriculum designer
    """

    def get(self, request, pk):
        try:
            course = Course.objects.get(pk=pk)
        except Course.DoesNotExist:
            return Response(
                {"detail": "Course not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # prerequisites: direct prereqs of this course
        prereqs = list(course.prerequisites.all().order_by("year", "semester", "code"))

        # dependents: courses that list THIS course as a prerequisite
        dependents = list(course.unlocks.all().order_by("year", "semester", "code"))

        # --- build summaries ---
        summary = (
            f"{course.code} – {course.name} is a Year {course.year} "
            f"course (Semester {course.semester}) worth {course.credits} credits."
        )

        if prereqs:
            prereq_strings = [
                f"{p.code} ({p.name}) – Year {p.year}, Sem {p.semester}"
                for p in prereqs
            ]
            prereq_summary = (
                "This course requires the following prerequisites: "
                + "; ".join(prereq_strings)
                + "."
            )
        else:
            prereq_summary = (
                "This course currently has no formal prerequisites and can be taken as a standalone course."
            )

        if dependents:
            dep_strings = [
                f"{d.code} ({d.name}) – Year {d.year}, Sem {d.semester}"
                for d in dependents
            ]
            dependents_summary = (
                "The following courses depend on this course: "
                + "; ".join(dep_strings)
                + "."
            )
        else:
            dependents_summary = (
                "No other courses currently list this course as a direct prerequisite."
            )

        # --- simple "AI-like" risk & recommendations (rule-based, no external API) ---
        risk_notes = []
        recommendations = []

        # central course?
        if len(dependents) >= 3:
            risk_notes.append(
                "This is a central course in the curriculum – changes to its syllabus will impact many later courses."
            )

        # no prereqs but late year?
        if not prereqs and course.year >= 3:
            risk_notes.append(
                "This is an advanced-year course without prerequisites – consider whether earlier courses provide enough preparation."
            )

        # prereqs from the same or later year (suspicious)
        weird_prereqs = [
            p
            for p in prereqs
            if (p.year > course.year)
            or (p.year == course.year and p.semester >= course.semester)
        ]
        if weird_prereqs:
            names = ", ".join([p.code for p in weird_prereqs])
            risk_notes.append(
                f"Some prerequisites ({names}) are in the same or a later semester/year – verify that the dependency order is correct."
            )

        # recommendations (generic but useful)
        if prereqs:
            recommendations.append(
                "Ensure that the learning outcomes of all prerequisite courses are explicitly referenced in this course syllabus."
            )

        if dependents:
            recommendations.append(
                "In the syllabus, highlight which topics are especially important for succeeding in the follow-up courses."
            )

        if not recommendations:
            recommendations.append(
                "This course is relatively isolated in the dependency graph; you may use it flexibly as an elective or entry point."
            )

        return Response(
            {
                "summary": summary,
                "prerequisites_summary": prereq_summary,
                "dependents_summary": dependents_summary,
                "risk_notes": risk_notes,
                "recommendations": recommendations,
            },
            status=status.HTTP_200_OK,
        )


# ========= Lecturer APIs =========
@api_view(["GET"])
def lecturer_courses(request):
    """
    GET /api/lecturer/courses/?lecturer_id=...&department_id=...&year=...
    מחזיר את הקורסים של המרצה כולל סטטוס הסילבוס האחרון שהמרצה העלה.
    """
    lecturer_id = request.query_params.get("lecturer_id")
    department_id = request.query_params.get("department_id")
    year = request.query_params.get("year")

    if not lecturer_id:
        return Response({"detail": "lecturer_id is required."}, status=status.HTTP_400_BAD_REQUEST)

    qs = Course.objects.filter(lecturers__id=lecturer_id)
    if department_id:
        qs = qs.filter(department_id=department_id)

    if year:
        try:
            qs = qs.filter(year=int(year))
        except ValueError:
            return Response({"detail": "year must be an integer."}, status=status.HTTP_400_BAD_REQUEST)

    qs = qs.select_related("department").prefetch_related("syllabuses").order_by("year", "semester", "code")

    data = []
    for course in qs:
        last_syllabus = (
            course.syllabuses.filter(uploaded_by_id=lecturer_id)
            .order_by("-updated_at")
            .first()
        )
        data.append(
            {
                "id": course.id,
                "name": course.name,
                "code": course.code,
                "year": course.year,
                "semester": course.semester,
                "credits": float(course.credits),
                "department_name": course.department.name if course.department else None,
                "department_code": course.department.code if course.department else None,
                "latest_syllabus": SyllabusSerializer(last_syllabus).data if last_syllabus else None,
            }
        )

    return Response(data, status=status.HTTP_200_OK)


@api_view(["GET"])
def lecturer_syllabuses(request):
    """
    GET /api/lecturer/syllabuses/?lecturer_id=...&course_id=...&status=...&year=...
    מחזיר את כל גרסאות הסילבוסים שהמרצה יצר, עם אפשרות סינון.
    """
    lecturer_id = request.query_params.get("lecturer_id")
    course_id = request.query_params.get("course_id")
    status_filter = request.query_params.get("status")
    year = request.query_params.get("year")

    if not lecturer_id:
        return Response({"detail": "lecturer_id is required."}, status=status.HTTP_400_BAD_REQUEST)

    qs = Syllabus.objects.filter(uploaded_by_id=lecturer_id).select_related("course")

    if course_id:
        qs = qs.filter(course_id=course_id)

    if status_filter:
        qs = qs.filter(status=status_filter)

    if year:
        try:
            qs = qs.filter(course__year=int(year))
        except ValueError:
            return Response({"detail": "year must be an integer."}, status=status.HTTP_400_BAD_REQUEST)

    qs = qs.order_by("-updated_at")

    serializer = SyllabusSerializer(qs, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


from .models import Syllabus
from rest_framework.decorators import api_view
from rest_framework.response import Response

@api_view(["GET"])
def get_syllabus_statuses(request):
    # מחזיר את ה-choices של Syllabus.status
    statuses = [{"value": v, "label": lbl} for (v, lbl) in Syllabus.status_choices]
    return Response({"statuses": statuses})

from .models import Course

@api_view(["GET"])
def get_course_semesters(request):
    semesters = [{"value": v, "label": lbl} for (v, lbl) in Course.semester_choices]
    return Response({"semesters": semesters})
from django.db.models import F

from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Syllabus

@api_view(["GET"])
def lecturer_syllabus_filters(request):
    lecturer_id = request.GET.get("lecturer_id")
    course_id = request.GET.get("course_id")

    qs = Syllabus.objects.filter(uploaded_by_id=lecturer_id, course_id=course_id)

    years = (
        qs.exclude(academic_year__isnull=True)
          .exclude(academic_year__exact="")
          .values_list("academic_year", flat=True)
          .distinct()
    )

    statuses = qs.values_list("status", flat=True).distinct()

    return Response({
        "years": sorted(list(years)),
        "statuses": sorted(list(statuses)),
    })

# backend/api/views.py
from django.db.models import Max
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import Course, Syllabus, SyllabusWeek, SyllabusAssessment, User
from .serializers import SyllabusSerializer

from django.db.models import Max
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import Course, Syllabus, SyllabusWeek, SyllabusAssessment, User
from .serializers import SyllabusSerializer
from datetime import date
from django.db.models import Max
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import Course, Syllabus, SyllabusWeek, SyllabusAssessment, User
from .serializers import SyllabusSerializer


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_lecturer_syllabus(request):
    lecturer_id = request.data.get("lecturer_id")
    course_id = request.data.get("course_id")

    if not lecturer_id or not course_id:
        return Response(
            {"detail": "lecturer_id and course_id are required."},
            status=status.HTTP_400_BAD_REQUEST
        )

    lecturer = User.objects.filter(id=lecturer_id, role="LECTURER").first()
    if not lecturer:
        return Response({"detail": "Lecturer not found."}, status=status.HTTP_404_NOT_FOUND)

    course = Course.objects.filter(id=course_id).first()
    if not course:
        return Response({"detail": "Course not found."}, status=status.HTTP_404_NOT_FOUND)

    save_as = request.data.get("saveAs") or request.data.get("save_as") or "SUBMIT"
    is_draft = (save_as == "DRAFT")
    new_status = "DRAFT" if is_draft else "PENDING_REVIEW"

    # academic_year ברירת מחדל
    y = date.today().year
    default_ay = f"{y}-{y+1}"
    ay = (request.data.get("academic_year") or default_ay).strip()

    # כל הסילבוסים של אותו קורס+מרצה+שנה
    base_qs = Syllabus.objects.filter(course=course, uploaded_by=lecturer, academic_year=ay)

    # 1) אם יש כבר PENDING_REVIEW לאותה שנה -> חסימה (לא ליצור עוד)
    if (not is_draft) and base_qs.filter(status="PENDING_REVIEW").exists():
        return Response(
            {"detail": "You already have a syllabus pending review for this academic year."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # 2) אם יש DRAFT קיים -> מעדכנים אותו במקום ליצור חדש
    existing_draft = base_qs.filter(status="DRAFT").order_by("-version").first()
    if existing_draft:
        serializer = SyllabusSerializer(
            existing_draft,
            data=request.data,
            partial=True,
            context={"save_as": save_as},
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        obj = serializer.save()

        # אם זה SUBMIT -> מעבירים ל-PENDING_REVIEW
        if save_as == "SUBMIT":
            obj.status = "PENDING_REVIEW"
            obj.reviewer_comment = ""
            obj.save(update_fields=["status", "reviewer_comment"])

        return Response(SyllabusSerializer(obj).data, status=status.HTTP_200_OK)

    # 3) אם אין DRAFT -> יוצרים גרסה חדשה
    last_ver = base_qs.aggregate(Max("version")).get("version__max") or 0
    next_ver = last_ver + 1

    payload = request.data.copy()
    payload["course"] = course.id
    payload["academic_year"] = ay  # חשוב!

    ser = SyllabusSerializer(data=payload, partial=is_draft, context={"save_as": save_as})
    if not ser.is_valid():
        return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)

    vd = ser.validated_data

    syllabus = Syllabus.objects.create(
        course=course,
        uploaded_by=lecturer,
        version=next_ver,
        status=new_status,

        academic_year=ay,
        level=vd.get("level") or "BSC",
        course_type=vd.get("course_type") or "MANDATORY",
        delivery=vd.get("delivery") or "IN_PERSON",
        instructor_email=vd.get("instructor_email"),
        language=vd.get("language") or "Hebrew",

        purpose=vd.get("purpose") or "",
        learning_outputs=vd.get("learning_outputs") or "",
        course_description=vd.get("course_description") or "",
        literature=vd.get("literature") or "",
        teaching_methods_planned=vd.get("teaching_methods_planned") or "",
        guidelines=vd.get("guidelines") or "",
    )

    # weeks / assessments רק אם נשלחו
    weeks = vd.get("weeks") or []
    if weeks:
        SyllabusWeek.objects.bulk_create([
            SyllabusWeek(
                syllabus=syllabus,
                week_number=int(w.get("week_number") or w.get("week") or 1),
                topic=w.get("topic") or "",
                sources=w.get("sources") or "",
            )
            for w in weeks
        ])

    assessments = vd.get("assessments") or []
    if assessments:
        SyllabusAssessment.objects.bulk_create([
            SyllabusAssessment(
                syllabus=syllabus,
                title=a.get("title") or "",
                percent=int(a.get("percent") or 0),
            )
            for a in assessments
        ])

    return Response(SyllabusSerializer(syllabus).data, status=status.HTTP_201_CREATED)

# ---------- Helper endpoints (statuses / semesters) ----------
@api_view(["GET"])
def syllabus_statuses(request):
    statuses = [value for value, _ in Syllabus.status_choices]
    return Response({"statuses": statuses}, status=status.HTTP_200_OK)


@api_view(["GET"])
def course_semesters(request):
    semesters = [value for value, _ in Course.semester_choices]
    return Response({"semesters": semesters}, status=status.HTTP_200_OK)

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_syllabus_statuses(request):
    # אם הסטטוסים אצלך הם “choices” במודל:
    # דוגמה: SyllabusVersion.STATUS_CHOICES = [(...), (...)]
    from .models import SyllabusVersion

    # נסי אחד מהשניים (תשאירי את מה שמתאים למודל שלך):

    # אופציה A: STATUS_CHOICES קלאסי
    if hasattr(SyllabusVersion, "STATUS_CHOICES"):
        data = [{"value": k, "label": v} for k, v in SyllabusVersion.STATUS_CHOICES]
        return Response(data)

    # אופציה B: Django TextChoices (Status.choices)
    if hasattr(SyllabusVersion, "Status"):
        data = [{"value": k, "label": v} for k, v in SyllabusVersion.Status.choices]
        return Response(data)

    # fallback אם אין לך choices (עדיף לא להגיע לפה)
    return Response([
        {"value": "APPROVED", "label": "Approved"},
        {"value": "REJECTED", "label": "Rejected"},
        {"value": "PENDING_REVIEW", "label": "Pending review"},
        {"value": "PENDING_DEPT", "label": "Pending dept"},
    ])



from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_history_years(request):
    from .models import SyllabusVersion  # או השם אצלך

    # דוגמה: אם יש שדה academic_year בגרסת סילבוס
    qs = (
        SyllabusVersion.objects
        .filter(author=request.user)          # או created_by / lecturer וכו'
        .values_list("academic_year", flat=True)
        .distinct()
        .order_by("-academic_year")
    )
    return Response(list(qs))


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_history_courses(request):
    from .models import SyllabusVersion, Course  # להתאים לשמות אצלך

    # דוגמה: אם לגרסת סילבוס יש FK בשם course
    course_ids = (
        SyllabusVersion.objects
        .filter(author=request.user)
        .values_list("course_id", flat=True)
        .distinct()
    )

    courses = Course.objects.filter(id__in=course_ids).order_by("name")
    data = [{"id": c.id, "name": c.name} for c in courses]
    return Response(data)


from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Syllabus
from .serializers import SyllabusSerializer
from rest_framework import status
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

@api_view(["GET", "PUT"])
def lecturer_syllabus_detail(request, syllabus_id):
    lecturer_id = request.GET.get("lecturer_id") or request.data.get("lecturer_id")

    syllabus = get_object_or_404(Syllabus, id=syllabus_id, uploaded_by_id=lecturer_id)

    # ✅ GET רגיל
    if request.method == "GET":
        return Response(SyllabusSerializer(syllabus).data)

    # ✅ PUT: נועלים עריכה לכל מצב שהוא לא DRAFT
    if syllabus.status != "DRAFT":
        return Response(
            {"detail": "Only DRAFT syllabus can be edited. Use clone for Approved/Rejected."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # ✅ להבין אם זה שמירה כטיוטה או Submit
    save_as = request.data.get("save_as") or request.data.get("saveAs") or "SUBMIT"

    serializer = SyllabusSerializer(
        syllabus,
        data=request.data,
        partial=True,
        context={"save_as": save_as},
    )

    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


from django.db.models import Max
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404

from .models import Syllabus, SyllabusWeek, SyllabusAssessment

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def clone_lecturer_syllabus(request, syllabus_id):
    """
    POST /api/lecturer/syllabuses/<id>/clone/
    - יוצר/מעדכן DRAFT חדש שמועתק מהגרסה (APPROVED/REJECTED)
    - אם כבר יש DRAFT לאותו course+lecturer+academic_year -> נעדכן אותו במקום ליצור עוד אחד
    """
    user = request.user

    source = get_object_or_404(Syllabus, id=syllabus_id, uploaded_by=user)

    # לא מאפשרים לשכפל pending (כי זה כבר בתהליך בדיקה)
    if source.status == "PENDING_REVIEW":
        return Response(
            {"detail": "Cannot edit while pending review. Wait for reviewer decision."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    ay = source.academic_year
    if not ay:
        # אם משום מה אין academic_year, ניצור אחד בסיסי
        from datetime import date
        y = date.today().year
        ay = f"{y}-{y+1}"

    # אם כבר קיימת טיוטה לאותו קורס/שנה — נשתמש בה (Upsert)
    draft = Syllabus.objects.filter(
        course=source.course,
        uploaded_by=user,
        academic_year=ay,
        status="DRAFT",
    ).first()

    created_new = False

    if not draft:
        last_ver = (
            Syllabus.objects.filter(course=source.course, uploaded_by=user)
            .aggregate(Max("version"))
            .get("version__max") or 0
        )
        draft = Syllabus.objects.create(
            course=source.course,
            uploaded_by=user,
            academic_year=ay,
            version=last_ver + 1,
            status="DRAFT",
        )
        created_new = True

    # להעתיק שדות
    fields_to_copy = [
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
    ]
    for f in fields_to_copy:
        setattr(draft, f, getattr(source, f))

    # הערות בודק: בדראפט החדש מתחילים נקי (את ההערות נציג ב־UI מה־source)
    draft.reviewer_comment = None
    draft.save()

    # להעתיק weeks/assessments
    draft.weeks.all().delete()
    draft.assessments.all().delete()

    source_weeks = list(source.weeks.all().order_by("week_number"))
    if source_weeks:
        SyllabusWeek.objects.bulk_create([
            SyllabusWeek(
                syllabus=draft,
                week_number=w.week_number,
                topic=w.topic,
                sources=w.sources,
            )
            for w in source_weeks
        ])

    source_assessments = list(source.assessments.all())
    if source_assessments:
        SyllabusAssessment.objects.bulk_create([
            SyllabusAssessment(
                syllabus=draft,
                title=a.title,
                percent=a.percent,
            )
            for a in source_assessments
        ])

    return Response(
        {
            "draft": SyllabusSerializer(draft).data,
            "created_new": created_new,
            "source_id": source.id,
            "source_status": source.status,
        },
        status=status.HTTP_200_OK,
    )

import json
import os

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from openai import OpenAI


def get_openai_client():
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError(
            "OPENAI_API_KEY is missing. Check backend/.env and load_dotenv in settings.py"
        )
    return OpenAI(api_key=api_key)



# views.py
from typing import List
from pydantic import BaseModel
from openai import OpenAI
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

class Week(BaseModel):
    week: str
    topic: str
    sources: str = ""

class Assessment(BaseModel):
    title: str
    percent: str

class SyllabusDraft(BaseModel):
    purpose: str
    learningOutputs: str
    courseDescription: str
    literature: str
    teachingMethodsPlanned: str
    guidelines: str
    weeksPlan: List[Week]
    assessments: List[Assessment]

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def ai_syllabus_draft(request):
    client = OpenAI()  # קורא OPENAI_API_KEY מה־env

    course_name = (request.data.get("courseName") or "").strip()
    language = (request.data.get("language") or "English").strip()
    mode = (request.data.get("mode") or "fill").strip().lower()
    reviewer_comment = request.data.get("reviewerComment") or ""
    current = request.data.get("currentDraft") or {}
    user_instruction = request.data.get("userInstruction") or ""

    if not course_name:
        return Response({"detail": "courseName is required"}, status=status.HTTP_400_BAD_REQUEST)

    system = "You are a syllabus assistant. Return a JSON object matching the given schema ONLY."

    if mode == "fix":
        user = f"""
Course: {course_name}
Language: {language}

We are in FIX mode (rejected). Improve the draft to address reviewer comments.
Reviewer comments:
{reviewer_comment}

Current draft (edit it, don't ignore it):
{current}

Extra instruction (optional):
{user_instruction}
"""
    else:
        user = f"""
Course: {course_name}
Language: {language}

We are in FILL mode. Create a complete syllabus draft.

Extra instruction (optional):
{user_instruction}
"""

    resp = client.responses.parse(
        model="gpt-4o-2024-08-06",  # לבחור מודל שתומך Structured Outputs
        input=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        text_format=SyllabusDraft,
    )

    data = resp.output_parsed.model_dump()
    return Response(data)
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

import os
from openai import OpenAI
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def syllabus_chat(request):
    message = (request.data.get("message") or "").strip()
    course_name = (request.data.get("courseName") or "").strip()
    language = (request.data.get("language") or "Hebrew").strip()

    if not message:
        return Response({"detail": "message is required"}, status=status.HTTP_400_BAD_REQUEST)

    if not os.getenv("OPENAI_API_KEY"):
        return Response(
            {"detail": "OPENAI_API_KEY is missing in backend env"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    client = OpenAI()

    system = (
        "You are a helpful syllabus assistant for lecturers. "
        f"Answer in {language}. Be concise and practical."
    )

    user = f"""
Course: {course_name or "N/A"}
User message: {message}
"""

    try:
        resp = client.responses.create(
            model="gpt-4.1-mini",
            input=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
        )
        return Response({"reply": resp.output_text or ""}, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# api/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404

from openai import OpenAI
from .models import Syllabus, SyllabusChatMessage
from .serializers import SyllabusChatMessageSerializer


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def syllabus_chat_history(request, syllabus_id):
    syllabus = get_object_or_404(Syllabus, id=syllabus_id, uploaded_by=request.user)
    msgs = syllabus.chat_messages.all()
    ser = SyllabusChatMessageSerializer(msgs, many=True)
    return Response(ser.data)


from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from openai import OpenAI

from .models import Syllabus, SyllabusChatMessage
from .serializers import SyllabusChatMessageSerializer

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def syllabus_chat_ask(request, syllabus_id):
    syllabus = get_object_or_404(Syllabus, id=syllabus_id, uploaded_by=request.user)

    # ⛔ אם Pending – לא מאפשרים בכלל לשאול "לתקן" (אופציונלי, אבל מומלץ)
    # אם את רוצה שיאפשר שאלות כלליות גם כשהוא pending, תורידי את זה.
    if syllabus.status == "PENDING_REVIEW":
        return Response(
            {"detail": "Syllabus is pending review and cannot be edited now."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    message = (request.data.get("message") or "").strip()
    language = (request.data.get("language") or syllabus.language or "Hebrew").strip()
    course_name = (request.data.get("courseName") or syllabus.course.name if syllabus.course else "N/A").strip()

    if not message:
        return Response({"detail": "message is required"}, status=status.HTTP_400_BAD_REQUEST)

    # ✅ FIX אוטומטי לפי סטטוס (לא סומכים על הפרונט)
    auto_mode = "fix" if syllabus.status == "REJECTED" else "chat"

    # הערת בודק + דראפט נוכחי
    reviewer_comment = syllabus.reviewer_comment or ""
    current = request.data.get("currentDraft") or {}

    # 1) שמירת הודעת המשתמש
    SyllabusChatMessage.objects.create(syllabus=syllabus, role="user", content=message)

    # 2) history אחרון
    last_msgs = list(syllabus.chat_messages.all().order_by("-created_at")[:12])
    last_msgs.reverse()

    system = build_syllabus_system_prompt(language)

    chat_input = [{"role": "system", "content": system}]

    # אם rejected → מוסיפים הקשר FIX (הערות + דראפט)
    if auto_mode == "fix":
        chat_input.append({"role": "user", "content": build_fix_context(reviewer_comment, current)})

    # מוסיפים history
    for m in last_msgs:
        chat_input.append({"role": m.role, "content": m.content})

    # מוסיפים הודעה אחרונה (כדי להיות בטוחים שהיא בפנים)
    # (אם כבר נכנסה דרך history, זה לא נורא, אבל זה מוודא)
    chat_input.append({"role": "user", "content": f"Course: {course_name}\nUser message: {message}"})

    client = OpenAI()
    resp = client.responses.create(
        model="gpt-4.1-mini",
        input=chat_input
    )
    reply = resp.output_text or ""

    # 7) שמירת תשובת ה-AI
    SyllabusChatMessage.objects.create(syllabus=syllabus, role="assistant", content=reply)
    return Response({"reply": reply, "mode": auto_mode}, status=status.HTTP_200_OK)

import json

def build_syllabus_system_prompt(language: str) -> str:
    lang = language or "Hebrew"
    return f"""
You are CSMS syllabus assistant for lecturers.
Answer in {lang}. Be concise and practical.

You must follow CSMS rules:
- DRAFT: lecturer can save partial content.
- PENDING_REVIEW: waiting for reviewer, not editable.
- REJECTED: reviewer left comments; lecturer must fix and resubmit.
- APPROVED: lecturer may revise by creating a new DRAFT and resubmit.

You must help field-by-field using EXACT API fields:
Meta:
- academic_year (format YYYY-YYYY)
- level (BSC/MSC)
- course_type (MANDATORY/ELECTIVE/GENERAL)
- delivery (IN_PERSON/ZOOM)
- instructor_email
- language

Content:
- purpose
- learning_outputs
- course_description
- literature
- teaching_methods_planned
- guidelines

Nested arrays:
- weeks: list of {{week_number, topic, sources}}
- assessments: list of {{title, percent}} and total percent must equal 100 on SUBMIT.

If status is REJECTED, you MUST address reviewer_comment and propose concrete fixes.
"""

def build_fix_context(reviewer_comment: str, current_draft) -> str:
    rc = reviewer_comment or ""
    try:
        cd = json.dumps(current_draft or {}, ensure_ascii=False)
    except Exception:
        cd = str(current_draft or {})
    return f"Reviewer comments:\n{rc}\n\nCurrent draft JSON:\n{cd}\n"
