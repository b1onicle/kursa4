from rest_framework import serializers

from .models import User, Property, Photo, Favorite


class PhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Photo
        fields = '__all__'


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

        read_only_fields = [
            'id',
            'created_at',
            'photos',
        ]


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

class UserSerializer(serializers.ModelSerializer):
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