from rest_framework import serializers
from .models import Student, Faculty, Batch, Course, Break, FeeReceipt


# -------------------------------------------------------------
# BREAK SERIALIZER
# -------------------------------------------------------------
class BreakSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.studentname', read_only=True)

    class Meta:
        model = Break
        fields = '__all__'


# -------------------------------------------------------------
# STUDENT SERIALIZER
# -------------------------------------------------------------
class StudentSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    breaks = BreakSerializer(many=True, read_only=True)

    class Meta:
        model = Student
        fields = '__all__'
        extra_kwargs = {
            'regno': {'required': True},
            'studentname': {'required': True}
        }

    def validate(self, data):
      
        regno = data.get('regno')
        studentname = data.get('studentname')

        # If either field is missing from incoming data (partial update), skip this check.
        if regno is None or studentname is None:
            return data

        existing = Student.objects.filter(regno=regno)
        if not existing.exists():
            return data

        # Compare case-insensitively and defend against None values on existing records
        if any((s.studentname or "").strip().lower() == studentname.strip().lower() for s in existing):
            return data

        raise serializers.ValidationError({
            "regno": "❌ This regno already belongs to another student."
        })


# -------------------------------------------------------------
# FACULTY SERIALIZER
# -------------------------------------------------------------
class FacultySerializer(serializers.ModelSerializer):
    class Meta:
        model = Faculty
        fields = '__all__'


# -------------------------------------------------------------
# BATCH SERIALIZER
# -------------------------------------------------------------
class BatchSerializer(serializers.ModelSerializer):
    faculty_name = serializers.CharField(source='faculty.faculty_name', read_only=True)

    class Meta:
        model = Batch
        fields = ["id", "faculty", "faculty_name", "label", "date", "batch_time", "subject"]


# -------------------------------------------------------------
# COURSE SERIALIZER
# -------------------------------------------------------------
class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = '__all__'


# -------------------------------------------------------------
# FEE RECEIPT SERIALIZER
# -------------------------------------------------------------
class FeeReceiptSerializer(serializers.ModelSerializer):

    class Meta:
        model = FeeReceipt
        fields = '__all__'
        read_only_fields = ['total_fees', 'paid_fees', 'due_fees']

    def validate(self, data):

        student = data.get("student") or (self.instance.student if self.instance else None)
        amount = data.get("amount") if data.get("amount") is not None else (self.instance.amount if self.instance else None)

        if student is None:
            raise serializers.ValidationError({"student": "Student is required"})

        if amount is None:
            raise serializers.ValidationError({"amount": "Amount is required"})

        qs = FeeReceipt.objects.filter(student=student)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)

        existing_paid = sum(r.amount for r in qs)
        total_fees = student.total_fees

        remaining = total_fees - existing_paid
        if amount > remaining:
            raise serializers.ValidationError(
                {"amount": f"Overpayment! Only {remaining} remaining."}
            )

        return data
