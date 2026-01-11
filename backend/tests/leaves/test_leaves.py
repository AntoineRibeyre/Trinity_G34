from django.test import TestCase
from django.db import IntegrityError, transaction
from datetime import date, timedelta
from decimal import Decimal

from trinity.models import User, Calendar, LeaveBalance
from trinity.logic.leavesmanager import LeavesManager

class LeaveReferencePeriodTest(TestCase):
    """Tests de la période légale des congés (base France)"""

    def test_reference_period_after_may(self):
        start, end = LeavesManager.get_reference_period_dates(
            date(2025, 6, 15)
        )

        self.assertEqual(start, date(2025, 5, 1))
        self.assertEqual(end, date(2026, 4, 30))

    def test_reference_period_before_may(self):
        start, end = LeavesManager.get_reference_period_dates(
            date(2025, 2, 10)
        )

        self.assertEqual(start, date(2024, 5, 1))
        self.assertEqual(end, date(2025, 4, 30))

    class LeaveMonthlyAcquisitionIntegrationTest(TestCase):
        """Tests d'intégration de l'acquisition mensuelle"""

        def setUp(self):
            self.user = User.objects.create_user(
                username="employee",
                email="employee@test.com",
                password="test123",
                arrival_date=date(2025, 1, 1),
                leaves=Decimal("0.0")
            )

        def test_standard_monthly_acquisition(self):
            tx = LeavesManager.acquire_monthly_leaves(
                self.user,
                date(2025, 6, 1)
            )

            self.user.refresh_from_db()

            self.assertEqual(tx.amount, Decimal("2.5"))
            self.assertEqual(self.user.leaves, Decimal("2.5"))
            self.assertEqual(tx.transaction_type, "acquisition")

        def test_prorata_acquisition_for_arrival_month(self):
            self.user.arrival_date = date(2025, 6, 15)
            self.user.save()

            tx = LeavesManager.acquire_monthly_leaves(
                self.user,
                date(2025, 6, 1)
            )

            self.assertLess(tx.amount, Decimal("2.5"))
            self.assertGreater(tx.amount, Decimal("0"))
            self.assertEqual(tx.transaction_type, "acquisition_prorata")

        def test_double_acquisition_same_month_fails(self):
            LeavesManager.acquire_monthly_leaves(self.user, date(2025, 6, 1))

            with self.assertRaises(Exception):
                LeavesManager.acquire_monthly_leaves(self.user, date(2025, 6, 1))


class LeaveBalanceCapIntegrationTest(TestCase):
    """Tests du plafond légal des congés (30 jours)"""

    def setUp(self):
        self.user = User.objects.create_user(
            username="senior",
            email="senior@test.com",
            password="test123",
            arrival_date=date(2020, 1, 1),
            leaves=Decimal("29.0")
        )

    def test_acquisition_is_capped_at_30(self):
        tx = LeavesManager.acquire_monthly_leaves(
            self.user,
            date(2025, 6, 1)
        )

        self.user.refresh_from_db()

        self.assertEqual(self.user.leaves, Decimal("30.0"))
        self.assertEqual(tx.amount, Decimal("1.0"))

class LeaveUsageIntegrationTest(TestCase):
    """Tests d'utilisation des congés"""

    def setUp(self):
        self.user = User.objects.create_user(
            username="employee2",
            email="employee2@test.com",
            password="test123",
            leaves=Decimal("5.0")
        )

    def test_use_one_leave_day(self):
        LeavesManager.use_leave(self.user, date(2025, 6, 10))

        self.user.refresh_from_db()
        self.assertEqual(self.user.leaves, Decimal("4.0"))

    def test_use_leave_insufficient_balance(self):
        self.user.leaves = Decimal("0.5")
        self.user.save()

        with self.assertRaises(Exception):
            LeavesManager.use_leave(self.user, date(2025, 6, 10))
