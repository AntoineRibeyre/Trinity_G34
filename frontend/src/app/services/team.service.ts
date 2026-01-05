import { Injectable, OnInit } from '@angular/core';
import { Apollo } from 'apollo-angular';
import gql from 'graphql-tag';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import {Team} from '../models/team.model';

// Interfaces pour typer les données
export interface EmployeeCalendar {
  begin: string;
  end: string;
  duration: number;
  dayType: string;
  dayOver: boolean;
}

export interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  role?: string;
  Calendar?: EmployeeCalendar[];
}

interface Calendar {
  id: number;
  begin: string;
  end: string;
  dayType: string;
  duration: number;
  dayOver: boolean;
  employee: Employee;
}

interface Planning {
  date: string;
  totalHours: string;
  calendar: Calendar[];
}

interface UserDetails {
  id: number;
  firstName: string;
  lastName: string;
  role?: string;
}

interface TeamMember {
  userDetails: UserDetails;
  planning: Planning[];
}

interface Manager {
  userDetails: UserDetails;
  planning: Planning[];
}

interface TeamDetails {
  id: number;
  name: string;
  description: string;
  members: Employee[];
}

export interface ManagerViewResponse {
  managerView: {
    manager: Manager;
    members: TeamMember[];
    teamDetails: TeamDetails;
  };
}

interface GetAllTeamsResponse {
  allTeams: Team[];
}

interface CreateTeamResponse {
  createTeam: {
    team: Team;
  };
}

interface UpdateTeamResponse {
  updateTeam: {
    message: string;
  };
}

interface GetTeamMembersResponse {
  teamMembers: Employee[];
}

const DELETE_MEMBER = gql`
  mutation DeleteMember($teamId: Int!, $employeeIds: [Int]!) {
    deleteMember(teamId: $teamId, employeeIds: $employeeIds) {
      message
      team {
        id
        name
        members {
          id
          firstName
          lastName
        }
      }
    }
  }
`;

const DELETE_TEAM = gql`
  mutation DeleteTeam($teamId : Int!){
    deleteTeam(teamId: $teamId){
      ok,
      message
    }
  }`

const GET_ALL_TEAMS = gql`
  query GetAllTeams{
    allTeams{
      id
      name
      description
      field
      members{
        id
        firstName
        lastName
        email
        role
        Calendar{
          begin
          end
          duration
          dayType
          }
        }
      }
  }
`;

const CHANGE_TEAM_MANAGER = gql`
mutation ChangeTeamManager($teamId: Int!, $newManagerId: Int!) {
  changeTeamManager(teamId: $teamId, newManagerId: $newManagerId) {
    message
  }
}`

const MANAGER_VIEW_QUERY = gql`
  query ManagerView($managerId: Int!) {
    managerView(managerId: $managerId) {
      manager {
        userDetails {
          id
          firstName
          lastName
        }
        planning {
          date
          totalHours
          calendar {
            id
            begin
            end
            dayType
            duration
            dayOver
            employee {
              id
              firstName
              lastName
            }
          }
        }
      }
      members {
        userDetails {
          id
          firstName
          lastName
          role
        }
        planning {
          date
          totalHours
          calendar {
            id
            begin
            end
            dayType
            duration
            dayOver
            employee {
              id
              firstName
              lastName
              role
            }
          }
        }
      }
      teamDetails {
        id
        name
        description
        members {
          id
          firstName
          lastName
          role
        }
      }
    }
  }
`;

const CREATE_TEAM = gql`
  mutation CreateTeam($description: String!, $field: String!,$name: String!, $managerID: Int!){
    createTeam(description: $description, field: $field, name: $name, managerID: $managerID){
      team {
       id
       }
      }
    }`

const ADD_EMPLOYEES = gql`
  mutation AddEmployeeToTeam($teamId: Int!, $employeeIds: [Int]!) {
    addEmployeeToTeam(teamId: $teamId, employeeIds: $employeeIds) {
      message
      team {
        id
        name
        members {
          id
          firstName
          lastName
        }
      }
    }
  }
`;

const UPDATE_TEAM = gql`
mutation UpdateTeam($teamToUpdate: TeamInput!) {
    updateTeam(teamToUpdate: $teamToUpdate) {
      message
    }
  }
`

const GET_TEAM_MEMBERS = gql`
  query GetTeamMembers($teamId: Int!) {
    teamMembers(teamId: $teamId) {
      id
      firstName
      lastName
      email
      username
      telephone
      role
      socialNumber
      contract
      arrivalDate
      annualSalary
      birthDate
      workingHours
      leaves
      Calendar {
        begin
        end
        duration
        dayType
        dayOver
      }
    }
  }
`;

@Injectable({
  providedIn: 'root'
})
export class TeamService {

  // Le constructeur injecte Apollo automatiquement
  constructor(private apollo: Apollo) {}

  getAllTeams(): Observable<any[]> {
    return this.apollo.watchQuery<any>({
      query: GET_ALL_TEAMS,
      fetchPolicy: 'network-only' // force une requête réseau à chaque appel
    })
    .valueChanges
    .pipe(
      map(result => result.data.allTeams)
    );
  }

  /**
   * 🔹 Crée une nouvelle équipe
   * @param name Nom de l'équipe
   * @param field Domaine de l'équipe
   * @param description Description de l'équipe
   */
  createTeam(name: string, field: string, description: string, managerID: number): Observable<any> {
    console.log("manager")
    console.log(managerID)
    return this.apollo.mutate<CreateTeamResponse>({
      mutation: CREATE_TEAM,
      variables: { name, field, description, managerID }
    })
    .pipe(
      map(result => result.data!.createTeam.team)
    );
  }

  addEmployees(teamId: number, employeeIds: number[]): Observable<any> {
    return this.apollo.mutate({
      mutation: ADD_EMPLOYEES,
      variables: {
        teamId: teamId,
        employeeIds: employeeIds
      }
    });
  }

  /**
   * Récupère la vue complète du manager avec son équipe
   */
  getManagerView(managerId: number): Observable<ManagerViewResponse['managerView'] | null> {
    return this.apollo.query<ManagerViewResponse>({
      query: MANAGER_VIEW_QUERY,
      variables: { managerId },
      fetchPolicy: 'network-only'
    }).pipe(
      map((result) => {
        console.log('Résultat GraphQL brut:', result);
        return result.data.managerView;
      }),
      catchError((error) => {
        console.error('Erreur GraphQL:', error);
        return of(null);
      })
    );
  }

  removeMembers(teamId: number, employeeIds: number[]): Observable<any> {
    return this.apollo.mutate({
      mutation: DELETE_MEMBER,
      variables: {
        teamId: teamId,
        employeeIds: employeeIds
      }
    });
  }

  deleteTeam(teamId: number):Observable<any> {
    return this.apollo.mutate({
      mutation: DELETE_TEAM,
      variables: {
        teamId: teamId
      }
    });
  }

  updateTeam( teamToUpdate: {
    id: number;
    name?: string;
    description?: string;
    field?: string;
    managerId?: number;
  }): Observable<{ message: string }> {
    return this.apollo.mutate<UpdateTeamResponse>({
      mutation: UPDATE_TEAM,
      variables: {
        teamToUpdate: teamToUpdate
      },
      //Rafraîchir automatiquement la liste des équipes après la mise à jour
      refetchQueries: [{
        query: GET_ALL_TEAMS
      }]
    })
    .pipe(
      map(result => result.data!.updateTeam as { message: string })
    );
  }



  /**
   * Récupère uniquement les détails de l'équipe
   */
  getTeamDetails(managerId: number): Observable<TeamDetails | null> {
    return this.getManagerView(managerId).pipe(
      map((managerView) => managerView ? managerView.teamDetails : null)
    );
  }

  /**
   * Récupère uniquement les membres de l'équipe
   */
  getTeamMembers(managerId: number): Observable<TeamMember[] | null> {
    return this.getManagerView(managerId).pipe(
      map((managerView) => managerView ? managerView.members : null)
    );
  }

  /**
   * Récupère uniquement les données du manager
   */
  getManagerData(managerId: number): Observable<Manager | null> {
    return this.getManagerView(managerId).pipe(
      map((managerView) => managerView ? managerView.manager : null)
    );
  }

  /**
   * Récupère la liste des utilisateurs membres d'une équipe
   * @param teamId ID de l'équipe
   * @returns Observable contenant la liste des membres de l'équipe
   */
  getTeamMembersByTeamId(teamId: number): Observable<Employee[]> {
    return this.apollo.query<GetTeamMembersResponse>({
      query: GET_TEAM_MEMBERS,
      variables: { teamId },
      fetchPolicy: 'network-only'
    }).pipe(
      map((result) => {
        console.log('Membres de l\'équipe récupérés:', result.data.teamMembers);
        return result.data.teamMembers;
      }),
      catchError((error) => {
        console.error('Erreur lors de la récupération des membres:', error);
        return of([]);
      })
    );
  }

  changeTeamManager(teamId: number, newManagerId: number): Observable<any> {
    return this.apollo.mutate({
      mutation: CHANGE_TEAM_MANAGER,
      variables: {
        teamId: teamId,
        newManagerId: newManagerId
      }
    });
  }
}
