import { client } from './client';
import { getSdkApollo } from './getSdkApollo';

export const requestsClient = getSdkApollo(client);
