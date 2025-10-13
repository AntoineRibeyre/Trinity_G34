from ..models import Team


class TeamFactory:

    @classmethod
    def create_team(cls, name: str, description: str | None) -> Team:
        return Team.objects.create(
            name=name,
            description=description

        )