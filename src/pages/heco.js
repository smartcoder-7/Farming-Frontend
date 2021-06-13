import { memo, useMemo, useState, useCallback, useEffect } from 'react'
import { map, compose, uniq } from 'ramda'
import { useQuery } from 'react-query'
import { useRouter } from 'next/router'

import { chainsById } from 'constants/chains'
import Vaults from 'components/Vaults'
import Pools from 'components/Pools'
import getApi from 'api'
import hecoConfig from 'constants/heco'
import hecoOldConfig from 'constants/heco-old'
import useWallet from 'context/wallet'

const refetchStatsInterval = 20000

const cleanTableData = map(summary => {
  const [pid, multiplier, asset, farm, _tvl, _apy] = summary
  return [pid, multiplier, asset, farm]
})

export async function getStaticProps(context) {
  const api = getApi(hecoConfig)
  const originFarmData = await api.fetchFarmData()
  const farmData = {
    poolsDisplayOrder: originFarmData.poolsDisplayOrder,
    table_data: cleanTableData(originFarmData.table_data),
  }

  return {
    props: {
      initialFarmData: farmData,
      chain: hecoConfig
    },
  }
}

const notice = {
  title: '20 new HECO vaults launched',
  body: 'Please withdraw your existing deposit to the new vaults to continue earning'
}

const VaultsPage = ({ initialFarmData, notify, ...rest }) => {
  // Old vaults
  const apiOld = useMemo(() => getApi(hecoOldConfig), [])
  const statsOld = useQuery(
    ['stats', hecoOldConfig],
    apiOld.fetchStats,
    {
      refetchInterval: refetchStatsInterval
    }
  )
  const farmsOld = useQuery(
    ['farms', hecoOldConfig],
    apiOld.fetchFarmData,
    { initialData: initialFarmData }
  )
  const walletDataOld = useWallet({
    farms: farmsOld,
    chain: hecoOldConfig,
    notify
  })

  // New vaults
  const api = useMemo(() => getApi(hecoConfig), [])
  const stats = useQuery(
    ['stats', hecoConfig],
    api.fetchStats,
    {
      refetchInterval: refetchStatsInterval,
      select: ({ platformTVL, ...rest }) => ({
        ...rest,
        platformTVL: platformTVL + statsOld.data?.platformTVL,
      })
    }
  )
  const farms = useQuery(
    ['farms', hecoConfig],
    api.fetchFarmData,
    { initialData: initialFarmData }
  )
  const walletData = useWallet({
    farms,
    chain: hecoConfig,
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
      chain={hecoConfig}
      sortField={sortField}
      setSortField={setSortField}
      selectedFarm={selectedFarm}
      setSelectedFarm={setSelectedFarm}
      hideEmpty={hideEmpty}
      setHideEmpty={setHideEmpty}
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
      notice={walletDataOld.totalNumStaked > 0 && notice}
      {...rest}
    >
      { walletDataOld.totalNumStaked > 0 && (
        <>
          <div className="py-2 px-2 font-semibold">Old Vaults</div>
          <Pools
            walletData={walletDataOld}
            farms={farmsOld}
            stats={statsOld}
            chain={hecoOldConfig}
            sortField={sortField}
            selectedFarm={selectedFarm}
            hideEmpty={true}
            searchTerm={searchTerm}
            alert={pid => walletDataOld.stakedValueByPid[pid] > 1}
          />
          <div className="py-2 px-2 font-semibold">New Vaults</div>
        </>
      ) }
      <Pools
        walletData={walletData}
        farms={farms}
        stats={stats}
        chain={hecoConfig}
        sortField={sortField}
        selectedFarm={selectedFarm}
        hideEmpty={hideEmpty}
        searchTerm={searchTerm}
      />
    </Vaults>
  )
}

export default memo(VaultsPage)

