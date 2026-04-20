from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Notification
from .serializers import NotificationSerializer


def _role_user(request, expected_role):
    if not request.user.is_authenticated:
        return None, Response({"detail": "Authentication required."}, status=401)
    if request.user.role != expected_role:
        return None, Response({"detail": "Forbidden."}, status=403)
    return request.user, None


def _list_notifications_for_role(request, role):
    user, err = _role_user(request, role)
    if err:
        return err

    qs = Notification.objects.filter(recipient=user).select_related("sender", "course")
    unread_only = request.query_params.get("unread")
    if unread_only in ("1", "true", "yes"):
        qs = qs.filter(read_at__isnull=True)
    return Response(NotificationSerializer(qs[:200], many=True).data)


def _detail_notification_for_role(request, notification_id, role):
    user, err = _role_user(request, role)
    if err:
        return err
    n = get_object_or_404(Notification, pk=notification_id, recipient=user)
    return Response(NotificationSerializer(n).data)


def _mark_read_for_role(request, notification_id, role):
    user, err = _role_user(request, role)
    if err:
        return err
    n = get_object_or_404(Notification, pk=notification_id, recipient=user)
    if not n.read_at:
        n.read_at = timezone.now()
        n.save(update_fields=["read_at"])
    return Response({"detail": "Marked as read."})


def _unread_count_for_role(request, role):
    user, err = _role_user(request, role)
    if err:
        return err
    unread = Notification.objects.filter(recipient=user, read_at__isnull=True).count()
    return Response({"unread": unread})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def lecturer_notifications(request):
    return _list_notifications_for_role(request, "LECTURER")


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def lecturer_notification_detail(request, notification_id):
    return _detail_notification_for_role(request, notification_id, "LECTURER")


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def lecturer_notification_mark_read(request, notification_id):
    return _mark_read_for_role(request, notification_id, "LECTURER")


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def lecturer_notification_unread_count(request):
    return _unread_count_for_role(request, "LECTURER")


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def reviewer_notifications(request):
    return _list_notifications_for_role(request, "REVIEWER")


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def reviewer_notification_detail(request, notification_id):
    return _detail_notification_for_role(request, notification_id, "REVIEWER")


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def reviewer_notification_mark_read(request, notification_id):
    return _mark_read_for_role(request, notification_id, "REVIEWER")


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def reviewer_notification_unread_count(request):
    return _unread_count_for_role(request, "REVIEWER")
