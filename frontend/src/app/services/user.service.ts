import { Injectable } from "@angular/core";
import { Apollo } from "apollo-angular";
import { firstValueFrom } from "rxjs";
import { CurrentUserResponse, User } from "../models/user.model";
import gql from "graphql-tag";

@Injectable({ providedIn: "root" })
export class UserService {
  currentUser: User | null = null;

  constructor(private apollo: Apollo) {
    this.loadCurrentUserFromServer();
  }

  CURRENT_USER_QUERY = gql`
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

  UPDATE_USER_MUTATION = gql`
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

  async loadCurrentUserFromServer(): Promise<User | null> {
    const res = await firstValueFrom(
      this.apollo.query<CurrentUserResponse>({
        query: this.CURRENT_USER_QUERY,
        fetchPolicy: "network-only",
      })
    );
    this.currentUser = res.data.currentUser;
    return this.currentUser;
  }

  async updateUser(data: Partial<User> & { password?: string }): Promise<User> {
    const res = await firstValueFrom(
      this.apollo.mutate<{ updateUser: { user: User } }>({
        mutation: this.UPDATE_USER_MUTATION,
        variables: data,
      })
    );

    if (res.data?.updateUser?.user) {
      this.currentUser = res.data.updateUser.user;
    }

    return this.currentUser!;
  }

  clearCurrentUser() {
    this.currentUser = null;
  }
}
