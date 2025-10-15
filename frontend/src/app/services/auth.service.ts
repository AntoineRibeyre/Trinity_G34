// auth.service.ts
import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import gql from 'graphql-tag';
import { map, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client/core';
import { from, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {CurrentUserResponse} from "../models/user.model"



@Injectable({
  providedIn: 'root'
})
export class AuthService {

  // Client Apollo pour le login (sans CSRF, endpoint /graphql-login/)
  loginClient = new ApolloClient({
    link: new HttpLink({
      uri: '/graphql-login/',
      credentials: 'include', // Envoie les cookies
    }),
    cache: new InMemoryCache(),
  });

  // Mutation GraphQL pour login
  private LOGIN_MUTATION = gql`
    mutation tokenAuth($email: String!, $password: String!) {
      tokenAuth(email: $email, password: $password) {
        token
        csrfToken
        payload
      }
    }
  `;

  // Query pour récupérer l'utilisateur connecté
  CURRENT_USER_QUERY = gql`
    query CurrentUser {
      currentUser {
        id
        email
        username
      }
    }
  `;

  constructor(
    private apollo: Apollo, 
    private router: Router, 
    private http: HttpClient
  ) {}

  /**
   * Login utilisateur ET récupère l'utilisateur connecté
   * Le JWT est stocké en cookie HttpOnly côté backend
   * Le CSRF token est stocké dans un cookie normal
   */
  async login(email: string, password: string): Promise<CurrentUserResponse['currentUser']> {
    try {
      // 1. Exécuter la mutation de login
      const loginResult = await this.loginClient.mutate({
        mutation: this.LOGIN_MUTATION,
        variables: { email, password }
      });

      const csrfToken = loginResult?.data?.tokenAuth?.csrfToken;
      
      if (csrfToken) {
        // Stocker le CSRF token dans un cookie accessible en JavaScript
        document.cookie = `csrftoken=${csrfToken}; path=/; SameSite=Lax`;
        console.log('CSRF token stocké:', csrfToken.substring(0, 20) + '...');
      }
      
      console.log('Login réussi, récupération de l\'utilisateur...');
      
      // 2. Récupérer l'utilisateur connecté (le cookie JWT est maintenant défini)
      const userResult = await firstValueFrom(
        this.apollo.query<CurrentUserResponse>({
          query: this.CURRENT_USER_QUERY,
          fetchPolicy: 'network-only'
        })
      );
      
      const user = userResult.data.currentUser;
      
      if (user) {
        console.log('Utilisateur récupéré:', user);
        return user;
      } else {
        throw new Error('Impossible de récupérer l\'utilisateur après login');
      }
      
    } catch (err) {
      console.error('Erreur login:', err);
      throw err;
    }
  }

  /**
   * Inscription utilisateur
   */
  register(username: string, firstName: string, lastName: string, email: string, telephone: string, password: string, role: string) {
    const REGISTER_MUTATION = gql`
      mutation createUser(
        $username: String!, 
        $firstName: String!, 
        $lastName: String!, 
        $email: String!, 
        $telephone: String!, 
        $password: String!, 
        $role: String!
      ) {
        createUser(
          username: $username, 
          firstName: $firstName, 
          lastName: $lastName, 
          email: $email, 
          telephone: $telephone, 
          password: $password, 
          role: $role
        ) {
          user {
            id
            email
          }
        }
      }
    `;

    return this.loginClient.mutate({
      mutation: REGISTER_MUTATION,
      variables: { username, firstName, lastName, email, telephone, password, role }
    });
  }

  /**
   * Logout utilisateur
   * Supprime les cookies et redirige vers login
   */
  logout() {
    const LOGOUT_MUTATION = gql`
      mutation {
        logout {
          success
          message
        }
      }
    `;

    this.loginClient.mutate({ mutation: LOGOUT_MUTATION })
      .then((response: any) => {
        console.log('Réponse logout:', response);
        
        // Supprimer manuellement les cookies côté client (pour nettoyage visuel)
        document.cookie = 'csrftoken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

        this.router.navigate(['/login']);
      })
      .catch((error: any) => {
        console.error('Erreur logout:', error);
        this.router.navigate(['/login']);
      });
  }


  /**
   * Vérifie si l'utilisateur est authentifié
   * Retourne true si un utilisateur connecté existe, false sinon
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      console.log('Vérification authentification...');
      console.log('Cookies actuels:', document.cookie);
      
      const result = await firstValueFrom(
        this.apollo.query<CurrentUserResponse>({
          query: this.CURRENT_USER_QUERY,
          fetchPolicy: 'network-only', // Force la requête réseau
          errorPolicy: 'all' // Capture toutes les erreurs
        })
      );

      const user = result.data.currentUser;
      
      if (user) {
        console.log('Utilisateur connecté:', user);
        return true;
      } else {
        console.log('Pas d\'utilisateur connecté (currentUser = null)');
        return false;
      }
      
    } catch (err: any) {
      console.error('Erreur lors de la vérification:', err);
      
      // Log détaillé de l'erreur
      if (err.graphQLErrors) {
        console.error('GraphQL Errors:', err.graphQLErrors);
      }
      if (err.networkError) {
        console.error('Network Error:', err.networkError);
      }
      
      return false;
    }
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