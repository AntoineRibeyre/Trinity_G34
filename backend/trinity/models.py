from django.db import models
from django.contrib.auth.models import AbstractUser
# Create your models here.


class Team(models.Model):
    name = models.CharField(max_length=100, null=False)
    description = models.CharField(max_length=100, null=True)

    """This class defines the data structure of a team"""


class User(AbstractUser):
    # Django gère déjà username, password, email, etc.
    username=models.CharField(blank=True,null=True)
    email = models.EmailField(unique=True)
    telephone = models.CharField(max_length=100, blank=True, null=True)
    role = models.CharField(max_length=100, blank=True, null=True)
    team = models.ForeignKey(Team, null=True, blank=True,
                             on_delete=models.SET_NULL, related_name="membres")

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['']
    def __str__(self):
        return self.first_name

    """This class defines a datastructure of an  employee"""


class Calendrier(models.Model):
    debut = models.DateTimeField(null=False)
    fin = models.DateTimeField(null=True)
    type_journee = models.TextField(max_length=100, null=True)
    employee = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="calendrier", null=False)
    journee_finie = models.BooleanField(null=False)
    duree = models.DurationField(null=True)

    def save(self, **kwargs):
        return super().save(**kwargs)

    """This class defines the data structure of a calendar"""
