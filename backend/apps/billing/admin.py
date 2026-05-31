from django.contrib import admin
from .models import Transaction


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'student', 'fee_type', 'course', 'month', 'year',
        'date', 'amount', 'status', 'payment_method', 'created_at',
    ]
    list_filter = ['fee_type', 'status', 'payment_method', 'month', 'year']
    search_fields = ['student__name', 'student__cnic', 'course__name']
    ordering = ['-created_at']
