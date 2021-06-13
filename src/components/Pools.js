import { memo, useMemo } from 'react'
import {
  compose,
  sortBy,
  map,
  mapObjIndexed,
  identity
} from 'ramda'
import * as venusMigration from 'lib/venusMigration'

import { multiplyTokenPrice } from 'lib/numFormat'
import Pool from 'components/Pool'

const Pools = ({
  farms,
  walletData,
  priceAUTO,
  chain,
  selectedFarm,
  sortField,
  hideEmpty,
  searchTerm,
  isEmergency,
  alert
}) => {
  const degen = selectedFarm === 'Kebab'
  const { userData, stakedValueByPid } = walletData

  const pools = useMemo(
    () => compose(
      // TODO: remove
      // Hide Viking
      xs => xs.filter(([pid]) => pid !== 79 && pid !== 80),
      // vaults migration hidings
      chain.chainId === 56
        ? xs => xs.filter(([pid]) => {
           if (selectedFarm) { return true }
           if (stakedValueByPid?.[pid] > 1) return true
           if (pid == 152) return false
           const pool = farms.data?.pools[pid]
           if (pool.allowDeposits === false) return false
           if (pool.farmName !== 'Venus') return true
        })
        : identity
      ,
      hideEmpty
        ? xs => xs.filter(([pid]) =>
          stakedValueByPid?.[pid] > 1
        )
        : identity,
      sortField
        ? sortBy(([pid, multiplier, asset, farm, tvl, apy]) => {
          if (sortField === 'apy') {
            return parseFloat(apy)
          }
          if (sortField === '-apy') {
            return -parseFloat(apy)
          }
          if (sortField === 'tvl') {
            return parseFloat(tvl)
          }
          if (sortField === '-tvl') {
            return -parseFloat(tvl)
          }
          return 0
        })
        : identity,
      xs => selectedFarm
        ? xs.filter((summary) => {
          const farmName = summary[3]
          return farmName === selectedFarm
        })
        : xs,
      !!searchTerm
        ? xs => xs.filter(([_pid, _mul, asset]) =>
          asset.toUpperCase().includes(searchTerm.toUpperCase())
        )
        : identity,
      xs => degen
        ? xs.slice(farms?.data?.degenRowOnwards)
        : (!searchTerm ? xs.slice(0, farms?.data?.degenRowOnwards) : xs),
    )(farms?.data?.table_data || []),
    [degen, farms?.data, selectedFarm, sortField, userData.data, hideEmpty,
    searchTerm, stakedValueByPid, chain.chainId]
  )

  return (
    <>
      { pools?.map((summary, idx) => {
        if (!summary) { return null }
        const pid = summary[0]
        return (
          <Pool
            key={pid}
            pid={pid}
            summary={summary}
            pool={farms.data.pools?.[pid]}
            userPendingAUTO={userData?.data?.pendingAUTO?.[pid]}
            userWantsBalance={userData?.data?.balances?.[pid]}
            userStakedWantToken={userData?.data?.staked?.[pid]}
            priceAUTO={priceAUTO}
            withdraw={walletData.withdraw}
            onTxSuccess={userData.refetch}
            deposit={walletData.deposit}
            hasAutoRewards={chain.AUTOAddress && !degen}
            emergencyWithdraw={typeof isEmergency === 'function'
              ? isEmergency(farms.data.pools?.[pid])
              : chain.emergencyWithdraw
            }
            chain={chain}
            alert={typeof alert === 'function'
              ? alert(pid)
              : alert
            }
          />
        ) })}
    </>
  )
}

export default memo(Pools)

