import { ApplicationConfig, inject } from '@angular/core';
import { ApolloClientOptions, InMemoryCache, ApolloLink, from } from '@apollo/client/core';
import { Apollo, APOLLO_OPTIONS } from 'apollo-angular';
import { HttpLink } from 'apollo-angular/http';
import { onError } from '@apollo/client/link/error';
import { Router } from '@angular/router';

const uri = 'http://localhost:8000/graphql/';

export function apolloOptionsFactory(): ApolloClientOptions<any> {
  const httpLink = inject(HttpLink);
  const router = inject(Router);

  //Middleware pour ajouter le JWT dans les headers
  const authLink = new ApolloLink((operation, forward) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      operation.setContext({
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    }
    return forward(operation);
  });

  //Middleware pour intercepter les erreurs (401 / 403 en cas de déconnexion)
  const errorLink = onError(({ graphQLErrors, networkError }) => {
    if (graphQLErrors) {
      for (const err of graphQLErrors) {
        if (
          err.extensions?.['code'] === 'UNAUTHENTICATED' ||
          err.message?.toLowerCase().includes('unauthorized')
        ) {
          console.warn('JWT expiré ou invalide — redirection vers /login');
          localStorage.removeItem('authToken');
          router.navigate(['/login']);
        }
      }
    }

    if (networkError) {
      // Si ton serveur renvoie un 401/403 HTTP
      const status = (networkError as any).statusCode || (networkError as any).status;
      if (status === 401 || status === 403) {
        console.warn('Erreur réseau 401/403 — redirection vers /login');
        localStorage.removeItem('authToken');
        router.navigate(['/login']);
      }
    }
  });

  //Chaîne des middlewares : erreurs -> auth -> http
  const link = from([errorLink, authLink, httpLink.create({ uri })]);

  //Configuration Apollo
  return {
    link,
    cache: new InMemoryCache(),
  };
}

export const graphqlProvider: ApplicationConfig['providers'] = [
  Apollo,
  {
    provide: APOLLO_OPTIONS,
    useFactory: apolloOptionsFactory,
  },
];
