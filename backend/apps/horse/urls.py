from django.urls import path
from .views import (
    HorseOwnerListCreateView,
    HorseOwnerDetailView,
    HorseListCreateView,
    HorseDetailView,
)

urlpatterns = [
    path('owners/', HorseOwnerListCreateView.as_view(), name='horse-owner-list-create'),
    path('owners/<int:pk>/', HorseOwnerDetailView.as_view(), name='horse-owner-detail'),
    path('horses/', HorseListCreateView.as_view(), name='horse-list-create'),
    path('horses/<int:pk>/', HorseDetailView.as_view(), name='horse-detail'),
]
