import graphene
import graphql_jwt
from ..models import Calendar
from ..logic.userfactory import UserFactory
from ..logic.teamfactory import TeamFactory
from ..logic.calendarfactory import CalendarFactory
from . import graphtypes as graphtype
from .queryresolver import QueryResolver


class Query(graphene.ObjectType):
    """This class is used to list and resolve all possible GraphQL queries."""
    pending_day = graphene.Field(
        graphtype.CalendarType,
        user_id=graphene.Int(required=True)
    )
    manager_view = graphene.Field(graphtype.TeamViewerType,
                                  manager_id=graphene.Int(required=True))
    admin_view = graphene.Field(graphtype.AdminViewType,
                                admin_id=graphene.Int(required=True))

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
    token_auth = graphql_jwt.ObtainJSONWebToken.Field()  # Login with token
    verify_token = graphql_jwt.Verify.Field()  # verifying the token
    refresh_token = graphql_jwt.Refresh.Field()  # Refresh of the token
    create_user = CreateUser.Field()
    create_team = CreateTeam.Field()
    register_arrival = RegisterArrival.Field()
    register_end = RegisterEnd.Field()


# final schema
schema = graphene.Schema(query=Query, mutation=Mutation)
