from datetime import datetime, timedelta
from unittest.mock import Mock, patch
from zoneinfo import ZoneInfo

from django.test import TestCase

from trinity.logic.calendarfactory import CalendarFactory, CalendarQueryOutput, DailyPlanning
from trinity.models import Calendar, User


class CalendarQueryOutputTestCase(TestCase):
    """Tests unitaires pour CalendarQueryOutput"""

    def test_calendar_query_output_with_duration(self):
        """Test de création d'un CalendarQueryOutput avec durée"""
        test_datetime = datetime(2024, 12, 8, 14, 30, 45)
        test_duration = timedelta(hours=8, minutes=30, seconds=15)
        result = CalendarQueryOutput(test_datetime, test_duration)
        # Vérifier les données de date/heure
        self.assertEqual(result.date_time_data['year'], 2024)
        self.assertEqual(result.date_time_data['month'], 12)
        self.assertEqual(result.date_time_data['day'], 8)
        self.assertEqual(result.date_time_data['hour'], 14)
        self.assertEqual(result.date_time_data['minute'], 30)
        self.assertEqual(result.date_time_data['second'], 45)
        # Vérifier les données de durée
        self.assertIsNotNone(result.duree_data)
        self.assertEqual(result.duree_data['hours'], 8)
        self.assertEqual(result.duree_data['minutes'], 30)
        self.assertEqual(result.duree_data['seconds'], 15)

    def test_calendar_query_output_without_duration(self):
        """Test de création d'un CalendarQueryOutput sans durée"""
        test_datetime = datetime(2024, 12, 8, 9, 0, 0)
        result = CalendarQueryOutput(test_datetime, None)
        self.assertIsNotNone(result.date_time_data)
        self.assertIsNone(result.duree_data)


class DailyPlanningTestCase(TestCase):
    """Tests unitaires pour DailyPlanning"""

    def setUp(self):
        """Configuration initiale"""
        self.mock_calendar1 = Mock(spec=Calendar)
        self.mock_calendar1.duration = timedelta(hours=4)
        self.mock_calendar2 = Mock(spec=Calendar)
        self.mock_calendar2.duration = timedelta(hours=4, minutes=30)

    def test_add_calendar(self):
        """Test d'ajout d'un calendrier à la planification"""
        planning = DailyPlanning(
            date="2024-12-08",
            calendars=[],
            total_hours=timedelta(0)
        )
        planning.add_calendar(self.mock_calendar1)
        self.assertEqual(len(planning.calendars), 1)
        self.assertEqual(planning.calendars[0], self.mock_calendar1)

    def test_update_total_hours_with_duration(self):
        """Test de mise à jour des heures totales avec durée"""
        planning = DailyPlanning(
            date="2024-12-08",
            calendars=[],
            total_hours=timedelta(hours=4)
        )
        planning.upadate_total_hours(timedelta(hours=4, minutes=30))
        expected_total = timedelta(hours=8, minutes=30)
        self.assertEqual(planning.total_hours, expected_total)

    def test_update_total_hours_with_none(self):
        """Test de mise à jour des heures totales avec None"""
        initial_duration = timedelta(hours=4)
        planning = DailyPlanning(
            date="2024-12-08",
            calendars=[],
            total_hours=initial_duration
        )
        planning.upadate_total_hours(None)
        # La durée ne doit pas changer
        self.assertEqual(planning.total_hours, initial_duration)


class CalendarFactoryTestCase(TestCase):
    """Tests unitaires pour CalendarFactory"""

    def setUp(self):
        """Configuration initiale pour chaque test"""
        self.mock_user = Mock(spec=User)
        self.mock_user.id = 1
        self.mock_user.email = "test@example.com"
        self.mock_user.first_name = "John"
        self.mock_calendar = Mock(spec=Calendar)
        self.mock_calendar.id = 1
        self.mock_calendar.begin = datetime(2024, 12, 8, 9, 0, 0, tzinfo=ZoneInfo("Europe/Paris"))
        self.mock_calendar.end = None
        self.mock_calendar.duration = None
        self.mock_calendar.day_over = False
        self.mock_calendar.employee = self.mock_user

    @patch('trinity.logic.calendarfactory.Calendar.objects.create')
    @patch('trinity.logic.calendarfactory.User.objects.get')
    @patch('trinity.logic.calendarfactory.datetime')
    def test_create_calendar(self, mock_datetime, mock_user_get, mock_calendar_create):
        """Test de création d'un calendrier"""
        # Configuration des mocks
        test_time = datetime(2024, 12, 8, 9, 0, 0, tzinfo=ZoneInfo("Europe/Paris"))
        mock_datetime.datetime.now.return_value = test_time
        mock_user_get.return_value = self.mock_user
        self.mock_calendar.begin = test_time
        mock_calendar_create.return_value = self.mock_calendar
        # Exécution
        result = CalendarFactory.create_calendar(1)
        # Vérifications
        mock_user_get.assert_called_once_with(pk=1)
        mock_calendar_create.assert_called_once()
        self.assertIsInstance(result, CalendarQueryOutput)
        self.assertIsNotNone(result.date_time_data)
        self.assertIsNone(result.duree_data)

    @patch('trinity.logic.calendarfactory.User.objects.get')
    def test_create_calendar_user_not_found(self, mock_user_get):
        """Test de création de calendrier avec utilisateur inexistant"""
        mock_user_get.side_effect = User.DoesNotExist
        with self.assertRaises(Exception) as context:
            CalendarFactory.create_calendar(999)
        self.assertEqual(str(context.exception), "Employee not found!")

    @patch('trinity.logic.calendarfactory.Calendar.objects.filter')
    @patch('trinity.logic.calendarfactory.User.objects.get')
    @patch('trinity.logic.calendarfactory.datetime')
    def test_close_calendar(self, mock_datetime, mock_user_get, mock_calendar_filter):
        """Test de fermeture d'un calendrier"""
        # Configuration
        begin_time = datetime(2024, 12, 8, 9, 0, 0, tzinfo=ZoneInfo("Europe/Paris"))
        end_time = datetime(2024, 12, 8, 17, 30, 0, tzinfo=ZoneInfo("Europe/Paris"))
        self.mock_calendar.begin = begin_time
        self.mock_calendar.day_over = False
        mock_datetime.datetime.now.return_value = end_time
        mock_user_get.return_value = self.mock_user
        mock_queryset = Mock()
        mock_queryset.last.return_value = self.mock_calendar
        mock_calendar_filter.return_value = mock_queryset
        # Exécution
        result = CalendarFactory.close_calendar(1)
        # Vérifications
        mock_user_get.assert_called_once_with(pk=1)
        self.assertTrue(self.mock_calendar.day_over)
        self.mock_calendar.save_base.assert_called_once()
        self.assertIsInstance(result, CalendarQueryOutput)

    @patch('trinity.logic.calendarfactory.Calendar.objects.filter')
    @patch('trinity.logic.calendarfactory.User.objects.get')
    def test_close_calendar_already_closed(self, mock_user_get, mock_calendar_filter):
        """Test de fermeture d'un calendrier déjà fermé"""
        # Configuration
        self.mock_calendar.day_over = True
        mock_user_get.return_value = self.mock_user
        mock_queryset = Mock()
        mock_queryset.last.return_value = self.mock_calendar
        mock_calendar_filter.return_value = mock_queryset
        # Vérification
        with self.assertRaises(Exception) as context:
            CalendarFactory.close_calendar(1)
        self.assertEqual(str(context.exception), "Day over")

    @patch('trinity.logic.calendarfactory.CalendarFactory.create_calendar')
    def test_register_arrival(self, mock_create):
        """Test d'enregistrement d'arrivée"""
        mock_output = Mock(spec=CalendarQueryOutput)
        mock_create.return_value = mock_output
        result = CalendarFactory.register_arrival(1)
        mock_create.assert_called_once_with(1)
        self.assertEqual(result, mock_output)

    @patch('trinity.logic.calendarfactory.CalendarFactory.close_calendar')
    def test_register_out(self, mock_close):
        """Test d'enregistrement de sortie"""
        mock_output = Mock(spec=CalendarQueryOutput)
        mock_close.return_value = mock_output
        result = CalendarFactory.register_out(1)
        mock_close.assert_called_once_with(1)
        self.assertEqual(result, mock_output)

    @patch('trinity.logic.calendarfactory.Calendar.objects.filter')
    def test_get_calendars_by_user(self, mock_filter):
        """Test de récupération des calendriers par utilisateur"""
        mock_calendar2 = Mock(spec=Calendar)
        mock_calendar2.id = 2
        mock_queryset = Mock()
        mock_queryset.all.return_value = [self.mock_calendar, mock_calendar2]
        mock_filter.return_value = mock_queryset
        result = CalendarFactory.get_calendars_by_user(self.mock_user)
        mock_filter.assert_called_once_with(employee=self.mock_user)
        self.assertEqual(len(result), 2)

    @patch('trinity.logic.calendarfactory.CalendarFactory.get_calendars_by_user')
    def test_get_sorted_planning_single_day(self, mock_get_calendars):
        """Test de tri des plannings pour un seul jour"""
        # Configuration
        calendar1 = Mock(spec=Calendar)
        calendar1.begin = datetime(2024, 12, 8, 9, 0, 0, tzinfo=ZoneInfo("Europe/Paris"))
        calendar1.duration = timedelta(hours=4)
        calendar2 = Mock(spec=Calendar)
        calendar2.begin = datetime(2024, 12, 8, 14, 0, 0, tzinfo=ZoneInfo("Europe/Paris"))
        calendar2.duration = timedelta(hours=4)
        mock_get_calendars.return_value = [calendar1, calendar2]
        # Exécution
        result = CalendarFactory.get_sorted_planning(self.mock_user)
        # Vérifications
        self.assertEqual(len(result), 1)
        self.assertIn("2024-12-08", result)
        daily_planning = result["2024-12-08"]
        self.assertEqual(len(daily_planning.calendars), 2)

    @patch('trinity.logic.calendarfactory.CalendarFactory.get_calendars_by_user')
    def test_get_sorted_planning_multiple_days(self, mock_get_calendars):
        """Test de tri des plannings pour plusieurs jours"""
        # Configuration
        calendar1 = Mock(spec=Calendar)
        calendar1.begin = datetime(2024, 12, 8, 9, 0, 0, tzinfo=ZoneInfo("Europe/Paris"))
        calendar1.duration = timedelta(hours=8)
        calendar2 = Mock(spec=Calendar)
        calendar2.begin = datetime(2024, 12, 9, 9, 0, 0, tzinfo=ZoneInfo("Europe/Paris"))
        calendar2.duration = timedelta(hours=7, minutes=30)
        mock_get_calendars.return_value = [calendar1, calendar2]
        # Exécution
        result = CalendarFactory.get_sorted_planning(self.mock_user)
        # Vérifications
        self.assertEqual(len(result), 2)
        self.assertIn("2024-12-08", result)
        self.assertIn("2024-12-09", result)

    @patch('trinity.logic.calendarfactory.CalendarFactory.get_calendars_by_user')
    def test_get_sorted_planning_with_none_duration(self, mock_get_calendars):
        """Test de tri avec durée None (jour en cours)"""
        # Configuration
        calendar1 = Mock(spec=Calendar)
        calendar1.begin = datetime(2024, 12, 8, 9, 0, 0, tzinfo=ZoneInfo("Europe/Paris"))
        calendar1.duration = None
        mock_get_calendars.return_value = [calendar1]
        # Exécution
        result = CalendarFactory.get_sorted_planning(self.mock_user)
        # Vérifications
        self.assertEqual(len(result), 1)
        daily_planning = result["2024-12-08"]
        self.assertEqual(len(daily_planning.calendars), 1)
