import { useState, memo, useCallback } from 'react'
import cx from 'classnames'
import { FiArrowDown, FiArrowUp, FiChevronDown, FiChevronUp } from 'react-icons/fi'
import { usePCSv2Pair } from 'contracts/pcs'
import { useWeb3 } from 'context/web3'
import { displayTokenUnits, formatTokenUnits, parseTokenUnits, token as formatToken } from 'lib/numFormat'
import {tokensByAddressLowerCase, bnb, normalizeWBNBAddress} from 'lib/tokens'
import { useBatchBalance } from 'contracts/batchBalance'
import { ethers } from 'ethers'
import { compose, map, mapObjIndexed } from 'ramda'
const BigNumber = ethers.BigNumber

const TokenInput = ({
  position,
  label,
  amount,
  balance,
  token: tokenAddress,
  onChange,
  isLoading,
  price,
  slippage,
  disabled
}) => {
  const [{web3, address}] = useWeb3()
  const handleAmountChange = useCallback(
    e => onChange(tokenAddress, e.target.value),
    [onChange, tokenAddress]
  )
  const token = tokensByAddressLowerCase[tokenAddress.toLowerCase()]
  if (!token) {
    throw new Error(`Token ${tokenAddress} missing`)
  }

  const handleClickMax = useCallback(e => {
    e.preventDefault()
    e.stopPropagation()
    onChange(tokenAddress, formatTokenUnits(balance, token.decimals))
  }, [tokenAddress, balance])

  return (
    <div className="max-w-sm flex flex-col space-y-1 text-sm">
      <div className="flex justify-between items-end">
        <div className="font-semibold text-sm">{label}</div>
        <div className="text-right text-sm text-gray-500 dark:text-gray-400">
          Balance: <span className="font-mono">{balance && formatToken(formatTokenUnits(balance, token.decimals))}</span>
        </div>
      </div>
      <div className="border dark:border-gray-800 bg-white dark:bg-gray-800 rounded pr-4 sm:pr-3
      flex space-x-3 items-center">
        <div className="flex-auto">
        <input
         type="number"
         className="w-full bg-transparent p-2 pr-0 focus:outline-none"
         value={isLoading || amount == null ? '' : amount}
         placeholder={0}
         onChange={handleAmountChange}
         disabled={disabled}
         style={{ fontSize: 16 }}
        />
        </div>
        { balance > 0 && (
          <button className="btn-secondary text-sm py-1" onClick={handleClickMax}>
            MAX
          </button>
        ) }
        <div className="flex space-x-1 items-center w-16">
          { token && <img src={token?.logoURI} className="w-5 h-5" /> }
          <span className={cx(token ? 'font-semibold' : 'text-gray-500 dark:text-gray-400')}>
            {token?.symbol}
          </span>
        </div>
      </div>
    </div>
  )
}

const calcSwap = ([reserve0, reserve1]) => token0 => {
  return BigNumber.from(reserve0).mul(token0 || 0).div(reserve1)
}

const LPMaker = ({ pool, onTxSuccess }) => {
  const tokens = [pool.wantToken0Address, pool.wantToken1Address]
    .map(normalizeWBNBAddress)
  const [token0, token1] = tokens
  const PCSVersion = (pool.farmName === 'PCSv2' || pool.wantName.includes('PCSv2'))
    ? 2 : 1
  const {
    pairData:
    pair,
    addLiquidity,
    removeLiquidity,
    allowances,
    approveTokensMutations
  } = usePCSv2Pair(
    pool.wantToken0Address,
    pool.wantToken1Address,
    PCSVersion
  )
  const balancesByToken = useBatchBalance([
    pool.wantToken0Address,
    pool.wantToken1Address,
    pair.data?.pairAddress
  ].filter(Boolean))
  const [amounts, setAmounts] = useState({})
  const tokenConfigs = tokens.map(t => tokensByAddressLowerCase[t.toLowerCase()])
  const tokenConfigsByAddress = {
    [token0]: tokensByAddressLowerCase[token0.toLowerCase()],
    [token1]: tokensByAddressLowerCase[token1.toLowerCase()],
  }
  const handleChangeAmount = useCallback((token, amtRaw) => {
    if (!amtRaw) {
      return setAmounts({})
    }
    const amt = (amtRaw.match(/,/g) || []).length === 1
      ? amtRaw.replace(',', '.')
      : amtRaw
    const token0Amt = token === token0
      ? amt
      : compose(
        n => displayTokenUnits(n, 5, tokenConfigs[0].decimals),
        calcSwap([pair.data.reserves._reserve0, pair.data.reserves._reserve1]),
        n => n > 0 ? parseTokenUnits(n, tokenConfigs[1].decimals) : 0
      )(amt)
    const token1Amt = token !== token0
      ? amt
      : compose(
        n => displayTokenUnits(n, 5, tokenConfigs[1].decimals),
        calcSwap([pair.data.reserves._reserve1, pair.data.reserves._reserve0]),
        n => n > 0 ? parseTokenUnits(n, tokenConfigs[0].decimals) : 0
      )(amt)
    setAmounts(s => ({
      ...s,
      [token0]: token0Amt,
      [token1]: token1Amt
    }))
  }, [pair.data?.reserves])

  const pairAddress = pair.data?.pairAddress
  const lpBalance = balancesByToken.data?.[pair.data?.pairAddress]
  const handleChangeLPAmount = useCallback((token, amt) => {
    setAmounts(s => ({
      ...s,
      [token]: amt
    }))
  }, [])

  const needsApproval = allowances.map((allowance, i) => {
    if (!amounts[tokens[i]]) {
      return null
    }
    if (tokens[i] === bnb.address) {
      return false
    }
    return parseTokenUnits(amounts[tokens[i]], tokenConfigs[i].decimals).gt(allowance)
  })
  const insufficientBalance = tokens.map(t => {
    const balance = balancesByToken.data?.[t]
    const amount = amounts[t] && parseTokenUnits(amounts[t], tokenConfigsByAddress[t].decimals)
    return amount && balance && amount.gt(balance)
  })

  return (
    <div className="max-w-md flex flex-col space-y-2 mx-auto">
      <div>
        <div className="font-medium">Create LP</div>
        <div className="font-medium text-sm text-gray-500 leading-none">PCSv{PCSVersion}</div>
      </div>
      <div className="space-y-3 ">
        <TokenInput
          token={token0}
          balance={balancesByToken.data?.[token0]}
          amount={amounts[token0]}
          onChange={handleChangeAmount}
          disabled={!pair.data}
        />
        <TokenInput
          token={token1}
          balance={balancesByToken.data?.[token1]}
          amount={amounts[token1]}
          onChange={handleChangeAmount}
          disabled={!pair.data}
        />
        {pair.isLoading && <div className="text-center">Loading LP data...</div>}
        {insufficientBalance?.some(Boolean) && <div className="text-center">Insufficient balance</div>}
        {needsApproval?.some(Boolean) && <div className="text-center">Requires approval</div>}
        <div className="flex justify-center space-x-2">
          { needsApproval?.map((nA, i) => nA ? (
            <button
              key={tokens[i]}
              className="btn btn-secondary"
              onClick={approveTokensMutations[i].mutate}
              disabled={approveTokensMutations[i].isLoading}
            >
              { approveTokensMutations[i].isLoading ? 'Approving ' : 'Approve ' }
              {tokensByAddressLowerCase[tokens[i].toLowerCase()]?.symbol || `Token ${i}`}
            </button>
          ): null) }
          <button
            disabled={needsApproval?.some(Boolean) || insufficientBalance?.some(Boolean)}
            onClick={() => {
              addLiquidity.mutate(mapObjIndexed((n, t) => parseTokenUnits(n, tokenConfigsByAddress[t].decimals), amounts), {
                onSuccess: () => {
                  balancesByToken.refetch()
                  onTxSuccess()
                  setAmounts({})
                }
              })
            }}
            className="btn-primary mx-auto"
          >
            {addLiquidity.isLoading ? 'Creating LP...' : 'Create LP'}
          </button>
        </div>
      </div>
      {/* pairAddress && (
        <div className="p-2 dark:bg-gray-900 rounded-lg">
          <TokenInput
            token={pairAddress}
            balance={lpBalance}
            amount={amounts[pairAddress]}
            onChange={handleChangeLPAmount}
          />
          <button
            onClick={() => {
              if (!amounts[pairAddress]) { return }
              removeLiquidity.mutate(
                parseTokenUnits(amounts[pairAddress])
              )
            }}
            className="btn-primary mx-auto"
          >
            Remove Liquidity
          </button>
        </div>
      )*/}
    </div>
  )
}

export default memo(LPMaker)

