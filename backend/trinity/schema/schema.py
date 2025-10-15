import graphene
import graphql_jwt
from ..models import User, Team, Calendar
from ..logic.userfactory import UserFactory
from ..logic.teamfactory import TeamFactory
from ..logic.calendarfactory import CalendarFactory
import backend.trinity.schema.graphtypes as graphtype


class Query(graphene.ObjectType):
    """This class is used to list and resolve all possible GraphQL queries."""
    all_users = graphene.List(graphtype.UserType)
    all_teams = graphene.List(graphtype.TeamType)
    all_calendars = graphene.List(graphtype.CalendarType)
    pending_day = graphene.Field(
        graphtype.CalendarType,
        user_id=graphene.Int(required=True)
    )
    manager_view = graphene.Field(graphtype.TeamViewType,
                                  manager_id=graphene.Int(required=True))

    def resolve_all_users(self, info, *kwargs):
        return User.objects.all()

    def resolve_all_teams(self, info, *kwargs):
        return Team.objects.all()

    def resolve_all_calendars(self, info, *kwargs):
        return Calendar.objects.all()

    def resolve_pending_day(self, info, user_id):
        """This method resolve pending_day querey """
        try:
            return Calendar.objects.filter(
                employee_id=user_id,
                day_over=False
            ).last()
        except Calendar.DoesNotExist:
            return None

    def resolve_manager_view(self, info, manager_id: int):
        """This method shows all the team details"""
        result = graphtype.ObjectTypeFactory.team_viewer_type_builder(
            manager_id)
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
