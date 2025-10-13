import datetime
from zoneinfo import ZoneInfo
from typing import Dict


from ..models import Calendar, User


class CalendarQueryOutput:
    date_time_data: Dict[str, int]
    duration_data: Dict[str, int] | None

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


class CalendarFactory:

    @classmethod
    def create_calendar(cls, user_id: int) -> CalendarQueryOutput:
        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            raise Exception("Employee not found!")
        calendrier = Calendar.objects.create(
            begin=datetime.datetime.now(ZoneInfo("Europe/Paris")),
            end=None,
            day_type=None,
            employee=user,
            day_over=False,
            duration=None)
        return CalendarQueryOutput(calendrier.begin, None)

    @classmethod
    def close_calendar(cls, user_id: int) -> CalendarQueryOutput:
        try:
            user = User.objects.get(pk=user_id)
            calendar = Calendar.objects.filter(employee=user).last()
        except (User.DoesNotExist, Calendar.DoesNotExist) as e:
            raise Exception(str(e))
        end = datetime.datetime.now(ZoneInfo("Europe/Paris"))
        duration = end - calendar.begin
        if calendar.day_over is True:
            raise Exception("Day over")
        calendar.day_over = True
        calendar.end = end
        calendar.duration = duration
        calendar.save_base()
        return CalendarQueryOutput(end, duration)
    @classmethod
    def register_arrival(cls, user_id: int) -> CalendarQueryOutput:
        return CalendarFactory.create_calendar(user_id)

    @classmethod
    def register_out(cls, user_id: int) -> CalendarQueryOutput:
        return CalendarFactory.close_calendar(user_id)
