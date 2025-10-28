import { Injectable, OnInit } from '@angular/core';
import { Apollo } from 'apollo-angular';
import gql from 'graphql-tag';
import { map, Observable } from 'rxjs';
import { Team } from '../models/team.model';





interface GetAllTeamsResponse {
  allTeams: Team[];
}

interface CreateTeamResponse {
  createTeam: {
    team: Team;
  };
}


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
  mutation CreateTeam($description: String!, $field: String!,$name: String!){
    createTeam(description: $description, field: $field, name: $name){
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
  createTeam(name: string, field: string, description: string): Observable<any> {
    return this.apollo.mutate<CreateTeamResponse>({
      mutation: CREATE_TEAM,
      variables: { name, field, description }
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



  
}
