import os
import json
import django
import pytest
from datetime import datetime, timedelta

from graphene.test import Client
from backend.schema import schema
from trinity.models import User
from . import querylist
from tests.test_data_db.testdbhandler import TestDBHandler
from trinity.models import Team, Event


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
def test_admin_complete_scenario(snapshot, client, database_for_test):
    """
    This test covers the following scenario:
    - Use existing admin, managers and employees from test database
    - Create a team with existing members
    - Create and modify events
    - Update team membership
    """
    print("\n" + "="*70)
    print("DÉBUT DU TEST - SCÉNARIO ADMIN COMPLET")
    print("="*70)
    
    # Clear and recreate database
    database_for_test.flush_current_database()
    database_for_test.create_database()
    
    # =============================
    # STEP 1: Get Existing Users from DB
    # =============================
    print("\n[STEP 1] Récupération des utilisateurs existants...")
    try:
        # Admin (pk=10)
        admin = User.objects.get(role="Admin")
        admin_id = admin.id
        print(f"✓ Admin trouvé: {admin.first_name} {admin.last_name} (ID: {admin_id})")
        
        # Manager Alice Martin (pk=1, Team 1)
        manager = User.objects.get(pk=1, role="Manager")
        manager_id = manager.id
        print(f"✓ Manager trouvé: {manager.first_name} {manager.last_name} (ID: {manager_id})")
        
        # Employees from Team 1
        employee1 = User.objects.get(pk=2, role="Employee")  # Bob Dupont
        employee2 = User.objects.get(pk=3, role="Employee")  # Charlie Lefevre
        print(f"✓ Employee 1: {employee1.first_name} {employee1.last_name} (ID: {employee1.id})")
        print(f"✓ Employee 2: {employee2.first_name} {employee2.last_name} (ID: {employee2.id})")
        
        # Additional employee from Team 2 for later addition
        employee3 = User.objects.get(pk=5, role="Employee")  # Emma Moreau
        print(f"✓ Employee 3 (pour ajout ultérieur): {employee3.first_name} {employee3.last_name} (ID: {employee3.id})")
        
        # Get existing Team 1
        team = Team.objects.get(pk=1)
        team_id = team.id
        print(f"✓ Team trouvée: {team.name} (ID: {team_id})")
        
    except User.DoesNotExist as e:
        pytest.fail(f"Utilisateur manquant dans test_data.json: {e}")
    except Team.DoesNotExist as e:
        pytest.fail(f"Team manquante dans test_data.json: {e}")
    
    # =============================
    # STEP 2: Verify Team Members
    # =============================
    print("\n[STEP 2] Vérification des membres de l'équipe...")
    team_members = team.members.all()
    print(f"✓ Team '{team.name}' contient {team_members.count()} membres:")
    for member in team_members:
        print(f"  - {member.first_name} {member.last_name} ({member.role})")
    
    # =============================
    # STEP 3: Query Admin View (Initial State)
    # =============================
    print("\n[STEP 3] Vérification de la vue admin initiale...")
    admin_view_query = f"""
    query {{
        adminView(adminId: {admin_id}) {{
            adminDetails {{
                userDetails {{
                    id
                    firstName
                    lastName
                    role
                    email
                }}
            }}
            teams {{
                teamDetails {{
                    id
                    name
                    description
                    field
                }}
                manager {{
                    userDetails {{
                        id
                        firstName
                        lastName
                        role
                    }}
                }}
                members {{
                    userDetails {{
                        id
                        firstName
                        lastName
                        role
                        email
                    }}
                }}
            }}
        }}
    }}
    """
    
    admin_view_initial = client.execute(admin_view_query)
    
    if 'errors' in admin_view_initial and admin_view_initial['errors']:
        pytest.fail(f"GraphQL errors in admin view: {admin_view_initial['errors']}")
    
    print("✓ Vue admin initiale récupérée")
    snapshot.assert_match(json.dumps(admin_view_initial, indent=2), 'admin_view_initial.json')
    
    # =============================
    # STEP 4: Create Events
    # =============================
    print("\n[STEP 4] Création d'événements...")
    now = datetime.now()
    start_time = (now + timedelta(days=1)).replace(year=2026, month=1, day=1, hour=14, minute=0, second=0, microsecond=0)
    end_time = start_time + timedelta(hours=2)
    
    create_event_mutation = f"""
    mutation {{
        createEvent(
            subject: "Réunion d'équipe Team Alpha"
            startTime: "{start_time.isoformat()}"
            endTime: "{end_time.isoformat()}"
            isAllDay: false
            attendeeIds: [{manager_id}, {employee1.id}, {employee2.id}]
        ) {{
            event {{
                id
                subject
                startTime
                endTime
                isAllDay
                attendees {{
                    id
                    firstName
                    lastName
                    role
                }}
            }}
            success
            message
        }}
    }}
    """
    
    event_result = client.execute(create_event_mutation)
    
    if 'errors' in event_result and event_result['errors']:
        pytest.fail(f"GraphQL errors creating event: {event_result['errors']}")
    
    if not event_result['data']['createEvent']['success']:
        pytest.fail(f"Event creation failed: {event_result['data']['createEvent']['message']}")
    
    event_id = event_result['data']['createEvent']['event']['id']
    print(f"✓ Event créé avec ID: {event_id}")
    print(f"  - Sujet: {event_result['data']['createEvent']['event']['subject']}")
    print(f"  - Participants: {len(event_result['data']['createEvent']['event']['attendees'])}")
    
    assert Event.objects.filter(id=event_id).exists()
    
    # =============================
    # STEP 5: Create Second Event
    # =============================
    print("\n[STEP 5] Création du second événement...")
    start_time_2 = (now + timedelta(days=2)).replace(hour=10, minute=0, second=0, microsecond=0)
    end_time_2 = start_time_2 + timedelta(hours=1)
    
    create_event_2_mutation = f"""
    mutation {{
        createEvent(
            subject: "Sprint Planning"
            startTime: "{start_time_2.isoformat()}"
            endTime: "{end_time_2.isoformat()}"
            isAllDay: false
            attendeeIds: [{manager_id}, {employee1.id}]
        ) {{
            event {{
                id
                subject
                startTime
                endTime
                attendees {{
                    id
                    firstName
                    lastName
                }}
            }}
            success
            message
        }}
    }}
    """
    
    event_2_result = client.execute(create_event_2_mutation)
    
    if 'errors' in event_2_result and event_2_result['errors']:
        pytest.fail(f"GraphQL errors creating second event: {event_2_result['errors']}")
    
    event_2_id = event_2_result['data']['createEvent']['event']['id']
    print(f"✓ Second event créé avec ID: {event_2_id}")
    print(f"  - Sujet: {event_2_result['data']['createEvent']['event']['subject']}")
    
    # =============================
    # STEP 6: Add Emma (employee3) to Team 1
    # =============================
    print("\n[STEP 6] Ajout d'Emma Moreau à Team Alpha...")
    add_member_mutation = f"""
    mutation {{
        addEmployeeToTeam(
            teamId: {team_id}
            employeeIds: [{employee3.id}]
        ) {{
            message
            team {{
                id
                name
                members {{
                    id
                    firstName
                    lastName
                    role
                }}
            }}
        }}
    }}
    """
    
    add_result = client.execute(add_member_mutation)
    
    if 'errors' in add_result and add_result['errors']:
        pytest.fail(f"GraphQL errors adding member: {add_result['errors']}")
    
    print(f"✓ {employee3.first_name} {employee3.last_name} ajoutée à l'équipe")
    print(f"  - Nouveau nombre de membres: {len(add_result['data']['addEmployeeToTeam']['team']['members'])}")
    
    # =============================
    # STEP 7: Update First Event (add Emma)
    # =============================
    print("\n[STEP 7] Mise à jour du premier événement...")
    new_start_time = start_time.replace(hour=15)
    new_end_time = end_time.replace(hour=17)
    
    update_event_mutation = f"""
    mutation {{
        updateEvent(
            eventId: {event_id}
            subject: "Réunion d'équipe Team Alpha - MODIFIÉE"
            startTime: "{new_start_time.isoformat()}"
            endTime: "{new_end_time.isoformat()}"
            isAllDay: false
            attendeeIds: [{manager_id}, {employee1.id}, {employee2.id}, {employee3.id}]
        ) {{
            event {{
                id
                subject
                startTime
                endTime
                attendees {{
                    id
                    firstName
                    lastName
                }}
            }}
            success
            message
        }}
    }}
    """
    
    update_result = client.execute(update_event_mutation)
    
    if 'errors' in update_result and update_result['errors']:
        pytest.fail(f"GraphQL errors updating event: {update_result['errors']}")
    
    assert update_result['data']['updateEvent']['success'] is True
    assert "MODIFIÉE" in update_result['data']['updateEvent']['event']['subject']
    assert len(update_result['data']['updateEvent']['event']['attendees']) == 4
    print("✓ Event mis à jour")
    print(f"  - Nouveau sujet: {update_result['data']['updateEvent']['event']['subject']}")
    print(f"  - Nombre de participants: {len(update_result['data']['updateEvent']['event']['attendees'])}")
    
    # =============================
    # STEP 8: Verify All Events
    # =============================
    print("\n[STEP 8] Vérification de tous les événements...")
    all_events_query = """
    query {
        allEvents {
            id
            subject
            startTime
            endTime
            isAllDay
            attendees {
                id
                firstName
                lastName
                role
            }
        }
    }
    """
    
    all_events_result = client.execute(all_events_query)
    
    if 'errors' in all_events_result and all_events_result['errors']:
        pytest.fail(f"GraphQL errors querying all events: {all_events_result['errors']}")
    
    events_count = len(all_events_result['data']['allEvents'])
    assert events_count == 2
    print(f"✓ {events_count} événements trouvés:")
    for event in all_events_result['data']['allEvents']:
        print(f"  - {event['subject']} ({len(event['attendees'])} participants)")
    
    snapshot.assert_match(json.dumps(all_events_result, indent=2), 'all_events.json')
    
    # =============================
    # STEP 9: Final Admin View
    # =============================
    print("\n[STEP 9] Vérification finale de la vue admin...")
    final_admin_view = client.execute(admin_view_query)
    
    if 'errors' in final_admin_view and final_admin_view['errors']:
        pytest.fail(f"GraphQL errors in final admin view: {final_admin_view['errors']}")
    
    teams = final_admin_view['data']['adminView']['teams']
    assert len(teams) >= 1
    
    # Find Team Alpha
    team_alpha = next((t for t in teams if t['teamDetails']['id'] == str(team_id)), None)
    assert team_alpha is not None, "Team Alpha not found in admin view"
    
    team_members_count = len(team_alpha['members'])
    print("✓ Vue admin finale:")
    print(f"  - Équipes visibles: {len(teams)}")
    print(f"  - Membres Team Alpha: {team_members_count}")
    
    snapshot.assert_match(json.dumps(final_admin_view, indent=2), 'admin_view_final.json')
    
    # =============================
    # FINAL ASSERTIONS
    # =============================
    print("\n[VÉRIFICATIONS FINALES]")
    
    # Verify database state
    assert User.objects.filter(role="Admin").count() >= 1
    print(f"✓ {User.objects.filter(role='Admin').count()} Admin(s)")
    
    assert User.objects.filter(role="Manager").count() >= 1
    print(f"✓ {User.objects.filter(role='Manager').count()} Manager(s)")
    
    assert User.objects.filter(role="Employee").count() >= 3
    print(f"✓ {User.objects.filter(role='Employee').count()} Employee(s)")
    
    assert Team.objects.count() >= 1
    print(f"✓ {Team.objects.count()} Team(s)")
    
    assert Event.objects.count() == 2
    print("✓ 2 Events créés")
    
    # Verify Team 1 has the new member
    team_refreshed = Team.objects.get(id=team_id)
    assert team_refreshed.members.filter(id=employee3.id).exists()
    print("✓ Emma ajoutée à Team Alpha")
    
    # Verify first event has 4 attendees
    event_refreshed = Event.objects.get(id=event_id)
    assert event_refreshed.attendees.count() == 4
    print("✓ Premier event a 4 participants")
    
    print("\n" + "="*70)
    print("✅ TOUS LES TESTS SONT PASSÉS AVEC SUCCÈS!")
    print("="*70)
    print("📊 Résumé:")
    print(f"   - Admin utilisé: {admin.first_name} {admin.last_name} (ID: {admin_id})")
    print(f"   - Manager: {manager.first_name} {manager.last_name} (ID: {manager_id})")
    print(f"   - Team: {team.name} (ID: {team_id})")
    print(f"   - Membres finaux: {team_refreshed.members.count()}")
    print("   - Events créés: 2")
    print(f"   - Total utilisateurs: {User.objects.count()}")
    print("="*70)
