from zoneinfo import ZoneInfo

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
        fields = "__all__"


class TeamType(DjangoObjectType):
    """Graphene object connected to the Django Team model."""
    class Meta:
        model = Team
        fields = "__all__"


class CalendarType(DjangoObjectType):
    """Graphene object connected to the Django Calendar model."""
    duration = graphene.Int()
    duration_formatted = graphene.String()
    class Meta:
        model = Calendar
        fields = "__all__"

    def resolve_duration(self, info):
        if self.duration:
            return int(self.duration.total_seconds())
        return None

    def resolve_duration_formatted(self, info):
        if self.duration:
            total_seconds = int(self.duration.total_seconds())
            hours = total_seconds // 3600
            minutes = (total_seconds % 3600) // 60
            seconds = total_seconds % 60
            return f"{hours:02d}:{minutes:02d}:{seconds:02d}"
        return None

    #ICI
class DailyWorkType(graphene.ObjectType):
    date = graphene.Date()
    day_number = graphene.Int()
    first_check_in = graphene.DateTime()
    first_check_in_time = graphene.String()
    last_check_out = graphene.DateTime()
    last_check_out_time = graphene.String()
    total_duration_seconds = graphene.Int()
    total_duration_formatted = graphene.String()

    def resolve_first_check_in_time(self, info):
        if self.first_check_in:
            paris_tz = ZoneInfo("Europe/Paris")
            time_paris = self.first_check_in.astimezone(paris_tz)
            return time_paris.strftime("%H:%M:%S")  # Ex: "14:57:08"
        return None

    def resolve_last_check_out_time(self, info):
        if self.last_check_out:
            paris_tz = ZoneInfo("Europe/Paris")
            time_paris = self.last_check_out.astimezone(paris_tz)
            return time_paris.strftime("%H:%M:%S")  # Ex: "17:30:45"
        return None

    def resolve_total_duration_formatted(self, info):
        if self.total_duration_seconds:
            hours = self.total_duration_seconds // 3600
            minutes = (self.total_duration_seconds % 3600) // 60
            seconds = self.total_duration_seconds % 60
            return f"{hours:02d}:{minutes:02d}:{seconds:02d}"
        return "00:00:00"
#ICI

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
