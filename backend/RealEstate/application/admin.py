from django.contrib import admin
from .models import User, Property, Photo, Favorite


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'phone', 'is_active')
    search_fields = ('username', 'email', 'phone')


@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = (
        'title',
        'owner',
        'price',
        'property_type',
        'deal_type',
        'city',
        'status',
        'created_at',
    )

    list_filter = (
        'property_type',
        'deal_type',
        'status',
        'city',
    )

    search_fields = (
        'title',
        'description',
        'address',
        'city',
    )


@admin.register(Photo)
class PhotoAdmin(admin.ModelAdmin):
    list_display = ('property', 'image')


@admin.register(Favorite)
class FavoriteAdmin(admin.ModelAdmin):
    list_display = ('user', 'property', 'created_at')
    list_filter = ('created_at',)