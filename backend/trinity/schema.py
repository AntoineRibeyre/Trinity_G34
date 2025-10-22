import datetime
from zoneinfo import ZoneInfo
import graphene
import graphql_jwt
from graphene_django.types import DjangoObjectType
from .models import User, Team, Calendar, Event
from .logic.userfactory import UserFactory
from .logic.teamfactory import TeamFactory
from .logic.calendarfactory import CalendarFactory
from django.utils import timezone

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

class EventType(DjangoObjectType):
    class Meta:
        model = Event
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


class RegisterResponseType(graphene.ObjectType):
    datetime_field = graphene.JSONString()
    duration_field = graphene.JSONString()


# Création d'un USER
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


# Création d'une TEAM
class CreateTeam(graphene.Mutation):
    class Arguments:
        name = graphene.String(required=True)
        description = graphene.String(required=False)

    team = graphene.Field(TeamType)

    def mutate(self, info, name, description=None):
        team = TeamFactory.create_team(name, description)
        return CreateTeam(team=team)



# Création d'un EVENT
class CreateEvent(graphene.Mutation):
    class Arguments:
        subject = graphene.String(required=True)
        start_time = graphene.DateTime(required=True)
        end_time = graphene.DateTime(required=True)
        is_all_day = graphene.Boolean(required=False)
        attendee_ids = graphene.List(graphene.Int)
    event = graphene.Field(EventType)
    success = graphene.Boolean()
    message = graphene.String()

    def mutate(self, info, subject, start_time, end_time,attendee_ids, is_all_day=False):
        try:
            event = Event.objects.create(
                subject=subject,
                start_time=start_time,
                end_time=end_time,
                is_all_day=is_all_day
            )
            if attendee_ids:
                event.attendees.set(User.objects.filter(id__in=attendee_ids))
            return CreateEvent(event=event, success=True, message="Événement créé avec succès")
        except Exception as e:
            return CreateEvent(event=None, success=False, message=str(e))


class UpdateEvent(graphene.Mutation):
    class Arguments:
        event_id = graphene.Int(required=True)
        subject = graphene.String(required=True)
        start_time = graphene.DateTime(required=True)
        end_time = graphene.DateTime(required=True)
        is_all_day = graphene.Boolean(required=False)
        attendee_ids = graphene.List(graphene.Int, required=False)
    
    event = graphene.Field(EventType)
    success = graphene.Boolean()
    message = graphene.String()
    
    def mutate(self, info, event_id, subject, start_time, end_time, is_all_day=False, attendee_ids=None):
        try:
            # Récupérer l'événement
            event = Event.objects.get(id=event_id)
            
            # Mettre à jour les champs (sans .set(), directement)
            event.subject = subject
            event.start_time = start_time
            event.end_time = end_time
            event.is_all_day = is_all_day
            
            # Sauvegarder les modifications
            event.save()
            
            # Mettre à jour les participants (ManyToMany)
            if attendee_ids is not None:
                event.attendees.set(User.objects.filter(id__in=attendee_ids))
            
            return UpdateEvent(
                event=event,
                success=True,
                message="Événement mis à jour avec succès"
            )
        except Event.DoesNotExist:
            return UpdateEvent(
                event=None,
                success=False,
                message=f"Événement avec l'ID {event_id} introuvable"
            )
        except Exception as e:
            return UpdateEvent(
                event=None,
                success=False,
                message=f"Erreur lors de la mise à jour: {str(e)}"
            )

    

class AddAttendeeToEvent(graphene.Mutation):
    class Arguments:
        event_id = graphene.Int(required=True)
        user_id = graphene.Int(required=True)
    
    event = graphene.Field(EventType)
    
    def mutate(self, info, event_id, user_id):
        event = Event.objects.get(id=event_id)
        user = User.objects.get(id=user_id)
        event.attendees.add(user)
        return AddAttendeeToEvent(event=event)
    

class RemoveAttendeeFromEvent(graphene.Mutation):
    class Arguments:
        event_id = graphene.Int(required=True)
        user_id = graphene.Int(required=True)
    
    event = graphene.Field(EventType)
    
    def mutate(self, info, event_id, user_id):
        event = Event.objects.get(id=event_id)
        user = User.objects.get(id=user_id)
        event.attendees.remove(user)
        return RemoveAttendeeFromEvent(event=event)

class DeleteEvent(graphene.Mutation):
    class Arguments:
        event_id = graphene.Int(required=True)
    
    success = graphene.Boolean()
    message = graphene.String()

    def mutate(self, info, event_id):
        try:
            # Récupérer l'événement
            event = Event.objects.get(id=event_id)
            
            # Supprimer l'événement (avec les parenthèses!)
            event.delete()
            
            return DeleteEvent(
                success=True,
                message="Événement supprimé avec succès"
            )
        except Event.DoesNotExist:
            return DeleteEvent(
                success=False,
                message=f"Événement avec l'ID {event_id} introuvable"
            )
        except Exception as e:
            return DeleteEvent(
                success=False,
                message=f"Erreur lors de la suppression: {str(e)}"
            )


# Enregistrement de l'arrivée
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

# Enregistrement du départ
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

# Toutes les queries
class Query(graphene.ObjectType):
    all_users = graphene.List(UserType)
    all_teams = graphene.List(TeamType)
    all_calendars = graphene.List(CalendarType)
    all_events = graphene.List(EventType)
    event = graphene.Field(EventType, id=graphene.Int(required=True))
    pending_day = graphene.Field(
        CalendarType,
        user_id=graphene.Int(required=True)
    )
    today_calendars = graphene.List(
        CalendarType,
        user_id=graphene.Int()
    )
    current_user = graphene.Field(UserType) # utilisateur connecté


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
    
    def resolve_all_events(self, info):
        return Event.objects.prefetch_related('attendees').all().order_by('-created_at')
    
    def resolve_event(self, info, id):
        return Event.objects.prefetch_related('attendees').get(id=id)

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


# Toutes les mutations
class Mutation(graphene.ObjectType):
    token_auth = CustomObtainJSONWebToken.Field() # Login personnalisé avec token
    verify_token = graphql_jwt.Verify.Field() # Vérification de la validité du token
    refresh_token = graphql_jwt.Refresh.Field() # Refresh du token

    create_event = CreateEvent.Field()
    update_event = UpdateEvent.Field()
    delete_event = DeleteEvent.Field()
    update_event_attendees = UpdateEvent.Field()
    add_attendee = AddAttendeeToEvent.Field()
    remove_attendee = RemoveAttendeeFromEvent.Field()
    create_user = CreateUser.Field()
    create_team = CreateTeam.Field()

    register_arrival = RegisterArrival.Field()
    register_end = RegisterEnd.Field()

    # login = LoginMutation.Field()
    logout = LogoutMutation.Field()
# Schema final
schema = graphene.Schema(query=Query, mutation=Mutation)