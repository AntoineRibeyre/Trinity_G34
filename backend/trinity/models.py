from django.db import models
from django.contrib.auth.models import AbstractUser


class Team(models.Model):
    name = models.CharField(max_length=100, null=False)
    description = models.CharField(max_length=100, null=True)

    """This class defines the data structure of a team"""


class User(AbstractUser):
    # Django handles already  username, password, email, etc.
    username = models.CharField(blank=True, null=True)
    email = models.EmailField(unique=True)
    telephone = models.CharField(max_length=100, blank=True, null=True)
    role = models.CharField(max_length=100, blank=True, null=True)
    team = models.ForeignKey(Team, null=True, blank=True,
                             on_delete=models.SET_NULL, related_name="membres")
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.first_name

    """This class defines a data structure of an  employee"""


class Calendar(models.Model):
    begin = models.DateTimeField(null=False)
    end = models.DateTimeField(null=True)
    day_type = models.TextField(max_length=100, null=True)
    employee = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="Calendar", null=False)
    day_over = models.BooleanField(null=False)
    duration = models.DurationField(null=True)

    def save(self, **kwargs):
        return super().save(**kwargs)

    """This class defines the data structure of a calendar"""
