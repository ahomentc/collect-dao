import {
    ApolloClient,
    ApolloLink,
    from,
    fromPromise,
    HttpLink,
    InMemoryCache,
    toPromise
  } from '@apollo/client';
  import { RetryLink } from '@apollo/client/link/retry';
  import jwt_decode from "jwt-decode";
  import axios from 'axios';
  
  const API_URL = 'https://api.lens.dev'
  const ERROR_MESSAGE = 'Something went wrong!'
  
  const REFRESH_AUTHENTICATION_MUTATION = `
    mutation Refresh($request: RefreshRequest!) {
      refresh(request: $request) {
        accessToken
        refreshToken
      }
    }
  `;
  
  const httpLink = new HttpLink({
    uri: API_URL,
    fetchOptions: 'no-cors',
    fetch
  });
  
  // RetryLink is a link that retries requests based on the status code returned.
  const retryLink = new RetryLink({
    delay: {
      initial: 100
    },
    attempts: {
      max: 2,
      retryIf: (error) => !!error
    }
  });
  
  const clearStorage = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('lenster.store');
  };
  
  const authLink = new ApolloLink((operation, forward) => {
    const accessToken = localStorage.getItem('accessToken');
  
    if (!accessToken || accessToken === 'undefined') {
      clearStorage();
      return forward(operation);
    }
  
    const expiringSoon = Date.now() >= jwt_decode(accessToken)?.exp * 1000;
  
    if (!expiringSoon) {
      operation.setContext({
        headers: {
          'x-access-token': accessToken ? `Bearer ${accessToken}` : ''
        }
      });
  
      return forward(operation);
    }
  
    return fromPromise(
      axios(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: JSON.stringify({
          operationName: 'Refresh',
          query: REFRESH_AUTHENTICATION_MUTATION,
          variables: {
            request: { refreshToken: localStorage.getItem('refreshToken') }
          }
        })
      })
        .then(({ data }) => {
          const accessToken = data?.data?.refresh?.accessToken;
          const refreshToken = data?.data?.refresh?.refreshToken;
          operation.setContext({
            headers: {
              'x-access-token': `Bearer ${accessToken}`
            }
          });
  
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
  
          return toPromise(forward(operation));
        })
        .catch(() => {
          console.log(ERROR_MESSAGE);
  
          return toPromise(forward(operation));
        })
    );
  });
  
  const client = new ApolloClient({
    link: from([retryLink, authLink, httpLink]),
    cache: new InMemoryCache(),
  });
  
  export default client;
  