from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
import uuid
from django.conf import settings
from django.utils import timezone
from django.core.validators import RegexValidator


# -------------------------------
#   Department (מחלקה)
# -------------------------------
class Department(models.Model):
    code = models.CharField(max_length=10, unique=True)
    name = models.CharField(max_length=100, unique=True)

    degree_types = [
        ("BSC", "First degree (BSc)"),
        ("MSC", "Second degree (MSc)"),
        ("BOTH", "First & Second degree (BSc + MSc)"),  # ✅ חדש
    ]

    degree = models.CharField(
        max_length=20,
        choices=degree_types,
        default="BSC",
    )    
    years_of_study = models.IntegerField(default=4)        # נקבע ע"י SUPER ADMIN
    semesters_per_year = models.IntegerField(default=2)    # נקבע ע"י SUPER ADMIN
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.code} - {self.name}"

# -------------------------------
#   Course (קורס)
# -------------------------------
class Course(models.Model):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True)
    department = models.ForeignKey(Department, on_delete=models.CASCADE)

    description = models.TextField(null=True, blank=True)
    credits = models.DecimalField(max_digits=3, decimal_places=1, default=3.0)

    year = models.IntegerField(
        choices=[(1, "Year 1"), (2, "Year 2"), (3, "Year 3"), (4, "Year 4")],
        default=1
    )

    semester_choices = [
        ("A", "Semester A"),
        ("B", "Semester B"),
        ("SUMMER", "Summer Semester")
    ]

    semester = models.CharField(max_length=10, choices=semester_choices, default="A")

    lecturers = models.ManyToManyField(settings.AUTH_USER_MODEL, limit_choices_to={"role": "LECTURER"})
    # ✅ NEW: prerequisites (courses you must pass before this one)
    prerequisites = models.ManyToManyField(
        "self",
        symmetrical=False,
        blank=True,
        related_name="unlocks",
    )

    def __str__(self):
        return f"{self.code} - {self.name}"


# backend/api/models.py
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.validators import RegexValidator
from django.db.models import Q
class Syllabus(models.Model):
    course = models.ForeignKey("Course", on_delete=models.CASCADE, related_name="syllabuses")
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)

    version = models.IntegerField(default=1)

    status_choices = [
        ("DRAFT", "Draft"),
        ("PENDING_REVIEW", "Pending Reviewer Approval"),
        ("APPROVED", "Approved"),
        ("REJECTED", "Rejected"),
    ]
    status = models.CharField(max_length=30, choices=status_choices, default="DRAFT")
    reviewer_comment = models.TextField(null=True, blank=True)

    # ✅ סילבוס — עמודות נפרדות
    academic_year = models.CharField(
         max_length=9,
         validators=[RegexValidator(r"^\d{4}-\d{4}$", "academic_year must be like 2025-2026")],
         null=True,          
         blank=True
         )  

    LEVEL_CHOICES = [("BSC", "BSc"), ("MSC", "MSc")]
    level = models.CharField(max_length=10, choices=LEVEL_CHOICES, null=True, blank=True)

    COURSE_TYPE_CHOICES = [
        ("MANDATORY", "Mandatory"),
        ("ELECTIVE", "Elective"),
        ("GENERAL", "General"),
    ]
    course_type = models.CharField(max_length=20, choices=COURSE_TYPE_CHOICES, null=True, blank=True)

    DELIVERY_CHOICES = [
        ("IN_PERSON", "In-person"),
        ("ZOOM", "Zoom"),
    ]
    delivery = models.CharField(max_length=20, choices=DELIVERY_CHOICES, null=True, blank=True)

    instructor_email = models.EmailField(blank=True, null=True)
    language = models.CharField(max_length=50, default="Hebrew", null=True, blank=True)

    purpose = models.TextField(null=True, blank=True)
    learning_outputs = models.TextField(null=True, blank=True)
    course_description = models.TextField(null=True, blank=True)
    literature = models.TextField(null=True, blank=True)
    teaching_methods_planned = models.TextField(null=True, blank=True)
    guidelines = models.TextField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
       constraints = [
            # ✅ תמיד: כל version חייב להיות ייחודי לאותו קורס+מרצה+שנה
            models.UniqueConstraint(
                fields=["course", "uploaded_by", "academic_year", "version"],
                name="uniq_syllabus_course_lecturer_year_version",
        ),

        # ✅ רק טיוטה אחת בכל פעם
        models.UniqueConstraint(
            fields=["course", "uploaded_by", "academic_year"],
            condition=Q(status="DRAFT"),
            name="uniq_draft_per_course_lecturer_year",
        ),

        # ✅ רק pending אחד בכל פעם
        models.UniqueConstraint(
            fields=["course", "uploaded_by", "academic_year"],
            condition=Q(status="PENDING_REVIEW"),
            name="uniq_pending_per_course_lecturer_year",
        ),
    ]


class SyllabusWeek(models.Model):
    syllabus = models.ForeignKey(Syllabus, on_delete=models.CASCADE, related_name="weeks")
    week_number = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    topic = models.TextField()
    sources = models.TextField(blank=True, null=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["course", "uploaded_by", "academic_year", "version"],
                name="uniq_syllabus_course_lecturer_year_version",
            )
        ]
    def __str__(self):
        return f"Week {self.week_number} ({self.syllabus})"


class SyllabusAssessment(models.Model):
    syllabus = models.ForeignKey(Syllabus, on_delete=models.CASCADE, related_name="assessments")
    title = models.CharField(max_length=200)
    percent = models.PositiveIntegerField(validators=[MinValueValidator(0), MaxValueValidator(100)])

    def __str__(self):
        return f"{self.title} - {self.percent}% ({self.syllabus})"

# -------------------------------
#   User Manager
# -------------------------------
class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        """
        יצירת משתמש רגיל במערכת (לא סופר־אדמין של Django).
        """
        if not email:
            raise ValueError("Email is required")

        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)

        if password:
            user.set_password(password)
        else:
            # אפשרות ליצור משתמש בלי סיסמה (למשל לפני קבלת magic link)
            user.set_unusable_password()

        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", "SYSTEM_ADMIN")
        extra_fields.setdefault("status", "APPROVED")

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(email, password, **extra_fields)



 

phone_validator = RegexValidator(
    regex=r'^\d{10}$',
    message="Phone number must be exactly 10 digits."
)

id_validator = RegexValidator(
    regex=r'^\d{9}$',
    message="ID number must be exactly 9 digits."
)

# -------------------------------
#   User (כל המשתמשים במערכת)
# -------------------------------
class User(AbstractBaseUser, PermissionsMixin):

    ROLES = [
        ("SYSTEM_ADMIN", "System Admin"),         # נוצר מהקוד / ייחודי
        ("DEPARTMENT_ADMIN", "Department Admin"),
        ("REVIEWER", "Reviewer"),
        ("LECTURER", "Lecturer"),
        ("STUDENT", "Student"),
    ]

    STATUS = [
        ("PENDING", "Pending"),     # מחכה לאישור
        ("APPROVED", "Approved"),   # מאושר ויכול להתחבר
        ("REJECTED", "Rejected"),   # נדחה
    ]

    # שדות בסיס
    email = models.EmailField(unique=True)
    username = models.CharField(
        max_length=40,
        unique=True,
        null=True,
        blank=True,
    )
    first_name = models.CharField(max_length=40, default="", blank=True)
    last_name = models.CharField(max_length=40, default="", blank=True)
 # ✅ בדיוק 10 ספרות, אם מזינים ערך
    phone = models.CharField(
        max_length=10,
        null=True,
        blank=True,
        validators=[phone_validator],
    )

    # ✅ בדיוק 9 ספרות, אם מזינים ערך
    id_number = models.CharField(
        max_length=9,
        null=True,
        blank=True,
        validators=[id_validator],
    )
    role = models.CharField(
    max_length=20,
    choices=ROLES,
    null=True,
    blank=True)
    status = models.CharField(max_length=20, choices=STATUS, default="PENDING")

    # פרטים לפי תפקיד
    # למחלקה אחת (לסטודנט / מרצה / אדמין / רוויוער)
    department = models.ForeignKey(Department, null=True, blank=True, on_delete=models.SET_NULL)

    # לסטודנטים
    study_year = models.IntegerField(null=True, blank=True)

    # למרצים – אילו קורסים הוא מלמד
    courses = models.ManyToManyField(Course, blank=True)

    # שדות ניהול של Django
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    def __str__(self):
        return f"{self.email} ({self.role})"


# -------------------------------
#   SignupRequest (בקשת הרשמה)
# -------------------------------
class SignupRequest(models.Model):
    ROLES = [
        ("DEPARTMENT_ADMIN", "Department Admin"),
        ("REVIEWER", "Reviewer"),
        ("LECTURER", "Lecturer"),
        ("STUDENT", "Student"),
    ]

    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=40)
    last_name = models.CharField(max_length=40)
    role = models.CharField(max_length=20, choices=ROLES)
    phone = models.CharField(max_length=20, null=True, blank=True)
    id_number = models.CharField(
        max_length=9,
        null=True,
        blank=True,
        validators=[id_validator],   # you already defined this above
    )
    department = models.ForeignKey(Department, null=True, blank=True, on_delete=models.SET_NULL)
    study_year = models.IntegerField(null=True, blank=True)

    student_semester = models.CharField(
        max_length=10,
        choices=[
            ("A", "Semester A"),
            ("B", "Semester B"),
            ("SUMMER", "Summer Semester")
        ],
        null=True,
        blank=True
    )

    selected_courses = models.ManyToManyField(Course, blank=True)

    reviewer_department = models.ForeignKey(
        Department,
        related_name="reviewer_department",
        null=True,
        blank=True,
        on_delete=models.SET_NULL
    )

    STATUS = [
        ("PENDING", "Pending Approval"),
        ("APPROVED", "Approved"),
        ("REJECTED", "Rejected"),
    ]
    status = models.CharField(max_length=20, choices=STATUS, default="PENDING")
    rejection_reason = models.TextField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

      # ✅ NEW: email verification fields
    email_verification_code = models.CharField(max_length=10, null=True, blank=True)
    email_verified = models.BooleanField(default=False)

    # NEW – to avoid sending multiple emails when status is edited
    magic_link_sent = models.BooleanField(default=False)

    def __str__(self):
        return f"Signup: {self.email} ({self.role})"

# -------------------------------
#   MagicLink (קישור חד-פעמי)
# -------------------------------
class MagicLink(models.Model):
    """
    אחרי שהבקשה אושרה – שולחים Magic Link למייל.
    דרכו המשתמש יגדיר סיסמה ויאקטב את החשבון.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    token = models.UUIDField(default=uuid.uuid4, unique=True)
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    def is_expired(self):
        if self.expires_at is None:
            return False  # for backwards-compatibility
        return self.expires_at < timezone.now()
    def __str__(self):
        return f"MagicLink for {self.user.email}"


# models.py (Syllabus.status_choices)
status_choices = [
    ("DRAFT", "Draft"),
    ("PENDING_REVIEW", "Pending Reviewer Approval"),
    ("APPROVED", "Approved"),
    ("REJECTED", "Rejected"),
]




from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator, RegexValidator
from django.db.models import Q

class SyllabusDocument(models.Model):
    """
    מסמך “אב” של סילבוס: מרצה+קורס+שנה אקדמית
    """
    course = models.ForeignKey("Course", on_delete=models.CASCADE, related_name="syllabus_documents")
    lecturer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="syllabus_documents")

    academic_year = models.CharField(
        max_length=9,
        validators=[RegexValidator(r"^\d{4}-\d{4}$", "academic_year must be like 2025-2026")],
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["course", "lecturer", "academic_year"],
                name="uniq_document_course_lecturer_year",
            ),
        ]

    def __str__(self):
        return f"Doc {self.academic_year} {self.course.code} ({self.lecturer.email})"


class SyllabusVersion(models.Model):
    """
    גרסה ספציפית של סילבוס בתוך מסמך אב
    """
    document = models.ForeignKey(SyllabusDocument, on_delete=models.CASCADE, related_name="versions")

    version = models.IntegerField(default=1)

    status_choices = [
        ("DRAFT", "Draft"),
        ("PENDING_REVIEW", "Pending Reviewer Approval"),
        ("APPROVED", "Approved"),
        ("REJECTED", "Rejected"),
    ]
    status = models.CharField(max_length=30, choices=status_choices, default="DRAFT")
    reviewer_comment = models.TextField(null=True, blank=True)

    LEVEL_CHOICES = [("BSC", "BSc"), ("MSC", "MSc")]
    level = models.CharField(max_length=10, choices=LEVEL_CHOICES, null=True, blank=True)

    COURSE_TYPE_CHOICES = [
        ("MANDATORY", "Mandatory"),
        ("ELECTIVE", "Elective"),
        ("GENERAL", "General"),
    ]
    course_type = models.CharField(max_length=20, choices=COURSE_TYPE_CHOICES, null=True, blank=True)

    DELIVERY_CHOICES = [("IN_PERSON", "In-person"), ("ZOOM", "Zoom")]
    delivery = models.CharField(max_length=20, choices=DELIVERY_CHOICES, null=True, blank=True)

    instructor_email = models.EmailField(blank=True, null=True)
    language = models.CharField(max_length=50, default="Hebrew", null=True, blank=True)

    purpose = models.TextField(null=True, blank=True)
    learning_outputs = models.TextField(null=True, blank=True)
    course_description = models.TextField(null=True, blank=True)
    literature = models.TextField(null=True, blank=True)
    teaching_methods_planned = models.TextField(null=True, blank=True)
    guidelines = models.TextField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["document", "version"], name="uniq_doc_version"),
            models.UniqueConstraint(
                fields=["document"],
                condition=Q(status="DRAFT"),
                name="uniq_draft_per_document",
            ),
            models.UniqueConstraint(
                fields=["document"],
                condition=Q(status="PENDING_REVIEW"),
                name="uniq_pending_per_document",
            ),
        ]
        ordering = ["-updated_at"]

    def __str__(self):
        return f"Version {self.version} ({self.document})"


class SyllabusWeek(models.Model):
    syllabus = models.ForeignKey(Syllabus, on_delete=models.CASCADE, related_name="weeks")
    week_number = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    topic = models.TextField()
    sources = models.TextField(blank=True, null=True)
    class Meta:
        constraints = [ models.UniqueConstraint(fields=["syllabus", "week_number"], name="uniq_week_per_syllabus")]

    def __str__(self):
        return f"Week {self.week_number} ({self.syllabus})"


class SyllabusAssessment(models.Model):
    syllabus = models.ForeignKey(Syllabus, on_delete=models.CASCADE, related_name="assessments")
    title = models.CharField(max_length=200)
    percent = models.PositiveIntegerField(validators=[MinValueValidator(0), MaxValueValidator(100)])

class SyllabusChatMessage(models.Model):
    syllabus = models.ForeignKey(
        Syllabus,
        on_delete=models.CASCADE,
        related_name="chat_messages"
    )
    role = models.CharField(max_length=20)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
