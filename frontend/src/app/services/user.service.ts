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
    }
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

  constructor(private apollo: Apollo) {
    this.loadCurrentUserFromServer();
  }
  private readonly UPDATE_USER_MUTATION = gql`
    mutation UpdateUser($userData: UserInput!) {
      updateUser(userData: $userData) {
        user {
          id
          firstName
          lastName
          email
          username
          telephone
          role
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

  async updateUser(data: Partial<User> & { password?: string }): Promise<User | null> {
    try {
      const res = await firstValueFrom(
        this.apollo.mutate<{ updateUser: { user: User } }>({
          mutation: this.UPDATE_USER_MUTATION,
          variables: {
            userData: data  // ✅ Utilise "userData" au lieu de "info"
          },
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
      return {
        id: graphqlUser.id.toString(),
        username: graphqlUser.username,
        email: graphqlUser.email,
        firstName: graphqlUser.firstName || '',
        lastName: graphqlUser.lastName || '',
        telephone: graphqlUser.telephone || '',
        role: graphqlUser.role || '',
        team: graphqlUser.team || undefined
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
