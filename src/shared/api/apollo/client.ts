import {
  ApolloClient,
  from,
  fromPromise,
  HttpLink,
  InMemoryCache,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { RetryLink } from '@apollo/client/link/retry';
import { onError } from '@apollo/client/link/error';

import { TokenDocument } from './__generated__';

const httpLink = new HttpLink({
  uri: `${process.env.PUBLIC_URL}/graphql`,
});

const retryLink = new RetryLink({
  delay: {
    initial: 300,
    max: Infinity,
    jitter: true,
  },
  attempts: {
    max: 5,
    retryIf: (error, _operation) => !!error,
  },
});

const authMiddleware = setContext(() => {
  const token = localStorage.getItem('@accessToken');
  const customerId = localStorage.getItem('@gateway-company-id');
  if (customerId) {
    return {
      headers: {
        authorization: token || '',
        ['gateway-company-id']: JSON.parse(customerId),
        timeout: 999999,
      },
    };
  } else {
    return {
      headers: {
        authorization: token || '',
        timeout: 999999,
      },
    };
  }
});

let isRefreshing = false;
let pendingRequests = [];

const resolvePendingRequests = () => {
  pendingRequests.map((callback) => callback());
  pendingRequests = [];
};

const getNewToken = () => {
  return client.mutate({
    fetchPolicy: 'no-cache',
    mutation: TokenDocument,
    variables: {
      accessToken: localStorage.getItem('@accessToken'),
      refreshToken: localStorage.getItem('@refreshToken'),
    },
  });
};

const errorLink = onError(({ graphQLErrors, operation, forward }) => {
  if (graphQLErrors) {
    for (const err of graphQLErrors) {
      switch (err.message) {
        //TODO: Дождаться когда бек сделает нормальный код ошибки и поменять
        case 'Authorization token is not valid': {
          let forward$;
          if (!isRefreshing) {
            isRefreshing = true;
            forward$ = fromPromise(
              getNewToken()
                .then((response) => {
                  localStorage.setItem(
                    '@accessToken',
                    response.data.token.accessToken,
                  );
                  localStorage.setItem(
                    '@refreshToken',
                    response.data.token.refreshToken,
                  );
                  resolvePendingRequests();
                })
                .catch((error) => {
                  pendingRequests = [];
                  return;
                })
                .finally(() => {
                  isRefreshing = false;
                }),
            )
              .filter(Boolean)
              .flatMap((accessToken) => {
                const oldHeaders = operation.getContext().headers;
                operation.setContext({
                  headers: {
                    ...oldHeaders,
                    authorization: accessToken,
                  },
                });

                return forward(operation);
              });
          } else {
            // Will only emit once the Promise is resolved
            forward$ = fromPromise(
              new Promise((resolve) => {
                pendingRequests.push(() => resolve(true));
              }),
            );
          }

          return forward$.flatMap(() => forward(operation));
        }
      }
    }
  }
});

export const client = new ApolloClient({
  cache: new InMemoryCache(),
  link: from([errorLink, retryLink, authMiddleware, httpLink]),
  defaultOptions: {
    query: {
      fetchPolicy: 'no-cache',
    },
    mutate: {
      fetchPolicy: 'network-only',
    },
  },
});
