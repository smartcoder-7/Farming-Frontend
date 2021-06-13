import { memo, useEffect, useState, useCallback } from 'react'
import { useQuery } from 'react-query'
import Slider from '@material-ui/core/Slider'
import { CgSpinner } from 'react-icons/cg'
import { useDebouncedCallback } from 'use-debounce'

import Modal from 'components/Modal'
import useSoteria from 'contracts/soteria'
import { getQuote } from 'api/soteria'
import { displayTokenUnits } from 'lib/numFormat'

const debounceTimer = 2000

const QuoteForm = ({ stakeInBNB, currency = 'BNB', purchaseCover, quote, setQuoteParams }) => {
  const [amt, setAmt] = useState(parseFloat(stakeInBNB))
  const [period, setPeriod] = useState(30)

  const debouncedSetQuoteParams = useDebouncedCallback(setQuoteParams, debounceTimer)

  useEffect(() => {
    debouncedSetQuoteParams({
      coverAmount: amt,
      period
    })
  }, [amt, period])

  const handleChangeSliderCoverAmount = useCallback((e, newValue) => {
    setAmt(newValue)
  }, [])

  const handleChangeCoverAmount = useCallback(e => handleChangeSliderCoverAmount(e, e.target.value), [])

  const handleChangeSliderPeriod = useCallback((e, newValue) => {
    setPeriod(newValue)
  }, [])
  const handleChangePeriod = useCallback((e) => handleChangeSliderPeriod(e, e.target.value), [])

  const handleClickPurchaseCover = useCallback(() => {
    purchaseCover.mutate(quote.data, amt, period)
  }, [purchaseCover, quote.data, amt, period])

  return (
    <div className="flex-auto flex flex-col items-start space-y-2 pb-8">
      <div>Cover amount (BNB)</div>
      <input className="bg-gray-800 text-lg sm:text-2xl p-2 sm:p-4 rounded-lg sm:rounded-xl w-full" value={amt}
        onChange={handleChangeCoverAmount}
      />
      <Slider
        value={amt}
        onChange={handleChangeSliderCoverAmount}
        step={0.00001}
        min={0}
        max={stakeInBNB}
      />
      <div>Cover period (days)</div>
      <input className="bg-gray-800 text-lg sm:text-2xl p-2 sm:p-4 rounded-lg sm:rounded-xl w-full" value={period}
        onChange={handleChangePeriod}
      />
      <Slider value={period} onChange={handleChangeSliderPeriod} min={30} max={365} />
      <div>Cover Fee</div>
      <div className="text-xl sm:text-3xl">
        {displayTokenUnits(quote.data?.price)} {quote.data?.currency}
      </div>
      { quote.isFetching ? (
        <div className="text-xl flex space-x-2 items-center">
          <div>Getting quote</div>
          <CgSpinner className="animate-spin" />
        </div>
      ) : (
        <button
          className="btn-primary sm:text-lg"
          onClick={handleClickPurchaseCover}
          disabled={purchaseCover.isLoading}
        >
          { purchaseCover.isLoading
            ? 'Purchasing...'
            : 'Purchase cover'
          }
        </button>
      ) }
    </div>
  )
}

const JoinSoteria = ({ register }) => {
  return (
    <div className="flex-auto flex flex-col justify-center items-start space-y-2 pb-8">
      <div className="text-lg font-semibold">You are not registered to Soteria</div>
      <div>You need to be registered in order to purchase cover</div>
      <button disabled={register.isLoading} className="btn-primary space-x-2 items-center" onClick={register.mutate}>
        <div>Register with Soteria (0.1 BNB)</div>
        { register.isLoading && <CgSpinner className="animate-spin" /> }
      </button>
    </div>
  )
}

const SoteriaModal = ({ stake, stakeInBNB, ...rest }) => {
  const { isMember, coverCapacity, register, purchaseCover } = useSoteria({
    enabled: true,
  })

  const [quoteParams, setQuoteParams] = useState(null)
  const quote = useQuery(
    ['soteriaQuote', quoteParams],
    () => getQuote(quoteParams),
    { enabled: !!quoteParams,
      retryDelay: debounceTimer * 3,
      staleTime: 30000,
      refetchOnWindowFocus: false
    }
  )

  return (
    <Modal {...rest}>
      <div>
        <div className="text-xl font-semibold">
          Purchase cover
        </div>
        <div className="text-sm flex items-center space-x-2">
          <div>Powered by</div>
          <img src="https://soteria.finance/img/logo.4155b34f.png" className="w-16" />
        </div>
      </div>
      { isMember === false
        ? <JoinSoteria register={register} />
        : <QuoteForm stakeInBNB={stakeInBNB} purchaseCover={purchaseCover} quote={quote} setQuoteParams={setQuoteParams} />
      }
    </Modal>
  )
}

export default memo(SoteriaModal)

