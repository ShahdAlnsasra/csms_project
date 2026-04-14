from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0022_alter_syllabusweek_options_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="signuprequest",
            name="email_verification_expires_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
