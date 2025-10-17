import { ApplicationConfig, inject } from '@angular/core';
import { ApolloClientOptions, InMemoryCache, ApolloLink, from } from '@apollo/client/core';
import { Apollo, APOLLO_OPTIONS } from 'apollo-angular';
import { HttpLink } from 'apollo-angular/http';
import { onError } from '@apollo/client/link/error';
import { Router } from '@angular/router';

const uri = '/graphql/';

export function apolloOptionsFactory(): ApolloClientOptions<any> {
  const httpLink = inject(HttpLink);
  const router = inject(Router);

  // Middleware pour ajouter le CSRF token à chaque requête
  const csrfLink = new ApolloLink((operation, forward) => {
    const match = document.cookie.match(new RegExp('(^| )csrftoken=([^;]+)'));
    const csrfToken = match ? match[2] : '';

    operation.setContext({
      headers: {
        'X-CSRFToken': csrfToken,
      },
    });
    return forward(operation);
  });

  // Middleware pour gérer les erreurs
  const errorLink = onError(({ graphQLErrors, networkError }) => {
    if (graphQLErrors) {
      for (const err of graphQLErrors) {
        if (
          err.extensions?.['code'] === 'UNAUTHENTICATED' ||
          err.message?.toLowerCase().includes('unauthorized')
        ) {
          console.warn('Session expirée — redirection vers /login');
          router.navigate(['/login']);
        }
      }
    }

    if (networkError) {
      const status = (networkError as any).statusCode || (networkError as any).status;
      if (status === 401 || status === 403) {
        console.warn('Erreur réseau 401/403 — redirection vers /login');
        router.navigate(['/login']);
      }
    }
  });

  const http = httpLink.create({
    uri,
    withCredentials: true, // <-- indispensable pour envoyer les cookies
  });

  // Chaîne des middlewares : erreurs -> CSRF -> http
  const link = from([errorLink, csrfLink, http]);

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
