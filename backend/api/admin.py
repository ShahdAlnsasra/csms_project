from django.contrib import admin
from .models import User, Department, Course, Syllabus, SignupRequest, MagicLink

admin.site.register(User)
admin.site.register(Department)
admin.site.register(Course)
admin.site.register(Syllabus)
admin.site.register(SignupRequest)
admin.site.register(MagicLink)
