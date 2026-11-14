from django.conf import settings
from rest_framework import serializers

from .models import User, Property, Photo, Favorite


class PhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Photo
        fields = ['id', 'property', 'image', 'thumbnail', 'order']
        # The view sets `property` and `order`; clients send only `image`.
        read_only_fields = ['property', 'thumbnail', 'order']

    def validate_image(self, image):
        if image.size > settings.MAX_PHOTO_SIZE:
            limit_mb = settings.MAX_PHOTO_SIZE // (1024 * 1024)
            raise serializers.ValidationError(
                f'Файл больше {limit_mb} МБ.'
            )
        return image


class PropertySerializer(serializers.ModelSerializer):
    photos = PhotoSerializer(many=True, read_only=True)

    class Meta:
        model = Property
        fields = [
            'id',
            'owner',
            'title',
            'description',
            'price',
            'property_type',
            'deal_type',
            'city',
            'address',
            'area',
            'rooms',
            'floor',
            'total_floors',
            'status',
            'created_at',
            'photos',
        ]

        # The owner is always the authenticated user (see the views).
        read_only_fields = [
            'id',
            'owner',
            'created_at',
            'photos',
        ]

    def validate_price(self, value):
        if value <= 0:
            raise serializers.ValidationError('Цена должна быть больше нуля.')
        return value

    def validate_area(self, value):
        if value <= 0:
            raise serializers.ValidationError('Площадь должна быть больше нуля.')
        return value

    def _validate_positive(self, value, message):
        if value is not None and value < 1:
            raise serializers.ValidationError(message)
        return value

    def validate_rooms(self, value):
        return self._validate_positive(value, 'Комнат должно быть хотя бы 1.')

    def validate_floor(self, value):
        return self._validate_positive(value, 'Этаж должен быть не меньше 1.')

    def validate_total_floors(self, value):
        return self._validate_positive(value, 'Этажей должно быть хотя бы 1.')

    def validate(self, attrs):
        floor = attrs.get('floor', getattr(self.instance, 'floor', None))
        total = attrs.get(
            'total_floors', getattr(self.instance, 'total_floors', None)
        )

        if floor and total and floor > total:
            raise serializers.ValidationError({
                'floor': 'Этаж не может быть выше, чем этажей в доме.'
            })

        return attrs


class FavoriteSerializer(serializers.ModelSerializer):
    property_data = PropertySerializer(
        source='property',
        read_only=True
    )

    class Meta:
        model = Favorite
        fields = [
            'id',
            'user',
            'property',
            'property_data',
            'created_at',
        ]
        read_only_fields = ['user']

    def validate(self, attrs):
        user = self.context['request'].user
        if Favorite.objects.filter(user=user, property=attrs['property']).exists():
            raise serializers.ValidationError('Объявление уже в избранном.')
        return attrs


class UserSerializer(serializers.ModelSerializer):
    """Full profile, shown only to the user themself."""

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'phone',
        ]
        read_only_fields = ['id', 'username']


class PublicUserSerializer(serializers.ModelSerializer):
    """What buyers see about a seller: no email."""

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'first_name',
            'last_name',
            'phone',
        ]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        min_length=6
    )

    class Meta:
        model = User
        fields = [
            'username',
            'email',
            'password',
            'first_name',
            'last_name',
            'phone',
        ]

    def create(self, validated_data):
        password = validated_data.pop('password')

        user = User.objects.create_user(
            password=password,
            **validated_data
        )

        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(
        write_only=True
    )


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    password = serializers.CharField(write_only=True, min_length=6)
