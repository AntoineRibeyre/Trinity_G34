import { Injectable } from "@angular/core";
import { Apollo } from "apollo-angular";
import { firstValueFrom } from "rxjs";
import { CurrentUserResponse, User } from "../models/user.model";
import gql from "graphql-tag";

@Injectable({ providedIn: "root" })
export class UserService {
  currentUser: User | null = null;

  private readonly CURRENT_USER_QUERY = gql`
    query CurrentUser {
      currentUser {
        id
        username
        email
        firstName
        lastName
        telephone
        role
      }
    }
  `;

  private readonly UPDATE_USER_MUTATION = gql`
    mutation UpdateUser(
      $firstName: String
      $lastName: String
      $email: String
      $password: String
    ) {
      updateUser(
        firstName: $firstName
        lastName: $lastName
        email: $email
        password: $password
      ) {
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

  constructor(private apollo: Apollo) {
    this.loadCurrentUserFromServer();
  }

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
          variables: data,
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
}
