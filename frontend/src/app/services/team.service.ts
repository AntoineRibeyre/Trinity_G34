import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import gql from 'graphql-tag';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import {Team} from '../models/team.model';

// Interfaces pour typer les données
interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  role?: string;
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
  message: string;


}

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
  }): Observable<UpdateTeamResponse> {
    console.log('ID:', teamToUpdate.id);
    console.log('Name:', teamToUpdate.name);
    console.log('Description:', teamToUpdate.description);
    console.log('Field:', teamToUpdate.field);
    console.log('ManagerId:', teamToUpdate.managerId);
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
      map(result => result.data!)
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
}
