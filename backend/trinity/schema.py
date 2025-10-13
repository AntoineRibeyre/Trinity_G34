
import graphene
from graphene_django.types import DjangoObjectType

from .models import User, Team, Calendar
from .logic.userfactory import UserFactory
from .logic.teamfactory import TeamFactory
from .logic.calendarfactory import CalendarFactory


class UserType(DjangoObjectType):
    class Meta:
        model = User
        exclude = ('password',)


class TeamType(DjangoObjectType):
    class Meta:
        model = Team
        fields = '__all__'


class CalendarType(DjangoObjectType):
    class Meta:
        model = Calendar
        fields = '__all__'


class RegisterResponseType(graphene.ObjectType):
    datetime_field = graphene.JSONString()
    duration_field = graphene.JSONString()


class Query(graphene.ObjectType):
    all_users = graphene.List(UserType)
    all_teams = graphene.List(TeamType)
    all_calendars = graphene.List(CalendarType)
    register_arrival = graphene.List(RegisterResponseType,
                                     user_id=graphene.Int(required=True))
    register_end = graphene.List(RegisterResponseType,
                                 user_id=graphene.Int(required=True))

    def resolve_all_users(self, info, *kwargs):
        return User.objects.all()

    def resolve_all_teams(self, info, *kwargs):
        return Team.objects.all()

    def resolve_all_Calendriers(self, info, *kwargs):
        return Calendar.objects.all()

    def resolve_register_arrival(self, info, user_id):
        result = CalendarFactory.create_calendar(user_id)
        return [RegisterResponseType(
            datetime_field=result.date_time_data,
            duration_field=None

         )]

    def resolve_register_end(self, info, user_id):
        result = CalendarFactory.register_out(user_id)
        return [RegisterResponseType(
            datetime_field=result.date_time_data,
            duration_field=result.duree_data)]


class CreateUser(graphene.Mutation):
    class Arguments:
        username = graphene.String(required=True)
        last_name = graphene.String(required=True)
        email = graphene.String(required=True)
        telephone = graphene.String(required=True)
        team_id = graphene.ID(required=False)
        password = graphene.String(required=True)

    user = graphene.Field(UserType)

    def mutate(self, info, username, last_name, email, telephone, password,
               team_id=None):
        # Si l'utilisateur appartient à une équipe
        user = UserFactory.create_new_user(username, last_name, email,
                                           telephone, team_id, password)
        return CreateUser(user=user)


class CreateTeam(graphene.Mutation):
    class Arguments:
        name = graphene.String(required=True)
        description = graphene.String(required=False)

    team = graphene.Field(TeamType)

    def mutate(self, info, name, description=None):
        team = TeamFactory.create_team(name, description)
        return CreateTeam(team=team)


class Mutation(graphene.ObjectType):
    create_user = CreateUser.Field()
    create_team = CreateTeam.Field()
