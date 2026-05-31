from django.urls import path
from .views import WorkerListCreateView, WorkerDetailView

urlpatterns = [
    path('', WorkerListCreateView.as_view(), name='worker-list-create'),
    path('<int:pk>/', WorkerDetailView.as_view(), name='worker-detail'),
]
