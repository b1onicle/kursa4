from django.apps import AppConfig
from django.db.backends.signals import connection_created
from django.db.models.signals import post_delete


def _register_unicode_lower(sender, connection, **kwargs):
    # SQLite's built-in LOWER() only handles ASCII, so Cyrillic search
    # would be case-sensitive. Override it with Python's str.lower().
    if connection.vendor == 'sqlite':
        connection.connection.create_function(
            'LOWER',
            1,
            lambda value: value.lower() if isinstance(value, str) else value,
            deterministic=True,
        )


def _delete_photo_files(sender, instance, **kwargs):
    # Also fires for photos removed by cascade when a listing is deleted.
    instance.delete_files()


class ApplicationConfig(AppConfig):
    name = 'application'

    def ready(self):
        connection_created.connect(_register_unicode_lower)

        from .models import Photo
        post_delete.connect(
            _delete_photo_files,
            sender=Photo,
            dispatch_uid='delete_photo_files',
        )
