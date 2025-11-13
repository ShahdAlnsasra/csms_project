from django.db.models.signals import post_migrate
from django.dispatch import receiver
from api.models import User

@receiver(post_migrate)
def create_super_admin(sender, **kwargs):
    # מריץ רק עבור האפליקציה api
    if sender.name == "api":
        if not User.objects.filter(role="SUPER_ADMIN").exists():
            User.objects.create_user(
                email="super@csms.com",
                password="Super123!",
                first_name="System",
                last_name="Admin",
                role="SUPER_ADMIN",
                status="APPROVED"
            )
            print(">>> SUPER_ADMIN created automatically!")
