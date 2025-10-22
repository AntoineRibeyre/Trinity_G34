from dataclasses import dataclass
from typing import Dict, List

from ..models import User, Team
from .calendarfactory import CalendarFactory, DailyPlanning


@dataclass
class UserViewer:
    user_details: User
    planning: Dict[str, DailyPlanning]
    """ This class creates a user view with its details and planning."""


class UserFactory:
    """This class is used to create and manage user model objects."""

    @classmethod
    def get_user_by_id(cls, id_user: int) -> User:
        """This method retrieves a user by its ID."""
        try:
            return User.objects.get(id=id_user)
        except (User.DoesNotExist, User.MultipleObjectsReturned):
            raise Exception("User does not exist or there is an error in the"
                            "database.")

    @classmethod
    def create_new_user(cls, first_name: str, username: str, last_name: str,
                        email: str, telephone: str, team_id: int | None,
                        password: str, role: str
                        ) -> User:
        """Creates a new user."""
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
        )
        user.telephone = telephone
        user.role = role
        if team_id:
            try:
                team = Team.objects.get(id=team_id)
                user.team = team
            except Team.DoesNotExist:
                pass
        user.save()

    @classmethod
    def get_team_manager(cls, team: Team) -> User:
        """This method gets the Team manager"""
        try:
            # role__iexact handles the case where role equals "Manager"
            # (case-insensitive)
            return User.objects.get(team=team, role__iexact="manager")
        except (User.DoesNotExist, User.MultipleObjectsReturned):
            raise Exception("User does not exist or there is an error in the"
                            "database.")

    @classmethod
    def get_members_except_manager(cls, team: Team) -> List[User]:
        """This method retrieves all team members except the manager."""
        return User.objects.filter(team=team).exclude(role__iexact="manager")

    @classmethod
    def build_user_viewer(cls, user: User) -> UserViewer:
        """This method builds a user view object from a user."""
        return UserViewer(user_details=user,
                          planning=CalendarFactory.get_sorted_planning(user))

    @classmethod
    def build_members_userviewer_list(cls,
                                      team: Team) -> Dict[int, UserViewer]:
        """This method builds the list of all members of a team,
        excluding the manager."""
        mermber_list: Dict[int, UserViewer] = {}
        members = UserFactory.get_members_except_manager(team)
        for member in members:
            # Building a dictionary with the user ID as the key, containing
            # members' details and plannings
            mermber_list[member.id] = UserFactory.build_user_viewer(member)
        return mermber_list

    @classmethod
    def user_is_a_manager(cls, user_id: int) -> bool:
        """This method checks if the user is a manager;it will be used to
        handle user view permissions in queries."""
        person = UserFactory.get_user_by_id(user_id)
        role = person.role
        if role == "manager" or role == "Manager":
            return True
        else:
            return False

    @classmethod
    def user_is_an_admin(cls, user_id: int) -> bool:
        """This method checks if the user is an admin;it will be used to
        handle user view permissions in queries."""
        person = UserFactory.get_user_by_id(user_id)
        role = person.role
        if role == "admin" or role == "Admin":
            return True
        else:
            return False
