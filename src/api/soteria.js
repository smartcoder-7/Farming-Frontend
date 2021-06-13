import axios from 'axios'

import bsc from 'constants/bsc'
import { soteriaApiURL } from 'constants/soteria'

const api = axios.create({
  baseURL: soteriaApiURL
})

export const getCoverCapacity = async () => {
  const { data } = await api.get('quote-api/capacities')
  const autofarmData = data.find(({ contractAddress }) =>
    contractAddress === bsc.autoFarmContractAddress
  )
  return autofarmData
}

export const getQuote = async ({
  coverAmount = 0,
  currency = 'BNB',
  period = 30
}) => {
  const { data } = await api.get('quote-api/quote', {
    params: {
      coverAmount,
      currency,
      period,
      contractAddress: bsc.autoFarmContractAddress
    }
  })
  return data
}

