from django.db import models

from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    phone = models.CharField(max_length=20, blank=True)

class Property(models.Model):
    TYPE_CHOICES = [
        ('apartment', 'Квартира'),
        ('house', 'Дом'),
        ('commercial', 'Коммерческая недвижимость'),
    ]

    DEAL_TYPE_CHOICES = [
        ('sale', 'Продажа'),
        ('rent', 'Аренда'),
    ]

    STATUS_CHOICES = [
        ('active', 'Активно'),
        ('sold', 'Продано'),
        ('archived', 'В архиве'),
    ]

    owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='properties'
    )

    title = models.CharField(max_length=200)
    description = models.TextField()

    price = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )

    property_type = models.CharField(
        max_length=30,
        choices=TYPE_CHOICES
    )

    deal_type = models.CharField(
        max_length=10,
        choices=DEAL_TYPE_CHOICES
    )

    city = models.CharField(max_length=100)
    address = models.CharField(max_length=255)

    area = models.DecimalField(
        max_digits=8,
        decimal_places=2
    )

    rooms = models.PositiveIntegerField(
        null=True,
        blank=True
    )

    floor = models.PositiveIntegerField(
        null=True,
        blank=True
    )

    total_floors = models.PositiveIntegerField(
        null=True,
        blank=True
    )

    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='active'
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

class Photo(models.Model):
    property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name='photos'
    )

    image = models.ImageField(upload_to='properties/')

class Favorite(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='favorites'
    )

    property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name='favorites'
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'property'],
                name='unique_user_property_favorite'
            )
        ]