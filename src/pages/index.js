import { memo, useMemo, useState, useCallback, useEffect } from 'react'
import { map, compose, uniq } from 'ramda'
import { useQuery } from 'react-query'
import { useRouter } from 'next/router'

import getApi from 'api'
import bsc from 'constants/bsc'
import useWallet from 'context/wallet'
import { initSoteria } from 'contracts/soteria'
import Vaults from 'components/Vaults'
import Pools from 'components/Pools'

const refetchStatsInterval = 20000

const cleanTableData = map(summary => {
  const [pid, multiplier, asset, farm, _tvl, _apy] = summary
  return [pid, multiplier, asset, farm]
})

export async function getStaticProps(context) {
  const api = getApi(bsc)
  const originFarmData = await api.fetchFarmData()
  const farmData = {
    pools: originFarmData.pools,
    poolsDisplayOrder: originFarmData.poolsDisplayOrder,
    table_data: cleanTableData(originFarmData.table_data),
  }

  return {
    props: {
      initialFarmData: farmData,
      chain: bsc
    },
  }
}

const VaultsPage = ({ initialFarmData, notify, ...rest }) => {
  initSoteria()
  const api = useMemo(() => getApi(bsc), [])
  const stats = useQuery(
    ['stats', bsc],
    api.fetchStats,
    {
      refetchInterval: refetchStatsInterval,
    }
  )
  const farms = useQuery(
    ['farms', bsc],
    api.fetchFarmData,
    { initialData: initialFarmData }
  )
  const walletData = useWallet({
    farms,
    chain: bsc,
    notify
  })

  const router = useRouter()
  const [selectedFarm, setSelectedFarm] = useState(null)
  const disabledFarm = "Disabled"

  const [sortField, setSortField] = useState(null)
  const [hideEmpty, setHideEmpty] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  useEffect(() => {
    setSearchTerm(router.query.asset)
  }, [router.query.asset])

  return (
    <Vaults
      walletData={walletData}
      farms={farms}
      stats={stats}
      chain={bsc}
      sortField={sortField}
      setSortField={setSortField}
      selectedFarm={selectedFarm}
      setSelectedFarm={setSelectedFarm}
      hideEmpty={hideEmpty}
      setHideEmpty={setHideEmpty}
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
      {...rest}
    >
      <Pools
        walletData={walletData}
        farms={farms}
        stats={stats}
        chain={bsc}
        sortField={sortField}
        selectedFarm={selectedFarm}
        hideEmpty={hideEmpty}
        searchTerm={searchTerm}
        priceAUTO={stats.data?.priceAUTO}
        isEmergency={pool => pool.farmName === 'Venus'}
      />
   </Vaults>
  )
}

export default memo(VaultsPage)

