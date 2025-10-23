import datetime
from zoneinfo import ZoneInfo

import graphene
import graphql_jwt

from .graphtypes import CalendarType, UserType, DailyWorkType, EventType, CreateEvent, UpdateEvent, DeleteEvent, \
    AddAttendeeToEvent, RemoveAttendeeFromEvent
from ..models import Calendar, Event, User
from ..logic.userfactory import UserFactory
from ..logic.teamfactory import TeamFactory
from ..logic.calendarfactory import CalendarFactory
from . import graphtypes as graphtype
from .queryresolver import QueryResolver
from ..mutations.mutation_logout import LogoutMutation
from ..mutations.mutation_token import CustomObtainJSONWebToken


class Query(graphene.ObjectType):
    """This class is used to list and resolve all possible GraphQL queries."""
    all_users = graphene.List(UserType)
    pending_day = graphene.Field(
        graphtype.CalendarType,
        user_id=graphene.Int(required=True)
    )
    manager_view = graphene.Field(graphtype.TeamViewerType,
                                  manager_id=graphene.Int(required=True))
    admin_view = graphene.Field(graphtype.AdminViewType,
                                admin_id=graphene.Int(required=True))
    today_calendars = graphene.List(
        graphtype.CalendarType,
        user_id=graphene.Int()
    )
    current_user = graphene.Field(UserType)
    current_month_work = graphene.List(
        graphtype.DailyWorkType,
        user_id=graphene.Int(required=True)
    )
    all_events = graphene.List(graphtype.EventType)
    event = graphene.Field(graphtype.EventType, id=graphene.Int(required=True))

    def resolve_pending_day(self, info, user_id):
        """Il faut aboslument modifier  ce code car il viole l'architecture
        A ce niveau, la couche Schema ne doit pas  utliser la classe  Calendar.
        Les seules Classes qui doivent être utlisées ici ce sont les factories
        qui eux,  passent par  la classe QueryResolver
        (voir methode resolve_manager_view)"""
        try:
            return Calendar.objects.filter(
                employee_id=user_id,
                day_over=False
            ).last()
        except Calendar.DoesNotExist:
            return None

    def resolve_manager_view(self, info, manager_id: int):
        """This method shows all the team details"""
        result = QueryResolver.resolve_manager_view(
            manager_id)
        return result

    def resolve_admin_view(self, info, admin_id: int):
        """This method shows all teams details in the database"""
        result = QueryResolver.resolve_admin_view(admin_id)
        return result

    def resolve_current_user(self, info):
        user = info.context.user

        if hasattr(user, 'is_authenticated') and user.is_authenticated:
            return user

        return None

    def resolve_today_calendars(self, info, user_id=None):
        # Utiliser la même timezone que dans ton CalendarFactory
        paris_tz = ZoneInfo("Europe/Paris")
        now_paris = datetime.datetime.now(paris_tz)

        # Début et fin du jour en heure de Paris
        today_start = now_paris.replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = now_paris.replace(hour=23, minute=59, second=59, microsecond=999999)

        queryset = Calendar.objects.filter(
            begin__gte=today_start,
            begin__lte=today_end
        )

        if user_id:
            queryset = queryset.filter(employee_id=user_id)

        result = queryset.order_by('-begin')

        return result

    def resolve_current_month_work(self, info, user_id):
        paris_tz = ZoneInfo("Europe/Paris")
        now = datetime.datetime.now(paris_tz)

        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

        sessions = Calendar.objects.filter(
            employee_id=user_id,
            begin__gte=month_start,
            begin__lte=today_start,
            day_over=True
        ).order_by('begin')

        from collections import defaultdict
        days_data = defaultdict(list)

        for session in sessions:
            session_date = session.begin.astimezone(paris_tz).date()
            days_data[session_date].append(session)

        daily_summaries = []

        for date in sorted(days_data.keys()):
            day_sessions = days_data[date]

            first_session = day_sessions[0]
            first_check_in = first_session.begin

            last_session = day_sessions[-1]
            last_check_out = last_session.end if last_session.end else last_session.begin

            total_seconds = 0
            for session in day_sessions:
                if session.duration:
                    session_seconds = int(session.duration.total_seconds())
                    total_seconds += session_seconds

            daily_summaries.append(DailyWorkType(
                date=date,
                day_number=date.day,
                first_check_in=first_check_in,
                last_check_out=last_check_out,
                total_duration_seconds=total_seconds
            ))

        return daily_summaries

    def resolve_all_events(self, info):
        return Event.objects.prefetch_related('attendees').all().order_by('-created_at')

    def resolve_event(self, info, id):
        return Event.objects.prefetch_related('attendees').get(id=id)
    
    def resolve_all_users(self, info):
        users = User.objects.all()
        users = users.filter(is_active=True)
        return users


class CreateUser(graphene.Mutation):
    """This class is a GraphQL mutation that creates a new user and pushes it
    to the database."""
    class Arguments:
        username = graphene.String(required=True)
        first_name = graphene.String(required=True)
        last_name = graphene.String(required=True)
        email = graphene.String(required=True)
        telephone = graphene.String(required=True)
        team_id = graphene.ID(required=False)
        password = graphene.String(required=True)
        role = graphene.String(required=True)

    user = graphene.Field(graphtype.UserType)

    def mutate(self, info, username, first_name, last_name, email, telephone,
               password, role, team_id=None):
        user = UserFactory.create_new_user(username, first_name, last_name,
                                           email, telephone, team_id, password,
                                           role)
        return CreateUser(user=user)
    
class DeleteUser(graphene.Mutation):
    class Arguments:
        user_id = graphene.Int(required=True)
    
    ok = graphene.Boolean()
    message = graphene.String()

    def mutate(self, info, user_id):
        try:
            user = User.objects.get(id=user_id)
            user.is_active = False
            user.save()
            return DeleteUser(ok=True, message=f"Utilisateur {user_id} supprimé avec succès.")
        except User.DoesNotExist:
            return DeleteUser(ok=False, message="Utilisateur introuvable.")
        except Exception as e:
            return DeleteUser(ok=False, message=f"Erreur: {str(e)}")


class CreateTeam(graphene.Mutation):
    """This class is a GraphQL mutation that creates a new team and pushes it
    to the database."""
    class Arguments:
        name = graphene.String(required=True)
        description = graphene.String(required=False)

    team = graphene.Field(graphtype.TeamType)

    def mutate(self, info, name, description=None):
        team = TeamFactory.create_team(name, description)
        return CreateTeam(team=team)


class RegisterArrival(graphene.Mutation):
    """This class is used to create the mutations that
    register the arrival time."""
    class Arguments:
        user_id = graphene.Int(required=True)

    datetime_field = graphene.JSONString()
    duration_field = graphene.JSONString()

    def mutate(self, info, user_id):
        result = CalendarFactory.register_arrival(user_id)
        return RegisterArrival(
            datetime_field=result.date_time_data,
            duration_field=None
        )


class RegisterEnd(graphene.Mutation):
    """This class is used to create the mutations that
    register the departure time."""
    class Arguments:
        user_id = graphene.Int(required=True)

    datetime_field = graphene.JSONString()
    duration_field = graphene.JSONString()

    def mutate(self, info, user_id):
        result = CalendarFactory.register_out(user_id)
        return RegisterEnd(
            datetime_field=result.date_time_data,
            duration_field=result.duree_data
        )


class Mutation(graphene.ObjectType):
    """This class is used to list and resolve all possible GraphQL mutations
    ."""
    token_auth = CustomObtainJSONWebToken.Field()  # Login with token
    verify_token = graphql_jwt.Verify.Field()  # verifying the token
    refresh_token = graphql_jwt.Refresh.Field()  # Refresh of the token
    create_user = CreateUser.Field()
    create_team = CreateTeam.Field()
    register_arrival = RegisterArrival.Field()
    register_end = RegisterEnd.Field()
    logout = LogoutMutation.Field()
    create_event = CreateEvent.Field()
    update_event = UpdateEvent.Field()
    delete_event = DeleteEvent.Field()
    update_event_attendees = UpdateEvent.Field()
    add_attendee = AddAttendeeToEvent.Field()
    remove_attendee = RemoveAttendeeFromEvent.Field()
    delete_user = DeleteUser.Field()


# final schema
schema = graphene.Schema(query=Query, mutation=Mutation)
