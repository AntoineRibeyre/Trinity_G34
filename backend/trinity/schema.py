import graphene
import graphql_jwt
from graphene_django.types import DjangoObjectType
from .models import User, Team, Calendrier
from .logic.userfactory import UserFactory
from .logic.teamfactory import TeamFactory
from .logic.calendrierfactory import CalendrierFactory, CalendrierQueryOutput


class UserType(DjangoObjectType):
    class Meta:
        model = User
        exclude= ("password",)


class TeamType(DjangoObjectType):
    class Meta:
        model = Team


class CalendrierType(DjangoObjectType):
    class Meta:
        model = Calendrier


class PointageResponseType(graphene.ObjectType):
    datetime_field = graphene.JSONString()
    duration_field = graphene.JSONString()


class Query(graphene.ObjectType):
    all_users = graphene.List(UserType)
    all_teams = graphene.List(TeamType)
    all_Calendriers = graphene.List(CalendrierType)
    pointage_arrivee = graphene.List(PointageResponseType, user_id=graphene.Int(required=True))
    pointage_fin = graphene.List(PointageResponseType, user_id=graphene.Int(required=True))

    def resolve_all_users(self, info, *kwargs):
        return User.objects.all()

    def resolve_all_teams(self, info, *kwargs):
        return Team.objects.all()

    def resolve_all_Calendriers(self, info, *kwargs):
        return Calendrier.objects.all()

    def resolve_pointage_arrivee(self, info, user_id):
        result = CalendrierFactory.enregistrer_arriver(user_id)
        return [PointageResponseType(
            datetime_field=result.date_time_data,
            duration_field=None

         )]

    def resolve_pointage_fin(self, info, user_id):
        result = CalendrierFactory.enregister_sortie(user_id)
        return [PointageResponseType(
            datetime_field=result.date_time_data,
            duration_field=result.duree_data)]


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


class Mutation(graphene.ObjectType):
    token_auth = graphql_jwt.ObtainJSONWebToken.Field() # Login avec token
    verify_token = graphql_jwt.Verify.Field() # Vérification de la validité du token
    refresh_token = graphql_jwt.Refresh.Field() # Refresh du token


    create_user = CreateUser.Field()
    create_team = CreateTeam.Field()


# Schema final
schema = graphene.Schema(query=Query, mutation=Mutation)