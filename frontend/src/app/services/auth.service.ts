// auth.service.ts
import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import gql from 'graphql-tag';
import { map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client/core';
import { from } from 'rxjs';




@Injectable({
  providedIn: 'root'
})
export class AuthService {

  //Création d'un client particulier pour le login (sans token csrf)
  loginClient = new ApolloClient({
    link: new HttpLink({
      uri: 'http://localhost:8000/graphql-login/', // endpoint login
      credentials: 'include', // envoie le cookie HttpOnly
    }),
    cache: new InMemoryCache(),
  });

  // Mutation GraphQL pour login
  private LOGIN_MUTATION = gql`
    mutation login($email: String!, $password: String!) {
      login(email: $email, password: $password) {
        success
        message
        csrfToken
      }
    }
  `;

  constructor(private apollo: Apollo, private router: Router) {}

  /**
   * Login utilisateur
   * Le JWT est stocké en cookie HttpOnly côté backend
   * Le CSRF token est stocké dans un cookie normal
   */
  login(email: string, password: string) {
    return from(
      this.loginClient.mutate({
        mutation: this.LOGIN_MUTATION,
        variables: { email, password }
      })
    ).pipe(
      map((result: any) => {
        const csrfToken = result?.data?.login?.csrfToken;
        if (csrfToken) {
          document.cookie = `csrftoken=${csrfToken}; path=/`;
        }
        return result?.data?.login;
      })
    );
  }


  /**
   * Inscription utilisateur
   */
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

  /**
   * Logout utilisateur
   * Supprime le cookie côté backend et redirige l'utilisateur sur la page login
   */
  logout() {
  const LOGOUT_MUTATION = gql`
    mutation logout {
      logout {
        success
      }
    }
  `;

  this.apollo.mutate({ mutation: LOGOUT_MUTATION }).subscribe(() => {
    // Redirection après logout
    document.cookie = 'csrftoken=; path=/; max-age=0'; // optionnel : supprimer le CSRF token
    this.router.navigate(['/login']);
  });
}
  /**
   * Vérifie si utilisateur authentifié
   * Ici, tu peux faire un call /me GraphQL ou vérifier le cookie CSRF
   */
  isAuthenticated(): boolean {
    // par exemple : présence du CSRF token comme proxy
    return !!this.getCookie('csrftoken');
  }

  /**
   * Récupère la valeur d'un cookie
   */
  getCookie(name: string): string | null {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
  }

  /**
   * Envoi d'une mutation GraphQL avec CSRF token automatiquement
   */
  doMutationWithCsrf(query: any, variables: any) {
    const csrfToken = this.getCookie('csrftoken');
    return this.apollo.mutate({
      mutation: query,
      variables,
      context: {
        headers: {
          'X-CSRFToken': csrfToken || ''
        }
      }
    });
  }
}
