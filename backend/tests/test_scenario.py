import os
import json
import django
import pytest
from django.contrib.auth import get_user_model

from graphene.test import Client
from backend.schema import schema
from trinity.models import Team, User
from . import querylist

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()


@pytest.fixture
def client():
    return Client(schema)


@pytest.mark.django_db
def test_manager_view_scenario(snapshot, client):
    """This test covers the following scenario:
    - Creating a team and attaching three users to it, including the manager.
    - Then, using the manager ID to retrieve all information about their team.
    """
    # Executing team creation mutation
    executed = client.execute(querylist.create_team_mutation())
    assert 'errors' not in executed or executed['errors'] is None, \
        f"Erreurs GraphQL: {executed.get('errors')}"
    # Checking that the mutation returned data
    assert 'data' in executed, "Pas de données dans la réponse"
    assert executed['data'] is not None, "Les données sont None"
    assert 'createTeam' in executed['data'], "createTeam absent de la réponse"
    assert executed['data']['createTeam'] is not None, "createTeam est None"
    # Checking that the mutation was saved in the database
    assert Team.objects.filter(name="Equipe Alpha").exists(), \
        "L'equipe 'Équipe Alpha' n'existe pas en base"
    team = Team.objects.get(name="Equipe Alpha")
    assert team.name == "Equipe Alpha"
    assert team.description == "Équipe de test pour le développement"
    # Creation of 3 users
    for query in querylist.create_three_users(team.id):
        executed = client.execute(query)
    assert 'errors' not in executed or executed['errors'] is None, \
        f"Erreurs GraphQL: {executed.get('errors')}"
    assert 'data' in executed, "Pas de données dans la réponse"
    assert executed['data'] is not None, "Les données sont None"
    assert 'createUser' in executed['data'], "createUser absent de la réponse"
    assert executed['data']['createUser'] is not None, "createUser est None"
    # Checking if the manager is in the database
    manager = User.objects.get(role="Manager", team=team)
    # Excuting the manager_view query
    executed = client.execute(querylist.manager_view_query(manager.id))
    result_query = json.dumps(executed, indent=2)
    # Testing the input of manager_view_query
    snapshot.assert_match(result_query, 'manager_view_query.json')