import os
import json
import django
import pytest

from graphene.test import Client
from backend.schema import schema
from trinity.models import User
from . import querylist
from tests.test_data_db.testdbhandler import TestDBHandler
from trinity.models import Team


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


@pytest.mark.django_db
def test_manager_view_scenario(snapshot, client):
    """This test covers the following scenario:
    - Creating a team and attaching three users to it, including the manager.
    - Then, using the manager ID to retrieve all information about their team.
    """
    # Executing team creation mutation
    executed = client.execute(querylist.create_team_mutation())
    assert 'errors' not in executed or executed['errors'] is None, \
        f"GraphQL errors: {executed.get('errors')}"
    # Checking that the mutation returned data
    assert 'data' in executed, "No data in the response"
    assert executed['data'] is not None, "Data is None"
    assert 'createTeam' in executed['data'], "createTeam not in the response"
    assert executed['data']['createTeam'] is not None, "createTeam is None"
    # Checking that the mutation was saved in the database
    assert Team.objects.filter(name="Equipe Alpha").exists(), \
        "The team 'Equipe Alpha' does not exist in the database"
    team = Team.objects.get(name="Equipe Alpha")
    assert team.name == "Equipe Alpha"
    assert team.description == "Équipe de test pour le développement"
    # Creation of 3 users
    for query in querylist.create_three_users(team.id):
        executed = client.execute(query)
    assert 'errors' not in executed or executed['errors'] is None, \
        f"GraphQL errors: {executed.get('errors')}"
    assert 'data' in executed, "No data in the response"
    assert executed['data'] is not None, "Data is None"
    assert 'createUser' in executed['data'], "createUser not in the response"
    assert executed['data']['createUser'] is not None, "createUser is None"
    # Checking if the manager is in the database
    manager = User.objects.get(role="Manager", team=team)
    # Executing the manager_view query
    executed = client.execute(querylist.manager_view_query(manager.id))
    result_query = json.dumps(executed, indent=2)
    # Testing the output of manager_view_query
    snapshot.assert_match(result_query, 'manager_view_query.json')


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


# @pytest.mark.django_db
# def test_admin_complete_scenario(snapshot, client):
#     """
#     This test covers the following scenario:
#     - Create an admin
#     - Create a team with members
#     - Login as admin
#     - Create and modify events
#     - Add a new member to the team
#     - Update an event
#     """
#     
#     # Clear database
#     database_for_test.flush_current_database()
#     
#     # =============================
#     # STEP 1: Create Admin
#     # =============================
#     create_admin_mutation = """
#     mutation {
#       createUser(
#         username: "admin.principal"
#         firstName: "Admin"
#         lastName: "Principal"
#         email: "admin@example.com"
#         telephone: "0600000000"
#         password: "Admin123."
#         role: "Admin"
#       ) {
#         user {
#           id,
#           firstName,
#           lastName,
#           role
#         }
#       }
#     }
#     """
#     admin_result = client.execute(create_admin_mutation)
#     # Debug: Print the full result
#     # print("\n" + "="*50)
#     # print("ADMIN CREATION RESULT:")
#     # print(json.dumps(admin_result, indent=2))
#     # print("="*50)
#     # assert 'errors' not in admin_result or admin_result['errors'] is None, \
#     #     f"GraphQL errors lors de la création admin: {admin_result.get('errors')}"
#     # assert admin_result['data']['createUser']['user']['role'] == "Admin"
#     # 
#     # admin_id = admin_result['data']['createUser']['user']['id']
#     # print(f"\n✓ Admin créé avec ID: {admin_id}")
#     
#     # =============================
#     # STEP 2: Create Manager
#     # =============================
#     create_manager_mutation = """
#     mutation {
#         createUser(
#             email: "manager@example.com"
#             firstName: "Alice"
#             lastName: "Dupont"
#             password: "manager123"
#             role: "Manager"
#             telephone: "0600000001"
#             username: "alice.dupont"
#         ) {
#             user {
#                 id
#                 firstName
#                 lastName
#                 role
#             }
#         }
#     }
#     """
#     manager_result = client.execute(create_manager_mutation)
#     assert 'errors' not in manager_result or manager_result['errors'] is None
#     manager_id = manager_result['data']['createUser']['user']['id']
#     print(f"✓ Manager créé avec ID: {manager_id}")
#     # =============================
#     # STEP 3: Create Team with Manager
#     # =============================
#     create_team_mutation = f"""
#     mutation {{
#         createTeam(
#             name: "Equipe Alpha"
#             description: "Équipe de développement"
#             field: "Development"
#             managerID: {manager_id}
#         ) {{
#             team {{
#                 id
#                 name
#                 description
#                 field
#                 members {{
#                     id
#                     firstName
#                     lastName
#                     role
#                 }}
#             }}
#         }}
#     }}
#     """
#     team_result = client.execute(create_team_mutation)
#     assert 'errors' not in team_result or team_result['errors'] is None, \
#         f"GraphQL errors lors de la création team: {team_result.get('errors')}"
#     team_id = team_result['data']['createTeam']['team']['id']
#     assert Team.objects.filter(id=team_id).exists()
#     print(f"✓ Team créée avec ID: {team_id}")
#     # =============================
#     # STEP 4: Create Team Members (Developers)
#     # =============================
#     members_data = [
#         ("Bob", "Martin", "bob.martin", "dev1@example.com", "0600000002"),
#         ("Claire", "Dubois", "claire.dubois", "dev2@example.com", "0600000003"),
#     ]
#     member_ids = []
#     for first_name, last_name, username, email, phone in members_data:
#         create_member_mutation = f"""
#         mutation {{
#             createUser(
#                 email: "{email}"
#                 firstName: "{first_name}"
#                 lastName: "{last_name}"
#                 password: "dev123"
#                 role: "Developer"
#                 teamId: "{team_id}"
#                 telephone: "{phone}"
#                 username: "{username}"
#             ) {{
#                 user {{
#                     id
#                     firstName
#                     lastName
#                     role
#                 }}
#             }}
#         }}
#         """
#         member_result = client.execute(create_member_mutation)
#         assert 'errors' not in member_result or member_result['errors'] is None
#         member_id = member_result['data']['createUser']['user']['id']
#         member_ids.append(member_id)
#         print(f"✓ Membre {first_name} {last_name} créé avec ID: {member_id}")
#     
#     # =============================
#     # STEP 5: Add Members to Team
#     # =============================
#     for member_id in member_ids:
#         add_member_mutation = f"""
#         mutation {{
#             addEmployeeToTeam(
#                 teamId: {team_id}
#                 employeeIds: [{member_id}]
#             ) {{
#                 message
#                 team {{
#                     id
#                     name
#                     members {{
#                         id
#                         firstName
#                         lastName
#                     }}
#                 }}
#             }}
#         }}
#         """
#         add_result = client.execute(add_member_mutation)
#         assert 'errors' not in add_result or add_result['errors'] is None
#     print(f"✓ {len(member_ids)} membres ajoutés à l'équipe")
#     # =============================
#     # STEP 6: Login as Admin (Get Token)
#     # =============================
#     login_mutation = """
#     mutation {
#         tokenAuth(
#             email: "admin@example.com"
#             password: "admin123"
#         ) {
#             token
#             payload
#             refreshExpiresIn
#         }
#     }
#     """
#     login_result = client.execute(login_mutation)
#     assert 'errors' not in login_result or login_result['errors'] is None, \
#         f"GraphQL errors lors du login: {login_result.get('errors')}"
#     assert 'token' in login_result['data']['tokenAuth']
#     token = login_result['data']['tokenAuth']['token']
#     print(f"✓ Admin connecté, token obtenu")
#     # =============================
#     # STEP 7: Verify Admin View
#     # =============================
#     admin_view_query = f"""
#     query {{
#         adminView(adminId: {admin_id}) {{
#             adminDetails {{
#                 userDetails {{
#                     id
#                     firstName
#                     lastName
#                     role
#                 }}
#             }}
#             teams {{
#                 teamDetails {{
#                     id
#                     name
#                     field
#                 }}
#                 manager {{
#                     userDetails {{
#                         firstName
#                         lastName
#                     }}
#                 }}
#                 members {{
#                     userDetails {{
#                         firstName
#                         lastName
#                         role
#                     }}
#                 }}
#             }}
#         }}
#     }}
#     """
#     admin_view_result = client.execute(admin_view_query)
#     assert 'errors' not in admin_view_result or admin_view_result['errors'] is None
#     assert admin_view_result['data']['adminView'] is not None
#     print(f"✓ Vue admin vérifiée")
#     # Save snapshot
#     snapshot.assert_match(json.dumps(admin_view_result, indent=2), 'admin_view_initial.json')
#     # =============================
#     # STEP 8: Create Events
#     # =============================
#     now = datetime.now()
#     start_time = (now + timedelta(days=1)).replace(hour=14, minute=0, second=0)
#     end_time = start_time + timedelta(hours=2)
#     create_event_mutation = f"""
#     mutation {{
#         createEvent(
#             subject: "Réunion d'équipe"
#             startTime: "{start_time.isoformat()}"
#             endTime: "{end_time.isoformat()}"
#             isAllDay: false
#             attendeeIds: [{manager_id}, {member_ids[0]}]
#         ) {{
#             event {{
#                 id
#                 subject
#                 startTime
#                 endTime
#                 isAllDay
#                 attendees {{
#                     id
#                     firstName
#                     lastName
#                 }}
#             }}
#             success
#             message
#         }}
#     }}
#     """
#     
#     event_result = client.execute(create_event_mutation)
#     assert 'errors' not in event_result or event_result['errors'] is None, \
#         f"GraphQL errors lors de la création event: {event_result.get('errors')}"
#     assert event_result['data']['createEvent']['success'] is True
#     
#     event_id = event_result['data']['createEvent']['event']['id']
#     print(f"✓ Event créé avec ID: {event_id}")
#     
#     # Verify event exists in DB
#     assert Event.objects.filter(id=event_id).exists()
#     
#     # =============================
#     # STEP 9: Create Second Event
#     # =============================
#     start_time_2 = (now + timedelta(days=2)).replace(hour=10, minute=0, second=0)
#     end_time_2 = start_time_2 + timedelta(hours=1)
#     
#     create_event_2_mutation = f"""
#     mutation {{
#         createEvent(
#             subject: "Sprint Planning"
#             startTime: "{start_time_2.isoformat()}"
#             endTime: "{end_time_2.isoformat()}"
#             isAllDay: false
#             attendeeIds: [{manager_id}]
#         ) {{
#             event {{
#                 id
#                 subject
#                 startTime
#                 endTime
#             }}
#             success
#             message
#         }}
#     }}
#     """
#     
#     event_2_result = client.execute(create_event_2_mutation)
#     assert 'errors' not in event_2_result or event_2_result['errors'] is None
#     event_2_id = event_2_result['data']['createEvent']['event']['id']
#     print(f"✓ Second event créé avec ID: {event_2_id}")
#     
#     # =============================
#     # STEP 10: Add New Member to Team
#     # =============================
#     create_new_member_mutation = f"""
#     mutation {{
#         createUser(
#             email: "dev3@example.com"
#             firstName: "David"
#             lastName: "Leroy"
#             password: "dev123"
#             role: "Developer"
#             telephone: "0600000004"
#             username: "david.leroy"
#         ) {{
#             user {{
#                 id
#                 firstName
#                 lastName
#             }}
#         }}
#     }}
#     """
#     
#     new_member_result = client.execute(create_new_member_mutation)
#     assert 'errors' not in new_member_result or new_member_result['errors'] is None
#     new_member_id = new_member_result['data']['createUser']['user']['id']
#     print(f"✓ Nouveau membre David créé avec ID: {new_member_id}")
#     
#     # Add to team
#     add_new_member_mutation = f"""
#     mutation {{
#         addEmployeeToTeam(
#             teamId: {team_id}
#             employeeIds: [{new_member_id}]
#         ) {{
#             message
#             team {{
#                 id
#                 members {{
#                     id
#                     firstName
#                     lastName
#                 }}
#             }}
#         }}
#     }}
#     """
#     
#     add_new_result = client.execute(add_new_member_mutation)
#     assert 'errors' not in add_new_result or add_new_result['errors'] is None
#     print(f"✓ David ajouté à l'équipe")
#     
#     # =============================
#     # STEP 11: Update Event (add new member as attendee)
#     # =============================
#     new_start_time = start_time.replace(hour=15)
#     new_end_time = end_time.replace(hour=17)
#     
#     update_event_mutation = f"""
#     mutation {{
#         updateEvent(
#             eventId: {event_id}
#             subject: "Réunion d'équipe - MODIFIÉE"
#             startTime: "{new_start_time.isoformat()}"
#             endTime: "{new_end_time.isoformat()}"
#             isAllDay: false
#             attendeeIds: [{manager_id}, {member_ids[0]}, {new_member_id}]
#         ) {{
#             event {{
#                 id
#                 subject
#                 startTime
#                 endTime
#                 attendees {{
#                     id
#                     firstName
#                     lastName
#                 }}
#             }}
#             success
#             message
#         }}
#     }}
#     """
#     
#     update_result = client.execute(update_event_mutation)
#     assert 'errors' not in update_result or update_result['errors'] is None, \
#         f"GraphQL errors lors de l'update event: {update_result.get('errors')}"
#     assert update_result['data']['updateEvent']['success'] is True
#     assert "MODIFIÉE" in update_result['data']['updateEvent']['event']['subject']
#     assert len(update_result['data']['updateEvent']['event']['attendees']) == 3
#     print(f"✓ Event mis à jour avec nouveau participant")
#     
#     # =============================
#     # STEP 12: Verify All Events
#     # =============================
#     all_events_query = """
#     query {
#         allEvents {
#             id
#             subject
#             startTime
#             endTime
#             isAllDay
#             attendees {
#                 id
#                 firstName
#                 lastName
#             }
#         }
#     }
#     """
#     
#     all_events_result = client.execute(all_events_query)
#     assert 'errors' not in all_events_result or all_events_result['errors'] is None
#     assert len(all_events_result['data']['allEvents']) == 2
#     print(f"✓ Vérification: {len(all_events_result['data']['allEvents'])} events trouvés")
#     
#     # =============================
#     # STEP 13: Final Admin View Verification
#     # =============================
#     final_admin_view_result = client.execute(admin_view_query)
#     assert 'errors' not in final_admin_view_result or final_admin_view_result['errors'] is None
#     
#     teams = final_admin_view_result['data']['adminView']['teams']
#     assert len(teams) > 0
#     
#     # Verify team has 4 members (manager + 3 developers)
#     team_members = teams[0]['members']
#     assert len(team_members) >= 3, f"Expected at least 3 members, got {len(team_members)}"
#     print(f"✓ Vue admin finale: équipe contient {len(team_members)} membres")
#     
#     # Save final snapshot
#     snapshot.assert_match(json.dumps(final_admin_view_result, indent=2), 'admin_view_final.json')
#     
#     # =============================
#     # STEP 14: Additional Event Operations
#     # =============================
#     # Add attendee to second event
#     add_attendee_mutation = f"""
#     mutation {{
#         addAttendee(
#             eventId: {event_2_id}
#             userId: {new_member_id}
#         ) {{
#             event {{
#                 id
#                 subject
#                 attendees {{
#                     id
#                     firstName
#                 }}
#             }}
#         }}
#     }}
#     """
#     
#     add_attendee_result = client.execute(add_attendee_mutation)
#     assert 'errors' not in add_attendee_result or add_attendee_result['errors'] is None
#     assert len(add_attendee_result['data']['addAttendee']['event']['attendees']) == 2
#     print(f"✓ Participant ajouté au second event")
#     
#     # =============================
#     # FINAL ASSERTIONS
#     # =============================
#     # Verify database state
#     assert User.objects.filter(role="Admin").count() == 1
#     assert User.objects.filter(role="Manager").count() == 1
#     assert User.objects.filter(role="Developer").count() == 3
#     assert Team.objects.count() == 1
#     assert Event.objects.count() == 2
#     
#     team = Team.objects.get(id=team_id)
#     assert team.members.count() == 4  # Manager + 3 developers
#     
#     print("\n" + "="*50)
#     print("✓ TOUS LES TESTS SONT PASSÉS AVEC SUCCÈS!")
#     print("="*50)
#     print(f"Admin créé: {admin_id}")
#     print(f"Team créée: {team_id} avec {team.members.count()} membres")
#     print(f"Events créés: 2")
#     print(f"Membres total: {User.objects.count()}")
#     
#     # Clean up
#     database_for_test.flush_current_database()