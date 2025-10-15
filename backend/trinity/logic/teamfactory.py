from dataclasses import dataclass
from typing import Dict

from ..models import Team
from .userfactory import UserFactory, UserViewer


@dataclass
class TeamViewer:
    team_details: Team
    manager: UserViewer
    members: Dict[int, UserViewer]
    """This class is a team viewer; it displays all details about a team,
    including the manager, members, their details, and plannings."""


class TeamFactory:
    """This class is used to create and manage team model objects."""
    @classmethod
    def create_team(cls, name: str, description: str | None) -> Team:
        """Creates a team."""
        return Team.objects.create(
            name=name,
            description=description)

    @classmethod
    def get_team_by_user_id(cls, user_id: int) -> Team:
        """This method retrives a team by user ID"""
        return UserFactory.get_user_by_id(user_id).team

    @classmethod
    def build_team_viewer(cls, team: Team) -> TeamViewer:
        """This method builds a teamviewer object using a team"""
        # The manager is a User object, while members are stored in a
        # Dict[int, UserViewer] object
        manger_user = UserFactory.get_team_manager(team)
        # Converting manager from User to a UserView object to get his planning
        manager = UserFactory.build_user_viewer(manger_user)
        members = UserFactory.build_members_user_viewer(team)
        return TeamViewer(team_details=team, manager=manager, members=members)


