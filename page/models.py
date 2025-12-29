from django.db import models
from django.core.validators import (
    MinValueValidator, MaxValueValidator, RegexValidator, EmailValidator
)
from datetime import date

class Course(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def str(self):
        return self.name
    

class Student(models.Model):
    # Basic Details
    image = models.ImageField(upload_to='student_images/', null=True, blank=True)
    studentname = models.CharField(
        max_length=50,
        validators=[RegexValidator(r'^[A-Za-z ]+$', 'Only letters and spaces are allowed.')]
    )
    regno = models.PositiveIntegerField(
        validators=[MinValueValidator(1)]
    )
    batchtime = models.CharField(max_length=30,null=True, blank=True)

    course = models.CharField(max_length=500)

    date_of_joining = models.DateField(null=True, blank=True)

    dob = models.DateField(null=True, blank=True)

    father_name = models.CharField(
        max_length=50,
        validators=[RegexValidator(r'^[A-Za-z ]+$', 'Only letters and spaces are allowed.')],
        null=True, blank=True
    )

    facultyname = models.CharField(
        max_length=50,
        validators=[RegexValidator(r'^[A-Za-z ]+$', 'Only letters and spaces are allowed.')],
        null=True, blank=True
    )

    address = models.CharField(max_length=300, null=True, blank=True)

    batch_started_date = models.DateField(null=True, blank=True)

    email = models.EmailField(
        validators=[EmailValidator()],
        null=True, blank=True
    )

    contact = models.CharField(
        max_length=15,
        validators=[RegexValidator(r'^\+?\d{10,15}$', 'Enter a valid contact number with 10–15 digits.')]
    )
    parent_contact = models.CharField(
        max_length=15,
        null=True, blank=True,
        validators=[RegexValidator(r'^\+?\d{10,15}$', 'Enter a valid contact number (10–15 digits).')]
    )
    
    reason = models.TextField(null=True, blank=True)
    #Certificate Details
    hallticket_no = models.TextField(null=True, blank=True)
    Exam_Course = models.TextField(null=True, blank=True)
    Certificate_status = models.TextField(null=True, blank=True)
    Exam_Date = models.TextField(null=True, blank=True)
    Issued_status = models.TextField(blank=True, null=True)
    # Fee Details
    total_fees = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    def str(self):
        return f"{self.studentname} ({self.regno})"
    

class Faculty(models.Model):
    faculty_name = models.CharField(
        max_length=50,
        validators=[RegexValidator(r'^[A-Za-z ]+$', 'Only letters and spaces are allowed.')]
    )

    batch_details = models.CharField(
        max_length=20,
        blank=True,
        null=True
    )
    subjects = models.JSONField(default=list, blank=True)

    def str(self):
        return f"{self.faculty_name} ({self.batch_details})"


class Batch(models.Model):
    faculty = models.ForeignKey(Faculty, related_name="batches", on_delete=models.CASCADE)
    label = models.CharField(max_length=20)
    date = models.DateField()
    batch_time = models.CharField(max_length=20, null=True, blank=True)
    subject = models.CharField(max_length=100, blank=True, null=True)

    def str(self):
        return f"{self.faculty.faculty_name} — {self.label}"


class Break(models.Model):
    student = models.ForeignKey(Student, related_name='breaks', on_delete=models.CASCADE)
    from_date = models.DateField()
    to_date = models.DateField()
    reason = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-from_date']

    def str(self):
        return f"{self.student.studentname} ({self.from_date} - {self.to_date})"



class FeeReceipt(models.Model):
    student = models.ForeignKey(
        'Student', on_delete=models.CASCADE, related_name='receipts'
    )
    receipt_no = models.CharField(max_length=50, blank=True, null=True)

    total_fees = models.PositiveIntegerField(default=0)
    paid_fees = models.PositiveIntegerField(default=0)
    due_fees = models.PositiveIntegerField(default=0)

    amount = models.PositiveIntegerField(validators=[MinValueValidator(0)])

    date = models.DateField(default=date.today)

    def _str_(self):
        return f"Receipt {self.receipt_no} - {self.student.studentname}"

    class Meta:
        ordering = ['-date']

    def save(self, *args, **kwargs):

        
        self.total_fees = self.student.total_fees

        # Previous amount
        if self.pk:
            old = FeeReceipt.objects.get(pk=self.pk)
            old_amount = old.amount
        else:
            old_amount = 0  

        old_receipts = FeeReceipt.objects.filter(student=self.student).exclude(pk=self.pk)
        already_paid = sum(r.amount for r in old_receipts)

        # Validation — now uses updated total_fees
        if already_paid + self.amount > self.total_fees:
            remaining = self.total_fees - already_paid
            raise ValueError(
                f"Payment Error: You are trying to pay {self.amount}, "
                f"but only {remaining} is remaining."
            )        

        super().save(*args, **kwargs)

        # Recalculate totals
        all_receipts = FeeReceipt.objects.filter(student=self.student)
        total_paid = sum(r.amount for r in all_receipts)

        self.paid_fees = total_paid
        self.due_fees = max(self.total_fees - total_paid, 0)

        super().save(update_fields=["paid_fees", "due_fees"])

    def delete(self, *args, **kwargs):
        student = self.student
        super().delete(*args, **kwargs)

        receipts = FeeReceipt.objects.filter(student=student)
        total_paid = sum(r.amount for r in receipts)

        for r in receipts:
            r.paid_fees = total_paid
            r.due_fees = max(r.total_fees - total_paid, 0)
            r.save(update_fields=["paid_fees", "due_fees"])

    
    def delete(self, *args, **kwargs):
        student = self.student
        super().delete(*args, **kwargs)

        receipts = FeeReceipt.objects.filter(student=student)
        total_paid = sum(r.amount for r in receipts)

        for r in receipts:
            r.paid_fees = total_paid
            r.due_fees = max(r.total_fees - total_paid, 0)
            r.save(update_fields=["paid_fees", "due_fees"])