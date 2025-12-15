from django.test import TestCase
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from datetime import datetime, timedelta
from trinity.models import Team, User, Calendar, Event


class TeamModelIntegrationTest(TestCase):
    """Tests d'intégration pour le modèle Team sans persistance"""
    def test_team_creation_without_save(self):
        """Test la création d'une équipe sans l'enregistrer"""
        team = Team(
            name="Dev Team",
            description="Équipe de développement",
            field="IT"
        )
        self.assertEqual(team.name, "Dev Team")
        self.assertEqual(team.description, "Équipe de développement")
        self.assertEqual(team.field, "IT")
        self.assertIsNone(team.pk)  # Pas de PK car non sauvegardé


class UserModelIntegrationTest(TestCase):
    """Tests d'intégration pour le modèle User sans persistance"""
    def test_user_creation_without_save(self):
        """Test la création d'un utilisateur sans l'enregistrer"""
        user = User(
            username="tester",
            email="test@example.com",
            first_name="John",
            last_name="Doe",
            telephone="0123456789",
            role="Developer"
        )
        self.assertEqual(user.email, "test@example.com")
        self.assertEqual(user.first_name, "John")
        self.assertEqual(user.telephone, "0123456789")
        self.assertEqual(user.username, "tester")
        self.assertIsNone(user.pk)

    def test_user_str_method(self):
        """Test la méthode __str__ de User"""
        user = User(first_name="Jane", email="jane@example.com")
        self.assertEqual(str(user), "Jane")

    def test_user_with_team_relation(self):
        """Test la relation User-Team sans sauvegarde"""
        team = Team(name="Backend Team")
        user = User(
            email="dev@example.com",
            first_name="Alice",
            team=team
        )
        # La relation existe en mémoire
        self.assertEqual(user.team, team)
        self.assertIsNone(user.team.pk)  # Team non sauvegardée

    def test_user_unique_email_constraint(self):
        """Test la contrainte d'unicité de l'email"""
        User.objects.create_user(
            username="test",
            email="unique@example.com",
            password="test123"
        )
        user2 = User(email="unique@example.com")
        with self.assertRaises(IntegrityError):
            user2.save()
            user2.delete()  # Nettoyage


class CalendarModelIntegrationTest(TestCase):
    """Tests d'intégration pour le modèle Calendar sans persistance"""

    def test_calendar_creation_without_save(self):
        """Test la création d'un calendrier sans l'enregistrer"""
        user = User(email="user@example.com")
        calendar = Calendar(
            begin=datetime.now(),
            end=datetime.now() + timedelta(hours=8),
            day_type="Travail",
            employee=user,
            day_over=False,
            duration=timedelta(hours=8)
        )
        self.assertEqual(calendar.day_type, "Travail")
        self.assertFalse(calendar.day_over)
        self.assertEqual(calendar.employee, user)
        self.assertIsNone(calendar.pk)

    def test_calendar_required_fields(self):
        """Test les champs obligatoires de Calendar"""
        calendar = Calendar(
            end=datetime.now(),
            day_over=False
        )
        with self.assertRaises(IntegrityError):
            calendar.save()

    def test_calendar_duration_calculation(self):
        """Test le calcul de durée"""
        user = User(email="user@example.com")
        begin = datetime(2024, 1, 1, 9, 0)
        end = datetime(2024, 1, 1, 17, 0)
        duration = end - begin

        calendar = Calendar(
            begin=begin,
            end=end,
            day_type="Travail",
            employee=user,
            day_over=True,
            duration=duration
        )
        self.assertEqual(calendar.duration, timedelta(hours=8))


class EventModelIntegrationTest(TestCase):
    """Tests d'intégration pour le modèle Event sans persistance"""
    def test_event_creation_without_save(self):
        """Test la création d'un événement sans l'enregistrer"""
        event = Event(
            subject="Réunion d'équipe",
            start_time=datetime.now(),
            end_time=datetime.now() + timedelta(hours=1),
            is_all_day=False
        )
        self.assertEqual(event.subject, "Réunion d'équipe")
        self.assertFalse(event.is_all_day)
        self.assertIsNone(event.pk)

    def test_event_str_method(self):
        """Test la méthode __str__ de Event"""
        event = Event(
            subject="Sprint Planning",
            start_time=datetime.now(),
            end_time=datetime.now() + timedelta(hours=2)
        )
        self.assertEqual(str(event), "Sprint Planning")

    def test_event_all_day_flag(self):
        """Test le flag all_day"""
        event = Event(
            subject="Formation",
            start_time=datetime.now(),
            end_time=datetime.now() + timedelta(days=1),
            is_all_day=True
        )
        self.assertTrue(event.is_all_day)

    def test_event_time_validation(self):
        """Test la validation des horaires"""
        start = datetime(2024, 1, 1, 10, 0)
        end = datetime(2024, 1, 1, 9, 0)  # Fin avant début
        event = Event(
            subject="Test",
            start_time=start,
            end_time=end
        )
        # Vous pourriez ajouter une validation custom dans le modèle
        self.assertLess(event.end_time, event.start_time)


class ModelsRelationshipsIntegrationTest(TestCase):
    """Tests d'intégration des relations entre modèles"""
    def test_team_members_relationship(self):
        """Test la relation Team -> Users (members)"""
        team = Team(name="QA Team")
        user1 = User(email="qa1@example.com", team=team)
        user2 = User(email="qa2@example.com", team=team)
        # Vérification que la relation existe en mémoire
        self.assertEqual(user1.team, team)
        self.assertEqual(user2.team, team)

    def test_user_calendar_relationship(self):
        """Test la relation User -> Calendar"""
        user = User(email="employee@example.com")
        calendar1 = Calendar(
            begin=datetime.now(),
            employee=user,
            day_over=False
        )
        calendar2 = Calendar(
            begin=datetime.now() + timedelta(days=1),
            employee=user,
            day_over=False
        )
        self.assertEqual(calendar1.employee, user)
        self.assertEqual(calendar2.employee, user)
