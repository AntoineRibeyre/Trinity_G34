import datetime
from zoneinfo import ZoneInfo
from typing import Dict


from ..models import Calendrier, User


class CalendrierQueryOutput:
    date_time_data: Dict[str, int]
    duree_data: Dict[str, int] | None

    def __init__(self, datetime: datetime.datetime,
                 duration: datetime.timedelta | None):
        self.date_time_data = {
            'hour': datetime.hour,
            'minute': datetime.minute,
            'second': datetime.second,
            'year': datetime.year,
            'month': datetime.month,
            'day': datetime.day
        }
        if duration is None:
            self.duree_data = None
        else:
            seconds = duration.seconds
            hours = seconds // 3600
            minutes = (seconds % 3600) // 60
            second = seconds % 60 
            self.duree_data = {
                'hours': hours,
                'minutes': minutes,
                'seconds': second
                
            }


class CalendrierFactory:

    @classmethod
    def create_calendrier(cls, user_id: int) -> CalendrierQueryOutput:
        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            raise Exception("User introuvable !")
        calendrier =  Calendrier.objects.create(
            debut=datetime.datetime.now(ZoneInfo("Europe/Paris")),
            fin=None,
            type_journee=None,
            employee=user,
            journee_finie=False,
            duree=None)
        return CalendrierQueryOutput(calendrier.debut, None)

    @classmethod
    def close_calendrier(cls, user_id: int) -> CalendrierQueryOutput:
        try:
            user = User.objects.get(pk=user_id)
            calendrier = Calendrier.objects.filter(employee=user).last()
        except (User.DoesNotExist, Calendrier.DoesNotExist) as e:
            raise Exception(str(e))
        cloture = datetime.datetime.now(ZoneInfo("Europe/Paris"))
        duree = cloture - calendrier.debut
        if calendrier.journee_finie is True:
            raise Exception("Journée finie")
        calendrier.journee_finie = True
        calendrier.fin = cloture
        calendrier.duree = duree
        calendrier.save_base()
        return CalendrierQueryOutput(cloture, duree)
    @classmethod
    def enregistrer_arriver(cls, user_id: int) -> CalendrierQueryOutput:
        return CalendrierFactory.create_calendrier(user_id)

    @classmethod
    def enregister_sortie(cls, user_id: int) -> CalendrierQueryOutput:
        return CalendrierFactory.close_calendrier(user_id)