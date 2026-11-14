import io
from pathlib import Path

from django.core.files.base import ContentFile
from PIL import Image, ImageOps

THUMBNAIL_WIDTH = 480


def build_thumbnail(image_file):
    """Return a JPEG thumbnail of `image_file` as a ContentFile, or None."""
    # Close the file only if we opened it: an upload that is still being
    # saved must stay open. A file left open cannot be deleted on Windows.
    was_closed = image_file.closed
    try:
        image_file.open('rb')
        image_file.seek(0)
        with Image.open(image_file) as source:
            image = ImageOps.exif_transpose(source).convert('RGB')
    except (OSError, ValueError):
        return None
    finally:
        if was_closed:
            image_file.close()
        else:
            image_file.seek(0)

    if image.width > THUMBNAIL_WIDTH:
        height = round(image.height * THUMBNAIL_WIDTH / image.width)
        image = image.resize((THUMBNAIL_WIDTH, height), Image.LANCZOS)

    buffer = io.BytesIO()
    image.save(buffer, format='JPEG', quality=80, optimize=True)

    name = f'{Path(image_file.name).stem}_thumb.jpg'
    return ContentFile(buffer.getvalue(), name=name)
