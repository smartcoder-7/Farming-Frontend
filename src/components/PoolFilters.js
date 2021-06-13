import { memo, useRef, useEffect, useState, useMemo, useCallback } from 'react'
import cx from 'classnames'
import { Switch } from '@material-ui/core'
import classnames from 'classnames'
import { CgSelect, CgSearch } from 'react-icons/cg'
import debounce from 'lodash.debounce'

import { useWeb3 } from 'context/web3'

export const degenWarning = (
  <div className="dark:text-yellow-400 text-yellow-600 text-sm leading-tight mt-2">
    <div style={{fontWeight:"bold", fontSize:"16px"}}> WARNING </div>
    <div> These farms have NOT been reviewed by the autofarm&nbsp;team. </div>
    <div> <b>DYOR</b>, use at your own risk.  </div>
  </div>
)

const ToolBar = ({
  degen,
  hasDegen = true,
  toggleDegen,
  farmChoices = [],
  setSelectedFarm,
  selectedFarm,
  hideEmpty,
  setHideEmpty,
  searchTerm,
  setSearchTerm
}) => {
  const ref = useRef()
  const [{ address }] = useWeb3()
  const [farmDDOpen, setFarmDDOpen] = useState()
  const handleChangeEmpty = useCallback(() => {
    setHideEmpty(e => !e)
  }, [setHideEmpty])
  const handleChangeSearchTerm = useCallback(debounce(term => {
    setSearchTerm(term)
    if (term) {
      window.scrollTo({
        top: ref.current.offsetParent.parentElement.offsetTop,
      })
    }
  }, 300), [setSearchTerm])

  const [searchTermInternal, setSearchTermInternal] = useState(searchTerm)
  const handleChangeSearchTermInternal = useCallback(e => {
    setSearchTermInternal(e.target.value)
  }, [])

  useEffect(() => {
    handleChangeSearchTerm(searchTermInternal)
  }, [searchTermInternal])
  useEffect(() => {
    setSearchTermInternal(searchTerm)
  }, [searchTerm])

  const sortedFarmChoices = useMemo(() => [
    'All',
    ...[...farmChoices].sort()
  ], [farmChoices])

  return (
    <div ref={ref} className="flex space-x-2 items-center px-2 xl:px-4 pt-2 rounded-lg">
      <div className="flex-auto flex items-center justify-between xl:flex-col xl:items-start xl:space-x-0 xl:space-y-2 space-x-2">
        <div className="relative flex-auto">
          <CgSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            className="text-base bg-transparent py-1 sm:py-2 pl-8 rounded-md lg:rounded-lg border dark:border-gray-800 focus:outline-none focus:ring focus:border-blue-300 w-full"
            placeholder="Search tokens"
            autoCorrect="false"
            autoComplete="false"
            value={searchTermInternal}
            onChange={handleChangeSearchTermInternal}
          />
        </div>
      </div>
      <div className="cursor-pointer relative rounded-lg p-2 border dark:border-gray-800 w-40" onClick={() => setFarmDDOpen(o => !o)}>
        <div className="text-sm sm:text-base leading-none flex items-center">
          <CgSelect /><div>Farm:&nbsp;{selectedFarm || 'All'}</div>
        </div>
        { farmDDOpen && (
          <div className="bg-white border dark:border-gray-800 divide-y dark:divide-gray-800 rounded-lg dark:bg-black absolute top-full mt-2 left-0 right-0 flex flex-col text-sm items-stretch overflow-x-auto xl:overflow-x-visible hide-scrollbar overflow-hidden z-50">
            {sortedFarmChoices.map(farm => (
              <div
                key={farm}
                onClick={(e) => {
                  e.stopPropagation()
                  const nFarm = farm === 'All' ? null : farm
                  setSelectedFarm(currFarm => farm === currFarm ? null : nFarm)
                  setFarmDDOpen(false)
                }}
                className={classnames(
                  selectedFarm === farm || (selectedFarm == null && farm === 'All')
                    ? 'dark:bg-white dark:text-black bg-gray-700 text-white'
                    : 'dark:hover:bg-gray-800 hover:bg-gray-200',
                  "cursor-pointer px-3 py-2 transition flex space-x-1 items-center"
                )}
              >
                {farm}
              </div>
            ))}
          </div>
        )}
      </div>
      { address && (
        <div
          className={cx(`flex items-center leading-none space-x-2
          rounded-md lg:rounded-lg p-2 select-none cursor-pointer
          text-sm sm:text-base cursor-pointer`,
          { 'bg-primary text-white': hideEmpty, 'bg-gray-200 dark:bg-gray-800': !hideEmpty }
          )}
          onClick={handleChangeEmpty}
         >
          Staked&nbsp;only
        </div>
      ) }
    </div>
  )
}

export default memo(ToolBar);
