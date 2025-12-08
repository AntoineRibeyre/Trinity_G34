from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model


class Command(BaseCommand):
    help = 'Crée des utilisateurs de test'

    def handle(self, *args, **kwargs):
        User = get_user_model()

        # Supprime les anciens utilisateurs de test si besoin
        User.objects.filter(username__startswith='admin').delete()
        User.objects.filter(username__startswith='manager').delete()
        User.objects.filter(username__startswith='employe').delete()

        # 1 Admin
        User.objects.create_user(
            username='admin1',
            password='admin',
            first_name='Admin',
            last_name='Principal',
            email='admin1@test.com',
            telephone='0601010101',
            role='admin'
        )

        # 5 Managers
        for i in range(1, 6):
            User.objects.create_user(
                username=f'manager{i}',
                password='admin',
                first_name='Manager',
                last_name=f'Number{i}',
                email=f'manager{i}@test.com',
                telephone=f'060202020{i}',
                role='manager'
            )

        # 15 Employés
        for i in range(1, 16):
            User.objects.create_user(
                username=f'employe{i}',
                password='admin',
                first_name='Employe',
                last_name=f'Number{i}',
                email=f'employe{i}@test.com',
                telephone=f'060303030{i}',
                role='employe'
            )

        self.stdout.write(self.style.SUCCESS('✅ 21 utilisateurs créés!'))


