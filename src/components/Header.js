import { memo, useContext, useMemo, useState, useCallback, Suspense } from 'react'
import cx from 'classnames'
import { Collapse } from '@material-ui/core'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import { RiSunLine, RiMoonLine, RiSafeLine, RiSwapLine, RiDashboard3Line } from 'react-icons/ri'
import { useQuery } from 'react-query'

import { useDarkTheme } from 'context/theme'
import getApi from 'api'
import { toggleTheme } from '../context/theme'
import { useWeb3 } from 'context/web3'
import { useChain } from 'context/chain'
import { chainsById } from 'constants/chains'
import LogoText from 'svgs/logo-text'
import { currency } from 'lib/numFormat'
import Chain from 'components/Chain'

const ConnectWallet = dynamic(
  () => import('./ConnectWallet'),
  { ssr: false }
)

const navLinks = [
  ['/', 'Vaults', RiSafeLine],
  ['/swap', 'Swap', RiSwapLine],
  ['/dashboard', 'Dashboard', RiDashboard3Line],
]

const Header = () => {
  const [darkMode, toggleTheme] = useDarkTheme()
  const chain = useChain()
  const router = useRouter()
  const [{address}] = useWeb3()

  const api = useMemo(() => getApi(chainsById[56]), [])
  const stats = useQuery(
    ['stats-header', 56],
    api.fetchStats,
    {
      refetchInterval: 10000,
    }
  )

  return (
    <div>
      <div className="xl:sticky xl:h-screen top-0 flex flex-row xl:flex-col
        xl:border-r dark:border-gray-800 w-full
        xl:items-stretch xl:w-48 py-2 px-2 sm:px-4 max-w-3xl xl:max-w-none m-auto
        items-start space-x-2 xl:space-x-0 xl:space-y-6 xl:py-4
        xl:px-4"
      >
        <div className="flex justify-center xl:justify-start items-center space-x-1 sm:space-x-2">
          <img src="./logo-round.svg" alt="Autofarm" className="w-8" />
          <LogoText className="hidden sm:block w-24 text-primary dark:text-white" />
        </div>

        <div className="hidden sm:block border-r border-gray-300 dark:border-gray-700 self-stretch" />

        <div className="hidden sm:flex sm:flex-col xl:space-y-2 font-semibold">
        { navLinks.map(([href, label, Icon]) => (
          <Link key={href} href={href}>
            <a className={cx(
              `hidden sm:flex items-center space-x-1 xl:space-x-2 xl:-mx-2
              text-sm sm:text-base px-2 py-2 hover:bg-primary rounded-lg
              hover:bg-opacity-10 transition-colors`,
              {
                'text-black dark:text-white bg-primary xl:bg-gradient-to-r xl:dark:from-top xl:dark:to-bottom  bg-opacity-20': href === router.pathname,
                'text-gray:600 dark:text-gray-400': href !== router.pathname
              }
            )}>
              <Icon className="xl:text-2xl" />
              <div>{label}</div>
            </a>
          </Link>
        )) }
        </div>

        <div className="flex-auto" />

        <div>
          <div className="grid grid-cols-auto grid-flow-col
            xl:grid-flow-row xl:grid-cols-1 gap-2 sm:gap-3 xl:static right-0 top-0 items-center
            xl:items-stretch
            sm:flex-col
            text-xs sm:text-sm xl:text-base">
            <Link href="/swap?outToken=0xa184088a740c695e156f91f5cc086a06bb78b827">
              <a className="hidden btn border w-full">
                Buy&nbsp;AUTO<span className="hidden">&nbsp;{currency(stats.data?.priceAUTO)}</span>
              </a>
            </Link>
            <div className="flex space-x-1 items-center cursor-pointer" onClick={toggleTheme}>
              <RiSunLine className={cx('text-lg sm:text-2xl', darkMode && 'text-gray-300 dark:text-gray-600')} />
              <div className="text-xl leading-none text-gray-300 dark:text-gray-600">/</div>
              <RiMoonLine className={cx('text-lg sm:text-2xl', !darkMode && 'text-gray-300 dark:text-gray-600')} />
            </div>
            <Chain chain={chain} />
            <ConnectWallet
              className={cx('p-1 sm:p-2 w-full', { 'hidden': false && !address })}
              label="Wallet"
              switchChain={false}
            />
          </div>
          <div className="justify-end xl:justify-between text-xs sm:text-sm dark:text-gray-400 py-2 flex space-x-2">
            <div>AUTO {currency(stats.data?.priceAUTO)}</div>
            <Link href="/swap?outToken=0xa184088a740c695e156f91f5cc086a06bb78b827">
              <a className="text-blue-500 font-semibold">
                BUY
              </a>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default memo(Header)
