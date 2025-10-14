from ..models import User, Team


class UserFactory:

    @classmethod
    def create_new_user(cls, first_name: str, username: str, last_name: str,
                        email: str, telephone: str, team_id: int | None,
                        password: str, role: str
                        ) -> User:
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
        )
        user.telephone = telephone
        user.role = role
        if team_id:
            try:
                team = Team.objects.get(id=team_id)
                user.team = team
            except Team.DoesNotExist:
                pass
        user.save()
