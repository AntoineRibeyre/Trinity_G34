import graphene
from graphene_django.types import DjangoObjectType

from ..models import User, Team, Calendar
from ..logic.userfactory import UserFactory, UserViewer
from ..logic.teamfactory import TeamFactory, TeamViewer
from ..logic.calendarfactory import DailyPlanning


class UserType(DjangoObjectType):
    """Graphene object connected to the Django User model."""
    class Meta:
        model = User
        fields = ("id", "first_name", "last_name")


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


class DailyPlanningType(graphene.ObjectType):
    """Graphene object representing a daily planning."""
    date = graphene.String()
    calendar = graphene.List(CalendarType)
    total_hours = graphene.Float()


class UserViewType(graphene.ObjectType):
    """Graphene object representing a user view."""
    user_details = graphene.Field(UserType)
    planning = graphene.List(DailyPlanningType)


class TeamViewerType(graphene.ObjectType):
    """Graphene object representing a team view."""
    team_details = graphene.Field(TeamType)
    manager = graphene.Field(UserViewType)
    members = graphene.List(UserViewType)


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
                                 calendar=planning.calendars)

    @classmethod
    def user_view_type_builder(cls, user_view: UserViewer) -> UserViewType:
        """Builds a UserViewType from a UserView object."""
        plannigtype = [ObjectTypeFactory.user_view_type_builder(calendar) for
                       calendar in user_view.planning.values()]
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
    def resolve_manager_view(cls, manager_id: int) -> TeamViewerType:
        """Checks if the ID belongs to a manager and builds their team view."""
        if UserFactory.user_is_a_manager(manager_id):
            team = TeamFactory.get_team_by_user_id(manager_id)
            return ObjectTypeFactory.team_viewer_type_builder(
                TeamFactory.build_team_viewer(team))
        else:
            raise Exception("Permission denied !")
