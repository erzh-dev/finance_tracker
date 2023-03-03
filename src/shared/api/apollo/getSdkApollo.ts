import { ApolloClient, QueryOptions, MutationOptions } from '@apollo/client';
import { DocumentNode } from 'graphql';

import { getSdk, Requester } from './__generated__';

export type ApolloRequesterOptions<V, R> =
  | Omit<QueryOptions<V>, 'variables' | 'query'>
  | Omit<MutationOptions<R, V>, 'variables' | 'mutation'>;

const validDocDefOps = ['mutation', 'query', 'subscription'];

export function getSdkApollo<C>(client: ApolloClient<C>) {
  const requester: Requester = async <R, V>(
    doc: DocumentNode,
    variables: V,
    options?: ApolloRequesterOptions<V, R>,
  ): Promise<R> => {
    // Valid document should contain *single* query or mutation unless it's has a fragment
    if (
      doc.definitions.filter(
        (d) =>
          d.kind === 'OperationDefinition' &&
          validDocDefOps.includes(d.operation),
      ).length !== 1
    ) {
      throw new Error(
        'DocumentNode passed to Apollo Client must contain single query or mutation',
      );
    }

    const definition = doc.definitions[0];

    // Valid document should contain *OperationDefinition*
    if (definition.kind !== 'OperationDefinition') {
      throw new Error(
        'DocumentNode passed to Apollo Client must contain single query or mutation',
      );
    }

    switch (definition.operation) {
      case 'mutation': {
        const response = await client.mutate<R, V>({
          mutation: doc,
          variables,
          ...(options as Omit<MutationOptions<R, V>, 'variables' | 'mutation'>),
        });

        if (response.errors) {
          throw Error(response.errors[0].message);
        }

        if (response.data === undefined || response.data === null) {
          throw Error('No data presented in the GraphQL response');
        }

        return response.data;
      }
      case 'query': {
        const response = await client.query<R, V>({
          query: doc,
          variables,
          ...options,
        });

        if (response.errors) {
          throw Error(response.errors[0].message);
        }

        if (response.data === undefined || response.data === null) {
          throw Error('No data presented in the GraphQL response');
        }

        return response.data;
      }
      case 'subscription': {
        throw new Error(
          'Subscription requests through SDK interface are not supported',
        );
      }
    }
  };

  return getSdk(requester);
}

export type Sdk = ReturnType<typeof getSdkApollo>;
