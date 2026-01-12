import json
import os
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from trinity.models import Team, Calendar
from datetime import datetime, timedelta


class Command(BaseCommand):
    help = 'Injecte les données complètes de présentation (Teams, Users, Calendars)'

    def handle(self, *args, **kwargs):
        User = get_user_model()
        
        # Chemin vers le fichier JSON
        json_file_path = os.path.join(os.path.dirname(__file__), '../../dump/data_for_presentation.json')
        
        self.stdout.write(self.style.WARNING('🔄 Chargement du fichier JSON...'))
        
        try:
            with open(json_file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except FileNotFoundError:
            self.stdout.write(self.style.ERROR(f'❌ Fichier non trouvé: {json_file_path}'))
            return
        
        # Statistiques
        teams_created = 0
        users_created = 0
        calendars_created = 0
        
        # Suppression des anciennes données
        self.stdout.write(self.style.WARNING('🗑️  Suppression des anciennes données...'))
        Calendar.objects.all().delete()
        User.objects.all().delete()
        Team.objects.all().delete()
        
        # Dictionnaire pour stocker les teams créées
        teams_dict = {}
        users_dict = {}
        
        # Traitement des données
        for item in data:
            model_name = item['model']
            pk = item['pk']
            fields = item['fields']
            
            # 1. Créer les Teams
            if model_name == 'trinity.team':
                team = Team.objects.create(
                    id=pk,
                    name=fields['name'],
                    description=fields.get('description', ''),
                    field=fields.get('field', '')
                )
                teams_dict[pk] = team
                teams_created += 1
                self.stdout.write(f'  ✅ Team créée: {team.name}')
            
            # 2. Créer les Users
            elif model_name == 'trinity.user':
                team_id = fields.get('team')
                team = teams_dict.get(team_id) if team_id else None
                
                # Conversion de la date
                arrival_date = None
                if fields.get('arrival_date'):
                    arrival_date = datetime.strptime(fields['arrival_date'], '%Y-%m-%d').date()
                
                birth_date = None
                if fields.get('birth_date'):
                    birth_date = datetime.strptime(fields['birth_date'], '%Y-%m-%d').date()
                
                user = User.objects.create(
                    id=pk,
                    username=fields.get('username', ''),
                    email=fields['email'],
                    password=fields['password'],  # Déjà hashé
                    first_name=fields.get('first_name', ''),
                    last_name=fields.get('last_name', ''),
                    telephone=fields.get('telephone', ''),
                    personal_email=fields.get('personal_email', ''),
                    role=fields.get('role', ''),
                    is_staff=fields.get('is_staff', False),
                    is_superuser=fields.get('is_superuser', False),
                    is_active=fields.get('is_active', True),
                    contract=fields.get('contract', ''),
                    arrival_date=arrival_date,
                    annual_salary=fields.get('annual_salary'),
                    birth_date=birth_date,
                    working_hours=fields.get('working_hours', 35),
                    leaves=fields.get('leaves', 25),
                    social_number=fields.get('social_number'),
                    rib=fields.get('rib', ''),
                    family_situation=fields.get('family_situation', ''),
                    address=fields.get('address', {}),
                    emergency_contact=fields.get('emergency_contact', {}),
                    team=team
                )
                users_dict[pk] = user
                users_created += 1
                
                role_icon = "👑" if user.is_superuser else "👔" if user.is_staff else "👤"
                self.stdout.write(f'  {role_icon} User créé: {user.email} ({user.role})')
            
            # 3. Créer les Calendars
            elif model_name == 'trinity.calendar':
                employee_id = fields['employee']
                employee = users_dict.get(employee_id)
                
                if not employee:
                    self.stdout.write(
                        self.style.WARNING(f'  ⚠️  Employee {employee_id} non trouvé pour Calendar {pk}')
                    )
                    continue
                
                # Conversion des dates
                begin = datetime.fromisoformat(fields['begin'].replace('Z', '+00:00'))
                end = datetime.fromisoformat(fields['end'].replace('Z', '+00:00')) if fields.get('end') else None
                
                # Conversion de la duration
                duration = None
                if fields.get('duration'):
                    hours, minutes, seconds = fields['duration'].split(':')
                    duration = timedelta(hours=int(hours), minutes=int(minutes), seconds=int(seconds))
                
                calendar = Calendar.objects.create(
                    id=pk,
                    begin=begin,
                    end=end,
                    day_type=fields.get('day_type', 'Travail'),
                    employee=employee,
                    day_over=fields.get('day_over', False),
                    duration=duration
                )
                calendars_created += 1
        
        # Résumé final
        self.stdout.write(self.style.SUCCESS('\n' + '='*60))
        self.stdout.write(self.style.SUCCESS('✅ INJECTION TERMINÉE AVEC SUCCÈS !'))
        self.stdout.write(self.style.SUCCESS('='*60))
        self.stdout.write(f'📊 {teams_created} équipes créées')
        self.stdout.write(f'👥 {users_created} utilisateurs créés')
        self.stdout.write(f'📅 {calendars_created} entrées de calendrier créées')
        self.stdout.write(self.style.SUCCESS('='*60))
        
        # Affichage des comptes de test
        self.stdout.write(self.style.WARNING('\n🔐 COMPTES DE TEST DISPONIBLES:'))
        self.stdout.write('  Admin: admin.chief@banque.com')
        self.stdout.write('  Manager: manager.comptes@banque.com')
        self.stdout.write('  Employé: sophie.bernard@banque.com')
        self.stdout.write('  Mot de passe: Houssem123')
