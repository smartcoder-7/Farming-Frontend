import React from 'react';
import { retryExchange } from '@urql/exchange-retry';
import { useAtom } from 'jotai';

import {
  cacheExchange,
  createClient,
  dedupExchange,
  fetchExchange,
  Provider,
} from 'urql';

import { getWeb3Atom } from 'context/web3';

const hasuraEndpoint = 'https://app.farmfol.io/v1/graphql';
// const hasuraEndpoint = 'http://localhost:8080/v1/graphql';

export const createCustomClient = (address) => {
  const headers = {
    'x-hasura-user-id': address && address.toLowerCase() || '',
    'x-hasura-user-role': 'public',
  };

  return createClient({
    url: hasuraEndpoint,
    fetchOptions: {
      headers,
    },
    exchanges: [
      dedupExchange,
      cacheExchange,
      retryExchange({
        initialDelayMs: 1000,
        maxDelayMs: 15000,
        randomDelay: true,
        maxNumberAttempts: 100,
        retryIf: (err) => Boolean(err && err.networkError),
      }),
      fetchExchange,
    ],
  });
};

export function GraphQLContextProvider({ children }) {
  const [{ address  }] = useAtom(getWeb3Atom);
  return <Provider value={createCustomClient(address)}>{children}</Provider>;
}
