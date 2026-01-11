from django.core.management.base import BaseCommand
from django.utils import timezone
from trinity.logic.leavesmanager import LeavesManager


class Command(BaseCommand):
    help = 'Traite l\'acquisition mensuelle de congés pour tous les employés'

    def add_arguments(self, parser):
        parser.add_argument(
            '--date',
            type=str,
            help='Date d\'acquisition au format YYYY-MM-DD (par défaut: aujourd\'hui)',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Simule l\'exécution sans enregistrer les données',
        )

    def handle(self, *args, **options):
        import datetime

        # Déterminer la date
        if options['date']:
            try:
                acquisition_date = datetime.date.fromisoformat(options['date'])
            except ValueError:
                self.stdout.write(
                    self.style.ERROR('Format de date invalide. Utilisez YYYY-MM-DD')
                )
                return
        else:
            acquisition_date = datetime.date.today()

        self.stdout.write(f"Traitement de l'acquisition pour le {acquisition_date}")

        if options['dry_run']:
            self.stdout.write(self.style.WARNING('Mode DRY-RUN activé - aucune donnée ne sera enregistrée'))
            # TODO: Implémenter la logique dry-run si nécessaire
            return

        try:
            result = LeavesManager.process_monthly_acquisition_for_all_employees(acquisition_date)

            # Afficher les résultats
            self.stdout.write(self.style.SUCCESS(f"\n Traitement terminé avec succès"))
            self.stdout.write(f"  • Employés traités: {len(result['success'])}")
            self.stdout.write(f"  • Erreurs: {len(result['errors'])}")

            if result['success']:
                self.stdout.write(self.style.SUCCESS("\n  Détails des acquisitions:"))
                for item in result['success']:
                    self.stdout.write(
                        f"  • {item['email']}: +{item['amount']} jours "
                        f"(nouveau solde: {item['new_balance']})"
                    )

            if result['errors']:
                self.stdout.write(self.style.ERROR("\n Erreurs rencontrées:"))
                for item in result['errors']:
                    self.stdout.write(f"  • {item['email']}: {item['error']}")

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Erreur lors du traitement: {str(e)}')
            )