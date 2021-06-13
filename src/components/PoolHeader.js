import { memo, useCallback } from 'react'
import { Grid } from '@material-ui/core'
import { TiArrowUnsorted, TiArrowSortedDown, TiArrowSortedUp } from 'react-icons/ti'

const sortIcon = (v, field) => {
  if (v === field) {
    return <TiArrowSortedUp />
  }
  if (v === '-' + field) {
    return <TiArrowSortedDown />
  }
  return (
    <TiArrowUnsorted />
  )
}

const PoolHeader = ({
  sortField,
  setSortField,
  showRewards,
  showAUTOx
}) => {
  const handleClickAPY = useCallback(() => {
    setSortField(s => {
      switch(s) {
        case '-apy':
          return 'apy'
        case 'apy':
          return null
        default:
          return '-apy'
      }
    })
  }, [setSortField])
  const handleClickTVL = useCallback(() => {
    setSortField(s => {
      switch(s) {
        case '-tvl':
          return 'tvl'
        case 'tvl':
          return null
        default:
          return '-tvl'
      }
    })
  }, [setSortField])

  return (
    <div className="pl-10 sm:pl-20 border-b border-gray-200 dark:border-gray-800">
    <div className="
      bg-white dark:bg-black text-left py-2 text-xs sm:text-sm
      text-gray-500 dark:text-gray-400 select-none
      grid gap-2 lg:gap-4 items-end px-2"
      style={{
        zIndex: 1,
        gridTemplateColumns: '2.5fr 1fr 1fr 1.5rem'
      }}>
      <div className="cursor-pointer" onClick={handleClickTVL}>
        <div className="font-semibold">Token</div>
        <div className="font-semibold flex space-x-1 items-center">
          {sortIcon(sortField, 'tvl')}
          <div>TVL</div>
        </div>
      </div>
      <div  className="text-right font-semibold cursor-pointer" onClick={handleClickAPY}>
        <div className="flex justify-end items-center space-x-1">
          {sortIcon(sortField, 'apy')}
          <div>APY</div>
        </div>
        <div className="">Daily&nbsp;APR</div>
        { showAUTOx && <div className="">AUTOx</div> }
      </div>
      <div className="text-right font-semibold">
        <div>Balance</div>
        <div>Deposit</div>
        { showRewards && <div>Rewards</div> }
      </div>
      <div className="">
      </div>
    </div>
    </div>
  )
}

export default memo(PoolHeader)

