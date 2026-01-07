from zoneinfo import ZoneInfo

import graphene
from graphene_django.types import DjangoObjectType

from ..models import User, Team, Calendar, Event
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

class EventType(DjangoObjectType):
    class Meta:
        model = Event
        fields = '__all__'

class CreateEvent(graphene.Mutation):
    class Arguments:
        subject = graphene.String(required=True)
        start_time = graphene.DateTime(required=True)
        end_time = graphene.DateTime(required=True)
        is_all_day = graphene.Boolean(required=False)
        attendee_ids = graphene.List(graphene.Int)

    event = graphene.Field(EventType)
    success = graphene.Boolean()
    message = graphene.String()

    def mutate(self, info, subject, start_time, end_time, attendee_ids, is_all_day=False):
        try:
            event = Event.objects.create(
                subject=subject,
                start_time=start_time,
                end_time=end_time,
                is_all_day=is_all_day
            )
            if attendee_ids:
                event.attendees.set(User.objects.filter(id__in=attendee_ids))
            return CreateEvent(event=event, success=True, message="Événement créé avec succès")
        except Exception as e:
            return CreateEvent(event=None, success=False, message=str(e))


class UpdateEvent(graphene.Mutation):
    class Arguments:
        event_id = graphene.Int(required=True)
        subject = graphene.String(required=True)
        start_time = graphene.DateTime(required=True)
        end_time = graphene.DateTime(required=True)
        is_all_day = graphene.Boolean(required=False)
        attendee_ids = graphene.List(graphene.Int, required=False)

    event = graphene.Field(EventType)
    success = graphene.Boolean()
    message = graphene.String()

    def mutate(self, info, event_id, subject, start_time, end_time, is_all_day=False, attendee_ids=None):
        try:
            # Récupérer l'événement
            event = Event.objects.get(id=event_id)

            # Mettre à jour les champs (sans .set(), directement)
            event.subject = subject
            event.start_time = start_time
            event.end_time = end_time
            event.is_all_day = is_all_day

            # Sauvegarder les modifications
            event.save()

            # Mettre à jour les participants (ManyToMany)
            if attendee_ids is not None:
                event.attendees.set(User.objects.filter(id__in=attendee_ids))

            return UpdateEvent(
                event=event,
                success=True,
                message="Événement mis à jour avec succès"
            )
        except Event.DoesNotExist:
            return UpdateEvent(
                event=None,
                success=False,
                message=f"Événement avec l'ID {event_id} introuvable"
            )
        except Exception as e:
            return UpdateEvent(
                event=None,
                success=False,
                message=f"Erreur lors de la mise à jour: {str(e)}"
            )


class AddAttendeeToEvent(graphene.Mutation):
    class Arguments:
        event_id = graphene.Int(required=True)
        user_id = graphene.Int(required=True)

    event = graphene.Field(EventType)

    def mutate(self, info, event_id, user_id):
        event = Event.objects.get(id=event_id)
        user = User.objects.get(id=user_id)
        event.attendees.add(user)
        return AddAttendeeToEvent(event=event)


class RemoveAttendeeFromEvent(graphene.Mutation):
    class Arguments:
        event_id = graphene.Int(required=True)
        user_id = graphene.Int(required=True)

    event = graphene.Field(EventType)

    def mutate(self, info, event_id, user_id):
        event = Event.objects.get(id=event_id)
        user = User.objects.get(id=user_id)
        event.attendees.remove(user)
        return RemoveAttendeeFromEvent(event=event)


class DeleteEvent(graphene.Mutation):
    class Arguments:
        event_id = graphene.Int(required=True)

    success = graphene.Boolean()
    message = graphene.String()

    def mutate(self, info, event_id):
        try:
            # Récupérer l'événement
            event = Event.objects.get(id=event_id)

            # Supprimer l'événement (avec les parenthèses!)
            event.delete()

            return DeleteEvent(
                success=True,
                message="Événement supprimé avec succès"
            )
        except Event.DoesNotExist:
            return DeleteEvent(
                success=False,
                message=f"Événement avec l'ID {event_id} introuvable"
            )
        except Exception as e:
            return DeleteEvent(
                success=False,
                message=f"Erreur lors de la suppression: {str(e)}"
            )

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


class LeaveBalanceType(DjangoObjectType):
    class Meta:
        model = LeaveBalance
        fields = '__all__'


class LeaveReportType(graphene.ObjectType):
    """Type GraphQL pour le rapport de congés"""
    employee_id = graphene.Int()
    current_balance = graphene.Float()
    acquired_this_year = graphene.Float()
    used_this_year = graphene.Float()
    reference_year_start = graphene.Date()
    reference_year_end = graphene.Date()
    next_acquisition_date = graphene.Date()
    is_at_max_capacity = graphene.Boolean()
    transactions = graphene.List(LeaveBalanceType)


class MonthlyAcquisitionResultType(graphene.ObjectType):
    """Résultat de l'acquisition mensuelle"""
    success_count = graphene.Int()
    error_count = graphene.Int()
    details = graphene.JSONString()