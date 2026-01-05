import os
import django
import pytest
from django.contrib.auth import get_user_model

from graphene.test import Client
from backend.schema import schema
from . import querylist
from trinity.models import Team


django.setup()
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")


@pytest.fixture
def client():
    return Client(schema)


@pytest.mark.django_db
def test_create_user(client):
    """Test de création d'utilisateur via GraphQL"""
    User = get_user_model()
    executed = client.execute(querylist.create_user_mutation())
    # Vérifier qu'il n'y a pas d'erreurs
    assert 'errors' not in executed or executed['errors'] is None, \
        f"Erreurs GraphQL: {executed.get('errors')}"
    # Vérifier que la mutation a retourné des données
    assert 'data' in executed, "Pas de données dans la réponse"
    assert executed['data'] is not None, "Les données sont None"
    assert 'createUser' in executed['data'], "createUser absent de la réponse"
    assert executed['data']['createUser'] is not None, "createUser est None"
    assert User.objects.filter(username="Houssem").exists(), \
        "L'utilisateur 'Houssem' n'existe pas en base"
    # Vérifier les données de l'utilisateur
    user = User.objects.get(username="Houssem")
    assert user.email == "houssem@test.com", f"Email incorrect: {user.email}"
    assert user.first_name == "Houssem", f"Prénom incorrect: {user.first_name}"
    assert user.last_name == "Jeguirim", f"Nom incorrect: {user.last_name}"
    assert user.telephone == "0606060606", f"Téléphone incorrect: {
        user.telephone}"
    assert user.role == "manager", f"Rôle incorrect: {user.role}"


@pytest.mark.django_db
def test_create_team(client):
    pytest.fail()
    executed = client.execute(querylist.create_team_mutation())
    assert 'errors' not in executed or executed['errors'] is None, \
        f"Erreurs GraphQL: {executed.get('errors')}"
    # Vérifier que la mutation a retourné des données
    assert 'data' in executed, "Pas de données dans la réponse"
    assert executed['data'] is not None, "Les données sont None"
    assert 'createTeam' in executed['data'], "createTeam absent de la réponse"
    assert executed['data']['createTeam'] is not None, "createTeam est None"
    assert Team.objects.filter(name="Equipe Alpha").exists(), \
    "L'equipe 'Equipe Alpha' n'existe pas en base"
    team = Team.objects.get(name="Equipe Alpha")
    assert team.name == "Equipe Alpha"
    assert team.description == "Équipe de test pour le développement"
    assert team.field == "Development"
