import datetime
from zoneinfo import ZoneInfo

import graphene
import graphql_jwt
from django.contrib.auth.hashers import make_password

from .graphtypes import TeamType, UserType, DailyWorkType, CreateEvent, UpdateEvent, DeleteEvent, \
    AddAttendeeToEvent, RemoveAttendeeFromEvent
from ..models import Calendar, Event, Team, User
from ..logic.userfactory import UserFactory
from ..logic.teamfactory import TeamFactory
from ..logic.calendarfactory import CalendarFactory
from . import graphtypes as graphtype
from .queryresolver import QueryResolver
from ..mutations.mutation_logout import LogoutMutation
from ..mutations.mutation_token import CustomObtainJSONWebToken

# User = get_user_model()

class Query(graphene.ObjectType):
    """This class is used to list and resolve all possible GraphQL queries."""
    all_users = graphene.List(UserType)
    all_teams = graphene.List(TeamType)
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
    all_calendars_by_user = graphene.List(
        graphtype.CalendarType,
        user_id=graphene.Int(required=True)
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

    def resolve_all_calendars_by_user(self, info, user_id):
        """Récupère toutes les entrées Calendar d'un utilisateur, triées par date de début"""
        try:
            user = User.objects.get(id=user_id)
            calendars = CalendarFactory.get_calendars_by_user(user)
            return calendars.order_by('begin')
        except User.DoesNotExist:
            return []

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

    def resolve_all_teams(self, info):
        return Team.objects.all()


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
            user.team = None
            user.save()
            return DeleteUser(ok=True, message=f"Utilisateur {user_id} supprimé avec succès.")
        except User.DoesNotExist:
            return DeleteUser(ok=False, message="Utilisateur introuvable.")
        except Exception as e:
            return DeleteUser(ok=False, message=f"Erreur: {str(e)}")


class UserInput(graphene.InputObjectType):
    username = graphene.String(required=False)
    firstName = graphene.String(required=False)
    lastName = graphene.String(required=False)
    email = graphene.String(required=False)
    password = graphene.String(required=False)
    telephone = graphene.String(required=False)
    role = graphene.String(required=False)
    teamId = graphene.Int(required=False)
    socialNumber = graphene.BigInt(required=False)
    contract = graphene.String(required=False)
    arrivalDate = graphene.String(required=False)
    annualSalary = graphene.Int(required=False)
    birthDate = graphene.String(required=False)
    workingHours = graphene.Int(required=False)
    leaves = graphene.Int(required=False)
    isActive = graphene.Boolean(required=False)

class UpdateUser(graphene.Mutation):
    class Arguments:
        user_data = UserInput(required=True)  # ✅ Changé de "info" à "user_data"
        userId = graphene.Int(required=False)

    user = graphene.Field(UserType)

    def mutate(self, info, user_data, userId=None):  # ✅ Plus de conflit
        caller = info.context.user
        if not caller.is_authenticated:
            raise Exception("Authentification requise")

        # Determine the target user: caller by default, or userId if provided and caller has rights
        target_user = caller
        if userId is not None:
            # Allow only staff/superuser or role 'admin' to update other users
            is_admin = getattr(caller, 'is_staff', False) or getattr(caller, 'is_superuser', False) or getattr(caller, 'role', '') == 'admin'
            if not is_admin:
                raise Exception("Droits insuffisants pour modifier un autre utilisateur")
            try:
                target_user = User.objects.get(id=userId)
            except User.DoesNotExist:
                raise Exception("Utilisateur cible introuvable")

        # Update simple string/int/boolean fields if provided (map camelCase input to model fields)
        if getattr(user_data, 'username', None) is not None:
            target_user.username = user_data.username
        if getattr(user_data, 'firstName', None) is not None:
            target_user.first_name = user_data.firstName
        if getattr(user_data, 'lastName', None) is not None:
            target_user.last_name = user_data.lastName
        if getattr(user_data, 'email', None) is not None:
            target_user.email = user_data.email
        if getattr(user_data, 'telephone', None) is not None:
            target_user.telephone = user_data.telephone
        if getattr(user_data, 'role', None) is not None:
            target_user.role = user_data.role
        if getattr(user_data, 'socialNumber', None) is not None:
            target_user.social_number = user_data.socialNumber
        if getattr(user_data, 'contract', None) is not None:
            target_user.contract = user_data.contract
        if getattr(user_data, 'annualSalary', None) is not None:
            target_user.annual_salary = user_data.annualSalary
        if getattr(user_data, 'workingHours', None) is not None:
            target_user.working_hours = user_data.workingHours
        if getattr(user_data, 'leaves', None) is not None:
            target_user.leaves = user_data.leaves
        if getattr(user_data, 'isActive', None) is not None:
            target_user.is_active = user_data.isActive

        # Handle password separately (hash it)
        if getattr(user_data, 'password', None):
            target_user.password = make_password(user_data.password)

        # Handle team relation if teamId provided
        team_id = getattr(user_data, 'teamId', None)
        if team_id is not None:
            try:
                team = Team.objects.get(id=team_id)
                target_user.team = team
            except Team.DoesNotExist:
                target_user.team = None

        # Parse dates if provided (expecting ISO format YYYY-MM-DD)
        arrival_date = getattr(user_data, 'arrivalDate', None)
        if arrival_date is not None:
            try:
                target_user.arrival_date = datetime.date.fromisoformat(arrival_date)
            except Exception:
                # ignore or leave unchanged on parse error
                pass

        birth_date = getattr(user_data, 'birthDate', None)
        if birth_date is not None:
            try:
                target_user.birth_date = datetime.date.fromisoformat(birth_date)
            except Exception:
                pass

        target_user.save()
        return UpdateUser(user=target_user)

class CreateTeam(graphene.Mutation):
    """This class is a GraphQL mutation that creates a new team and pushes it
    to the database."""
    class Arguments:
        name = graphene.String(required=True)
        description = graphene.String(required=False)
        field = graphene.String(required=True)
        managerID = graphene.Int(required=True)

    team = graphene.Field(graphtype.TeamType)

    def mutate(self, info, name, field, managerID, description=None):
        print(f"{managerID} manager")
        team = TeamFactory.create_team(name, field, description)
        manager = User.objects.filter(id=managerID)
        print(f"{manager}")
        team.members.add(*manager)
        return CreateTeam(team=team)
    
class DeleteTeam(graphene.Mutation):
    class Arguments:
        team_id = graphene.Int(required=True)

    ok = graphene.Boolean()
    message = graphene.String()

    def mutate(self, info, team_id):
        try:
            team = Team.objects.get(id=team_id)
            team_name = team.name
            
            # Retirer tous les membres de l'équipe
            team.members.clear()
            
            # Supprimer l'équipe
            team.delete()
            
            return DeleteTeam(
                ok=True, 
                message=f"Équipe '{team_name}' supprimée avec succès."
            )
        except Team.DoesNotExist:
            return DeleteTeam(
                ok=False, 
                message="Équipe introuvable."
            )
        except Exception as e:
            return DeleteTeam(
                ok=False, 
                message=f"Erreur : {str(e)}"
            )
        
class ChangeTeamManager(graphene.Mutation):
    class Arguments:
        team_id = graphene.Int(required=True)
        new_manager_id = graphene.Int(required=True)

    message = graphene.String()

    def mutate(self, info, team_id, new_manager_id):
        try:
            team = Team.objects.get(id=team_id)
            new_manager = User.objects.get(id=new_manager_id)
            # on récupère l'utilisateur présent dans la liste 'members' de l'équipe qui possède le role de manager
            old_manager = team.members.filter(role='manager').first()
            if old_manager:
                team.members.remove(old_manager)
            # Vérifier si le nouveau manager est déjà membre de l'équipe
            if not team.members.filter(id=new_manager_id).exists():
                team.members.add(new_manager)

            return ChangeTeamManager(
                message="Le manager de l'équipe a été mis à jour avec succès."
            )
        except Team.DoesNotExist:
            return ChangeTeamManager(
                message="Équipe introuvable."
            )
        except User.DoesNotExist:
            return ChangeTeamManager(
                message="Utilisateur introuvable."
            )
        except Exception as e:
            return ChangeTeamManager(
                message=f"Erreur : {str(e)}"
            )
        
class TeamInput(graphene.InputObjectType):
    id = graphene.Int(required=True)
    name = graphene.String(required=False)
    description = graphene.String(required=False)
    field = graphene.String(required=False)
    manager_id = graphene.Int(required=False)        

class UpdateTeam(graphene.Mutation) :
    class Arguments:
        team_to_update = TeamInput(required=True)
    
    message = graphene.String()

    def mutate(self, info, team_to_update):
        try:
            team = Team.objects.get(id=team_to_update.id)
            if team_to_update.name is not None:
                team.name = team_to_update.name
            if team_to_update.description is not None:
                team.description = team_to_update.description
            if team_to_update.field is not None:
                team.field = team_to_update.field
            team.save()
            return UpdateTeam(
                message="Mise à jour effectuée avec succès",
            )
        except Team.DoesNotExist:
            return UpdateTeam(
                message="Équipe introuvable",
            )
        except Exception as e:
            return UpdateTeam(
                message=f"Erreur : {str(e)}",
            )
        


class AddEmployeeToTeam(graphene.Mutation):
    class Arguments:
        teamId = graphene.Int(required=True)
        employeeIds = graphene.List(graphene.Int, required=True)

    message = graphene.String()
    team = graphene.Field(TeamType)  # Ajoutez ceci pour retourner l'équipe mise à jour

    def mutate(self, info, teamId, employeeIds):
        try:
            # Récupérer l'équipe
            team = Team.objects.get(id=teamId)

            # Récupérer tous les employés
            employees = User.objects.filter(id__in=employeeIds)

            # Vérifier que tous les employés existent
            if employees.count() != len(employeeIds):
                return AddEmployeeToTeam(
                    message="Certains employés n'existent pas",
                    team=None
                )

            # Ajouter les employés à l'équipe
            team.members.add(*employees)

            return AddEmployeeToTeam(
                message=f"{employees.count()} employé(s) ajouté(s) avec succès",
                team=team
            )

        except Team.DoesNotExist:
            return AddEmployeeToTeam(
                message="Équipe introuvable",
                team=None
            )
        except Exception as e:
            return AddEmployeeToTeam(
                message=f"Erreur : {str(e)}",
                team=None
            )
        
class DeleteMember(graphene.Mutation):
    class Arguments:
        teamId = graphene.Int(required=True)
        employeeIds = graphene.List(graphene.Int, required=True)

    message = graphene.String()
    team = graphene.Field(TeamType)  # Ajoutez ceci pour retourner l'équipe mise à jour

    def mutate(self, info, teamId, employeeIds):
        try:
            # Récupérer l'équipe
            team = Team.objects.get(id=teamId)

            # Récupérer tous les employés
            employees = User.objects.filter(id__in=employeeIds)

            # Vérifier que tous les employés existent
            if employees.count() != len(employeeIds):
                return DeleteMember(
                    message="Certains employés n'existent pas",
                    team=None
                )

            # Retirer les employés de l'équipe
            team.members.remove(*employees)

            return DeleteMember(
                message=f"{employees.count()} employé(s) retirés de la team avec succès",
                team=team
            )

        except Team.DoesNotExist:
            return DeleteMember(
                message="Équipe introuvable",
                team=None
            )
        except Exception as e:
            return DeleteMember(
                message=f"Erreur : {str(e)}",
                team=None
            )

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
    update_team = UpdateTeam.Field()
    delete_team = DeleteTeam.Field()
    change_team_manager = ChangeTeamManager.Field()
    delete_member = DeleteMember.Field()
    register_arrival = RegisterArrival.Field()
    add_employee_to_team = AddEmployeeToTeam.Field()
    register_end = RegisterEnd.Field()
    logout = LogoutMutation.Field()
    create_event = CreateEvent.Field()
    update_event = UpdateEvent.Field()
    delete_event = DeleteEvent.Field()
    update_event_attendees = UpdateEvent.Field()
    add_attendee = AddAttendeeToEvent.Field()
    remove_attendee = RemoveAttendeeFromEvent.Field()
    update_user = UpdateUser.Field()
    delete_user = DeleteUser.Field()


# final schema
schema = graphene.Schema(query=Query, mutation=Mutation)
