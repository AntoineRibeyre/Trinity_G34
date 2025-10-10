from django.db import models
from django.contrib.auth.models import AbstractUser
# Create your models here.


class Team(models.Model):
    name = models.CharField(max_length=100)
    description = models.CharField(max_length=100)

    """This class defines the data structure of a team"""


class User(AbstractUser):
    # Django gère déjà username, password, email, etc.
    email = models.EmailField(unique=True)
    telephone = models.CharField(max_length=100, blank=True, null=True)
    role = models.CharField(max_length=100, blank=True, null=True)
    team = models.ForeignKey(Team, null=True, blank=True, on_delete=models.SET_NULL, related_name="membres")

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    def __str__(self):
        return self.username

    """This class defines a datastructure of an  employee"""


class Calendrier(models.Model):
    date = models.DateField()
    heure_debut = models.TimeField()
    heure_fin = models.TimeField()
    type_journee = models.TextField(max_length=100)
    employee = models.ForeignKey(User, on_delete=models.CASCADE, related_name="calendrier")

    """This class defines the data structure of a calendar"""



