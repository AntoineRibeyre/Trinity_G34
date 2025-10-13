// auth.service.ts
import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import gql from 'graphql-tag';
import { map } from 'rxjs/operators';
import { Router } from '@angular/router';



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

  constructor(private apollo: Apollo, private router: Router) {}

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

  register(username: string, firstName: string, lastName: string, email: string, telephone: string, password: string, role: string) {
  const REGISTER_MUTATION = gql`
    mutation createUser($username: String!, $firstName: String!, $lastName: String!, $email: String!, $telephone: String!, $password: String!, $role: String!) {
      createUser(username: $username, firstName: $firstName, lastName: $lastName, email: $email, telephone: $telephone, password: $password, role: $role) {
        user {
          id
          email
        }
      }
    }
  `;

  return this.apollo.mutate({
    mutation: REGISTER_MUTATION,
    variables: {username, firstName, lastName, email, telephone, password, role }
  });
}


  logout() {
    localStorage.removeItem('authToken');
    this.router.navigate(['/']);
  }

  getToken() {
    return localStorage.getItem('authToken');
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('authToken');
  }
}
