from django.contrib import admin
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from django.urls import path

from .views import (
    PropertyListView,
    PropertyDetailView,
    PhotoUploadView,
    FavoriteListView,
    FavoriteDetailView,
    UserDetailView,
    RegisterView,
    LoginView
)

urlpatterns = [
    path('properties/', PropertyListView.as_view()),
    path('properties/<int:pk>/', PropertyDetailView.as_view()),
    path('properties/<int:pk>/photos/', PhotoUploadView.as_view()),
    path('favorites/', FavoriteListView.as_view()),
    path('favorites/<int:pk>/', FavoriteDetailView.as_view()),
    path('users/<int:pk>/', UserDetailView.as_view()),
    path('register/', RegisterView.as_view()),
    path('login/', LoginView.as_view()),
]
