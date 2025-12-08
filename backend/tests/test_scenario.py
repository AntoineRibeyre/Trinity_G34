import os
import json
import django
import pytest

from graphene.test import Client
from backend.schema import schema
from trinity.models import User
from . import querylist
from .test_data_db.testdbhandler import TestDBHandler

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()


@pytest.fixture
def database_for_test() -> TestDBHandler:
    """This fixture is used to clear the current database and create a new
    one."""
    return TestDBHandler()


@pytest.fixture
def client():
    """This fixture initializes a GraphQL test client."""
    return Client(schema)


# @pytest.mark.django_db
# def test_manager_view_scenario(snapshot, client):
#     """This test covers the following scenario:
#     - Creating a team and attaching three users to it, including the manager.
#     - Then, using the manager ID to retrieve all information about their team.
#     """
#     # Executing team creation mutation
#     executed = client.execute(querylist.create_team_mutation())
#     assert 'errors' not in executed or executed['errors'] is None, \
#         f"GraphQL errors: {executed.get('errors')}"
#     # Checking that the mutation returned data
#     assert 'data' in executed, "No data in the response"
#     assert executed['data'] is not None, "Data is None"
#     assert 'createTeam' in executed['data'], "createTeam not in the response"
#     assert executed['data']['createTeam'] is not None, "createTeam is None"
#     # Checking that the mutation was saved in the database
#     assert Team.objects.filter(name="Equipe Alpha").exists(), \
#         "The team 'Equipe Alpha' does not exist in the database"
#     team = Team.objects.get(name="Equipe Alpha")
#     assert team.name == "Equipe Alpha"
#     assert team.description == "Équipe de test pour le développement"
#     # Creation of 3 users
#     for query in querylist.create_three_users(team.id):
#         executed = client.execute(query)
#     assert 'errors' not in executed or executed['errors'] is None, \
#         f"GraphQL errors: {executed.get('errors')}"
#     assert 'data' in executed, "No data in the response"
#     assert executed['data'] is not None, "Data is None"
#     assert 'createUser' in executed['data'], "createUser not in the response"
#     assert executed['data']['createUser'] is not None, "createUser is None"
#     # Checking if the manager is in the database
#     manager = User.objects.get(role="Manager", team=team)
#     # Executing the manager_view query
#     executed = client.execute(querylist.manager_view_query(manager.id))
#     result_query = json.dumps(executed, indent=2)
#     # Testing the output of manager_view_query
#     snapshot.assert_match(result_query, 'manager_view_query.json')


@pytest.mark.django_db
def test_admin_view_senario(snapshot, client, database_for_test):
    """This test clears the current database, injects new data to test the
    admin_view API, and then clears the database again."""
    # database_for_test.init()
    assert database_for_test.flush, "Could not initialize the database"
    database_for_test.flush_current_database()
    database_for_test.create_database()
    admin = User.objects.get(role="Admin")
    excuted = client.execute(querylist.admin_view_query(admin.id))
    result_query = json.dumps(excuted, indent=2)
    snapshot.assert_match(result_query, 'admin_view_query.json')
    database_for_test.flush_current_database()