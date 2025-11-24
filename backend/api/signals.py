from django.db.models.signals import post_migrate
from api.models import User
from django.dispatch import receiver
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from django.utils import timezone
import uuid

from django.db.models.signals import post_save, post_migrate
from django.dispatch import receiver
from django.core.mail import send_mail
from django.conf import settings

from .models import SignupRequest, User, MagicLink


@receiver(post_migrate)
def create_system_admin(sender, **kwargs):
    if sender.name != "api":
        return

    if not User.objects.filter(role="SYSTEM_ADMIN").exists():
        user = User.objects.create(
            email="admin@gmail.com",
            first_name="System",
            last_name="Admin",
            role="SYSTEM_ADMIN",
            status="APPROVED",
            is_active=True,
            is_staff=False,
            is_superuser=False,

        )
        user.set_password("Admin123!")  # חשוב מאוד !!!
        user.save()

        print(">>> SYSTEM ADMIN CREATED!")



from .models import SignupRequest, User, MagicLink

# backend/api/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.conf import settings

from .models import SignupRequest, User, MagicLink


from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.conf import settings
import uuid  # 👈 add this

from .models import SignupRequest, User, MagicLink


@receiver(post_save, sender=SignupRequest)
def handle_signup_approval(sender, instance: SignupRequest, created, **kwargs):
    """
    When an existing SignupRequest is updated to APPROVED:
    - ONLY IF email_verified is True
    - get or create a User
    - get or reset a MagicLink
    - send activation email via Gmail
    """
    # Only handle updates, not creation
    if created:
        return

    # Only if approved, not sent before, and email already verified
    if (
        instance.status != "APPROVED"
        or instance.magic_link_sent
        or not instance.email_verified
    ):
        return

    #    # 1) Get or create the User
    try:
        user = User.objects.get(email=instance.email)
        # Update fields from signup request
        user.first_name = instance.first_name
        user.last_name = instance.last_name
        user.phone = instance.phone            # ✅ copy phone
        user.role = instance.role
        user.department = instance.department
        if instance.role == "STUDENT":
            user.study_year = instance.study_year
        user.status = "APPROVED"
        user.save()
    except User.DoesNotExist:
        user = User.objects.create_user(
            email=instance.email,
            first_name=instance.first_name,
            last_name=instance.last_name,
            phone=instance.phone,             # ✅ copy phone when creating
            role=instance.role,
            department=instance.department,
            study_year=instance.study_year if instance.role == "STUDENT" else None,
            status="APPROVED",
        )


    # 2) Get or create MagicLink (OneToOne with user)
    magic_link, created_ml = MagicLink.objects.get_or_create(user=user)
    magic_link.token = uuid.uuid4()
    magic_link.is_used = False
    magic_link.expires_at = timezone.now() + timedelta(hours=24)  # valid 24h
    magic_link.save()

    # 3) Build frontend activation URL
    base_url = getattr(settings, "FRONTEND_BASE_URL", "http://localhost:3000")
    activate_url = f"{base_url}/activate/{magic_link.token}/"

    # 4) Send email via Gmail
    subject = "Activate your CSMS account"
    message = (
        f"Hi {user.first_name},\n\n"
        f"Your signup request has been approved.\n"
        f"To activate your account and set a password, click this link:\n\n"
        f"{activate_url}\n\n"
        f"If you did not request this account, you can ignore this email."
    )

    send_mail(
        subject=subject,
        message=message,
        from_email=getattr(settings, "DEFAULT_FROM_EMAIL", settings.EMAIL_HOST_USER),
        recipient_list=[user.email],
        fail_silently=False,
    )

    # 5) Mark email as sent (so this signal won't run again for this request)
    instance.magic_link_sent = True
    instance.save(update_fields=["magic_link_sent"])
