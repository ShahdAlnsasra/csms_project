

from django.db.models.signals import post_migrate
from django.dispatch import receiver
from api.models import User
from django.db.models.signals import post_migrate
from django.dispatch import receiver
from api.models import User
from django.db.models.signals import post_migrate
from django.dispatch import receiver
from api.models import User

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
