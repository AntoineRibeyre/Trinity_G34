from ..models import User, Team


class UserFactory:

    @classmethod
    def create_new_user(cls, first_name: str, username: str, last_name: str, email: str,
                        telephone: str, team_id: int | None, password: str, role: str
                        ) -> User:
        team = None
        if team_id:
            try:
                team = Team.objects.get(pk=team_id)
            except Team.DoesNotExist:
                raise Exception("Équipe introuvable.")

        # Création de l'utilisateur
        return User.objects.create_user(
            first_name=first_name,
            username=username,
            last_name=last_name,
            email=email,
            telephone=telephone,
            team=team,
            password=password,
            role=role)
