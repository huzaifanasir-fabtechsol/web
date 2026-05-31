from django.contrib import admin
from .models import HorseOwner, Horse


@admin.register(HorseOwner)
class HorseOwnerAdmin(admin.ModelAdmin):
    list_display = ['name', 'phone', 'email', 'cnic', 'joined_date']
    search_fields = ['name', 'phone', 'email', 'cnic']
    list_filter = ['joined_date']


@admin.register(Horse)
class HorseAdmin(admin.ModelAdmin):
    list_display = ['horse_name', 'owner', 'arrival_date', 'height', 'breed', 'gender']
    search_fields = ['horse_name', 'owner__name', 'owner__email', 'breed', 'color']
    list_filter = ['gender', 'arrival_date', 'breed']
