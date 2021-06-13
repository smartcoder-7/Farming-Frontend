import axios from 'axios'
import { QueryClient } from 'react-query'
import { chainsById, isStaging } from 'constants/chains'
import bsc from 'constants/bsc'

const getAxiosInstance = chain => axios.create({
  baseURL: isStaging
    ? chain.stagingApiURL
    : chain.apiURL,
})

const getBSCApi = () => {
  const axiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_BSC_API_URL ||
      'https://static.autofarm.network/bsc'
  })
  const request = (uri) => axiosInstance.get(uri).then(({data}) => data)

  return {
    fetchStats: () => request('stats.json'),
    fetchFarmData: () => request('farm_data.json')
  }
}

const getApi = (chain) => {
  if (chain.chainId === bsc.chainId) {
    return getBSCApi()
  }
  const axiosInstance = getAxiosInstance(chain)
  const request = (uri) => axiosInstance.get(uri)
    .then(({data}) => data)

  return {
    fetchStats: () => request('get_stats'),
    fetchFarmData: () => request('get_farms_data')
  }
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
    },
  },
})

export default getApi

