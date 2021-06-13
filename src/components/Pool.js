import { memo, useMemo, useState, useCallback } from 'react'
import classnames from 'classnames'
import {div, Collapse, Tooltip} from '@material-ui/core'
import { KeyboardArrowDown, KeyboardArrowUp, ErrorOutline } from '@material-ui/icons'
import { CgInfo } from 'react-icons/cg'
import { abbrNum, displayTokenUnits } from 'lib/numFormat'
import PoolInfo from './PoolInfo'
import PoolDetails from './PoolDetails'
import SoteriaModal from 'components/SoteriaModal'
import { dust } from 'constants/index'
import { chainsById } from 'constants/chains'
import * as venusMigration from 'lib/venusMigration'
import { poolsImages as images } from '../constants/pools-images';
import { tokensByAddressLowerCase } from 'lib/tokens'


const TokenIcon = ({ token, symbol, address: addressT, ...rest}) => {
  if (!token) {
    token = addressT && tokensByAddressLowerCase[addressT.toLowerCase()]
    if (!token) {
      return null
    }
    token = { url: token.logoURI }
  }
  const { address, url, rounded, bg, darkBg, margin } = token
  const src = url || `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/smartchain/assets/${address}/logo.png`
  return (
    <img
      src={src}
      alt=""
      className={classnames(
        rounded && 'rounded-full shadow-sm',
        bg && `bg-${bg}`,
        darkBg,
        margin && `p-${margin}`,
        'w-6 h-6 sm:w-8 sm:h-8'
      )}
      {...rest}
    />
  )
}

const Pool = ({
  summary,
  pool,
  hasAutoRewards = true,
  initiallyOpen = false,
  chain,
  alert,
  ...rest
}) => {
  // eslint-disable-next-line no-unused-vars
  const [_id, multiplier, asset, _farm, tvl, apy] = summary
  const [open, setOpen] = useState(initiallyOpen)
  const toggleOpen = useCallback(() => setOpen(x => !x), [])
  const [token1, token2] = useMemo(() => {
    return asset.toLowerCase().replace(/ lp.*/, '')
    .replace(/^i/g, '')
    .replace(/^belt/g, '')
    .split('-')
  }, [asset])

  const dailyAPR = (pool?.APR + pool?.APR_AUTO) * 100 / 364
  const newMultiplierAt = pool?.newMultiplierAt
  const showNewMultiplier = Date.now() < newMultiplierAt
  const isNew = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) < pool?.createdAt
  const useNewMultiplier = Date.now() > newMultiplierAt

  const _multiplier = useNewMultiplier
    ? pool?.newMultiplier
    : multiplier

  const [soteriaModalOpen, setSoteriaModalOpen] = useState(false)
  const openSoteriaModal = useCallback((params) => setSoteriaModalOpen(params), [])
  const closeSoteriaModal = useCallback(() => setSoteriaModalOpen(false), [])
  const isOldVenus = venusMigration.oldVaults.includes(_id)

  return (
    <>
      <div className="text-left text-sm sm:text-base py-2">
        <div className="flex px-2">
        { images[token1] && (images[token2] || !token2) ? <div className="w-10 sm:w-20 flex space-x-1 p-0 sm:p-2 xl:p-4 items-center">
          <TokenIcon symbol={token1} token={images[token1]} />
          { token2
            ? <TokenIcon symbol={token2} style={{ marginLeft: '-1em'}} token={images[token2]} />
            : <div style={{ marginLeft: '-1em'}} className="w-6 sm:w-8" /> }
        </div> :
        <div className="w-10 sm:w-20 flex space-x-1 p-0 sm:p-2 xl:p-4 items-center">
          <TokenIcon symbol={token1} address={pool.wantToken1Address} />
          { token2
            ? <TokenIcon symbol={token2} address={pool.wantToken0Address} style={{ marginLeft: '-1em'}} />
            : <div style={{ marginLeft: '-1em'}} className="w-6 sm:w-8" /> }
        </div> }
        <div onClick={toggleOpen} className="flex-auto grid items-center gap-2 lg:gap-4 cursor-pointer"
        style={{gridTemplateColumns: '2.5fr 1fr 1fr 1.5rem' }}>
          <div className="flex flex-col">
            <div className="flex">
              <div className="font-semibold flex space-x-2">
                <div>{ asset }</div>
                { (alert || rest.emergencyWithdraw) && (
                    <CgInfo className="text-base sm:text-2xl text-yellow-600 dark:text-yellow-400" />
                ) }
              </div>&nbsp;
              { (isNew || venusMigration.newVaults.includes(_id)) && (
                <div className="hidden sm:text-xs text-blue-500 dark:text-blue-300 font-bold" style={{ fontSize: 9 }}>
                  new
                </div>
              ) }
            </div>
            <div className="grid grid-rows-2 items-center text-gray-500 dark:text-gray-400 font-semibold text-xs sm:text-sm">
              <div className="">Farm:&nbsp;{_farm}</div>
              <div className="">
                <div className="">TVL&nbsp;${abbrNum(Math.floor(parseFloat(tvl)))}</div>
              </div>
            </div>
          </div>
          <div className="text-right font-semibold">
            <div className="text-sm sm:text-base">{abbrNum(parseFloat(apy))}%</div>
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{abbrNum(dailyAPR, 2)}%</div>
            { chain.AUTOAddress && (
              <div className={classnames(
                'text-xs sm:text-sm',
                { 'text-blue-500': showNewMultiplier },
                { 'text-gray-500 dark:text-gray-400': !showNewMultiplier },
              )}>
                { _multiplier }{ showNewMultiplier && ( <>&#8594;{ pool.newMultiplier }</> )}
              </div>
            )}
          </div>
          <div className="text-xs sm:text-sm text-right font-semibold">
            <div className={classnames(
              rest.userWantsBalance > 0 ? 'text-green-600 dark:text-green-500' :
              'text-gray-500 dark:text-gray-400',
              )}
            >
              {displayTokenUnits(rest.userWantsBalance, 2)}
            </div>
            <div className={classnames(
                rest.userStakedWantToken > 0
                  ? 'text-green-600 dark:text-green-500'
                  : 'text-gray-500 dark:text-gray-400'
              )}
            >
              {displayTokenUnits(rest.userStakedWantToken, 2)}
            </div>
            { chain.AUTOAddress && (
            <div className={classnames(
              rest.userPendingAUTO > dust ? 'text-green-600 dark:text-green-500' :
              'text-gray-500 dark:text-gray-400',
              )}
            >
              {displayTokenUnits(rest.userPendingAUTO, 2)}
            </div>
            )}
          </div>
          <div className="text-right">
            { open ? <KeyboardArrowUp /> : <KeyboardArrowDown /> }
          </div>
        </div>
        </div>
        { process.browser && pool && (
          <Collapse in={open}>
            <PoolDetails
              pool={pool}
              hasAutoRewards={hasAutoRewards}
              chain={chain}
              {...rest}
            />
            <div className="mx-3 mb-6">
              <PoolInfo
                pid={_id}
                pool={pool}
                chain={chain}
                openSoteriaModal={openSoteriaModal}
                stake={rest.userStakedWantToken}
                enabled={open}
                onTxSuccess={rest.onTxSuccess}
              />
            </div>
          </Collapse>
        ) }
      </div>
      { soteriaModalOpen && (
        <SoteriaModal
          stake={rest.userStakedWantToken}
          stakeInBNB={soteriaModalOpen.stakeInBNB}
          closeModal={closeSoteriaModal}
        />
      ) }
    </>
  )
}

export default memo(Pool)
