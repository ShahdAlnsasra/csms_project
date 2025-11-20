from django.http import JsonResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Department, SignupRequest
from .serializers import DepartmentSerializer
from django.contrib.auth import authenticate
from rest_framework import status
# backend/api/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .models import Department
from .serializers import DepartmentSerializer


@api_view(['POST'])
def login_view(request):
    """
    Simple login endpoint:
    - expects: { "email": "...", "password": "..." }
    - returns: user info if correct, or error if not
    """
    email = request.data.get("email")
    password = request.data.get("password")

    if not email or not password:
        return Response(
            {"detail": "Email and password are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Your custom User model uses USERNAME_FIELD = "email",
    # so we pass username=email here:
    user = authenticate(request, username=email, password=password)

    if user is None:
        return Response(
            {"detail": "Invalid email or password."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # You can also check status == APPROVED later if you want:
    # if user.status != "APPROVED": ...

    return Response(
        {
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": user.role,
        },
        status=status.HTTP_200_OK,
    )



class DepartmentList(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        departments = Department.objects.all()
        serializer = DepartmentSerializer(departments, many=True)
        return Response(serializer.data)

# ------------------
#   DEPARTMENTS API
# ------------------
@api_view(['GET'])
def get_departments(request):
    depts = Department.objects.all()
    serializer = DepartmentSerializer(depts, many=True)
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
