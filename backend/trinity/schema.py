import graphene
from graphene_django.types import DjangoObjectType
from .models import User, Team, Calendrier


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

    def resolve_all_users(self, info, *kwargs):
        return User.objects.all()

    def resolve_all_teams(self, info, *kwargs):
        return Team.objects.all()

    def resolve_all_Calendriers(self, info, *kwargs):
        return Calendrier.objects.all()
    

class CreateUser(graphene.Mutation):
    class Arguments:
        username = graphene.String(required=True)
        last_name = graphene.String(required=True)
        email = graphene.String(required=True)
        telephone = graphene.String(required=True)
        team_id = graphene.ID(required=False)

    user = graphene.Field(UserType)

    def mutate(self, info, username, last_name, email, telephone, team_id=None):
        # Si l'utilisateur appartient à une équipe
        team = None
        if team_id:
            try:
                team = Team.objects.get(pk=team_id)
            except Team.DoesNotExist:
                raise Exception("Équipe introuvable.")

        # Création de l'utilisateur
        user = User.objects.create(
            username=username,
            last_name=last_name,
            email=email,
            telephone=telephone,
            team=team
                    )

        return CreateUser(user=user)


class Mutation(graphene.ObjectType):
    create_user = CreateUser.Field()