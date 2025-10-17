import graphene
from graphene_django.types import DjangoObjectType

from ..models import User, Team, Calendar
from ..logic.userfactory import UserViewer
from ..logic.teamfactory import TeamViewer, AdminView
from ..logic.calendarfactory import DailyPlanning


class UserType(DjangoObjectType):
    """Graphene object connected to the Django User model."""
    class Meta:
        model = User
        fields = ("id", "first_name", "last_name", "role")


class TeamType(DjangoObjectType):
    """Graphene object connected to the Django Team model."""
    class Meta:
        model = Team
        fields = "__all__"


class CalendarType(DjangoObjectType):
    """Graphene object connected to the Django Calendar model."""
    class Meta:
        model = Calendar
        fields = "__all__"

    def resolve_duration(self, info):
        """We need to resolve this variable because in Graphene it is
        considered as a float. If we don't handle this variable here,
        GraphQL generates type errors."""

        if self.duration is None:
            return
        else:
            return self.duration.seconds/3600


class DailyPlanningType(graphene.ObjectType):
    """Graphene object representing a daily planning."""
    date = graphene.String()
    calendar = graphene.List(CalendarType)
    total_hours = graphene.String()


class UserViewType(graphene.ObjectType):
    """Graphene object representing a user view."""
    user_details = graphene.Field(UserType)
    planning = graphene.List(DailyPlanningType)


class TeamViewerType(graphene.ObjectType):
    """Graphene object representing a team view."""
    team_details = graphene.Field(TeamType)
    manager = graphene.Field(UserViewType)
    members = graphene.List(UserViewType)


class AdminViewType(graphene.ObjectType):
    """Graphene object representing an admin view."""
    admin_details = graphene.Field(UserViewType)
    teams = graphene.List(TeamViewerType)


class RegisterResponseType(graphene.ObjectType):
    """This class is used to create the response object for calendar
    manipulation operations."""
    datetime_field = graphene.JSONString()
    duration_field = graphene.JSONString()


class ObjectTypeFactory:
    """This class is a factory for Graphene object types."""
    @classmethod
    def daily_planning_type_builder(cls, planning: DailyPlanning
                                    ) -> DailyPlanningType:
        """Builds a DailyPlanningType from a DailyPlanning object."""
        return DailyPlanningType(date=planning.date,
                                 calendar=planning.calendars,
                                 total_hours=str(planning.total_hours))

    @classmethod
    def user_view_type_builder(cls, user_view: UserViewer) -> UserViewType:
        """Builds a UserViewType from a UserView object."""
        plannigtype = [ObjectTypeFactory.daily_planning_type_builder(calendar)
                       for calendar in user_view.planning.values()]
        return UserViewType(user_details=user_view.user_details,
                            planning=plannigtype)

    @classmethod
    def team_viewer_type_builder(cls, team_viewer: TeamViewer
                                 ) -> TeamViewerType:
        """Builds a TeamViewerType from a TeamViewer object."""
        members_type = [ObjectTypeFactory.user_view_type_builder(user_view) for
                        user_view in team_viewer.members.values()]
        manager_type = ObjectTypeFactory.user_view_type_builder(
            team_viewer.manager)
        return TeamViewerType(team_details=team_viewer.team_details,
                              manager=manager_type,
                              members=members_type)

    @classmethod
    def build_admin_view_type(cls, admin_view: AdminView) -> AdminViewType:
        """Builds a TeamViewerType from a TeamView object."""
        admin_type = ObjectTypeFactory.user_view_type_builder(
            admin_view.admin_details)
        teams_type = [ObjectTypeFactory.team_viewer_type_builder(team_viewer)
                      for team_viewer in admin_view.teams.values()]
        return AdminViewType(admin_details=admin_type,
                             teams=teams_type)
