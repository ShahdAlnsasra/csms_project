"""Shared helpers for academic terms (avoid circular imports)."""
from django.utils import timezone

from .models import AcademicTerm

SEM_ORDER = ["A", "B", "SUMMER"]


def get_current_term():
    term = AcademicTerm.objects.filter(is_current=True).first()
    if term:
        return term
    now = timezone.now()
    year_start = now.year if now.month >= 9 else now.year - 1
    academic_year = f"{year_start}-{year_start + 1}"
    term, _ = AcademicTerm.objects.get_or_create(
        academic_year=academic_year,
        semester="A",
        defaults={"is_current": True},
    )
    if not term.is_current:
        AcademicTerm.objects.filter(is_current=True).update(is_current=False)
        term.is_current = True
        term.save(update_fields=["is_current"])
    return term
