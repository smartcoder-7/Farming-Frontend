import classnames from 'classnames'
import { memo, useState, useMemo, useCallback } from 'react'
import { __, equals, gte, not, compose, prop, sortWith, ascend, descend } from 'ramda'
import { BigNumber } from '@ethersproject/bignumber'

import { dust } from 'constants/index'
import tokens, { sortedTokensList } from 'lib/tokens'
import { formatTokenUnits, token as formatToken } from 'lib/numFormat'
import Modal from 'components/Modal'

const TokenRow = ({ token, balance, selected, onSelect }) => {
  const { symbol, logoURI, address } = token
  const handleClick = useCallback(e => {
    e.stopPropagation()
    onSelect(address)
  }, [address])
  const balanceBn = useMemo(() => balance && BigNumber.from(balance), [balance])
  const balanceGteDust = token.decimals > 12
    ? balanceBn?.gte(1e10 / Math.pow(10, 18 - token.decimals))
    : true

  return (
    <div
      className="hover:bg-gray-200 dark:hover:bg-gray-800 px-4 sm:px-8 py-3 cursor-pointer flex space-x-4 items-center"
      onClick={handleClick}
    >
      <img src={logoURI} className="w-6 h-6" />
      <div className="flex-auto">{symbol}</div>
      { balanceBn && (
        <div className={
          classnames("text-right text-sm font-mono",
            balanceGteDust ? 'text-green-500' : 'text-gray-500')
        }>
          { balanceGteDust
            ? formatToken(formatTokenUnits(balanceBn), token.decimals)
            : 0
          }
        </div>
      ) }
    </div>
  )
}

const SwapSelectTokenModal = ({ closeModal, balancesByToken, onSelectToken, selectedToken }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const handleSearchTermChange = useCallback(e => {
    setSearchTerm(e.target.value)
  }, [])

  const displayedTokens = useMemo(() =>
    compose(
      sortWith([
        descend(compose(equals(selectedToken), prop('address'))),
        descend(compose(parseInt, prop(__, balancesByToken), prop('address'))),
        ascend(prop('symbol')),
      ]),
      ts => searchTerm
        ? ts.filter(
          ({ symbol }) => symbol.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : ts,
    )(tokens),
    [searchTerm, balancesByToken, selectedToken]
  )


  return (
    <Modal closeModal={closeModal}>
      <div className="text-xl font-bold leading-none mb-3">Select Token</div>
      <input
        className="bg-gray-200 dark:bg-gray-800 p-2 rounded"
        placeholder="Search"
        value={searchTerm}
        onChange={handleSearchTermChange}
        autoFocus
      />
      <div className="flex-auto overflow-y-scroll -mx-4 sm:-mx-8">
        { displayedTokens.map(token =>
          <TokenRow
            key={token.address}
            balance={balancesByToken?.[token.address]}
            token={token}
            onSelect={onSelectToken}
            selected={token.address === selectedToken}
          />
        ) }
      </div>
    </Modal>
  )
}

export default memo(SwapSelectTokenModal)

