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