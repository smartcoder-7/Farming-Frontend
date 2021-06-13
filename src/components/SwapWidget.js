import React, { memo, useMemo, useCallback, useState, useEffect } from 'react'
import { useAtom } from 'jotai'
import { useQuery, useMutation } from 'react-query'
import { FiArrowDown, FiArrowUp, FiChevronDown, FiChevronUp } from 'react-icons/fi'
import classnames from 'classnames'
import BigNumber from 'bignumber.js'

import { formatTokenUnits, parseTokenUnits, token as formatToken } from 'lib/numFormat'
import {tokensByAddress, bnb} from 'lib/tokens'
import {getWeb3Atom} from 'context/web3'
import {getERC20TokenContract} from 'contracts'
import { useBatchAllBalance } from 'contracts/batchBalance'
import SwapSelectTokenModal from './SwapSelectTokenModal'
import { useAutoSwapContract, useSwap } from 'contracts/swap'
import { getQuote } from 'api/swap'

const TokenInput = ({
  position,
  label,
  amount = 0,
  balance,
  token: tokenAddress,
  setAmount,
  id,
  openTokenModal,
  readOnly,
  isLoading,
  price,
  slippage
}) => {
  const [{web3, address}] = useAtom(getWeb3Atom)
  const handleAmountChange = useCallback(
    e => setAmount(e.target.value),
    [setAmount, id, tokenAddress]
  )
  const handleOpenTokenModal = useCallback(() => openTokenModal(id), [id])
  const token = tokensByAddress[tokenAddress]

  const handleClickMax = useCallback(e => {
    e.preventDefault()
    e.stopPropagation()
    setAmount(formatTokenUnits(balance, tokensByAddress[tokenAddress].decimals))
  }, [balance, id])

  return (
    <div className="flex flex-col space-y-1">
      <div className="flex justify-between items-end">
        <div className="font-semibold text-sm">{label}</div>
        <div className="text-right text-sm text-gray-500 dark:text-gray-400">
          Balance: <span className="font-mono">{balance && formatToken(formatTokenUnits(balance, tokensByAddress[tokenAddress].decimals))}</span>
        </div>
      </div>
      <div className="border dark:border-gray-800 flex bg-white dark:bg-gray-800 rounded pr-3 flex space-x-3 items-center">
        <input
         type="number"
         className="w-full flex-auto bg-transparent p-3 pr-0 font-mono focus:outline-none"
         value={isLoading || amount === null ? '' : amount}
         placeholder={isLoading && position === 'bottom' && 'Fetching...'}
         onChange={handleAmountChange}
         readOnly={readOnly}
        />
        { balance > 0 && position === 'top' && (
          <button className="btn-secondary text-sm py-1" onClick={handleClickMax}>
            MAX
          </button>
        ) }
        <div className="flex space-x-1 items-center cursor-pointer" onClick={handleOpenTokenModal}>
          { token && <img src={token?.logoURI} className="w-5 h-5" /> }
          <span className={classnames(token ? 'font-semibold' : 'text-gray-500 dark:text-gray-400')}>
            {token?.symbol || <>Select&nbsp;token</> }
          </span>
          <FiChevronDown className="w-8" />
        </div>
      </div>
      <div className="text-right text-sm font-mono text-gray-500 dark:text-gray-400">
        { price ? (
          <>
            ≈ ${price?.toFixed(2).toString()}
            {slippage && `(${slippage.s === 1 ? '-' : '+'}${slippage.abs().times(100).dp(2).toString()}%)`}
          </>
        ) : <>&nbsp;</>}
      </div>
    </div>
  )
}

const useTokenValueState = (id, defAmt = null, defToken) => {
  const [token, setToken] = useState(defToken)
  const [amount, setAmount] = useState(defAmt)
  return { token, setToken, amount, setAmount, id }
}

const useTokenValuesState = ({ inToken, outToken }) => {
  const [direction, setDirection] = useState(1)
  const toggleDirection = useCallback(() => setDirection(d => -d), [])
  const input = useTokenValueState(-1, null, inToken || bnb.address)
  const output = useTokenValueState(1, null, outToken)
  return direction > 0
    ? [input, output, direction, toggleDirection]
    : [output, input, direction, toggleDirection]
}

const SwapWidget = ({ quote, quoteParams, setQuoteParams, inToken, outToken }) => {
  const [{web3, address}] = useAtom(getWeb3Atom)
  const [inputState, outputState, direction, toggleDirection] = useTokenValuesState({ inToken, outToken })
  const [slippage, setSlippage] = useState(100)
  const [slippageText, setSlippageText] = useState('')
  const normalizedSlippage = useMemo(() => slippageText
    ? slippageText * 100
    : slippage,
    [slippage, slippageText]
  )
  const reverse = () => {
    inputState.setAmount(outputState.amount)
    inputState.setToken(outputState.token)
    outputState.setAmount(null)
    outputState.setToken(inputState.token)
  }
  useEffect(() => {
    outputState.setToken(outToken)
  }, [outToken])

  useEffect(() => {
    if (!inputState.amount) {
      outputState.setAmount(null)
    }
    try {
      setQuoteParams({
        inputAmt: inputState.amount && parseTokenUnits(
          inputState.amount, // TODO: guard underflow
          tokensByAddress[inputState.token].decimals
        ),
        inputToken: inputState.token,
        outputToken: outputState.token
      })
    } catch (e) {
      setQuoteParams({})
      outputState.setAmount(null)
    }
  }, [inputState.amount, inputState.token, outputState.token])


  // TODO: add address to all tokens and remove filter
  const balancesByToken = useBatchAllBalance()

  useEffect(() => {
    const setAmount = outputState.setAmount
    if (quote.data?.success && quote.data?.output_amt_total) {
      setAmount(formatTokenUnits(quote.data?.output_amt_total, tokensByAddress[outputState.token].decimals))
    }
    if (quote.data?.success === false) {
      setAmount(null)
    }
  }, [
    outputState.setAmount,
    direction,
    quote.data,
  ])

  const [tokenModalOpen, setTokenModalOpen] = useState(false)
  const openTokenModal = useCallback((id) => setTokenModalOpen(id), [])
  const closeTokenModal = useCallback(() => setTokenModalOpen(false), [])

  const selectToken = useCallback((token) => {
    const setToken = tokenModalOpen * direction > 0
      ? outputState.setToken
      : inputState.setToken

    setToken(token)
    setTokenModalOpen(false)
  }, [tokenModalOpen, direction])

  const autoSwapContract = useAutoSwapContract()

  const { swap, approved, approve } = useSwap({ inputToken: inputState.token })
  const swapMutation = useMutation(
    () => swap(
      inputState.token,
      outputState.token,
      quote.data.input_amt_total,
      quote.data.output_amt_total,
      quote.data,
      normalizedSlippage
    ),
    {
      onSuccess: () => balancesByToken.refetch()
    }
  )
  const approveMutation = useMutation(approve, {
    onSuccess: () => { quote.data && quote.refetch() },
  })

  const inputTotalPrice = useMemo(() =>
    quote.data?.success ?
      new BigNumber(quoteParams.inputAmt.toString())
       .shiftedBy(-18)
      .times(quote.data.token_in_price) :
      null,
    [quote.data, quoteParams.inputAmt]
  )
  const outputTotalPrice = useMemo(() =>
    quote.data?.success ? BigNumber.minimum(
      new BigNumber(quote.data.output_amt_total)
        .shiftedBy(-18)
        .times(quote.data.token_out_price),
      inputTotalPrice
    ) : null,
    [quote.data, inputTotalPrice]
  )
  const priceSlip = useMemo(() => inputTotalPrice?.minus(outputTotalPrice).div(inputTotalPrice),
    [inputTotalPrice, outputTotalPrice])

  const canSwap = quote.data?.swaps && !swapMutation.isLoading &&
    balancesByToken.data?.[inputState.token] &&
    new BigNumber(balancesByToken.data?.[inputState.token]).gte(quote.data.input_amt_total)
  return (
    <>
      <div className="border border-gray-200 dark:border-gray-900 dark:bg-gray-900 rounded-xl
      p-4 max-w-sm w-full sm:max-w-md sm:p-8 flex flex-col items-stretch space-y-4 shadow-xl">
        <div className="text-xl font-bold leading-none">Swap</div>
        <div>
          <TokenInput
            {...inputState}
            label="From"
            position="top"
            openTokenModal={openTokenModal}
            balance={balancesByToken.data?.[inputState.token]}
            price={inputTotalPrice}
          />
        </div>
        <div className="text-center">
          <div
            onClick={reverse}
            className="p-1 rounded-full bg-gray-300 dark:bg-gray-500 inline-block cursor-pointer"
          >
            <FiArrowDown />
          </div>
        </div>
        <div>
          <TokenInput
            {...outputState}
            label="To"
            position="bottom"
            openTokenModal={openTokenModal}
            balance={balancesByToken.data?.[outputState.token]}
            isLoading={quote.isLoading}
            price={outputTotalPrice}
            slippage={priceSlip}
            readOnly
          />
        </div>
        <div className="flex flex-col space-y-1">
          <div>Slippage tolerance</div>
          <div className="flex space-x-2">
            { [10, 50, 100].map(slip => (
              <div
                key={slip}
                className={classnames(
                  "p-1 px-2 text-center rounded cursor-pointer",
                  normalizedSlippage === slip
                    ? 'bg-blue-400 dark:bg-blue-500'
                    : 'bg-gray-200 dark:bg-gray-800'
                )}
                onClick={() => {
                  setSlippageText('')
                  setSlippage(slip)
                }}
              >
                {slip / 100}%
              </div>
            ))}
            <div className="flex-auto">
              <input
                className="bg-gray-200 dark:bg-gray-800 rounded p-1 px-2 w-full focus:outline-none"
                type="number"
                placeholder="Custom"
                value={slippageText}
                onChange={e => setSlippageText(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="pt-4">
          { web3 ? (
            <button
              className={classnames(
                'py-4 w-full',
                approved === false || canSwap ? 'btn-primary' : 'btn-disabled'
              )}
              disabled={!canSwap}
              onClick={approved ? swapMutation.mutate : approveMutation.mutate}
            >
              { approved && (swapMutation.isLoading ? 'Swapping...' : 'Swap') }
              { approved === false && (approveMutation.isLoading ? 'Approving...' : 'Approve') }
              { approved == null && 'Swap' }
            </button>
          ) : (
            <div className="text-center dark:text-gray-400 rounded-lg p-3 dark:bg-gray-800">
              Wallet not connected
            </div>
          )
        }
        </div>
        { quote.data?.success && ( <div className="pt5 text-gray-500 dark:text-gray-400 flex flex-col space-y-1 text-sm sm:text-base">
          <div className="flex">
            <div className="flex-auto">1 {tokensByAddress[inputState.token]?.symbol}</div>
            <div className="font-mono">≈ ${quote.data.token_in_price}</div>
          </div>
          <div className="flex">
            <div className="flex-auto">1 {tokensByAddress[outputState.token]?.symbol}</div>
            <div className="font-mono">≈ ${quote.data.token_out_price}</div>
          </div>
          <div className="flex">
            <div className="flex-auto">Swap Rate</div>
            <div className="font-mono">≈ {new BigNumber(quote.data.output_amt_total).div(quote.data.input_amt_total).dp(5).toString()} {tokensByAddress[outputState?.token]?.symbol}/{tokensByAddress[inputState?.token]?.symbol}</div>
          </div>
        </div> )}
      </div>
      { tokenModalOpen !== false && (
        <SwapSelectTokenModal
          closeModal={closeTokenModal}
          balancesByToken={balancesByToken.data}
          onSelectToken={selectToken}
          selectedToken={tokenModalOpen === inputState.id
            ? inputState.token
            : outputState.token
          }
        />
      ) }
    </>
  )
}
export default memo(SwapWidget)

