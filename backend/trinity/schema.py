import datetime
from zoneinfo import ZoneInfo
import graphene
import graphql_jwt
from graphene_django.types import DjangoObjectType
from .models import User, Team, Calendar
from .logic.userfactory import UserFactory
from .logic.teamfactory import TeamFactory
from .logic.calendarfactory import CalendarFactory
from .mutations.mutation_token import CustomObtainJSONWebToken
from .mutations.mutation_logout import LogoutMutation

class UserType(DjangoObjectType):
    class Meta:
        model = User
        fields = '__all__'


class TeamType(DjangoObjectType):
    class Meta:
        model = Team
        fields = '__all__'


class CalendarType(DjangoObjectType):
    duration = graphene.Int()
    duration_formatted = graphene.String()
    class Meta:
        model = Calendar
        fields = '__all__'

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

class RegisterResponseType(graphene.ObjectType):
    datetime_field = graphene.JSONString()
    duration_field = graphene.JSONString()


class Query(graphene.ObjectType):
    all_users = graphene.List(UserType)
    all_teams = graphene.List(TeamType)
    all_calendars = graphene.List(CalendarType)
    pending_day = graphene.Field(
        CalendarType,
        user_id=graphene.Int(required=True)
    )
    today_calendars = graphene.List(
        CalendarType,
        user_id=graphene.Int()
    )
    current_user = graphene.Field(UserType)
    current_month_work = graphene.List(
        DailyWorkType,
        user_id=graphene.Int(required=True)
    )

    # renvoie l'utilisateur connecté s'il est connecté
    def resolve_current_user(self, info):
        user = info.context.user

        if hasattr(user, 'is_authenticated') and user.is_authenticated:
            return user

        return None

    def resolve_all_users(self, info, *kwargs):
        return User.objects.all()

    def resolve_all_teams(self, info, *kwargs):
        return Team.objects.all()

    def resolve_all_calendars(self, info, *kwargs):
        return Calendar.objects.all()

    def resolve_pending_day(self, info, user_id):
        try:
            return Calendar.objects.filter(
                employee_id=user_id,
                day_over=False
            ).last()
        except Calendar.DoesNotExist:
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

        if now.month == 12:
            next_month = now.replace(year=now.year + 1, month=1, day=1)
        else:
            next_month = now.replace(month=now.month + 1, day=1)

        month_end = next_month - datetime.timedelta(seconds=1)

        sessions = Calendar.objects.filter(
            employee_id=user_id,
            begin__gte=month_start,
            begin__lte=month_end,
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

class CreateUser(graphene.Mutation):
    class Arguments:
        username = graphene.String(required=True)
        first_name = graphene.String(required=True)
        last_name = graphene.String(required=True)
        email = graphene.String(required=True)
        telephone = graphene.String(required=True)
        team_id = graphene.ID(required=False)
        password = graphene.String(required=True)
        role = graphene.String(required=True)

    user = graphene.Field(UserType)

    def mutate(self, info, username, first_name, last_name, email, telephone,password, role, team_id=None):
        # Si l'utilisateur appartient à une équipe
        user = UserFactory.create_new_user(username, first_name, last_name, email,
                                           telephone, team_id, password, role)
        return CreateUser(user=user)


class CreateTeam(graphene.Mutation):
    class Arguments:
        name = graphene.String(required=True)
        description = graphene.String(required=False)

    team = graphene.Field(TeamType)

    def mutate(self, info, name, description=None):
        team = TeamFactory.create_team(name, description)
        return CreateTeam(team=team)


class RegisterArrival(graphene.Mutation):

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
    token_auth = CustomObtainJSONWebToken.Field() # Login personnalisé avec token
    verify_token = graphql_jwt.Verify.Field() # Vérification de la validité du token
    refresh_token = graphql_jwt.Refresh.Field() # Refresh du token


    create_user = CreateUser.Field()
    create_team = CreateTeam.Field()

    register_arrival = RegisterArrival.Field()
    register_end = RegisterEnd.Field()

    # login = LoginMutation.Field()
    logout = LogoutMutation.Field()
# Schema final
schema = graphene.Schema(query=Query, mutation=Mutation)