from ..logic.teamfactory import TeamFactory
from ..logic.userfactory import UserFactory
from . import graphtypes


class QueryResolver:
    """This class is used to reslove GraphQL queries."""
    @classmethod
    def resolve_manager_view(cls, manager_id: int
                             ) -> graphtypes.TeamViewerType:
        """Checks if the ID belongs to a manager and builds their team view."""
        if UserFactory.user_is_a_manager(manager_id):
            team = TeamFactory.get_team_by_user_id(manager_id)
            return graphtypes.ObjectTypeFactory.team_viewer_type_builder(
                TeamFactory.build_team_viewer(team))
        else:
            raise Exception("Permission denied !")

    @classmethod
    def resolve_admin_view(cls, admin_id: int) -> graphtypes.AdminViewType:
        """Checks if the ID belongs to an admin and builds their team view."""
        if UserFactory.user_is_an_admin(admin_id):
            admin = UserFactory.get_user_by_id(admin_id)
            return graphtypes.ObjectTypeFactory.build_admin_view_type(
                TeamFactory.build_admin_view(admin))
        else:
            raise Exception("Permission denied !")
