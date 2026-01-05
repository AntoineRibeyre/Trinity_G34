from typing import List


def create_user_mutation() -> str:
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
    return mutation


def create_team_mutation() -> str:
    """This mutation creates a team for testing purposes."""
    mutation = """
    mutation {
        createTeam(
            name: "Equipe Alpha",
            description: "Équipe de test pour le développement",
            field: "Development",
            managerID: 1
        ) {
            team {
                name
                description
                field
            }
        }
    }
    """
    return mutation


def create_three_users(team_id: int) -> List[str]:
    """This mutation creates 3 random users  for testing purposes."""
    mutation1 = f"""
    mutation {{
      createUser(
        email: "manager@example.com"
        firstName: "Alice"
        lastName: "Dupont"
        password: "manager123"
        role: "Manager"
        teamId: "{team_id}"
        telephone: "0600000001"
        username: "alice.dupont"
      ) {{ user {{ id,
          firstName,
          lastName,
          role }} }}}}"""

    mutation2 = f"""
     mutation {{
      createUser(
        email: "dev1@example.com"
        firstName: "Bob"
        lastName: "Martin"
        password: "dev123"
        role: "Developer"
        teamId: "{team_id}"
        telephone: "0600000002",
        username: "bob.martin"
      ) {{ user {{
        id,
        firstName,
        lastName,
        role
        }} }}}}"""

    mutation3 = f"""
        mutation{{
        createUser(
        email: "dev2@example.com"
        firstName: "Claire"
        lastName: "Durand"
        password: "dev123"
        role: "Developer"
        teamId: "{team_id}"
        telephone: "0600000003"
        username: "claire.durand"
      ) {{ user {{
        id,
        firstName,
        lastName,
        role}} }}}}
    """
    return [mutation1, mutation2, mutation3]


def manager_view_query(manager_id: int) -> str:
    """This query is used to get all team information for a manager,
    used for testing purposes."""

    query = f"""query{{
    managerView(managerId: {manager_id}) {{
      manager {{
        planning {{
          calendar {{
            dayType
            duration
            dayOver
            begin
            employee {{
              lastName
              firstName
              id
            }}
            end
            id
          }}
          date
          totalHours
        }}
        userDetails {{
          firstName
          id
          lastName
        }}
      }}
      members {{
        planning {{
          date
          totalHours
          calendar {{
            begin
            dayOver
            dayType
            duration
            employee {{
              firstName
              id
              lastName
              role
            }}
            end
            id
          }}
        }}
        userDetails {{
          firstName
          id
          lastName
          role
        }}
      }}
      teamDetails {{
        description
        id
        membres {{
          firstName
          id
          lastName
          role
        }}
        name
      }}
    }}}}
    """
    return query


def admin_view_query(admin_id: int) -> str:
    """This query is used to get information about all teams in
    the database."""
    query = f"""
      query {{
        adminView(adminId: {admin_id}) {{
          adminDetails {{
            userDetails {{
              id
              lastName
              role
              firstName
            }}
            planning {{
              date
              totalHours
              calendar {{
                begin
                dayOver
                dayType
                duration
                end
                id
              }}
            }}
          }}
          teams {{
            teamDetails {{
              id
              description
              name
              membres {{
                firstName
                id
                lastName
                role
              }}
            }}
            members {{
              planning {{
                date
                totalHours
                calendar {{
                  begin
                  dayOver
                  dayType
                  employee {{
                    firstName
                    id
                    lastName
                    role
                  }}
                  duration
                  end
                  id
                }}
              }}
              userDetails {{
                firstName
                id
                lastName
                role
              }}
            }}
            manager {{
              planning {{
                date
                totalHours
                calendar {{
                  begin
                  dayOver
                  end
                  id
                  duration
                  dayType
                }}
              }}
              userDetails {{
                firstName
                id
                lastName
                role
              }}
            }}
          }}
        }}
      }}
      """
    return query
