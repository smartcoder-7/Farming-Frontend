import { memo, useCallback } from 'react'
import classnames from 'classnames'
import Link from 'next/link'

import { chains, defaultChainId, chainsById } from 'constants/chains'


const ChainOption = ({ chain, active, setChainId }) => {
  return (
    <Link href={chain.urls.vaults} replace shallow>
        <a className={classnames(
          'leading-none cursor-pointer transition',
          active ? 'text-black dark:text-white' : 'text-gray-400 dark:text-gray-500',
          !active && 'hover:text-gray-500 dark:hover:text-gray-400'
        )}
      >
        { chain.label }
      </a>
    </Link>
  )
}

const Chain = ({ chain }) => {
  return (
    <div className="flex space-x-1 sm:space-x-3 btn border p-1 sm:p-2">
      { chains.map(c => (
        <ChainOption
          key={c.chainId}
          chain={c}
          active={chain.chainId === c.chainId}
        />
      ))}
    </div>
  )
}

export default memo(Chain)

