import io
import os
import re
import shutil
import tempfile
from decimal import Decimal
from pathlib import Path
from unittest.mock import patch

from django.core import mail
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import call_command
from django.test import override_settings
from PIL import Image
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from .models import Favorite, Photo, Property, User


def make_property(owner, **overrides):
    data = {
        'title': 'Квартира',
        'description': 'Описание',
        'price': Decimal('1000000.00'),
        'property_type': 'apartment',
        'deal_type': 'sale',
        'city': 'Караганда',
        'address': 'ул. Ленина, 1',
        'area': Decimal('50.00'),
    }
    data.update(overrides)
    return Property.objects.create(owner=owner, **data)


def make_image(name='photo.png', size=(10, 10)):
    buffer = io.BytesIO()
    Image.new('RGB', size, 'red').save(buffer, format='PNG')
    return SimpleUploadedFile(name, buffer.getvalue(), content_type='image/png')


class TempMediaMixin:
    """Keep uploaded files out of the real media folder."""

    def setUp(self):
        super().setUp()
        self.media_root = tempfile.mkdtemp()
        self.addCleanup(shutil.rmtree, self.media_root, ignore_errors=True)
        override = override_settings(MEDIA_ROOT=self.media_root)
        override.enable()
        self.addCleanup(override.disable)

    def login(self, user):
        self.client.force_authenticate(user)


class AuthTests(APITestCase):
    def test_register_returns_token_and_hashes_password(self):
        response = self.client.post('/api/register/', {
            'username': 'ivan',
            'email': 'ivan@example.com',
            'password': 'secret123',
            'phone': '+77000000000',
        })

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('token', response.data)
        self.assertEqual(response.data['user']['username'], 'ivan')
        self.assertNotIn('password', response.data['user'])

        user = User.objects.get(username='ivan')
        self.assertTrue(user.check_password('secret123'))
        self.assertEqual(Token.objects.get(user=user).key, response.data['token'])

    def test_register_rejects_short_password(self):
        response = self.client.post('/api/register/', {
            'username': 'ivan',
            'password': '123',
        })

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)

    def test_login_returns_token(self):
        User.objects.create_user(username='ivan', password='secret123')

        response = self.client.post('/api/login/', {
            'username': 'ivan',
            'password': 'secret123',
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['user']['username'], 'ivan')
        self.assertTrue(response.data['token'])

    def test_login_with_wrong_password(self):
        User.objects.create_user(username='ivan', password='secret123')

        response = self.client.post('/api/login/', {
            'username': 'ivan',
            'password': 'wrong',
        })

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_token_authenticates_requests(self):
        User.objects.create_user(username='ivan', password='secret123')
        token = self.client.post('/api/login/', {
            'username': 'ivan', 'password': 'secret123',
        }).data['token']

        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        response = self.client.get('/api/users/me/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'ivan')

    def test_logout_invalidates_token(self):
        user = User.objects.create_user(username='ivan', password='secret123')
        token = Token.objects.create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')

        response = self.client.post('/api/logout/')

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(
            self.client.get('/api/users/me/').status_code,
            status.HTTP_401_UNAUTHORIZED,
        )


@override_settings(FRONTEND_URL='http://front.test')
class PasswordResetTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='ivan', email='ivan@example.com', password='old-pass'
        )

    def request_link(self, email='ivan@example.com'):
        return self.client.post('/api/password-reset/', {'email': email})

    def link_params(self):
        match = re.search(r'uid=([^&\s]+)&token=([^\s]+)', mail.outbox[-1].body)
        return {'uid': match.group(1), 'token': match.group(2)}

    def test_sends_link_to_registered_email(self):
        response = self.request_link()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn('http://front.test/reset-password?uid=', mail.outbox[0].body)

    def test_same_answer_for_unknown_email(self):
        known = self.request_link()
        unknown = self.request_link('nobody@example.com')

        self.assertEqual(unknown.status_code, status.HTTP_200_OK)
        self.assertEqual(known.data, unknown.data)
        self.assertEqual(len(mail.outbox), 1)

    def test_confirm_sets_new_password_and_revokes_tokens(self):
        Token.objects.create(user=self.user)
        self.request_link()

        response = self.client.post('/api/password-reset/confirm/', {
            **self.link_params(), 'password': 'new-pass',
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('new-pass'))
        self.assertFalse(Token.objects.filter(user=self.user).exists())

    def test_link_works_only_once(self):
        self.request_link()
        params = self.link_params()
        self.client.post('/api/password-reset/confirm/', {**params, 'password': 'new-pass'})

        response = self.client.post('/api/password-reset/confirm/', {
            **params, 'password': 'other-pass',
        })

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_rejects_bad_token(self):
        self.request_link()

        response = self.client.post('/api/password-reset/confirm/', {
            'uid': self.link_params()['uid'],
            'token': 'bad-token',
            'password': 'new-pass',
        })

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class PropertyListTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.alice = User.objects.create_user(username='alice', password='x')
        cls.bob = User.objects.create_user(username='bob', password='x')

        cls.cheap = make_property(
            cls.alice, title='Cheap', price=Decimal('100'), area=Decimal('30'),
            rooms=1, city='Караганда',
        )
        cls.middle = make_property(
            cls.alice, title='Middle', price=Decimal('500'), area=Decimal('70'),
            rooms=3, property_type='house', deal_type='rent', city='Алматы',
        )
        cls.expensive = make_property(
            cls.bob, title='Expensive', price=Decimal('900'), area=Decimal('120'),
            rooms=5, property_type='commercial', city='Астана',
            address='пр. Республики, 10',
        )
        cls.sold = make_property(
            cls.bob, title='Sold', price=Decimal('300'), status='sold',
        )

    def titles(self, response):
        return [item['title'] for item in response.data['results']]

    def test_response_is_paginated(self):
        response = self.client.get('/api/properties/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 3)
        self.assertIn('next', response.data)
        self.assertEqual(len(response.data['results']), 3)

    def test_page_size_and_page(self):
        first = self.client.get('/api/properties/?page_size=2')
        second = self.client.get('/api/properties/?page_size=2&page=2')

        self.assertEqual(len(first.data['results']), 2)
        self.assertIsNotNone(first.data['next'])
        self.assertEqual(len(second.data['results']), 1)

    def test_page_out_of_range_returns_404(self):
        response = self.client.get('/api/properties/?page=99')

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_hides_sold_listings_from_catalog(self):
        response = self.client.get('/api/properties/')

        self.assertNotIn('Sold', self.titles(response))

    def test_owner_sees_own_sold_listings(self):
        self.client.force_authenticate(self.bob)

        response = self.client.get(f'/api/properties/?owner={self.bob.id}')

        self.assertEqual(sorted(self.titles(response)), ['Expensive', 'Sold'])

    def test_others_do_not_see_sold_listings_of_owner(self):
        self.client.force_authenticate(self.alice)

        response = self.client.get(f'/api/properties/?owner={self.bob.id}')

        self.assertEqual(self.titles(response), ['Expensive'])

    def test_default_ordering_is_newest_first(self):
        response = self.client.get('/api/properties/')

        self.assertEqual(self.titles(response), ['Expensive', 'Middle', 'Cheap'])

    def test_ordering_by_price(self):
        asc = self.client.get('/api/properties/?ordering=priceAsc')
        desc = self.client.get('/api/properties/?ordering=priceDesc')

        self.assertEqual(self.titles(asc), ['Cheap', 'Middle', 'Expensive'])
        self.assertEqual(self.titles(desc), ['Expensive', 'Middle', 'Cheap'])

    def test_filter_by_property_and_deal_type(self):
        by_type = self.client.get('/api/properties/?property_type=house')
        by_deal = self.client.get('/api/properties/?deal_type=sale')

        self.assertEqual(self.titles(by_type), ['Middle'])
        self.assertEqual(sorted(self.titles(by_deal)), ['Cheap', 'Expensive'])

    def test_filter_by_price_range(self):
        response = self.client.get('/api/properties/?price_min=200&price_max=900')

        self.assertEqual(self.titles(response), ['Expensive', 'Middle'])

    def test_filter_by_area_range(self):
        response = self.client.get('/api/properties/?area_min=50&area_max=100')

        self.assertEqual(self.titles(response), ['Middle'])

    def test_filter_by_rooms(self):
        exact = self.client.get('/api/properties/?rooms=1,3')
        four_plus = self.client.get('/api/properties/?rooms=4')

        self.assertEqual(self.titles(exact), ['Middle', 'Cheap'])
        self.assertEqual(self.titles(four_plus), ['Expensive'])

    def test_invalid_number_returns_400(self):
        response = self.client.get('/api/properties/?price_min=abc')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_search_is_case_insensitive_for_cyrillic(self):
        for query in ('караганда', 'КАРАГАНДА', 'Караганда'):
            with self.subTest(query=query):
                response = self.client.get('/api/properties/', {'search': query})
                self.assertEqual(self.titles(response), ['Cheap'])

    def test_search_matches_address(self):
        response = self.client.get('/api/properties/', {'search': 'республики'})

        self.assertEqual(self.titles(response), ['Expensive'])


class PropertyPermissionTests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(username='owner', password='x')
        self.stranger = User.objects.create_user(username='stranger', password='x')
        self.prop = make_property(self.owner)

    def payload(self, **overrides):
        data = {
            'title': 'Дом у озера',
            'description': 'Тихое место',
            'price': '25000000.00',
            'property_type': 'house',
            'deal_type': 'sale',
            'city': 'Караганда',
            'address': 'ул. Озёрная, 5',
            'area': '120.50',
            'rooms': 4,
        }
        data.update(overrides)
        return data

    def test_anyone_can_read(self):
        self.assertEqual(self.client.get('/api/properties/').status_code, 200)
        self.assertEqual(
            self.client.get(f'/api/properties/{self.prop.id}/').status_code, 200
        )

    def test_guest_cannot_create(self):
        response = self.client.post('/api/properties/', self.payload(), format='json')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_owner_is_taken_from_token_not_from_body(self):
        self.client.force_authenticate(self.owner)

        response = self.client.post(
            '/api/properties/',
            self.payload(owner=self.stranger.id),
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['owner'], self.owner.id)

    def test_owner_can_update(self):
        self.client.force_authenticate(self.owner)

        response = self.client.put(
            f'/api/properties/{self.prop.id}/',
            self.payload(title='Обновлено', status='sold'),
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.prop.refresh_from_db()
        self.assertEqual(self.prop.title, 'Обновлено')
        self.assertEqual(self.prop.status, 'sold')

    def test_stranger_cannot_update(self):
        self.client.force_authenticate(self.stranger)

        response = self.client.put(
            f'/api/properties/{self.prop.id}/', self.payload(), format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_stranger_cannot_delete(self):
        self.client.force_authenticate(self.stranger)

        response = self.client.delete(f'/api/properties/{self.prop.id}/')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(Property.objects.filter(pk=self.prop.pk).exists())

    def test_guest_cannot_delete(self):
        response = self.client.delete(f'/api/properties/{self.prop.id}/')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_owner_can_delete_with_favorites(self):
        Favorite.objects.create(user=self.stranger, property=self.prop)
        self.client.force_authenticate(self.owner)

        response = self.client.delete(f'/api/properties/{self.prop.id}/')

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Property.objects.exists())
        self.assertFalse(Favorite.objects.exists())


class PropertyValidationTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='owner', password='x')
        self.client.force_authenticate(self.user)

    def post(self, **overrides):
        data = {
            'title': 'Квартира',
            'description': 'Описание',
            'price': '1000',
            'property_type': 'apartment',
            'deal_type': 'sale',
            'city': 'Караганда',
            'address': 'ул. Ленина, 1',
            'area': '40',
        }
        data.update(overrides)
        return self.client.post('/api/properties/', data, format='json')

    def test_required_fields(self):
        response = self.client.post(
            '/api/properties/', {'title': 'Без данных'}, format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        for field in ('price', 'city', 'area'):
            self.assertIn(field, response.data)

    def test_rejects_non_positive_price_and_area(self):
        for field, value in (('price', '0'), ('price', '-5'), ('area', '0')):
            with self.subTest(field=field, value=value):
                response = self.post(**{field: value})
                self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
                self.assertIn(field, response.data)

    def test_rejects_zero_rooms_and_floor(self):
        for field in ('rooms', 'floor', 'total_floors'):
            with self.subTest(field=field):
                response = self.post(**{field: 0})
                self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
                self.assertIn(field, response.data)

    def test_floor_cannot_exceed_total_floors(self):
        response = self.post(floor=12, total_floors=9)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('floor', response.data)

    def test_top_floor_is_valid(self):
        response = self.post(floor=9, total_floors=9)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)


@override_settings(MAX_PHOTOS_PER_PROPERTY=3, MAX_PHOTO_SIZE=50 * 1024)
class PhotoTests(TempMediaMixin, APITestCase):
    def setUp(self):
        super().setUp()
        self.owner = User.objects.create_user(username='owner', password='x')
        self.stranger = User.objects.create_user(username='stranger', password='x')
        self.prop = make_property(self.owner)

    def upload(self, image=None):
        return self.client.post(
            f'/api/properties/{self.prop.id}/photos/',
            {'image': image or make_image()},
            format='multipart',
        )

    def test_owner_uploads_photo_with_thumbnail(self):
        self.login(self.owner)

        response = self.upload(make_image(size=(1200, 800)))

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        photo = self.prop.photos.get()
        self.assertTrue(photo.thumbnail)
        with Image.open(photo.thumbnail.path) as thumb:
            self.assertEqual(thumb.width, 480)

    def test_photos_get_increasing_order(self):
        self.login(self.owner)
        self.upload()
        self.upload()

        self.assertEqual(list(self.prop.photos.values_list('order', flat=True)), [0, 1])

    def test_stranger_cannot_upload(self):
        self.login(self.stranger)

        self.assertEqual(self.upload().status_code, status.HTTP_403_FORBIDDEN)

    def test_guest_cannot_upload(self):
        self.assertEqual(self.upload().status_code, status.HTTP_401_UNAUTHORIZED)

    def test_rejects_non_image(self):
        self.login(self.owner)

        response = self.upload(
            SimpleUploadedFile('photo.png', b'not an image', content_type='image/png')
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(Photo.objects.exists())

    def test_rejects_too_large_file(self):
        self.login(self.owner)

        # Random noise does not compress, so the PNG is ~270 KB > 50 KB.
        noise = Image.frombytes('RGB', (300, 300), os.urandom(300 * 300 * 3))
        buffer = io.BytesIO()
        noise.save(buffer, format='PNG')

        response = self.upload(
            SimpleUploadedFile('big.png', buffer.getvalue(), content_type='image/png')
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('image', response.data)

    def test_limits_number_of_photos(self):
        self.login(self.owner)
        for _ in range(3):
            self.upload()

        response = self.upload()

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(self.prop.photos.count(), 3)

    def test_upload_to_missing_property_returns_404(self):
        self.login(self.owner)

        response = self.client.post(
            '/api/properties/999/photos/', {'image': make_image()}, format='multipart'
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_owner_reorders_photos(self):
        self.login(self.owner)
        first = self.upload().data['id']
        second = self.upload().data['id']

        response = self.client.post(
            f'/api/properties/{self.prop.id}/photos/order/',
            {'ids': [second, first]},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            list(self.prop.photos.values_list('id', flat=True)), [second, first]
        )

    def test_reorder_requires_all_photos(self):
        self.login(self.owner)
        first = self.upload().data['id']
        self.upload()

        response = self.client.post(
            f'/api/properties/{self.prop.id}/photos/order/',
            {'ids': [first]},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_stranger_cannot_reorder(self):
        self.login(self.owner)
        photo_id = self.upload().data['id']
        self.login(self.stranger)

        response = self.client.post(
            f'/api/properties/{self.prop.id}/photos/order/',
            {'ids': [photo_id]},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_owner_deletes_photo_and_its_files(self):
        self.login(self.owner)
        self.upload()
        photo = self.prop.photos.get()
        paths = [Path(photo.image.path), Path(photo.thumbnail.path)]

        response = self.client.delete(f'/api/photos/{photo.id}/')

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Photo.objects.exists())
        self.assertFalse(any(path.exists() for path in paths))

    def test_stranger_cannot_delete_photo(self):
        self.login(self.owner)
        self.upload()
        photo = self.prop.photos.get()
        self.login(self.stranger)

        response = self.client.delete(f'/api/photos/{photo.id}/')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_deleting_listing_removes_photo_files(self):
        self.login(self.owner)
        self.upload()
        path = Path(self.prop.photos.get().image.path)

        self.client.delete(f'/api/properties/{self.prop.id}/')

        self.assertFalse(path.exists())


class FavoriteTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='user', password='x')
        self.other = User.objects.create_user(username='other', password='x')
        self.prop = make_property(self.other)

    def test_guest_has_no_favorites_access(self):
        self.assertEqual(
            self.client.get('/api/favorites/').status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_add_and_list_own_favorites(self):
        self.client.force_authenticate(self.user)

        response = self.client.post('/api/favorites/', {'property': self.prop.id})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['user'], self.user.id)

        listing = self.client.get('/api/favorites/')
        self.assertEqual(len(listing.data), 1)
        self.assertEqual(listing.data[0]['property_data']['id'], self.prop.id)

    def test_list_shows_only_own_favorites(self):
        Favorite.objects.create(user=self.other, property=self.prop)
        self.client.force_authenticate(self.user)

        # The old ?user= parameter must not expose someone else's list.
        response = self.client.get(f'/api/favorites/?user={self.other.id}')

        self.assertEqual(response.data, [])

    def test_duplicate_favorite_is_rejected(self):
        Favorite.objects.create(user=self.user, property=self.prop)
        self.client.force_authenticate(self.user)

        response = self.client.post('/api/favorites/', {'property': self.prop.id})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_delete_own_favorite(self):
        favorite = Favorite.objects.create(user=self.user, property=self.prop)
        self.client.force_authenticate(self.user)

        response = self.client.delete(f'/api/favorites/{favorite.id}/')

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Favorite.objects.exists())

    def test_cannot_delete_someone_elses_favorite(self):
        favorite = Favorite.objects.create(user=self.other, property=self.prop)
        self.client.force_authenticate(self.user)

        response = self.client.delete(f'/api/favorites/{favorite.id}/')

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(Favorite.objects.exists())


class UserTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='user', password='x', first_name='Old',
            email='user@example.com', phone='+77001112233',
        )

    def test_public_profile_hides_email(self):
        response = self.client.get(f'/api/users/{self.user.id}/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['phone'], '+77001112233')
        self.assertNotIn('email', response.data)

    def test_public_profile_is_read_only(self):
        self.client.force_authenticate(self.user)

        response = self.client.put(f'/api/users/{self.user.id}/', {'first_name': 'X'})

        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_me_requires_login(self):
        self.assertEqual(
            self.client.get('/api/users/me/').status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_me_shows_email_to_owner(self):
        self.client.force_authenticate(self.user)

        response = self.client.get('/api/users/me/')

        self.assertEqual(response.data['email'], 'user@example.com')

    def test_partial_update_own_profile(self):
        self.client.force_authenticate(self.user)

        response = self.client.put('/api/users/me/', {'phone': '+77005556677'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.phone, '+77005556677')
        self.assertEqual(self.user.first_name, 'Old')

    def test_username_cannot_be_changed(self):
        self.client.force_authenticate(self.user)

        self.client.put('/api/users/me/', {'username': 'hacker'})

        self.user.refresh_from_db()
        self.assertEqual(self.user.username, 'user')


class SeedDemoCommandTests(TempMediaMixin, APITestCase):
    def setUp(self):
        super().setUp()
        buffer = io.BytesIO()
        Image.new('RGB', (4, 4), 'blue').save(buffer, format='JPEG')
        # No network in tests: every "download" returns a tiny JPEG.
        patcher = patch(
            'application.management.commands.seed_demo.Command.fetch_photo',
            return_value=buffer.getvalue(),
        )
        patcher.start()
        self.addCleanup(patcher.stop)

    def run_seed(self, *args):
        call_command('seed_demo', *args, stdout=io.StringIO())

    def test_creates_30_listings_with_photos(self):
        self.run_seed()

        demo = Property.objects.filter(owner__username__startswith='demo_')
        self.assertEqual(demo.count(), 30)
        for kind in ('apartment', 'house', 'commercial'):
            self.assertEqual(demo.filter(property_type=kind).count(), 10)
        self.assertGreaterEqual(len(set(demo.values_list('city', flat=True))), 10)
        self.assertTrue(all(p.photos.count() >= 1 for p in demo))
        self.assertTrue(all(photo.thumbnail for photo in Photo.objects.all()))

    def test_demo_sellers_can_log_in_with_shared_password(self):
        from .management.commands.seed_demo import DEMO_PASSWORD

        self.run_seed()

        response = self.client.post('/api/login/', {
            'username': 'demo_aigerim',
            'password': DEMO_PASSWORD,
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['token'])

    def test_rerun_replaces_demo_data_and_keeps_user_data(self):
        user = User.objects.create_user(username='real', password='x')
        make_property(user)

        self.run_seed()
        self.run_seed()

        self.assertEqual(
            Property.objects.filter(owner__username__startswith='demo_').count(),
            30,
        )
        self.assertEqual(Property.objects.filter(owner=user).count(), 1)

    def test_clear_removes_demo_data(self):
        self.run_seed()
        self.run_seed('--clear')

        self.assertFalse(Property.objects.exists())
        self.assertFalse(User.objects.filter(username__startswith='demo_').exists())
