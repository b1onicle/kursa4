from django.shortcuts import get_object_or_404
from django.contrib.auth import authenticate
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.generics import CreateAPIView
from .models import User, Property, Photo, Favorite
from .serializers import (
    PropertySerializer,
    PhotoSerializer,
    FavoriteSerializer,
    UserSerializer,
    RegisterSerializer,
    LoginSerializer,
)


class PropertyListView(APIView):

    def get(self, request):
        properties = Property.objects.all()

        owner_id = request.query_params.get("owner")

        if owner_id:
            properties = properties.filter(owner_id=owner_id)

        serializer = PropertySerializer(properties, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = PropertySerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


class PropertyDetailView(APIView):

    def get(self, request, pk):
        property = get_object_or_404(Property, pk=pk)
        serializer = PropertySerializer(property)

        return Response(serializer.data)

    def put(self, request, pk):
        property = get_object_or_404(Property, pk=pk)
        serializer = PropertySerializer(property, data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    def delete(self, request, pk):
        property = get_object_or_404(Property, pk=pk)
        property.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)


class PhotoUploadView(CreateAPIView):
    parser_classes = [MultiPartParser, FormParser]
    serializer_class = PhotoSerializer

    def perform_create(self, serializer):
        property = get_object_or_404(
            Property,
            pk=self.kwargs['pk']
        )

        serializer.save(property=property)

class FavoriteListView(APIView):
    def get(self, request):
        user_id = request.query_params.get('user')

        favorites = Favorite.objects.filter(user_id=user_id)

        serializer = FavoriteSerializer(
            favorites,
            many=True
        )

        return Response(serializer.data)

    def post(self, request):
        serializer = FavoriteSerializer(
            data=request.data
        )

        if serializer.is_valid():
            serializer.save()

            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


class FavoriteDetailView(APIView):
    def delete(self, request, pk):
        favorite = get_object_or_404(
            Favorite,
            pk=pk
        )

        favorite.delete()

        return Response(
            status=status.HTTP_204_NO_CONTENT
        )

class UserDetailView(APIView):
    def get(self, request, pk):
        user = get_object_or_404(User, pk=pk)

        serializer = UserSerializer(user)

        return Response(serializer.data)

    def put(self, request, pk):
        user = get_object_or_404(User, pk=pk)

        serializer = UserSerializer(
            user,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            serializer.save()

            return Response(serializer.data)

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

class RegisterView(APIView):
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.save()

            return Response(
                UserSerializer(user).data,
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )
    
class LoginView(APIView):
    def post(self, request):
        serializer = LoginSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        username = serializer.validated_data["username"]
        password = serializer.validated_data["password"]

        user = authenticate(
            username=username,
            password=password
        )

        if user is None:
            return Response(
                {"detail": "Неверный логин или пароль."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        return Response(
            UserSerializer(user).data,
            status=status.HTTP_200_OK
        )