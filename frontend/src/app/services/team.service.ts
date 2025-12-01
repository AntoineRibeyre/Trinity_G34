import { Injectable, OnInit } from '@angular/core';
import { Apollo } from 'apollo-angular';
import gql from 'graphql-tag';
import { map, Observable } from 'rxjs';
import { Team } from '../models/team.model';
import { User } from '../models/user.model';





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
export class TeamService implements OnInit{
  
  constructor(private apollo: Apollo) {
    }
  ngOnInit(): void {
    throw new Error('Method not implemented.');
  }

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




  
}
