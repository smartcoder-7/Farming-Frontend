import { useMemo } from 'react'
import { useAtom } from 'jotai'
import { useQuery } from 'react-query'
import { compose, fromPairs, zip, pluck } from 'ramda'

import { getContract, contractsConfig } from './index'
import tokensList from 'lib/tokens.json'
import { getWeb3Atom } from 'context/web3'
import { bnb } from 'lib/tokens'

export function useBatchBalance(tokens) {
  const [{ web3, address }] = useAtom(getWeb3Atom)
  const batchBalanceContract = useMemo(
    () => web3 && getContract(web3)(contractsConfig.batchBalance),
    [web3]
  )
  return useQuery(
    ['balance', address, tokens],
    () => Promise.all([
      web3.eth.getBalance(address),
      batchBalanceContract.methods.tokensBalance(address, tokens).call({})
    ]).then(([bnbBalance, tokensBalance]) => [bnbBalance, ...tokensBalance]),
    {
      enabled: !!web3 && !!address,
      select: compose(fromPairs, zip([bnb.address, ...tokens]))
    }
  )
}

export function useBatchAllBalance(additionalTokens = []) {
  return useBatchBalance([
    ...pluck('address', tokensList.tokens),
    ...additionalTokens
  ])
}

