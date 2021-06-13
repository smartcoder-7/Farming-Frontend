import { sortBy, indexBy, toPairs, prop, pluck, toLower, compose } from 'ramda'
import PCSTokens from './tokens.json'

const blacklist = [
].map(s => s.toLowerCase())

export const bnb = {
  name: 'BNB Token',
  symbol: 'BNB',
  address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
  chainId: 56,
  decimals: 18,
  logoURI: 'https://exchange.pancakeswap.finance/images/coins/0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c.png',
}
const tokens = [
  bnb,
  ...PCSTokens.tokens
    .filter(({ symbol }) => !blacklist.includes(symbol.toLowerCase()))
]
const tokensAll = [
  bnb,
  ...PCSTokens.tokens
]

export const tokensByAddress = indexBy(prop('address'), tokensAll)
export const tokensByAddressLowerCase = indexBy(
  compose(toLower, prop('address')),
  tokensAll
)
export const tokenAddresses = pluck('address', tokens)
export const tokensBySymbol = indexBy(prop('symbol'), tokens)

export const normalizeBNBAddress = address => address.toLowerCase() === bnb.address.toLowerCase()
  ? tokensBySymbol.WBNB.address
  : address
export const normalizeWBNBAddress = address => address.toLowerCase() === tokensBySymbol.WBNB.address.toLowerCase()
  ? bnb.address
  : address

export const addressesEqual = (a, b) => a?.toLowerCase() === b?.toLowerCase()

export default tokens

