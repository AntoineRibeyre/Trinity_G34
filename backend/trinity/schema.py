import graphene
import graphql_jwt
from graphene_django.types import DjangoObjectType
from .models import User, Team, Calendrier


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


class Query(graphene.ObjectType):
    all_users = graphene.List(UserType)
    all_teams = graphene.List(TeamType)
    all_Calendriers = graphene.List(CalendrierType)

    def resolve_all_users(self, info, *kwargs):
        return User.objects.all()

    def resolve_all_teams(self, info, *kwargs):
        return Team.objects.all()

    def resolve_all_Calendriers(self, info, *kwargs):
        return Calendrier.objects.all()
    

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
        team = None
        if team_id:
            try:
                team = Team.objects.get(pk=team_id)
            except Team.DoesNotExist:
                raise Exception("Équipe introuvable.")

        # Création de l'utilisateur
        user = User.objects.create_user(
            username=username,
            first_name=first_name,
            last_name=last_name,
            email=email,
            telephone=telephone,
            team=team,
            password=password,
            role=role
                    )

        return CreateUser(user=user)


class Mutation(graphene.ObjectType):
    token_auth = graphql_jwt.ObtainJSONWebToken.Field() # Login avec token
    verify_token = graphql_jwt.Verify.Field() # Vérification de la validité du token
    refresh_token = graphql_jwt.Refresh.Field() # Refresh du token


    create_user = CreateUser.Field()

# Schema final
schema = graphene.Schema(query=Query, mutation=Mutation)