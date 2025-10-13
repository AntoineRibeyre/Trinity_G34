// auth.service.ts
import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import gql from 'graphql-tag';
import { map } from 'rxjs/operators';
import {jwtDecode} from 'jwt-decode';
import {BehaviorSubject, Observable} from 'rxjs';

interface JWTPayload {
  username: string;
  email: string;
  user_id: number;
  exp: number;
  origIat: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private currentUserSubject: BehaviorSubject<JWTPayload | null>;
  public currentUser$: Observable<JWTPayload | null>;

  private LOGIN_MUTATION = gql`
    mutation tokenAuth($email: String!, $password: String!) {
      tokenAuth(email: $email, password: $password) {
        token
        payload
      }
    }
  `;

  constructor(private apollo: Apollo) {
    const token = this.getToken();
    const user = token ? this.decodeToken(token) : null;

    this.currentUserSubject = new BehaviorSubject<JWTPayload | null>(user);
    this.currentUser$ = this.currentUserSubject.asObservable();
  }

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
  }

  getToken() {
    return localStorage.getItem('authToken');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  private decodeToken(token: string): JWTPayload {
    return jwtDecode<JWTPayload>(token);
  }

  getUserId(): number | null {
    const user = this.currentUserSubject.value;
    return user ? user.user_id : null;
  }

  getCurrentUser(): JWTPayload | null {
    return this.currentUserSubject.value;
  }

  getUserEmail(): string | null {
    const user = this.currentUserSubject.value;
    return user ? user.email : null;
  }

  getUsername(): string | null {
    const user = this.currentUserSubject.value;
    return user ? user.username : null;
  }
}
