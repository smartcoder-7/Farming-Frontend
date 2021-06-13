import commaNumber from 'comma-number'
import { formatUnits, parseUnits } from '@ethersproject/units'
import BigNumber from 'bignumber.js'
import { clamp } from 'ramda'

export function formatTokenUnits(units, decimals = 18) {
  return formatUnits(units, decimals)
}
export function displayTokenUnits(units, displayDecimals = 5, tokenDecimals = 18) {
  if (Number.isNaN(units) || units == null) { return '–' }
  return parseFloat(formatTokenUnits(units, tokenDecimals)).toFixed(displayDecimals)
}
export function parseTokenUnits(value, decimals = 18) {
  return parseUnits(value, decimals)
}

export function multiplyTokenPrice(units, price, decimals = 18) {
  if (!units) { return NaN }
  return formatTokenUnits(units, decimals) * price
}

export function abbrNum(num, dec) {
  if (Number.isNaN(num) || typeof num !== 'number' || num == null) { return '–' }
  if (num > 1e12){
    return `${commaNumber((num / 1e12).toFixed(1))}T`
  } else if (num > 1e9){
    return `${commaNumber((num / 1e9).toFixed(1))}B`
  } else if (num > 1e6){
    return `${commaNumber((num / 1e6).toFixed(1))}M`
  } else  if (num > 1e3){
    return `${commaNumber((num / 1e3).toFixed(1))}K`
  }
  if (dec) {
    return num.toFixed(dec)
  }
  return num
}

function toFixed(num, dec = 0) {
  const bn = new BigNumber(num)
  return bn.toFixed(dec, 1)
}

export function formatNumber(num, dec = 4) {
  if (Number.isNaN(num) || num == null) { return '–' }
  return commaNumber(toFixed(num, dec))
}

export function token(num, dec = 5, maxLength = 8) {
  if (Number.isNaN(num) || num == null) { return '–' }
  const magnitude = Math.floor(Math.log10(parseFloat(num)))
  const adjDec = clamp(
    0,
    dec,
    maxLength - magnitude
  )

  return toFixed(num, adjDec)
}

export function currency(num, dec = 2) {
  return `$${formatNumber(num, dec)}`
}

