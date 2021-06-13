import { pluck, indexBy, prop } from 'ramda'
import bscConfig from './bsc'
import hecoConfig from './heco'

export const mode = process.env.REACT_APP_MODE || 'prod'

export const apiURL = process.env.NEXT_PUBLIC_API_URL
  || 'https://api2.autofarm.network/'
export const isStaging = process.env.NEXT_PUBLIC_IS_STAGING || false

export const chains = [bscConfig, hecoConfig]
export const defaultChainId = bscConfig.chainId
export const defaultChain = bscConfig

// Generated values
export const chainsById = indexBy(prop('chainId'), chains)
export const chainIds = pluck('chainId', chains)

export const otherChains = {
  1: 'Ethereum'
}

