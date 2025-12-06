import { Injectable } from "@angular/core";
import { Apollo } from "apollo-angular";
import { firstValueFrom } from "rxjs";
import { CurrentUserResponse, User } from "../models/user.model";
import gql from "graphql-tag";
import { Team } from "../models/team.model";

interface GraphQLUser {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  telephone?: string;
  role?: string;
  team?: Team;
  contract?: string;
  socialNumber?: number;
  arrivalDate?: string;
  birthDate?: string;
  workingHours?: number;
  annualSalary?: number;
  leaves?: number;
}

interface AllUsersResponse {
  allUsers: GraphQLUser[];
}

const GET_ALL_USERS = gql`
  query GetAllUsers {
    allUsers {
      id
      username
      email
      firstName
      lastName
      telephone
      role
      isActive
      team{
        id
        field
        name
        description
        members {
          id
          username
          email
          firstName
          lastName
          telephone
          role
        }
      }
      socialNumber
      contract
      arrivalDate
      annualSalary
      birthDate
      workingHours
      leaves
    }
  }
`;

const DELETE_USER = gql`
  mutation DeleteUser($userId: Int!) {
    deleteUser(userId: $userId) {
      message
    }
  }
`;

interface DeleteUserResponse {
  deleteUser: {
    message: string;
  };
}


@Injectable({ providedIn: 'root' })
export class UserService {
  currentUser: User | null = null;

  // Build a payload matching GraphQL `UserInput` from frontend `User` object
  private buildUserPayload(data: Partial<User> & { password?: string }): any {
    const payload: any = {};

    const src = data as any;
    if (src.username !== undefined) payload.username = src.username;
    if (src.firstName !== undefined) payload.firstName = src.firstName;
    if (src.lastName !== undefined) payload.lastName = src.lastName;
    if (src.email !== undefined) payload.email = src.email;
    if (src.password !== undefined) payload.password = src.password;
    if (src.telephone !== undefined) payload.telephone = src.telephone;
    if (src.role !== undefined) payload.role = src.role;

    if (src.socialNumber !== undefined) {
      const sn = Number(src.socialNumber);
      if (!Number.isNaN(sn) && Number.isFinite(sn)) payload.socialNumber = Math.trunc(sn);
    }

    if (src.contract !== undefined) payload.contract = src.contract;
    if (src.arrivalDate !== undefined) payload.arrivalDate = src.arrivalDate;
    if (src.annualSalary !== undefined) {
      const v = Number(src.annualSalary);
      if (!Number.isNaN(v) && Number.isFinite(v)) payload.annualSalary = Math.trunc(v);
    }
    if (src.birthDate !== undefined) payload.birthDate = src.birthDate;
    if (src.workingHours !== undefined) {
      const v = Number(src.workingHours);
      if (!Number.isNaN(v) && Number.isFinite(v)) payload.workingHours = Math.trunc(v);
    }
    if (src.leaves !== undefined) {
      const v = Number(src.leaves);
      if (!Number.isNaN(v) && Number.isFinite(v)) payload.leaves = Math.trunc(v);
    }
    if (src.isActive !== undefined) payload.isActive = src.isActive;

    if (src.team !== undefined && src.team !== null) {
      const t = src.team as any;
      if (typeof t === 'number' || typeof t === 'string') payload.teamId = Number(t);
      else if (t && t.id !== undefined) payload.teamId = Number(t.id);
    }

    return payload;
  }

  constructor(private apollo: Apollo) {
    this.loadCurrentUserFromServer();
  }
  private readonly UPDATE_USER_MUTATION = gql`
    mutation UpdateUser($userData: UserInput!, $userId: Int) {
      updateUser(userData: $userData, userId: $userId) {
        user {
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
          team {
            id
            field
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
    }
  `;

  CURRENT_USER_QUERY = gql`
      query CurrentUser {
        currentUser{
            id
            username
            email
            firstName
            lastName
            telephone
            role
            isActive
            team{
              id
              field
              name
              description
              members {
                id
                username
                email
                firstName
                lastName
                telephone
                role
              }
            }
        }
      }
    `;

  async loadCurrentUserFromServer(): Promise<User | null> {
    try {
      const res = await firstValueFrom(
        this.apollo.query<CurrentUserResponse>({
          query: this.CURRENT_USER_QUERY,
          fetchPolicy: "network-only",
        })
      );
      this.currentUser = res.data.currentUser;
      return this.currentUser;
    } catch (error) {
      console.error("Error loading current user:", error);
      this.currentUser = null;
      return null;
    }
  }

  async updateUser(data: Partial<User> & { password?: string }, userId?: string | number): Promise<User | null> {
    try {
      const payload = this.buildUserPayload(data);

      const variables: any = { userData: payload };
      if (userId !== undefined && userId !== null) variables.userId = Number(userId);

      const res = await firstValueFrom(
        this.apollo.mutate<{ updateUser: { user: User } }>({
          mutation: this.UPDATE_USER_MUTATION,
          variables,
        })
      );

      if (!res.data?.updateUser?.user) {
        throw new Error("Failed to update user: Invalid response from server");
      }

      this.currentUser = res.data.updateUser.user;
      return this.currentUser;
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  }

  clearCurrentUser(): void {
    this.currentUser = null;
  }

  async getAllUsers(): Promise<User[]> {
      try {
        const response = await firstValueFrom(
          this.apollo.query<AllUsersResponse>({
            query: GET_ALL_USERS,
            fetchPolicy: 'network-only'
          })
        );

        const users = (response.data?.allUsers || []).map(user =>
          this.convertUser(user)
        );

        return users;
      } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs:', error);
        throw error;
      }
    }

    // Fonction utilitaire pour convertir GraphQLUser en User
    convertUser(graphqlUser: GraphQLUser): User {
      const teamWithMembers = graphqlUser.team
        ? {
            ...graphqlUser.team,
            members: graphqlUser.team.members
              ? graphqlUser.team.members.map(m => ({
                  ...m,
                  id: m.id.toString(),
                }))
              : undefined,
          }
        : undefined;

      return {
        id: graphqlUser.id.toString(),
        username: graphqlUser.username,
        email: graphqlUser.email,
        firstName: graphqlUser.firstName || '',
        lastName: graphqlUser.lastName || '',
        telephone: graphqlUser.telephone || '',
        role: graphqlUser.role || '',
        team: teamWithMembers as Team | undefined,
        socialNumber: graphqlUser.socialNumber,
        contract: graphqlUser.contract,
        arrivalDate: graphqlUser.arrivalDate,
        annualSalary: graphqlUser.annualSalary,
        birthDate: graphqlUser.birthDate,
        workingHours: graphqlUser.workingHours,
        leaves: graphqlUser.leaves,
      };
    }

    async deleteUser(id: string): Promise<string> {
      try {
        const response = await firstValueFrom(
          this.apollo.mutate<DeleteUserResponse>({
            mutation: DELETE_USER,
            variables: { userId: Number(id) },
            fetchPolicy: 'no-cache'
          })
        );

        return response.data?.deleteUser?.message || 'Utilisateur désactivé avec succès.';
      } catch (error) {
        console.error('Erreur lors de la désactivation de l’utilisateur :', error);
        throw error;
      }
    }
}
