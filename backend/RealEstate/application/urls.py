from django.urls import path

from .views import (
    CurrentUserView,
    FavoriteDetailView,
    FavoriteListView,
    LoginView,
    LogoutView,
    PasswordResetConfirmView,
    PasswordResetRequestView,
    PhotoDetailView,
    PhotoOrderView,
    PhotoUploadView,
    PropertyDetailView,
    PropertyListView,
    RegisterView,
    UserDetailView,
)

urlpatterns = [
    path('properties/', PropertyListView.as_view()),
    path('properties/<int:pk>/', PropertyDetailView.as_view()),
    path('properties/<int:pk>/photos/', PhotoUploadView.as_view()),
    path('properties/<int:pk>/photos/order/', PhotoOrderView.as_view()),
    path('photos/<int:pk>/', PhotoDetailView.as_view()),
    path('favorites/', FavoriteListView.as_view()),
    path('favorites/<int:pk>/', FavoriteDetailView.as_view()),
    path('users/me/', CurrentUserView.as_view()),
    path('users/<int:pk>/', UserDetailView.as_view()),
    path('register/', RegisterView.as_view()),
    path('login/', LoginView.as_view()),
    path('logout/', LogoutView.as_view()),
    path('password-reset/', PasswordResetRequestView.as_view()),
    path('password-reset/confirm/', PasswordResetConfirmView.as_view()),
]
