from decimal import Decimal, InvalidOperation

from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.db import transaction
from django.db.models import Max, Q, Value
from django.db.models.functions import Concat, Lower
from django.shortcuts import get_object_or_404
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Favorite, Photo, Property, User
from .serializers import (
    FavoriteSerializer,
    LoginSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    PhotoSerializer,
    PropertySerializer,
    PublicUserSerializer,
    RegisterSerializer,
    UserSerializer,
)


def ensure_owner(request, prop):
    if prop.owner_id != request.user.id:
        raise PermissionDenied('Изменять объявление может только его владелец.')


def parse_decimal(value):
    try:
        return Decimal(value)
    except (InvalidOperation, TypeError):
        raise ValidationError({'detail': f'Некорректное число: {value}'})


def auth_response(user, status_code=status.HTTP_200_OK):
    token, _ = Token.objects.get_or_create(user=user)
    return Response(
        {'token': token.key, 'user': UserSerializer(user).data},
        status=status_code,
    )


class PropertyPagination(PageNumberPagination):
    page_size = 12
    page_size_query_param = 'page_size'
    max_page_size = 50


class PropertyListView(APIView):
    ORDERING = {
        'newest': '-created_at',
        'priceAsc': 'price',
        'priceDesc': '-price',
    }

    def get(self, request):
        params = request.query_params
        properties = Property.objects.prefetch_related('photos')

        owner_id = params.get('owner')
        if owner_id:
            properties = properties.filter(owner_id=owner_id)

        # Sold and archived listings are visible only to their owner.
        is_own_list = (
            owner_id
            and request.user.is_authenticated
            and str(request.user.id) == owner_id
        )
        if not is_own_list:
            properties = properties.filter(status='active')

        property_type = params.get('property_type')
        if property_type:
            properties = properties.filter(property_type=property_type)

        deal_type = params.get('deal_type')
        if deal_type:
            properties = properties.filter(deal_type=deal_type)

        search = params.get('search', '').strip()
        if search:
            properties = properties.annotate(
                search_text=Lower(Concat('city', Value(' '), 'address'))
            ).filter(search_text__contains=search.lower())

        ranges = {
            'price_min': 'price__gte',
            'price_max': 'price__lte',
            'area_min': 'area__gte',
            'area_max': 'area__lte',
        }
        for param, lookup in ranges.items():
            if params.get(param):
                properties = properties.filter(
                    **{lookup: parse_decimal(params[param])}
                )

        # rooms=1,2 or rooms=4 (which means "4 and more").
        rooms = [r for r in params.get('rooms', '').split(',') if r.strip()]
        if rooms:
            try:
                values = [int(r) for r in rooms]
            except ValueError:
                raise ValidationError({'rooms': 'Ожидаются числа через запятую.'})

            condition = Q(rooms__in=[v for v in values if v < 4])
            if any(v >= 4 for v in values):
                condition |= Q(rooms__gte=4)
            properties = properties.filter(condition)

        ordering = self.ORDERING.get(params.get('ordering'), '-created_at')
        properties = properties.order_by(ordering, '-id')

        paginator = PropertyPagination()
        page = paginator.paginate_queryset(properties, request, view=self)
        serializer = PropertySerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        serializer = PropertySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(owner=request.user)

        return Response(serializer.data, status=status.HTTP_201_CREATED)


class PropertyDetailView(APIView):

    def get(self, request, pk):
        prop = get_object_or_404(Property, pk=pk)
        return Response(PropertySerializer(prop).data)

    def put(self, request, pk):
        prop = get_object_or_404(Property, pk=pk)
        ensure_owner(request, prop)

        serializer = PropertySerializer(prop, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data)

    def delete(self, request, pk):
        prop = get_object_or_404(Property, pk=pk)
        ensure_owner(request, prop)
        prop.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)


class PhotoUploadView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, pk):
        prop = get_object_or_404(Property, pk=pk)
        ensure_owner(request, prop)

        if prop.photos.count() >= settings.MAX_PHOTOS_PER_PROPERTY:
            raise ValidationError({
                'image': f'У объявления уже {settings.MAX_PHOTOS_PER_PROPERTY} '
                         'фотографий, это максимум.'
            })

        serializer = PhotoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        last = prop.photos.aggregate(last=Max('order'))['last']
        serializer.save(property=prop, order=0 if last is None else last + 1)

        return Response(serializer.data, status=status.HTTP_201_CREATED)


class PhotoOrderView(APIView):
    """Set the order of a listing's photos; the first one becomes the cover."""

    def post(self, request, pk):
        prop = get_object_or_404(Property, pk=pk)
        ensure_owner(request, prop)

        ids = request.data.get('ids')
        current = set(prop.photos.values_list('id', flat=True))

        if not isinstance(ids, list) or set(ids) != current or len(ids) != len(current):
            raise ValidationError({
                'ids': 'Нужно передать все фотографии этого объявления.'
            })

        with transaction.atomic():
            for index, photo_id in enumerate(ids):
                Photo.objects.filter(pk=photo_id).update(order=index)

        return Response(PhotoSerializer(prop.photos.all(), many=True).data)


class PhotoDetailView(APIView):

    def delete(self, request, pk):
        photo = get_object_or_404(Photo, pk=pk)
        ensure_owner(request, photo.property)
        photo.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)


class FavoriteListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        favorites = (
            Favorite.objects.filter(user=request.user)
            .select_related('property')
            .prefetch_related('property__photos')
            .order_by('-created_at')
        )
        return Response(FavoriteSerializer(favorites, many=True).data)

    def post(self, request):
        serializer = FavoriteSerializer(
            data=request.data, context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user)

        return Response(serializer.data, status=status.HTTP_201_CREATED)


class FavoriteDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        # Other users' favorites look like they do not exist.
        favorite = get_object_or_404(Favorite, pk=pk, user=request.user)
        favorite.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)


class UserDetailView(APIView):
    """Public seller card: name and phone, no email."""

    def get(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        return Response(PublicUserSerializer(user).data)


class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def put(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data)


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        return auth_response(user, status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = authenticate(
            username=serializer.validated_data['username'],
            password=serializer.validated_data['password'],
        )

        if user is None:
            return Response(
                {'detail': 'Неверный логин или пароль.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        return auth_response(user)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        Token.objects.filter(user=request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']

        for user in User.objects.filter(email__iexact=email, is_active=True):
            if not user.has_usable_password():
                continue

            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            link = f'{settings.FRONTEND_URL}/reset-password?uid={uid}&token={token}'

            send_mail(
                'Восстановление пароля RealEstate',
                f'Здравствуйте, {user.first_name or user.username}!\n\n'
                f'Чтобы задать новый пароль, откройте ссылку:\n{link}\n\n'
                'Если вы не запрашивали сброс, просто проигнорируйте письмо.',
                None,
                [user.email],
            )

        # Same answer whether or not the email exists, so the form
        # cannot be used to find out who is registered.
        return Response({
            'detail': 'Если такой email зарегистрирован, мы отправили на него ссылку.'
        })


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            user = User.objects.get(pk=force_str(urlsafe_base64_decode(data['uid'])))
        except (User.DoesNotExist, ValueError, TypeError, OverflowError):
            user = None

        if user is None or not default_token_generator.check_token(user, data['token']):
            return Response(
                {'detail': 'Ссылка устарела или уже использована. Запросите новую.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(data['password'])
        user.save()
        # Log out everywhere: old tokens stop working.
        Token.objects.filter(user=user).delete()

        return Response({'detail': 'Пароль изменён. Войдите с новым паролем.'})
