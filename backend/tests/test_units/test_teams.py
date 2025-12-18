from django.test import TestCase
from unittest.mock import Mock, patch
from trinity.models import Team, User
from trinity.logic.teamfactory import TeamFactory, TeamViewer, AdminView
from trinity.logic.userfactory import UserViewer


class TeamFactoryTestCase(TestCase):
    """Tests unitaires pour TeamFactory avec mocks"""

    def setUp(self):
        """Configuration initiale pour chaque test"""
        self.mock_team = Mock(spec=Team)
        self.mock_team.id = 1
        self.mock_team.name = "Équipe Dev"
        self.mock_team.description = "Équipe de développement"
        self.mock_team.field = "IT"
        self.mock_user = Mock(spec=User)
        self.mock_user.id = 1
        self.mock_user.email = "manager@test.com"
        self.mock_user.first_name = "Jean"
        self.mock_user.last_name = "Dupont"
        self.mock_user.role = "manager"
        self.mock_user.team = self.mock_team

    @patch('trinity.logic.teamfactory.Team.objects.create')
    def test_create_team(self, mock_create):
        """Test de création d'une équipe"""
        mock_create.return_value = self.mock_team
        result = TeamFactory.create_team(
            name="Équipe Dev",
            field="IT",
            description="Équipe de développement"
        )
        mock_create.assert_called_once_with(
            name="Équipe Dev",
            description="Équipe de développement",
            field="IT"
        )
        self.assertEqual(result.name, "Équipe Dev")
        self.assertEqual(result.field, "IT")

    @patch('trinity.logic.teamfactory.Team.objects.all')
    def test_get_all_teams(self, mock_all):
        """Test de récupération de toutes les équipes"""
        mock_team2 = Mock(spec=Team)
        mock_team2.id = 2
        mock_team2.name = "Équipe Marketing"
        mock_all.return_value = [self.mock_team, mock_team2]
        result = TeamFactory.get_all_teams()
        mock_all.assert_called_once()
        self.assertEqual(len(result), 2)
        self.assertEqual(result[0].name, "Équipe Dev")
        self.assertEqual(result[1].name, "Équipe Marketing")

    @patch('trinity.logic.teamfactory.UserFactory.get_user_by_id')
    def test_get_team_by_user_id(self, mock_get_user):
        """Test de récupération d'une équipe par ID utilisateur"""
        mock_get_user.return_value = self.mock_user
        result = TeamFactory.get_team_by_user_id(1)
        mock_get_user.assert_called_once_with(1)
        self.assertEqual(result.id, 1)
        self.assertEqual(result.name, "Équipe Dev")

    @patch('trinity.logic.teamfactory.UserFactory.build_members_userviewer_list')
    @patch('trinity.logic.teamfactory.UserFactory.build_user_viewer')
    @patch('trinity.logic.teamfactory.UserFactory.get_team_manager')
    def test_build_team_viewer(self, mock_get_manager, mock_build_viewer, mock_build_members):
        """Test de construction d'un TeamViewer"""
        mock_manager_viewer = Mock(spec=UserViewer)
        mock_manager_viewer.user_details = self.mock_user
        mock_member1 = Mock(spec=UserViewer)
        mock_member1.user_details = Mock()
        mock_member1.user_details.id = 2
        mock_get_manager.return_value = self.mock_user
        mock_build_viewer.return_value = mock_manager_viewer
        mock_build_members.return_value = {2: mock_member1}
        result = TeamFactory.build_team_viewer(self.mock_team)
        mock_get_manager.assert_called_once_with(self.mock_team)
        mock_build_viewer.assert_called_once_with(self.mock_user)
        mock_build_members.assert_called_once_with(self.mock_team)
        self.assertIsInstance(result, TeamViewer)
        self.assertEqual(result.team_details, self.mock_team)
        self.assertEqual(result.manager, mock_manager_viewer)
        self.assertEqual(len(result.members), 1)

    @patch('trinity.logic.teamfactory.TeamFactory.build_team_viewer')
    @patch('trinity.logic.teamfactory.TeamFactory.get_all_teams')
    @patch('trinity.logic.teamfactory.UserFactory.build_user_viewer')
    def test_build_admin_view(self, mock_build_user_viewer, mock_get_all_teams, mock_build_team_viewer):
        """Test de construction d'un AdminView"""
        mock_admin = Mock(spec=User)
        mock_admin.id = 99
        mock_admin.role = "admin"
        mock_admin_viewer = Mock(spec=UserViewer)
        mock_admin_viewer.user_details = mock_admin
        mock_team2 = Mock(spec=Team)
        mock_team2.id = 2
        mock_team2.name = "Équipe Marketing"
        mock_team_viewer1 = Mock(spec=TeamViewer)
        mock_team_viewer2 = Mock(spec=TeamViewer)
        mock_build_user_viewer.return_value = mock_admin_viewer
        mock_get_all_teams.return_value = [self.mock_team, mock_team2]
        mock_build_team_viewer.side_effect = [mock_team_viewer1, mock_team_viewer2]
        result = TeamFactory.build_admin_view(mock_admin)
        mock_build_user_viewer.assert_called_once_with(mock_admin)
        mock_get_all_teams.assert_called_once()
        self.assertEqual(mock_build_team_viewer.call_count, 2)
        self.assertIsInstance(result, AdminView)
        self.assertEqual(result.admin_details, mock_admin_viewer)
        self.assertEqual(len(result.teams), 2)
        self.assertIn(1, result.teams)
        self.assertIn(2, result.teams)

    @patch('trinity.logic.teamfactory.Team.objects.create')
    def test_create_team_without_description(self, mock_create):
        """Test de création d'une équipe sans description"""
        mock_team_no_desc = Mock(spec=Team)
        mock_team_no_desc.name = "Équipe Test"
        mock_team_no_desc.field = "QA"
        mock_team_no_desc.description = None
        mock_create.return_value = mock_team_no_desc
        result = TeamFactory.create_team(
            name="Équipe Test",
            field="QA",
            description=None
        )
        mock_create.assert_called_once()
        self.assertIsNone(result.description)
