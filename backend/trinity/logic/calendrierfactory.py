from dataclasses import dataclass
import datetime
from zoneinfo import ZoneInfo

from ..models import Calendrier, User


@dataclass
class CalendrierQueryOutput:
    date_time_data: datetime.datetime
    duree_data: datetime.time | None


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
        return CalendrierQueryOutput(date_time_data=calendrier.debut, duree_data=None)

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
        return CalendrierQueryOutput(date_time_data=cloture, duree_data=datetime.time(second=duree.seconds))
    @classmethod
    def enregistrer_arriver(cls, user_id: int) -> CalendrierQueryOutput:
        return CalendrierFactory.create_calendrier(user_id)

    @classmethod
    def enregister_sortie(cls, user_id: int) -> CalendrierQueryOutput:
        return CalendrierFactory.close_calendrier(user_id)