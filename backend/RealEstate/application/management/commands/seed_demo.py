"""
Fill the database with 30 demo listings (10 apartments, 10 houses,
10 commercial premises) in different cities of Kazakhstan, with photos.

Photos are free Unsplash images (https://unsplash.com/license). They are
downloaded once into MEDIA_ROOT/demo_cache and reused on later runs.

Usage:
    python manage.py seed_demo            # create or recreate demo data
    python manage.py seed_demo --clear    # only remove demo data

All demo sellers (demo_aigerim, demo_daniyar, demo_elena, demo_nurlan,
demo_realty) can log in with DEMO_PASSWORD below.
"""

import urllib.request
from datetime import timedelta
from decimal import Decimal
from pathlib import Path

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from application.models import Photo, Property, User

UNSPLASH_URL = (
    'https://images.unsplash.com/{id}?w=1280&q=75&fm=jpg&fit=crop'
)

DEMO_PREFIX = 'demo_'

# Shared password of all demo sellers, so the demo can show owner-only
# actions. It is public (it is in the repository): demo accounts only.
DEMO_PASSWORD = 'demo12345'

SELLERS = [
    ('demo_aigerim', 'Айгерим', 'Сапарова', '+7 701 214 55 18'),
    ('demo_daniyar', 'Данияр', 'Ахметов', '+7 707 390 12 64'),
    ('demo_elena', 'Елена', 'Ковальчук', '+7 777 518 40 92'),
    ('demo_nurlan', 'Нурлан', 'Бекенов', '+7 702 655 73 01'),
    ('demo_realty', 'Агентство', '«Ключ»', '+7 727 300 25 25'),
]

# (title, description, price, deal, city, address, area, rooms,
#  floor, total_floors, photo ids)
APARTMENTS = [
    ('Двухкомнатная с видом на горы',
     'Светлая квартира в новом доме. Окна на юг, из гостиной видны горы. '
     'Кухня-гостиная, раздельный санузел, подземный паркинг.',
     '58500000', 'sale', 'Алматы', 'пр. Аль-Фараби, 77/8', '64.5', 2, 11, 16,
     ['photo-1522708323590-d24dbb6b0267', 'photo-1484154218962-a197022b5858']),
    ('Однушка рядом с метро',
     'Пять минут пешком до станции «Абая». Свежий косметический ремонт, '
     'встроенная кухня, стиральная машина. Для одного или пары.',
     '230000', 'rent', 'Алматы', 'ул. Розыбакиева, 125', '38', 1, 4, 9,
     ['photo-1502672260266-1c1ef2d93688', 'photo-1612320648993-61c1cd604b71']),
    ('Трёхкомнатная в ЖК у набережной',
     'Большая квартира для семьи: три изолированные комнаты, две ванные, '
     'гардеробная. Во дворе детская площадка, рядом школа и парк.',
     '72000000', 'sale', 'Астана', 'пр. Мангилик Ел, 31', '96.2', 3, 7, 12,
     ['photo-1757524503555-b62633f47670', 'photo-1702014862053-946a122b920d']),
    ('Студия на последнем этаже',
     'Высокие потолки, панорамные окна, тихий двор. Мебель и техника '
     'остаются. Коммунальные платежи включены в цену.',
     '180000', 'rent', 'Астана', 'ул. Кенесары, 52', '31', 1, 25, 25,
     ['photo-1583847268964-b28dc8f51f92', 'photo-1560448204-e02f11c3d0e2']),
    ('Двушка в кирпичном доме',
     'Тёплый кирпичный дом, второй этаж. Комнаты раздельные, балкон '
     'застеклён. Рядом рынок «Таугуль» и остановки.',
     '24500000', 'sale', 'Шымкент', 'пр. Тауке хана, 18', '52', 2, 2, 5,
     ['photo-1773578978637-c9771e7a9913', 'photo-1586023492125-27b2c045efd7']),
    ('Квартира в центре у парка',
     'Ремонт 2025 года, новая проводка и сантехника. Окна во двор, '
     'до Центрального парка три минуты пешком.',
     '27800000', 'sale', 'Караганда', 'пр. Бухар-Жырау, 47', '58.4', 2, 3, 9,
     ['photo-1564078516393-cf04bd966897', 'photo-1759691555393-60cd5355d840']),
    ('Трёшка для большой семьи',
     'Три комнаты, большая кухня, кладовая. Дом после капремонта, '
     'новый лифт. Рядом школа и детский сад.',
     '31000000', 'sale', 'Павлодар', 'ул. Торайгырова, 64', '74', 3, 6, 9,
     ['photo-1628592102751-ba83b0314276', 'photo-1763827513396-5917fc6c84f3']),
    ('Однокомнатная с ремонтом',
     'Сдаётся на длительный срок. Есть всё для жизни: кровать, диван, '
     'холодильник, интернет. Без животных.',
     '150000', 'rent', 'Усть-Каменогорск', 'ул. Казахстан, 98', '36.5', 1, 1, 5,
     ['photo-1613575831056-0acd5da8f085', 'photo-1512918728675-ed5a9ecdebfd']),
    ('Квартира с видом на Урал',
     'Новый дом на набережной. Кухня-гостиная с выходом на лоджию, '
     'спальня, кабинет. Закрытый двор с охраной.',
     '420000', 'rent', 'Атырау', 'пр. Азаттык, 112', '82', 2, 14, 16,
     ['photo-1774311237295-a65a4c1ff38a', 'photo-1585128792020-803d29415281']),
    ('Двухкомнатная у моря',
     'До пляжа десять минут. Квартира после ремонта, кондиционеры в обеих '
     'комнатах, кухня с техникой.',
     '29500000', 'sale', 'Актау', '14-й мкр., дом 41', '61', 2, 5, 10,
     ['photo-1665249934445-1de680641f50', 'photo-1493809842364-78817add7ffb']),
]

HOUSES = [
    ('Дом с садом в предгорьях',
     'Двухэтажный дом на участке 8 соток. Фруктовый сад, гараж на две '
     'машины, газ и центральная вода. Тихая улица.',
     '145000000', 'sale', 'Алматы', 'мкр. Каменское плато, ул. Садовая, 14',
     '210', 5, None, 2,
     ['photo-1570129477492-45c003edd2be', 'photo-1600596542815-ffad4c1539a9']),
    ('Коттедж в пригороде',
     'Современный коттедж в посёлке с охраной. Тёплые полы, камин, '
     'летняя терраса. До центра города 20 минут.',
     '98000000', 'sale', 'Астана', 'пос. Косшы, ул. Республики, 8',
     '165', 4, None, 2,
     ['photo-1781797221329-c3d083ab6d99', 'photo-1598228723793-52759bba239c']),
    ('Одноэтажный дом с участком',
     'Кирпичный дом, участок 10 соток с теплицей. Баня, летняя кухня, '
     'скважина. Рядом остановка автобуса.',
     '36000000', 'sale', 'Караганда', 'ул. Шахтёров, 23',
     '112', 3, None, 1,
     ['photo-1580587771525-78b9dba3b914', 'photo-1787094497609-5efe6029b950']),
    ('Дом для большой семьи',
     'Шесть комнат, два санузла, просторная кухня. Двор с беседкой '
     'и детской площадкой. Документы готовы.',
     '64000000', 'sale', 'Шымкент', 'ул. Байтурсынова, 71',
     '240', 6, None, 2,
     ['photo-1568605114967-8130f3a36994', 'photo-1583608205776-bfd35f0d9f83']),
    ('Дом в аренду на длительный срок',
     'Меблированный дом с гаражом. Подходит для семьи с детьми. '
     'Коммунальные платежи оплачиваются отдельно.',
     '450000', 'rent', 'Актобе', 'ул. Абилкайыр хана, 140',
     '130', 4, None, 1,
     ['photo-1777428762767-e3a797da389a', 'photo-1523217582562-09d0def993a6']),
    ('Новый дом у реки',
     'Построен в 2024 году. Панорамные окна, второй свет в гостиной, '
     'до берега Иртыша пять минут пешком.',
     '78500000', 'sale', 'Павлодар', 'ул. Береговая, 5',
     '180', 4, None, 2,
     ['photo-1628624747186-a941c476b7ef', 'photo-1786550860372-116b871a1697']),
    ('Дом с бассейном',
     'Просторный дом с открытым бассейном и зоной барбекю. Сдаётся '
     'с мебелью, можно с июня.',
     '1200000', 'rent', 'Алматы', 'ул. Аль-Фараби, 205',
     '280', 5, None, 2,
     ['photo-1512917774080-9991f1c4c750', 'photo-1564013799919-ab600027ffc6']),
    ('Уютный дом на окраине',
     'Деревянный дом с утеплением, печь и газовый котёл. Участок '
     '6 соток, огород, сарай.',
     '18500000', 'sale', 'Костанай', 'ул. Пушкина, 112',
     '84', 3, None, 1,
     ['photo-1605276374104-dee2a0ed3cd6', 'photo-1758158452965-ef267a639880']),
    ('Двухэтажный дом в центре',
     'Кирпичный дом рядом с центральной площадью. Отдельный вход на '
     'второй этаж, можно жить двумя семьями.',
     '52000000', 'sale', 'Тараз', 'ул. Толе би, 36',
     '196', 5, None, 2,
     ['photo-1592595896616-c37162298647', 'photo-1605146769289-440113cc3d00']),
    ('Дом с гаражом и мастерской',
     'Крепкий дом с большим гаражом и мастерской. Центральное отопление, '
     'новая крыша, пластиковые окна.',
     '29000000', 'sale', 'Семей', 'ул. Шакарима, 154',
     '120', 4, None, 1,
     ['photo-1494526585095-c41746248156', 'photo-1584738766473-61c083514bf4']),
]

COMMERCIAL = [
    ('Офис в бизнес-центре класса А',
     'Открытая планировка, две переговорные, кухня. Охрана, парковка '
     'для сотрудников, вид на город.',
     '1800000', 'rent', 'Алматы', 'пр. Достык, 210', '185', None, 12, 18,
     ['photo-1497366811353-6870744d04b2', 'photo-1780639681568-0e71735c3d27']),
    ('Помещение под магазин у остановки',
     'Первый этаж, отдельный вход с улицы, витринные окна. Большой '
     'поток людей весь день.',
     '650000', 'rent', 'Астана', 'пр. Туран, 34', '96', None, 1, 9,
     ['photo-1771033834141-023d630b3965', 'photo-1784790435603-58b273bd7803']),
    ('Офис с ремонтом в центре',
     'Пять кабинетов, приёмная, санузел. Готов к работе, мебель можно '
     'оставить. Рядом акимат.',
     '84000000', 'sale', 'Караганда', 'ул. Ерубаева, 35', '140', None, 3, 5,
     ['photo-1763306934305-39de4bbf19d9', 'photo-1497366754035-f200968a6e72']),
    ('Торговое помещение в ТЦ',
     'Островная зона на втором этаже торгового центра. Высокая '
     'проходимость, все коммуникации.',
     '420000', 'rent', 'Шымкент', 'пр. Республики, 2', '48', None, 2, 3,
     ['photo-1777628530456-bb93d3a03faf', 'photo-1766934587214-86e21b3ae093']),
    ('Коворкинг под ключ',
     'Действующий коворкинг на 40 мест: столы, переговорные, лаунж-зона. '
     'Продаётся вместе с мебелью.',
     '120000000', 'sale', 'Алматы', 'ул. Толе би, 59', '320', None, 2, 6,
     ['photo-1768836180167-6d4a25c421b2', 'photo-1604328698692-f76ea9498e76']),
    ('Шоурум с высокими потолками',
     'Потолки 5 метров, панорамное остекление, отдельный вход. Подойдёт '
     'для салона мебели или автосалона.',
     '1100000', 'rent', 'Астана', 'ул. Сыганак, 18', '260', None, 1, 2,
     ['photo-1785741393025-d6b6ba1d1eee', 'photo-1759050486852-fdfe2fdc7bea']),
    ('Офисный этаж',
     'Целый этаж в бизнес-центре: 12 кабинетов, open space, '
     'серверная. Возможна аренда частями.',
     '2400000', 'rent', 'Атырау', 'ул. Сатпаева, 19', '410', None, 6, 10,
     ['photo-1549637642-90187f64f420', 'photo-1579487785973-74d2ca7abdd5']),
    ('Помещение свободного назначения',
     'Чистовая отделка, бетонные стены в стиле лофт. Подойдёт под кафе, '
     'студию или магазин.',
     '46000000', 'sale', 'Актобе', 'пр. Абилкайыр хана, 52', '115', None, 1, 5,
     ['photo-1783987597078-84d5ac51d518', 'photo-1783700085825-1df197a49f40']),
    ('Бутик в историческом центре',
     'Помещение с витриной и отдельным входом. Сделан ремонт, '
     'установлены стеллажи и освещение.',
     '380000', 'rent', 'Петропавловск', 'ул. Конституции Казахстана, 23',
     '64', None, 1, 3,
     ['photo-1764795850238-7a024db5e3ee', 'photo-1777136977034-71cbc026c9b1']),
    ('Офис рядом с вокзалом',
     'Три кабинета и приёмная, свежий ремонт, кондиционеры. '
     'Собственная парковка на 4 машины.',
     '39000000', 'sale', 'Уральск', 'ул. Есенжанова, 42', '88', None, 2, 4,
     ['photo-1783581040348-2bfff0b1559d', 'photo-1780639681636-d5e1878d567e']),
]


class Command(BaseCommand):
    help = 'Create 30 demo listings with photos (free Unsplash images).'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Only remove previously created demo data.',
        )

    def handle(self, *args, **options):
        self.cache_dir = Path(settings.MEDIA_ROOT) / 'demo_cache'
        self.cache_dir.mkdir(parents=True, exist_ok=True)

        removed = self.clear()
        self.stdout.write(f'Removed {removed} old demo listings.')

        if options['clear']:
            User.objects.filter(username__startswith=DEMO_PREFIX).delete()
            return

        # Download first, so a network error leaves the database untouched.
        groups = [
            ('apartment', APARTMENTS),
            ('house', HOUSES),
            ('commercial', COMMERCIAL),
        ]
        for _, items in groups:
            for item in items:
                for photo_id in item[-1]:
                    self.fetch_photo(photo_id)

        with transaction.atomic():
            sellers = self.create_sellers()
            now = timezone.now()
            index = 0

            for property_type, items in groups:
                for (title, description, price, deal, city, address, area,
                     rooms, floor, total_floors, photo_ids) in items:
                    prop = Property.objects.create(
                        owner=sellers[index % len(sellers)],
                        title=title,
                        description=description,
                        price=Decimal(price),
                        property_type=property_type,
                        deal_type=deal,
                        city=city,
                        address=address,
                        area=Decimal(area),
                        rooms=rooms,
                        floor=floor,
                        total_floors=total_floors,
                    )

                    for order, photo_id in enumerate(photo_ids):
                        photo = Photo(property=prop, order=order)
                        photo.image.save(
                            f'{photo_id}.jpg',
                            ContentFile(self.fetch_photo(photo_id)),
                            save=True,
                        )

                    # Spread publication dates over the last weeks so
                    # sorting by date shows a mix of types.
                    Property.objects.filter(pk=prop.pk).update(
                        created_at=now - timedelta(hours=(index * 37) % 900)
                    )
                    index += 1

        self.stdout.write(self.style.SUCCESS(
            f'Created {index} demo listings for {len(sellers)} sellers.'
        ))

    def clear(self):
        demo = Property.objects.filter(owner__username__startswith=DEMO_PREFIX)
        count = demo.count()
        # Photo files are removed by the post_delete signal.
        demo.delete()
        return count

    def create_sellers(self):
        sellers = []
        for username, first_name, last_name, phone in SELLERS:
            user, _ = User.objects.get_or_create(username=username)
            user.first_name = first_name
            user.last_name = last_name
            user.phone = phone
            user.email = f'{username}@example.com'
            user.set_password(DEMO_PASSWORD)
            user.save()
            sellers.append(user)
        return sellers

    def fetch_photo(self, photo_id):
        path = self.cache_dir / f'{photo_id}.jpg'

        if not path.exists():
            self.stdout.write(f'Downloading {photo_id}...')
            request = urllib.request.Request(
                UNSPLASH_URL.format(id=photo_id),
                headers={'User-Agent': 'kursa4-seed/1.0'},
            )
            with urllib.request.urlopen(request, timeout=30) as response:
                path.write_bytes(response.read())

        return path.read_bytes()
