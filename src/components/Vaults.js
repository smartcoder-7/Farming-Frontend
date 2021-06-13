import { useMemo, useState, useCallback, useEffect } from 'react'
import { identity, sortBy, uniq, sum, reduce, values, compose, mapObjIndexed } from 'ramda'
import { CgSpinner, CgExternal } from 'react-icons/cg'
import { RiBook3Line } from 'react-icons/ri'
import { useQuery } from 'react-query'
import { ethers } from 'ethers'
import {BigNumber} from '@ethersproject/bignumber'
import Countdown from 'react-countdown'

import { dust } from 'constants/index'
import { chainsById } from 'constants/chains'
import useWallet from 'context/wallet'
import getApi from 'api'
import { token, multiplyTokenPrice } from 'lib/numFormat'
import Loading from 'components/Loading'
import Dashboard from 'components/Dashboard'
import TVLs from 'components/TVLs'
import Pool from 'components/Pool'
import PoolHeader from 'components/PoolHeader'
import PoolFilters, { degenWarning } from 'components/PoolFilters'
import Chain from 'components/Chain'
import Announcement from 'components/Announcement'
import VaultWalletOnboarding from 'components/VaultWalletOnboarding'
import * as venusMigration from 'lib/venusMigration.js'
import { useWeb3 } from 'context/web3'

const refetchStatsInterval = 20000

const Vaults = ({
  chain,
  notify,
  stats,
  farms,
  walletData,

  // filters
  sortField,
  setSortField,
  selectedFarm,
  setSelectedFarm,
  hideEmpty,
  setHideEmpty,
  searchTerm,
  setSearchTerm,

  notice,
  children
}) => {
  const degen = selectedFarm === 'Kebab'
  const farmChoices = useMemo(() => {
    return compose(
      // TODO: remove
      // Hide viking vaults
      xs => xs.filter(farmName => farmName !== 'Viking'),
      uniq,
      xs => xs.map(summary => summary[3]),
    )(farms?.data?.table_data || [])
  }, [farms?.data])

  const {
    userData,
    totalPendingAUTO,
    stakedValueByPid,
    totalStaked,
    totalNumStaked
  } = walletData

  const numHarvestable = useMemo(() =>
    Object.keys(walletData.harvestablePools).length,
    [walletData.harvestablePools]
  )

  const newMultiplierAt = useMemo(() => {
    const pools = farms.data?.pools
    if (!pools) { return false }
    return Object.keys(pools).map(pid => {
      const pool = pools[pid]
      return pool.newMultiplierAt
    }).filter(Boolean).find(time => time > Date.now())
  }, [farms.data])

  const openedTime = useMemo(() => Date.now(), [])
  const showCountdown = useMemo(() =>
    openedTime < newMultiplierAt,
    [openedTime, newMultiplierAt]
  )

  const renderer = useCallback(({ days, hours, minutes, seconds, completed }) => {
    if (completed) {
      // Render a completed state
      return <div>New multipliers in effect</div>
    } else {
      // Render a countdown
      const text = [
        days && `${days}d`,
        `${hours}h`,
        `${minutes}m`,
        `${seconds}s`
      ].filter(Boolean).join(' ')
      return (
        <div className="leading-none">
          New AUTO multipliers in
          <span className="bg-blue-100 dark:bg-blue-900 p-1 rounded text-sm ml-2 whitespace-nowrap font-semibold">
            {text}
          </span>
        </div>
      );
    }
  }, [])

  const showStakedVenus = useCallback(() => {
    setSelectedFarm('Venus')
    setHideEmpty(true)
  }, [])

  const venusVaultsPids = useMemo(() =>
    farms.data?.table_data
      .filter(summary => summary[3] === 'Venus')
      .map(([pid]) => pid),
    [farms.data]
  )
  const hasStakedVenus = useMemo(() =>
    Object.keys(userData.data?.staked || {})
      .filter(pid => chain.chainId === 56 && venusVaultsPids.includes(parseInt(pid, 10)))
      .some(pid => stakedValueByPid[pid] > 1),
    [venusVaultsPids, stakedValueByPid, chain.chainId]
  )

  const [{ isConnectionOK }] = useWeb3()

  return (
    <>
    <div className="m-auto flex flex-col xl:grid xl:grid-cols-12 xl:items-start
      items-center xl:gap-0 w-full max-w-screen-2xl"
    >
      <div className="xl:overflow-y-auto xl:max-h-screen col-span-5 2xl:col-span-6 w-full xl:h-full xl:sticky xl:top-0 xl:bottom-0
        flex flex-col py-4 px-2 sm:px-4 xl:px-8 space-y-6
        max-w-3xl xl:max-w-none flex-auto mt-4 xl:mt-0"
      >
        <div className="flex justify-between space-x-1">
          <div className="text-3xl sm:text-5xl font-semibold leading-none">Vaults</div>

          <TVLs
            stats={stats}
            chainTVL={stats.data?.platformTVL}
            chain={chain}
          />
        </div>
        <div className="space-y-2 w-full m-auto px-2 px-4 xl:px-8 xl:pl-0 xl:pr-4">
          { hasStakedVenus && (
            <Announcement title="Withdraw your Venus vaults deposits">
              <p>Due to changes on the Venus protocol, Venus vaults have been suspended. Please withdraw from the Venus vaults.</p>
              <div className="flex flex-col sm:flex-row sm:space-x-2">
                <a href="https://autofarm-network.medium.com/21-april-2021-venus-vaults-post-mortem-1518ae7399c6"
                className="btn-secondary mt-2"
                target="_blank"
                >
                  Post-Mortem Report
                </a>
                <button className="btn-primary mt-2" onClick={showStakedVenus}>
                  Show your venus vaults
                </button>
              </div>
            </Announcement>
          ) }
          { showCountdown && (
            <Announcement title={(
              <Countdown date={newMultiplierAt} renderer={renderer} />
            )}>
            </Announcement>
          ) }
          { userData.data?.staked?.[152] > 0 && (
            <Announcement title="Please withdraw from the USDT-DOT pool">
            </Announcement>
          ) }
          { notice && (
            <Announcement title={notice.title}>
              {notice.body}
            </Announcement>
          ) }
        </div>
        { isConnectionOK(chain.chainId) && totalNumStaked > 0 && (
          <Dashboard
            pools={farms.data?.pools}
            stats={stats}
            priceAUTO={stats?.data?.priceAUTO}
            totalPendingAUTO={totalPendingAUTO}
            totalStaked={totalStaked}
            totalNumStaked={totalNumStaked}
            chainId={chain.chainId}
            harvestAll={walletData.harvestAll}
            numHarvestable={numHarvestable}
            stakedValueByPid={stakedValueByPid}
          />
        ) }
        { isConnectionOK(chain.chainId) && totalNumStaked === 0 && (
          <div className="flex-auto flex flex-col space-y-4 py-4 justify-center items-start">
            <div>
              <div className="sm:text-lg lg:text-xl font-semibold">
                You're connected
              </div>
              <div className="text-sm sm:text-base">
                Deposit your asset into a vault and start earning.
              </div>
            </div>
            <div>
              <div className="font-semibold flex space-x-1 items-center">
                <RiBook3Line />
                <div>Check out our guides</div>
              </div>
              <a href="https://autofarm.gitbook.io/autofarm-network/vaults/introduction" target="_blank" className="block text-sm sm:text-base text-blue-500">
                Introduction to Vaults
              </a>
              <a href="https://autofarm.gitbook.io/autofarm-network/vaults/fees" target="_blank" className="block text-sm sm:text-base text-blue-500">
                Fees
              </a>
              <a href="https://autofarm.gitbook.io/autofarm-network/vaults/apy-vs-apr" target="_blank" className="block text-sm sm:text-base text-blue-500">
                APY vs APR
              </a>
            </div>
          </div>
        ) }
        { !isConnectionOK(chain.chainId) && (
          <VaultWalletOnboarding />
        ) }
      </div>
      <div className="flex-auto col-span-7 2xl:col-span-6 max-w-3xl xl:max-w-none flex-auto m-auto w-full
        xl:h-full min-h-screen xl:border-l dark:border-gray-800
        flex flex-col
        ">
            <div className="flex-auto divide-y divide-y-reverse divide-gray-200
            dark:divide-gray-800 flex flex-col bg-white dark:bg-black">
              <div className="sticky top-0 bg-white dark:bg-black">
                <PoolFilters
                  selectedFarm={selectedFarm}
                  setSelectedFarm={setSelectedFarm}
                  farmChoices={farmChoices}
                  hideEmpty={hideEmpty}
                  setHideEmpty={setHideEmpty}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                />
                <PoolHeader
                  sortField={sortField}
                  setSortField={setSortField}
                  showRewards={chain.AUTOAddress}
                  showAUTOx={chain.AUTOAddress}
                />
              </div>
              { degen && <div className="p-2 text-center">{degenWarning}</div> }
                { children || (
                  <div className="flex flex-auto justify-center items-center
                    p-8 py-16 text-lg text-gray-500 dark:text-gray-400">
                    No results
                  </div>
                ) }
              </div>
        </div>
      </div>
      { userData.isLoading && (
        <div
          className="box-border fixed bottom-0 left-2/4 transform -translate-x-1/2
          p-3 mb-2 rounded-xl bg-gray-100 dark:bg-gray-900 flex flex-row items-center space-x-2"
        >
          <div className="whitespace-nowrap">Loading wallet data</div>
          <CgSpinner className="animate-spin" />
        </div>
      ) }
    </>
  )
}

export default Vaults

