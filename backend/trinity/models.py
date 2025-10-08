from django.db import models


# Create your models here.


class Team(models.Model):
    id = models.IntegerField(primary_key=True)
    name = models.CharField(max_length=100)
    description = models.CharField(max_length=100)
    """This class defines the data structure of a team"""


class User(models.Model):
    id = models.IntegerField(primary_key=True)
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    mail = models.EmailField(max_length=100)
    telephone = models.IntegerField()
    mot_de_passe = models.TextField(max_length=100)
    role = models.TextField(max_length=100)
    team = models.ForeignKey(Team, on_delete=models.CASCADE)
    """This class defines a datastructure of an  employee"""


class Calendrier(models.Model):
    id = models.IntegerField(primary_key=True)
    date = models.DateField()
    heure_debut = models.TimeField()
    heure_fin = models.TimeField()
    type_journee = models.TextField(max_length=100)
    id_employee = models.ForeignKey(User, on_delete=models.CASCADE)

    """This class defines the data structure of a calendar  """



