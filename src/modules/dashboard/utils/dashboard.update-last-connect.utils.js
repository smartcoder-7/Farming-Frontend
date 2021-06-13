import { useEffect } from "react";
import { gql, useMutation } from "urql";

const UPDATE_LAST_CONNECT = gql`
  mutation updateLastConnect($address: String!, $now: timestamptz!) {
    update_wallets_by_pk(
      pk_columns: { address: $address }
      _set: { last_connect: $now }
    ) {
      address
      last_connect
    }
  }
`;

export function useUpdateLastConnect(wallet) {
  const [state, mutate] = useMutation(UPDATE_LAST_CONNECT);
  useEffect(() => {
    if (!state?.data) {
      mutate({ address: wallet, now: new Date().toJSON() });
    }
  }, [wallet]);
}
