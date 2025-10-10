// auth.service.ts
import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import gql from 'graphql-tag';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private LOGIN_MUTATION = gql`
    mutation tokenAuth($email: String!, $password: String!) {
      tokenAuth(email: $email, password: $password) {
        token
        payload
      }
    }
  `;

  constructor(private apollo: Apollo) {}

  login(email: string, password: string) {
    return this.apollo.mutate({
      mutation: this.LOGIN_MUTATION,
      variables: { email, password }
    }).pipe(
      map((result: any) => {
        const token = result?.data?.tokenAuth?.token;
        if (token) {
          localStorage.setItem('authToken', token);
        }
        return result.data.tokenAuth;
      })
    );
  }

  register(userName: String, firstName: string, lastName: string, email: string, telephone: string, password: string) {
  const REGISTER_MUTATION = gql`
    mutation createUser($userName: String!, $firstName: String!, $lastName: String!, $email: String!, $telephone: String!, $password: String!) {
      createUser(username: $userName, firstName: $firstName, lastName: $lastName, email: $email, telephone: $telephone, password: $password) {
        user {
          id
          email
        }
      }
    }
  `;

  return this.apollo.mutate({
    mutation: REGISTER_MUTATION,
    variables: { firstName, lastName, email, telephone, password }
  });
}


  logout() {
    localStorage.removeItem('authToken');
  }

  getToken() {
    return localStorage.getItem('authToken');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}
