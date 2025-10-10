
import graphene
from graphene_django.types import DjangoObjectType

from .models import User, Team, Calendrier
from .logic.userfactory import UserFactory
from .logic.teamfactory import TeamFactory
from .logic.calendrierfactory import CalendrierFactory


class UserType(DjangoObjectType):
    class Meta:
        model = User


class TeamType(DjangoObjectType):
    class Meta:
        model = Team


class CalendrierType(DjangoObjectType):
    class Meta:
        model = Calendrier


class Query(graphene.ObjectType):
    all_users = graphene.List(UserType)
    all_teams = graphene.List(TeamType)
    all_Calendriers = graphene.List(CalendrierType)
    pointage_arrivee = graphene.String(user_id=graphene.Int(required=True))
    pointage_fin = graphene.String(user_id=graphene.Int(required=True))

    def resolve_all_users(self, info, *kwargs):
        return User.objects.all()

    def resolve_all_teams(self, info, *kwargs):
        return Team.objects.all()

    def resolve_all_Calendriers(self, info, *kwargs):
        return Calendrier.objects.all()

    def resolve_pointage_arrivee(self, info, user_id):
        date = CalendrierFactory.enregistrer_arriver(user_id)
        return date.strftime("%Y-%m-%d, %H:%M:%S")

    def resolve_pointage_fin(self, info, user_id):
        date = CalendrierFactory.enregister_sortie(user_id)
        
        return date.strftime("%Y-%m-%d, %H:%M:%S")


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