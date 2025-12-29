from rest_framework import viewsets
from django.utils import timezone
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import HttpResponse, JsonResponse
from django.db import IntegrityError
from .models import Student, Faculty, Batch, Course, Break, FeeReceipt
from .serializers import (
    StudentSerializer, FacultySerializer, BatchSerializer,
    CourseSerializer, BreakSerializer, FeeReceiptSerializer
)
import openpyxl
import json
from openpyxl.utils import get_column_letter
from django.views.decorators.csrf import csrf_exempt

class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer

    def get_queryset(self):
        regno = self.request.query_params.get("regno")
        if regno:
            return Student.objects.filter(regno=regno)
        return super().get_queryset()

    @action(detail=True, methods=["PATCH"])
    def update_cert_status(self, request, pk=None):
        student = self.get_object()
        status = request.data.get("certificate_status") or request.data.get("Certificate_status")

        if status is None:
            return Response({"error": "No certificate status provided"}, status=400)

        student.Certificate_status = status
        student.save()
        return Response({"message": "Certificate status updated successfully"})

    @action(detail=True, methods=["PATCH"])
    def update_exam_details(self, request, pk=None):
        student = self.get_object()

        hall = request.data.get("hallticket_no")
        exam_date = request.data.get("exam_date") or request.data.get("Exam_Date")

        if hall:
            student.hallticket_no = hall
        if exam_date:
            student.Exam_Date = exam_date

        try:
            student.save()
        except IntegrityError:
            return Response({"error": "Hall Ticket No already exists"}, status=400)

        return Response({"message": "Exam details updated successfully"})

    @action(detail=True, methods=["PATCH"])
    def update_exam_course(self, request, pk=None):
        student = self.get_object()

        course = request.data.get("course")
        hall = request.data.get("hallticket_no")
        exam_date = request.data.get("Exam_Date")
        cert_status = request.data.get("Certificate_status")
        issued_status = request.data.get("Issued_status")

        if not course:
            return Response({"error": "Course not provided"}, status=400)

        # Convert CSV to lists
        courses = student.Exam_Course.split(",") if student.Exam_Course else []
        halls = student.hallticket_no.split(",") if student.hallticket_no else []
        dates = student.Exam_Date.split(",") if student.Exam_Date else []
        certs = student.Certificate_status.split(",") if student.Certificate_status else []
        issued_list = student.Issued_status.split(",") if student.Issued_status else []

        # Normalize lengths
        max_len = max(len(courses), len(halls), len(dates), len(certs), len(issued_list))

        while len(courses) < max_len: courses.append("")
        while len(halls) < max_len: halls.append("")
        while len(dates) < max_len: dates.append("")
        while len(certs) < max_len: certs.append("")
        while len(issued_list) < max_len: issued_list.append("")

        # ADD NEW COURSE
        if course not in courses:
            courses.append(course)
            halls.append(hall or "")  # Only if provided
            dates.append(exam_date or "")
            certs.append(cert_status or "")
            issued_list.append(issued_status or "")

        else:
            # UPDATE EXISTING COURSE
            idx = courses.index(course)

            if hall is not None:       # Only update if explicitly provided
                halls[idx] = hall

            if exam_date is not None:
                dates[idx] = exam_date

            if cert_status is not None:
                certs[idx] = cert_status

            if issued_status is not None:
                issued_list[idx] = issued_status

        # Save all CSV fields
        student.Exam_Course = ",".join(courses)
        student.hallticket_no = ",".join(halls)
        student.Exam_Date = ",".join(dates)
        student.Certificate_status = ",".join(certs)
        student.Issued_status = ",".join(issued_list)

        student.save()

        return Response({"message": "Updated successfully"})




        # @action(detail=True, methods=["PATCH"])
        # def update_exam_course(self, request, pk=None):
        #     student = self.get_object()

        #     course = request.data.get("course")
        #     hall = request.data.get("hallticket_no")
        #     exam_date = request.data.get("Exam_Date")
        #     status = request.data.get("Certificate_status")

        #     if not course:
        #         return Response({"error": "Course not provided"}, status=400)

        #     # Convert CSV to lists
        #     courses = student.Exam_Course.split(",") if student.Exam_Course else []
        #     halls = student.hallticket_no.split(",") if student.hallticket_no else []
        #     dates = student.Exam_Date.split(",") if student.Exam_Date else []
        #     statuses = student.Certificate_status.split(",") if student.Certificate_status else []

        #     # Normalize lists to equal lengths
        #     max_len = max(len(courses), len(halls), len(dates), len(statuses))
        #     while len(courses) < max_len: courses.append("")
        #     while len(halls) < max_len: halls.append("")
        #     while len(dates) < max_len: dates.append("")
        #     while len(statuses) < max_len: statuses.append("")

        #     # 🔥 If new course → ADD it
        #     if course not in courses:
        #         courses.append(course)
        #         halls.append(hall or "")
        #         dates.append(exam_date or "")
        #         statuses.append(status or "")

        #     else:
        #         # 🔥 If exists → UPDATE that index
        #         idx = courses.index(course)

        #         if hall is not None:
        #             halls[idx] = hall
        #         if exam_date is not None:
        #             dates[idx] = exam_date
        #         if status is not None:
        #             statuses[idx] = status

        #     # Save back into CSV fields
        #     student.Exam_Course = ",".join(courses)
        #     student.hallticket_no = ",".join(halls)
        #     student.Exam_Date = ",".join(dates)
        #     student.Certificate_status = ",".join(statuses)

        #     student.save()
        #     return Response({"message": "Exam course added/updated successfully"})



# ------------------------------------------------------------
# COURSE VIEWSET
# ------------------------------------------------------------
class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer


# ------------------------------------------------------------
# FACULTY VIEWSET
# ------------------------------------------------------------
class FacultyViewSet(viewsets.ModelViewSet):
    queryset = Faculty.objects.all()
    serializer_class = FacultySerializer


# ------------------------------------------------------------
# BATCH VIEWSET
# ------------------------------------------------------------
class BatchViewSet(viewsets.ModelViewSet):
    queryset = Batch.objects.all()
    serializer_class = BatchSerializer

    def get_queryset(self):
        faculty_id = self.request.query_params.get("faculty")
        if faculty_id:
            return Batch.objects.filter(faculty_id=faculty_id)
        return super().get_queryset()


# ------------------------------------------------------------
# BREAK VIEWSET
# ------------------------------------------------------------
class BreakViewset(viewsets.ModelViewSet):
    queryset = Break.objects.all()
    serializer_class = BreakSerializer

    def get_queryset(self):
        student_id = self.request.query_params.get("student")
        if student_id:
            return Break.objects.filter(student_id=student_id)
        return super().get_queryset()


# ------------------------------------------------------------
# FEE RECEIPT VIEWSET
# ------------------------------------------------------------
class FeeReceiptViewSet(viewsets.ModelViewSet):
    queryset = FeeReceipt.objects.all()
    serializer_class = FeeReceiptSerializer

    def get_queryset(self):
        student_id = self.request.query_params.get("student")
        if student_id:
            return FeeReceipt.objects.filter(student_id=student_id)
        return super().get_queryset()

from django.http import FileResponse
import io

@csrf_exempt
def export_excel(request):
    if request.method == "POST":
        data = json.loads(request.body)

        wb = openpyxl.Workbook()
        ws = wb.active
        ws.append(["Test"])

        buffer = io.BytesIO()
        wb.save(buffer)
        buffer.seek(0)

        return FileResponse(
            buffer,
            as_attachment=True,
            filename="Filtered_Students_Report.xlsx",
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )


# ------------------------------------------------------------
# FILTER STUDENTS (NOT USED BY FRONTEND)
# ------------------------------------------------------------
def filter_students(request):
    start = request.GET.get("start")
    end = request.GET.get("end")
    course = request.GET.get("course")

    filters = {}
    if start and end:
        filters["date_of_joining__range"] = [start, end]
    if course:
        filters["course__iexact"] = course.lower()

    data = Student.objects.filter(**filters)
    return JsonResponse(StudentSerializer(data, many=True).data,safe=False)
