import { memo } from 'react'
import { CgChevronRight } from 'react-icons/cg'
import { toPairs } from 'ramda'

import { tokensByAddressLowerCase } from 'lib/tokens'
import dexes from 'lib/dexes'

const Dexes = ({ pairsObj }) => {
  const pairs = toPairs(pairsObj)
  return (
    <>
      {pairs.map(([_pairAddress, { dex, weight }]) => (
        <div className="flex space-x-4" key={_pairAddress}>
          <div className="flex-auto">{dexes[dex]?.name || dex}</div>
          <div>{weight}%</div>
        </div>
      ))}
    </>
  )
}

const RouteNode = ({ token, tokenOutSymbol, percentage, swaps = {} }) => (
  <div className="flex space-x-2 items-stretch">
    <div className="flex items-center font-semibold w-16">
      {percentage}% <CgChevronRight />
    </div>
    <div className="flex-auto flex flex-col shadow-lg rounded-lg">
      <div className="bg-gray-100 dark:bg-gray-900 rounded-t-lg py-2 px-2 flex space-x-2 items-center">
        { token?.logoURI  && <img src={token?.logoURI} className="h-5" /> }
        <div>{token?.symbol || tokenOutSymbol}</div>
      </div>
      <div className="border dark:bg-gray-800 border-gray-100 dark:border-gray-900 rounded-b-lg py-2 px-2 flex-auto">
        <Dexes pairsObj={swaps} />
      </div>
    </div>
  </div>
)

const Route = ({ percentage = 100, dst, tokenOutSymbol, swaps, subroutes = [] }) => (
  <div className="grid grid-flow-col auto-cols-auto gap-4">
    <RouteNode
      percentage={percentage}
      tokenOutSymbol={tokenOutSymbol}
      token={tokensByAddressLowerCase[dst.toLowerCase()]}
      swaps={swaps}
    />
    { subroutes.length > 0 && <Routes routes={subroutes} /> }
  </div>
)

const Routes = ({ routes }) => (
  <div className="grid gap-4 flex-auto">
    {routes.map(({ pair: { weight, token_out, token_out_symbol, pair_addresses_obj }, children }) => (
      <Route
        key={token_out}
        percentage={weight}
        dst={token_out}
        tokenOutSymbol={token_out_symbol}
        swaps={pair_addresses_obj}
        subroutes={children}
      />
    ))}
  </div>
)


const SwapRoute = ({ routes = [] }) => {
  return (
    <div className="flex flex-row justify-start space-x-4 items-center p-4 w-full overflow-x-auto">
      { routes.length > 0 && (
        <div>
          <img
            className="max-w-none w-8 h-8"
            src={tokensByAddressLowerCase[routes[0]?.pair.token_in.toLowerCase()]?.logoURI}
          />
        </div>
      ) }
      <Routes routes={routes} />
    </div>
  )
}

export default memo(SwapRoute)
