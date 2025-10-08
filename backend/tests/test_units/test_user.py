from django.test import TestCase
from unittest.mock import Mock, patch
from trinity.models import User, Team
from trinity.logic.userfactory import UserFactory, UserViewer
from trinity.logic.calendarfactory import DailyPlanning


class UserFactoryTestCase(TestCase):
    """Tests unitaires pour UserFactory avec mocks"""

    def setUp(self):
        """Configuration initiale pour chaque test"""
        self.mock_user = Mock(spec=User)
        self.mock_user.id = 1
        self.mock_user.email = "user@test.com"
        self.mock_user.first_name = "John"
        self.mock_user.last_name = "Doe"
        self.mock_user.role = "employee"
        self.mock_user.telephone = "0123456789"
        self.mock_team = Mock(spec=Team)
        self.mock_team.id = 1
        self.mock_team.name = "Dev Team"
        self.mock_team.field = "IT"

    @patch('trinity.logic.userfactory.User.objects.get')
    def test_get_user_by_id_success(self, mock_get):
        """Test de récupération d'un utilisateur par ID"""
        mock_get.return_value = self.mock_user
        result = UserFactory.get_user_by_id(1)
        mock_get.assert_called_once_with(id=1)
        self.assertEqual(result, self.mock_user)

    @patch('trinity.logic.userfactory.User.objects.get')
    def test_get_user_by_id_not_found(self, mock_get):
        """Test de récupération d'un utilisateur inexistant"""
        mock_get.side_effect = User.DoesNotExist
        with self.assertRaises(Exception) as context:
            UserFactory.get_user_by_id(999)
        self.assertIn("User does not exist", str(context.exception))

    @patch('trinity.logic.userfactory.User.objects.get')
    def test_get_user_by_id_multiple_found(self, mock_get):
        """Test avec plusieurs utilisateurs trouvés"""
        mock_get.side_effect = User.MultipleObjectsReturned
        with self.assertRaises(Exception) as context:
            UserFactory.get_user_by_id(1)
        self.assertIn("error in the", str(context.exception))

    @patch('trinity.logic.userfactory.Team.objects.get')
    @patch('trinity.logic.userfactory.User.objects.create_user')
    def test_create_new_user_with_team(self, mock_create_user, mock_get_team):
        """Test de création d'un utilisateur avec équipe"""
        mock_user = Mock(spec=User)
        mock_create_user.return_value = mock_user
        mock_get_team.return_value = self.mock_team
        result = UserFactory.create_new_user(
            first_name="John",
            username="johndoe",
            last_name="Doe",
            email="john@test.com",
            telephone="0123456789",
            team_id=1,
            password="securepass",
            role="employee"
        )
        mock_create_user.assert_called_once()
        mock_get_team.assert_called_once_with(id=1)
        mock_user.save.assert_called_once()

    @patch('trinity.logic.userfactory.User.objects.create_user')
    def test_create_new_user_without_team(self, mock_create_user):
        """Test de création d'un utilisateur sans équipe"""
        mock_user = Mock(spec=User)
        mock_create_user.return_value = mock_user
        UserFactory.create_new_user(
            first_name="Jane",
            username="janedoe",
            last_name="Doe",
            email="jane@test.com",
            telephone="0987654321",
            team_id=None,
            password="securepass",
            role="employee"
        )
        mock_create_user.assert_called_once()
        mock_user.save.assert_called_once()

    @patch('trinity.logic.userfactory.Team.objects.get')
    @patch('trinity.logic.userfactory.User.objects.create_user')
    def test_create_new_user_team_not_found(self, mock_create_user, mock_get_team):
        """Test de création avec équipe inexistante"""
        mock_user = Mock(spec=User)
        mock_create_user.return_value = mock_user
        mock_get_team.side_effect = Team.DoesNotExist
        # Ne devrait pas lever d'exception
        UserFactory.create_new_user(
            first_name="Test",
            username="test",
            last_name="User",
            email="test@test.com",
            telephone="0000000000",
            team_id=999,
            password="pass",
            role="employee"
        )
        mock_user.save.assert_called_once()

    @patch('trinity.logic.userfactory.User.objects.get')
    def test_get_team_manager_success(self, mock_get):
        """Test de récupération du manager d'équipe"""
        mock_manager = Mock(spec=User)
        mock_manager.role = "manager"
        mock_get.return_value = mock_manager
        result = UserFactory.get_team_manager(self.mock_team)
        mock_get.assert_called_once_with(team=self.mock_team, role__iexact="manager")
        self.assertEqual(result, mock_manager)

    @patch('trinity.logic.userfactory.User.objects.get')
    def test_get_team_manager_not_found(self, mock_get):
        """Test de récupération du manager inexistant"""
        mock_get.side_effect = User.DoesNotExist
        with self.assertRaises(Exception) as context:
            UserFactory.get_team_manager(self.mock_team)
        self.assertIn("User does not exist", str(context.exception))

    @patch('trinity.logic.userfactory.User.objects.filter')
    def test_get_members_except_manager(self, mock_filter):
        """Test de récupération des membres sauf le manager"""
        mock_member1 = Mock(spec=User)
        mock_member1.id = 2
        mock_member1.role = "employee"
        mock_member2 = Mock(spec=User)
        mock_member2.id = 3
        mock_member2.role = "employee"
        mock_queryset = Mock()
        mock_queryset.exclude.return_value = [mock_member1, mock_member2]
        mock_filter.return_value = mock_queryset
        result = UserFactory.get_members_except_manager(self.mock_team)
        mock_filter.assert_called_once_with(team=self.mock_team)
        mock_queryset.exclude.assert_called_once_with(role__iexact="manager")
        self.assertEqual(len(result), 2)

    @patch('trinity.logic.userfactory.CalendarFactory.get_sorted_planning')
    def test_build_user_viewer(self, mock_get_planning):
        """Test de construction d'un UserViewer"""
        mock_planning = {
            "2024-12-08": Mock(spec=DailyPlanning)
        }
        mock_get_planning.return_value = mock_planning
        result = UserFactory.build_user_viewer(self.mock_user)
        mock_get_planning.assert_called_once_with(self.mock_user)
        self.assertIsInstance(result, UserViewer)
        self.assertEqual(result.user_details, self.mock_user)
        self.assertEqual(result.planning, mock_planning)

    @patch('trinity.logic.userfactory.UserFactory.build_user_viewer')
    @patch('trinity.logic.userfactory.UserFactory.get_members_except_manager')
    def test_build_members_userviewer_list(self, mock_get_members, mock_build_viewer):
        """Test de construction de la liste des membres"""
        mock_member1 = Mock(spec=User)
        mock_member1.id = 2
        mock_member2 = Mock(spec=User)
        mock_member2.id = 3
        mock_viewer1 = Mock(spec=UserViewer)
        mock_viewer2 = Mock(spec=UserViewer)
        mock_get_members.return_value = [mock_member1, mock_member2]
        mock_build_viewer.side_effect = [mock_viewer1, mock_viewer2]
        result = UserFactory.build_members_userviewer_list(self.mock_team)
        mock_get_members.assert_called_once_with(self.mock_team)
        self.assertEqual(mock_build_viewer.call_count, 2)
        self.assertEqual(len(result), 2)
        self.assertIn(2, result)
        self.assertIn(3, result)
        self.assertEqual(result[2], mock_viewer1)
        self.assertEqual(result[3], mock_viewer2)

    @patch('trinity.logic.userfactory.UserFactory.get_user_by_id')
    def test_user_is_a_manager_true(self, mock_get_user):
        """Test si l'utilisateur est un manager (True)"""
        mock_manager = Mock(spec=User)
        mock_manager.role = "manager"
        mock_get_user.return_value = mock_manager
        result = UserFactory.user_is_a_manager(1)
        mock_get_user.assert_called_once_with(1)
        self.assertTrue(result)

    @patch('trinity.logic.userfactory.UserFactory.get_user_by_id')
    def test_user_is_a_manager_true_capitalized(self, mock_get_user):
        """Test si l'utilisateur est un Manager avec majuscule"""
        mock_manager = Mock(spec=User)
        mock_manager.role = "Manager"
        mock_get_user.return_value = mock_manager
        result = UserFactory.user_is_a_manager(1)
        self.assertTrue(result)

    @patch('trinity.logic.userfactory.UserFactory.get_user_by_id')
    def test_user_is_a_manager_false(self, mock_get_user):
        """Test si l'utilisateur n'est pas un manager (False)"""
        mock_employee = Mock(spec=User)
        mock_employee.role = "employee"
        mock_get_user.return_value = mock_employee
        result = UserFactory.user_is_a_manager(1)
        self.assertFalse(result)

    @patch('trinity.logic.userfactory.UserFactory.get_user_by_id')
    def test_user_is_an_admin_true(self, mock_get_user):
        """Test si l'utilisateur est un admin (True)"""
        mock_admin = Mock(spec=User)
        mock_admin.role = "admin"
        mock_get_user.return_value = mock_admin
        result = UserFactory.user_is_an_admin(1)
        mock_get_user.assert_called_once_with(1)
        self.assertTrue(result)

    @patch('trinity.logic.userfactory.UserFactory.get_user_by_id')
    def test_user_is_an_admin_true_capitalized(self, mock_get_user):
        """Test si l'utilisateur est un Admin avec majuscule"""
        mock_admin = Mock(spec=User)
        mock_admin.role = "Admin"
        mock_get_user.return_value = mock_admin
        result = UserFactory.user_is_an_admin(1)
        self.assertTrue(result)

    @patch('trinity.logic.userfactory.UserFactory.get_user_by_id')
    def test_user_is_an_admin_false(self, mock_get_user):
        """Test si l'utilisateur n'est pas un admin (False)"""
        mock_employee = Mock(spec=User)
        mock_employee.role = "employee"
        mock_get_user.return_value = mock_employee
        result = UserFactory.user_is_an_admin(1)
        self.assertFalse(result)

    @patch('trinity.logic.userfactory.UserFactory.get_user_by_id')
    def test_user_role_checks_with_none(self, mock_get_user):
        """Test des vérifications de rôle avec None"""
        mock_user = Mock(spec=User)
        mock_user.role = None
        mock_get_user.return_value = mock_user
        is_manager = UserFactory.user_is_a_manager(1)
        is_admin = UserFactory.user_is_an_admin(1)
        self.assertFalse(is_manager)
        self.assertFalse(is_admin)
