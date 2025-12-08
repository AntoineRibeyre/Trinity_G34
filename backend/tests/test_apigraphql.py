import os
import django
import pytest
from django.contrib.auth import get_user_model

from graphene.test import Client
from backend.schema import schema


django.setup()
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")


@pytest.fixture
def client():
    return Client(schema)


@pytest.mark.django_db
def test_create_user(client):
    """Test de création d'utilisateur via GraphQL"""
    User = get_user_model()
    mutation = """
    mutation {
      createUser(
        username: "Houssem"
        firstName: "Houssem"
        lastName: "Jeguirim"
        email: "houssem@test.com"
        telephone: "0606060606"
        password: "Houssem123."
        role: "manager"
      ) {
        user {
        id,
        firstName,
        lastName,
        role
        }
      }
    }
    """
    executed = client.execute(mutation)
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


# @pytest.mark.django_db
# def test_create_team(client):
#     mutation = """
#         mutation{
#               createTeam(
#                 name:"testing_team"
#                 description: "This is a Test"
#               ){
#                 team{
#                   name
#                   description
#                 }
#               }
#             }
#             """
#     executed = client.execute(mutation)
#     assert 'errors' not in executed or executed['errors'] is None, \
#         f"Erreurs GraphQL: {executed.get('errors')}"
#     # Vérifier que la mutation a retourné des données
#     assert 'data' in executed, "Pas de données dans la réponse"
#     assert executed['data'] is not None, "Les données sont None"
#     assert 'createTeam' in executed['data'], "createTeam absent de la
#     réponse"
#     assert executed['data']['createTeam'] is not None, "createTeam est None"
#     assert Team.objects.filter(name="testing_team").exists(), \
#     "L'equipe 'testing_team' n'existe pas en base"
#     team = Team.objects.get(name="testing_team")
#     assert team.name == "testing_team"
#     assert team.description == "This is a Test"
