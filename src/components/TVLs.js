import { memo } from 'react'
import cx from 'classnames'
import { Collapse } from '@material-ui/core'
import { useQuery } from 'react-query'
import Link from 'next/link'
import { sum, map } from 'ramda'

import { chainIds, chainsById } from 'constants/chains'
import { multiplyTokenPrice, displayTokenUnits, currency } from 'lib/numFormat'
import getApi, { queryClient } from 'api'
import bsc from 'constants/bsc'
import heco from 'constants/heco'
import hecoOld from 'constants/heco-old'

const chains = [
  bsc,
  heco,
  hecoOld
]

const TVLs = ({
  chainTVL,
  chainId,
  chain
}) => {
  const tvls = useQuery(
    ['tvls'],
    () => Promise.all(chains.map(chain => getApi(chain).fetchStats())),
    {
      refetchInterval: 20000,
      select: map(({ platformTVL }) => platformTVL)
    }
  )
  const totalTVL = tvls.data ? sum(tvls.data) : NaN

  return (
    <div className="text-sm sm:text-base xl:text-lg">
      <div className="font-semibold flex justify-between">
        <div>TVL</div><div>{currency(totalTVL, 0)}</div>
      </div>
      <div className="font-semibold">
        {chain.label} TVL {currency(chainTVL, 0)}
      </div>
    </div>
  )
}

export default memo(TVLs)

