import { useMemo } from 'react'
import { useQuery } from 'react-query'

import { useWeb3 } from 'context/web3'
import aggregatorAddresses from './aggregatorAddresses.json'
import aggregatorV3InterfaceABI from './aggregatorABI.json'

async function getPrice(web3, pair) {
  const { address, decimals } = aggregatorAddresses[pair]
  const contract = new web3.eth.Contract(aggregatorV3InterfaceABI, address)
  const data = await contract.methods.latestRoundData().call()
  return { price: data.answer, decimals }
}

export const useChainlinkPrice = (pair) => {
  const [{web3}] = useWeb3()
  return useQuery(
    ['chainlink-price', pair],
    () => getPrice(web3, pair),
    {
      enabled: !!web3,
      staleTime: Infinity,
    }
  )
}

