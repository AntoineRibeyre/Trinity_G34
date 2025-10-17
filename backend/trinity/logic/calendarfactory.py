import datetime
from zoneinfo import ZoneInfo
from typing import Dict, List
from dataclasses import dataclass


from ..models import Calendar, User


@dataclass
class DailyPlanning:
    date: str
    calendars: List[Calendar]
    total_hours: datetime.timedelta
    """This class containes for a user a sorted calendars by date """
    def add_calendar(self, calendar: Calendar) -> None:
        """This method adds a new calendar to the list of calendars."""
        self.calendars.append(calendar)

    def upadate_total_hours(self, duration: datetime.timedelta | None) -> None:
        """This method updates if necessary the total_duration of a day when a
        new calendar is added to the list."""
        if duration is None:
            pass
        else:
            self.total_hours += duration


class CalendarQueryOutput:
    date_time_data: Dict[str, int]
    duration_data: Dict[str, int] | None
    """This class converts date and time data and
    builds dictionaries to be returned as a
    JSONResponse with GraphQL queries."""

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
                'seconds': second}


class CalendarFactory:
    """This class serves as a factory and manager for Calendar objects."""

    @classmethod
    def create_calendar(cls, user_id: int) -> CalendarQueryOutput:
        """This method communicates with the calendar model and retrieves the
        latest calendar object from the SQL database."""
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
        """This method manipulates the latest calendar element to close it."""
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
        """This method is used by the register_arrival mutation to create a new
        calendar element with the arrival time."""
        return CalendarFactory.create_calendar(user_id)

    @classmethod
    def register_out(cls, user_id: int) -> CalendarQueryOutput:
        """This method is used by the register_out mutation to record the
        employee's departure time."""
        return CalendarFactory.close_calendar(user_id)

    @classmethod
    def get_calendars_by_user(cls, user: User) -> List[Calendar]:
        """This method retrieves all calendars of a user."""
        return Calendar.objects.filter(employee=user).all()

    @classmethod
    def get_sorted_planning(cls, user: User) -> Dict[str, DailyPlanning]:
        """This class sorts all plannings and returns a dictionary with sorted
        daily calendars."""
        sorted_planning_by_date: Dict[str, DailyPlanning] = {}
        calendars = CalendarFactory.get_calendars_by_user(user)
        for calendar in calendars:
            date = calendar.begin.date().strftime("%Y-%m-%d")
            # Check if the date exists in the dictionary keys
            if date not in sorted_planning_by_date.keys():
                # Add a daily planning under a new key
                new_daily_planning = DailyPlanning(date=date,
                                                   calendars=[calendar],
                                                   total_hours=calendar.duration)
                sorted_planning_by_date[date] = new_daily_planning
            else:
                # Updating the existing planning
                current_planning = sorted_planning_by_date[date]
                current_planning.add_calendar(calendar)
                current_planning.upadate_total_hours(calendar.duration)
        return sorted_planning_by_date
