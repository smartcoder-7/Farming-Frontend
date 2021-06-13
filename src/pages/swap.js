import React, { memo, useMemo, useCallback, useState, useRef, useEffect} from 'react'
import classnames from 'classnames'
import { useQuery } from 'react-query'
import debounce from 'lodash.debounce'
import { ethers } from 'ethers'
import { useRouter } from 'next/router'

import { getAutoSwapContract } from 'contracts'
import { normalizeBNBAddress } from 'lib/tokens'
import { formatTokenUnits } from 'lib/numFormat'
import SwapWidget from 'components/SwapWidget'
import SwapRoute from 'components/SwapRoute'
import { getQuote as getQuoteApi } from 'api/swap'
import { mkRoute } from 'contracts/swap'

const Swap = ({ web3, chainId = 56, address }) => {
  const [quoteParams, setQuoteParams] = useState({})
  const setQuoteParamsDebounced = useCallback(debounce(setQuoteParams, 500), [])
  const router = useRouter()
  const { inToken, outToken, inAmount, outAmount } = router.query

  useEffect(() => {
    document.documentElement.classList.add('swap')
    return () => document.documentElement.classList.remove('swap')
  }, [])

  const quote = useQuery(
    ['swap-quote', quoteParams],
    () => getQuoteApi({
      ...quoteParams,
      inputToken: quoteParams.inputToken,
      outputToken: quoteParams.outputToken,
    }),
    {
      enabled: quoteParams.inputAmt > 0 &&
        !!quoteParams.inputToken &&
        !!quoteParams.outputToken,
      // keepPreviousData: true,
      cacheTime: 1,
      refetchInterval: 5000,
      refetchOnWindowFocus: false
    }
  )

  const routes = useMemo(
    () => quoteParams.inputToken
      ? mkRoute(quote.data?.swaps || [], normalizeBNBAddress(quoteParams.inputToken))
      : [],
    [quote.data, quoteParams.inputToken]
  )

  return (
    <div className="lg:px-8 pb-32">
      <div className="py-8 px-4 text-center font-semibold leading-wide">
        AutoSwap is in public alpha. Use at your own risk.
      </div>
      <div className="flex lg:flex-row-reverse flex-col items-center justify-center space-y-8 lg:space-y-0 lg:max-w-screen-xl lg:m-auto">
        <div className="px-2 sm:px-0 flex flex-row justify-center">
          <SwapWidget
            quote={quote}
            quoteParams={quoteParams}
            setQuoteParams={setQuoteParamsDebounced}
            setQuoteParamsDebounced={setQuoteParamsDebounced}
            inToken={inToken}
            outToken={outToken}
            inAmount={inAmount}
            outAmount={outAmount}
          />
        </div>
        <div
          className={classnames(
            'w-full sm:w-auto transition-all transform duration-500',
            !quote.isIdle ? 'flex-auto' : ''
          )}
        >
          {quote.data?.swaps && (
            <>
              <div className="mb-4 text-2xl lg:text-3xl font-semibold px-4 sm:px-8 text-center">Routing</div>
              <div className="sm:px-8">
                <SwapRoute routes={routes} />
              </div>
            </>
          )}
          {quote.data && quote.data.success === false && (
            <div className="p-4 sm:p-8">
              <div className="text-2xl font-semibold text-center">No results</div>
            </div>
          ) }
        </div>
      </div>
    </div>
  )
}

export default memo(Swap)
