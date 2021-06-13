import { useMemo } from 'react'
import { useAtom } from 'jotai'
import ERC20 from './abis/ERC20.json'
import AutoFarm from './abis/AutoFarm.json'
import AutoSwap from './abis/AutoSwap.json'
import batchBalance from './abis/batchBalance.json'

import { chainsById } from 'constants/chains'
import { getWeb3Atom } from 'context/web3'

// TODO: dynamic import ABIs
// <!> BSC Only
export const contractsConfig = {
  batchBalance: {
    address: '0x7E9f1Ee1905B5Bde9522c20bbb78bAbe3c3FB4ca',
    abi: batchBalance.abi
  },
}

export const getContract = (web3) => ({ address, abi = ERC20.abi }) => {
  if (!web3) return null
  return new web3.eth.Contract(abi, address)
}

export const getERC20TokenContract = (web3) => (tokenAddress) => getContract(web3)({
  address: tokenAddress?.toLowerCase(),
  abi: ERC20.abi
})

export const getAutoFarmContract = (web3) => (address) => getContract(web3)({
  abi: AutoFarm.abi,
  address 
})

export const getAutoSwapContract = (web3) => (chainId) => getContract(web3)({
  abi: AutoSwap.abi,
  address: chainsById[chainId].autoSwapContractAddress
})

export const getContractByName = (web3) => name => getContract(web3)(contractsConfig[name])

export const useContract = (contractConfig) => {
  const [{ web3 }] = useAtom(getWeb3Atom)
  const contract = useMemo(
    () => web3 && contractConfig && getContract(web3)(contractConfig),
    [web3, contractConfig]
  )
  return contract
}

