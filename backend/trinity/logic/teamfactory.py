from dataclasses import dataclass
from typing import Dict, List

from ..models import Team, User
from .userfactory import UserFactory, UserViewer


@dataclass
class TeamViewer:
    team_details: Team
    manager: UserViewer
    members: Dict[int, UserViewer]
    """This class is a team viewer; it displays all details about a team,
    including the manager, members, their details, and plannings."""


@dataclass
class AdminView:
    admin_details: UserViewer
    teams: Dict[int, TeamViewer]
    """This class is an AdminView; it displays all details about all teams,
    including the admin,all team members, their details, and plannings."""


class TeamFactory:
    """This class is used to create and manage team model objects."""
    @classmethod
    def create_team(cls, name: str,field: str, description: str | None) -> Team:
        """Creates a team."""
        return Team.objects.create(
            name=name,
            description=description,
            field=field)

    @classmethod
    def get_all_teams(cls) -> List[Team]:
        """Gets all teams in the DataBase."""
        return Team.objects.all()

    @classmethod
    def get_team_by_user_id(cls, user_id: int) -> Team:
        """This method retrives a team by user ID"""
        return UserFactory.get_user_by_id(user_id).team

    @classmethod
    def build_team_viewer(cls, team: Team) -> TeamViewer:
        """This method builds a teamviewer object using a team"""
        # The manager is a User object, while members are stored in a
        # Dict[int, UserViewer] object
        manager_user = UserFactory.get_team_manager(team)
        # Converting manager from User to a UserView object to get his planning
        manager = UserFactory.build_user_viewer(manager_user)
        members = UserFactory.build_members_userviewer_list(team)
        return TeamViewer(team_details=team, manager=manager, members=members)

    @classmethod
    def build_admin_view(cls, admin: User) -> AdminView:
        """This Method Builds an  AdminView object using admin details"""
        team_list: Dict[int, TeamViewer] = {}
        admin_user_view = UserFactory.build_user_viewer(admin)
        teams = TeamFactory.get_all_teams()
        for team in teams:
            team_list[team.id] = TeamFactory.build_team_viewer(team)
        return AdminView(admin_details=admin_user_view,
                         teams=team_list)


