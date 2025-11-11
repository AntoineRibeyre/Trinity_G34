import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import gql from 'graphql-tag';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

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
  membres: Employee[];
}

export interface ManagerViewResponse {
  managerView: {
    manager: Manager;
    members: TeamMember[];
    teamDetails: TeamDetails;
  };
}

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
        membres {
          id
          firstName
          lastName
          role
        }
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