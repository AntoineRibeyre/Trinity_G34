from django.db import models
from django.contrib.auth.models import AbstractUser


class Team(models.Model):
    name = models.CharField(max_length=100, null=False)
    description = models.CharField(max_length=500, null=True)
    field = models.CharField(max_length=100, null=True)

    """This class defines the data structure of a team"""


class User(AbstractUser):
    # Django gère déjà username, password, email, etc.
    username = models.CharField(blank=True, null=True)
    email = models.EmailField(unique=True)
    telephone = models.CharField(max_length=100, blank=True, null=True)
    role = models.CharField(max_length=100, blank=True, null=True)
    team = models.ForeignKey(Team, null=True, blank=True,
                             on_delete=models.SET_NULL, related_name="members")
    social_number = models.BigIntegerField(blank=True, null=True)
    contract = models.CharField(blank=True, null=True)
    arrival_date = models.DateField(blank=True, null=True)
    annual_salary = models.IntegerField(blank=True, null=True)
    birth_date = models.DateField(blank=True, null=True)
    working_hours = models.IntegerField(blank=True, null=True)

    leaves = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        blank=True,
        null=True,
        default=0,
        help_text="Solde de congés en jours (peut être décimal, ex: 2.5 jours)"
    )

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


class Event(models.Model):
    subject = models.CharField(max_length=200)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    is_all_day = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    attendees = models.ManyToManyField(
        User,
        related_name='events',
        blank=True
    )

    def __str__(self):
        return self.subject

    """This class defines the data structure of a calendar"""


class LeaveBalance(models.Model):
    """Historique des acquisitions et utilisations de congés"""
    TRANSACTION_TYPES = [
        ('acquisition', 'Acquisition mensuelle'),
        ('acquisition_prorata', 'Acquisition au prorata'),
        ('usage', 'Utilisation de congé'),
        ('adjustment', 'Ajustement manuel'),
        ('reset', 'Réinitialisation annuelle'),
    ]

    employee = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="leave_transactions"
    )
    transaction_type = models.CharField(max_length=30, choices=TRANSACTION_TYPES)
    amount = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        help_text="Nombre de jours (positif pour acquisition, négatif pour usage)"
    )
    balance_after = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        help_text="Solde après cette transaction"
    )
    reference_period = models.CharField(
        max_length=7,
        help_text="Période de référence YYYY-MM"
    )
    calendar_entry = models.ForeignKey(
        Calendar,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="Lien vers l'entrée Calendar si c'est un congé pris"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['employee', 'reference_period']),
            models.Index(fields=['transaction_type']),
        ]

    def __str__(self):
        return f"{self.employee.email} - {self.transaction_type} - {self.amount} jours"

    """This class defines the data structure of a leave"""