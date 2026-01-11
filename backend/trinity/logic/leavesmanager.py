import datetime
from decimal import Decimal
from typing import Dict, List, Tuple, Optional
from zoneinfo import ZoneInfo
from dataclasses import dataclass

from django.db import transaction
from django.db.models import Sum, Q

from ..models import User, Calendar, LeaveBalance


@dataclass
class LeaveReport:
    """Rapport détaillé du solde de congés d'un employé"""
    employee_id: int
    current_balance: Decimal
    acquired_this_year: Decimal
    used_this_year: Decimal
    reference_year_start: datetime.date
    reference_year_end: datetime.date
    next_acquisition_date: datetime.date
    is_at_max_capacity: bool
    transactions: List[LeaveBalance]


class LeavesManager:
    """Gestionnaire des congés payés selon la législation française"""

    MONTHLY_ACCRUAL = Decimal('2.5')  # Jours acquis par mois
    MAX_BALANCE = Decimal('30.0')  # Plafond maximum
    PARIS_TZ = ZoneInfo("Europe/Paris")

    @classmethod
    def get_reference_period_dates(cls, reference_date: datetime.date = None) -> Tuple[datetime.date, datetime.date]:
        """
        Calcule les dates de début et fin de la période de référence (1er mai N au 30 avril N+1)

        Args:
            reference_date: Date de référence (par défaut: aujourd'hui)

        Returns:
            Tuple (date_debut, date_fin) de la période de référence
        """
        if reference_date is None:
            reference_date = datetime.date.today()

        if reference_date.month >= 5:  # De mai à décembre
            period_start = datetime.date(reference_date.year, 5, 1)
            period_end = datetime.date(reference_date.year + 1, 4, 30)
        else:  # De janvier à avril
            period_start = datetime.date(reference_date.year - 1, 5, 1)
            period_end = datetime.date(reference_date.year, 4, 30)

        return period_start, period_end

    @classmethod
    def get_reference_period_string(cls, date: datetime.date = None) -> str:
        """Retourne la période de référence au format YYYY-MM"""
        if date is None:
            date = datetime.date.today()
        return date.strftime("%Y-%m")

    @classmethod
    def calculate_prorata_acquisition(cls, arrival_date: datetime.date,
                                      calculation_month: datetime.date) -> Decimal:
        """
        Calcule l'acquisition au prorata pour un employé arrivé en cours de mois

        Args:
            arrival_date: Date d'arrivée de l'employé
            calculation_month: Mois de calcul (1er du mois)

        Returns:
            Nombre de jours de congés à acquérir (au prorata)
        """
        # Si l'arrivée n'est pas dans le mois de calcul, acquisition complète
        if arrival_date.year != calculation_month.year or arrival_date.month != calculation_month.month:
            return cls.MONTHLY_ACCRUAL

        # Calcul du nombre de jours dans le mois
        if calculation_month.month == 12:
            next_month = datetime.date(calculation_month.year + 1, 1, 1)
        else:
            next_month = datetime.date(calculation_month.year, calculation_month.month + 1, 1)

        days_in_month = (next_month - calculation_month).days

        # Jours travaillés dans le mois (à partir du jour d'arrivée inclus)
        days_worked = days_in_month - arrival_date.day + 1

        # Calcul au prorata
        prorata = (Decimal(days_worked) / Decimal(days_in_month)) * cls.MONTHLY_ACCRUAL

        return prorata.quantize(Decimal('0.01'))

    @classmethod
    def count_business_days(cls, start_date: datetime.date, end_date: datetime.date) -> int:
        """
        Compte le nombre de jours ouvrés entre deux dates (excluant weekends)
        Note: Cette version ne gère pas les jours fériés automatiquement

        Args:
            start_date: Date de début (incluse)
            end_date: Date de fin (incluse)

        Returns:
            Nombre de jours ouvrés
        """
        business_days = 0
        current_date = start_date

        while current_date <= end_date:
            # 0 = Lundi, 6 = Dimanche
            if current_date.weekday() < 5:  # Lundi à Vendredi
                business_days += 1
            current_date += datetime.timedelta(days=1)

        return business_days

    @classmethod
    @transaction.atomic
    def acquire_monthly_leaves(cls, employee: User, acquisition_date: datetime.date = None) -> LeaveBalance:
        """
        Acquiert les congés mensuels pour un employé (2.5 jours par mois)

        Args:
            employee: L'employé concerné
            acquisition_date: Date d'acquisition (par défaut: aujourd'hui)

        Returns:
            L'objet LeaveBalance créé

        Raises:
            Exception: Si l'employé n'a pas de date d'arrivée ou si déjà acquis ce mois
        """
        if acquisition_date is None:
            acquisition_date = datetime.date.today()

        if not employee.arrival_date:
            raise Exception(f"L'employé {employee.email} n'a pas de date d'arrivée définie")

        # Vérifier que l'employé était bien présent ce mois
        first_of_month = acquisition_date.replace(day=1)
        if employee.arrival_date > first_of_month:
            # Si arrivée dans le mois, calcul au prorata
            amount = cls.calculate_prorata_acquisition(employee.arrival_date, first_of_month)
            transaction_type = 'acquisition_prorata'
        else:
            amount = cls.MONTHLY_ACCRUAL
            transaction_type = 'acquisition'

        # Vérifier qu'on n'a pas déjà acquis pour ce mois
        reference_period = cls.get_reference_period_string(first_of_month)
        existing = LeaveBalance.objects.filter(
            employee=employee,
            reference_period=reference_period,
            transaction_type__in=['acquisition', 'acquisition_prorata']
        ).exists()

        if existing:
            raise Exception(f"Les congés pour {reference_period} ont déjà été acquis")

        # Calculer le nouveau solde (avec plafond)
        current_balance = employee.leaves or Decimal('0.0')
        new_balance = min(current_balance + amount, cls.MAX_BALANCE)
        actual_acquired = new_balance - current_balance

        # Créer la transaction
        leave_transaction = LeaveBalance.objects.create(
            employee=employee,
            transaction_type=transaction_type,
            amount=actual_acquired,
            balance_after=new_balance,
            reference_period=reference_period,
            notes=f"Acquisition automatique pour {reference_period}" +
                  (f" (plafonné à {cls.MAX_BALANCE})" if actual_acquired < amount else "")
        )

        # Mettre à jour le solde de l'employé
        employee.leaves = new_balance
        employee.save()

        return leave_transaction

    @classmethod
    @transaction.atomic
    def use_leave(cls, employee: User, leave_date: datetime.date,
                  calendar_entry: Calendar = None) -> LeaveBalance:
        """
        Enregistre l'utilisation d'un jour de congé

        Args:
            employee: L'employé concerné
            leave_date: Date du congé
            calendar_entry: Entrée Calendar associée (optionnel)

        Returns:
            L'objet LeaveBalance créé

        Raises:
            Exception: Si solde insuffisant
        """
        current_balance = employee.leaves or Decimal('0.0')

        if current_balance < Decimal('1.0'):
            raise Exception(f"Solde de congés insuffisant ({current_balance} jours)")

        # Calculer le nouveau solde
        new_balance = current_balance - Decimal('1.0')

        # Créer la transaction
        reference_period = cls.get_reference_period_string(leave_date)
        leave_transaction = LeaveBalance.objects.create(
            employee=employee,
            transaction_type='usage',
            amount=Decimal('-1.0'),
            balance_after=new_balance,
            reference_period=reference_period,
            calendar_entry=calendar_entry,
            notes=f"Congé payé du {leave_date.strftime('%d/%m/%Y')}"
        )

        # Mettre à jour le solde
        employee.leaves = new_balance
        employee.save()

        return leave_transaction

    @classmethod
    def get_leave_report(cls, employee: User) -> LeaveReport:
        """
        Génère un rapport complet des congés d'un employé

        Args:
            employee: L'employé concerné

        Returns:
            LeaveReport avec toutes les informations
        """
        current_date = datetime.date.today()
        period_start, period_end = cls.get_reference_period_dates(current_date)

        # Récupérer toutes les transactions de l'année en cours
        transactions = LeaveBalance.objects.filter(
            employee=employee,
            created_at__date__gte=period_start,
            created_at__date__lte=period_end
        ).order_by('-created_at')

        # Calculer les acquisitions et utilisations
        acquired = transactions.filter(
            transaction_type__in=['acquisition', 'acquisition_prorata', 'adjustment']
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.0')

        used = abs(transactions.filter(
            transaction_type='usage'
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.0'))

        # Date de prochaine acquisition (1er du mois prochain)
        if current_date.month == 12:
            next_acquisition = datetime.date(current_date.year + 1, 1, 1)
        else:
            next_acquisition = datetime.date(current_date.year, current_date.month + 1, 1)

        current_balance = employee.leaves or Decimal('0.0')
        is_at_max = current_balance >= cls.MAX_BALANCE

        return LeaveReport(
            employee_id=employee.id,
            current_balance=current_balance,
            acquired_this_year=acquired,
            used_this_year=used,
            reference_year_start=period_start,
            reference_year_end=period_end,
            next_acquisition_date=next_acquisition,
            is_at_max_capacity=is_at_max,
            transactions=list(transactions[:10])  # Les 10 dernières transactions
        )

    @classmethod
    @transaction.atomic
    def process_monthly_acquisition_for_all_employees(cls,
                                                      acquisition_date: datetime.date = None) -> Dict[str, List]:
        """
        Lance l'acquisition mensuelle pour tous les employés actifs

        Args:
            acquisition_date: Date d'acquisition (par défaut: aujourd'hui)

        Returns:
            Dictionnaire avec 'success' et 'errors'
        """
        if acquisition_date is None:
            acquisition_date = datetime.date.today()

        first_of_month = acquisition_date.replace(day=1)

        # Récupérer tous les employés actifs avec une date d'arrivée
        employees = User.objects.filter(
            is_active=True,
            arrival_date__isnull=False,
            arrival_date__lte=acquisition_date  # Arrivés avant ou pendant ce mois
        )

        success = []
        errors = []

        for employee in employees:
            try:
                leave_transaction = cls.acquire_monthly_leaves(employee, first_of_month)
                success.append({
                    'employee_id': employee.id,
                    'email': employee.email,
                    'amount': float(leave_transaction.amount),
                    'new_balance': float(leave_transaction.balance_after)
                })
            except Exception as e:
                errors.append({
                    'employee_id': employee.id,
                    'email': employee.email,
                    'error': str(e)
                })

        return {
            'success': success,
            'errors': errors
        }

    @classmethod
    @transaction.atomic
    def create_leave_request(cls, employee: User, start_date: datetime.date,
                             end_date: datetime.date) -> Tuple[List[Calendar], List[LeaveBalance]]:
        """
        Crée une demande de congé pour une période donnée

        Args:
            employee: L'employé concerné
            start_date: Date de début du congé
            end_date: Date de fin du congé (incluse)

        Returns:
            Tuple (liste des Calendar créés, liste des LeaveBalance créés)

        Raises:
            Exception: Si solde insuffisant
        """
        # Compter les jours ouvrés
        business_days = cls.count_business_days(start_date, end_date)

        if business_days <= 0:
            raise Exception("Aucun jour ouvré dans la période sélectionnée")

        # Vérifier le solde
        current_balance = employee.leaves or Decimal('0.0')
        if current_balance < Decimal(business_days):
            raise Exception(
                f"Solde insuffisant: {business_days} jours demandés, "
                f"{current_balance} jours disponibles"
            )

        calendars = []
        leave_transactions = []
        current_date = start_date

        paris_tz = cls.PARIS_TZ

        # Créer les entrées Calendar et LeaveBalance pour chaque jour ouvré
        while current_date <= end_date:
            if current_date.weekday() < 5:  # Jour ouvré
                # Créer l'entrée Calendar
                calendar_entry = Calendar.objects.create(
                    begin=datetime.datetime.combine(current_date, datetime.time(0, 0), tzinfo=paris_tz),
                    end=datetime.datetime.combine(current_date, datetime.time(23, 59), tzinfo=paris_tz),
                    day_type='conge_paye',
                    employee=employee,
                    day_over=True,
                    duration=datetime.timedelta(days=1)
                )
                calendars.append(calendar_entry)

                # Enregistrer l'utilisation du congé
                leave_transaction = cls.use_leave(employee, current_date, calendar_entry)
                leave_transactions.append(leave_transaction)

            current_date += datetime.timedelta(days=1)

        return calendars, leave_transactions