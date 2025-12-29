from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    StudentViewSet,
    FacultyViewSet,
    BatchViewSet,
    CourseViewSet,
    BreakViewset,
    FeeReceiptViewSet,
    export_excel,
    filter_students,
)

router = DefaultRouter()
router.register(r'students', StudentViewSet)
router.register(r'faculty', FacultyViewSet)
router.register(r'batches', BatchViewSet)
router.register(r'courses', CourseViewSet)
router.register(r'breaks', BreakViewset)
router.register(r'fees', FeeReceiptViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path("export-excel/", export_excel, name="export_excel"),
    path("filter-students/", filter_students),
]
