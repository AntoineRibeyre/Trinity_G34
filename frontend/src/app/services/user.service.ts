import { Injectable } from "@angular/core";
import { Apollo } from "apollo-angular";
import { firstValueFrom } from "rxjs";
import {CurrentUserResponse, User} from "../models/user.model"
import gql from 'graphql-tag';

@Injectable({ providedIn: 'root' })



export class UserService {
  currentUser: User | null = null;

  constructor(private apollo: Apollo) {
    this.loadCurrentUserFromServer();
  }

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
        }
      }
    `;

    async loadCurrentUserFromServer(): Promise<User | null>  {
    const res = await firstValueFrom(this.apollo.query<CurrentUserResponse>({
      query: this.CURRENT_USER_QUERY,
      fetchPolicy: 'network-only'
    }));
    this.currentUser = res.data.currentUser;
    return this.currentUser
  }

  clearCurrentUser() {
    this.currentUser = null;
  }
}
