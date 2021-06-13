import { memo, useEffect, useRef, useContext, useMemo, useState, useCallback, Suspense } from 'react'
import cx from 'classnames'
import { Collapse } from '@material-ui/core'
import Link from 'next/link'
import Web3Modal from 'web3modal'
import Web3 from 'web3'
import WalletConnectProvider from '@walletconnect/web3-provider'
import { BscConnector } from '@binance-chain/bsc-connector'
import { map } from 'ramda'
import { useAtom } from 'jotai'
import { IoWalletOutline } from 'react-icons/io5'
import { useDarkTheme } from 'context/theme'
import { useChain } from 'context/chain'

import ThemeContext from 'context/theme'
import { chainsById } from 'constants/chains'
import bscConfig from 'constants/bsc'
import { web3Atom, setWeb3Atom } from 'context/web3'

const bscProviderOptions = {
  display: {
    logo: './bscwallet.jpg',
    name: 'Binance Chain Wallet',
    description: 'Binance Smart Chain Wallet',
  },
  package: BscConnector,
  options: {
    supportedChainIds: [bscConfig.chainId],
  },
  connector: async (Package, opts) => {
    const bsc = new Package(opts)
    await bsc.activate()
    return bsc.getProvider()
  }
}

const providerOptions = {
 'custom-bsc': bscProviderOptions,
  walletconnect: {
    package: WalletConnectProvider,
    options: {
      rpc: map(({ rpcURL }) => rpcURL, chainsById)
    }
  },
}

const WalletButton = ({
  resetApp,
  connect,
  address,
  connectedChainId,
  connectionOK,
  label: labelOut,
  disconnect,
  className
}) => {
  const label = useMemo(() => {
    if (connectionOK === false && disconnect) {
      return 'Disconnect'
    }
    if (address) {
      return address.slice(0, 5) + "..." + address.slice(-4)
    }
    return labelOut
  }, [connectionOK, address, connectedChainId])

  return (
    <button
      onClick={ connectionOK === null ? connect : resetApp }
      className={cx(
        'btn space-x-1 sm:space-x-2 border',
        connectionOK === false
          ? 'border-red-500 text-red-500'
          : 'border-blue-500 text-blue-500',
        className,
      )}
    >
      <IoWalletOutline />
      <div>
        {label}
      </div>
    </button>
  )
}


const mkWeb3Modal = (theme) => new Web3Modal({
  network: 'binance',
  cacheProvider: true,
  providerOptions,
  theme
})

const ConnectWallet = ({
  label = 'Connect Wallet',
  switchChain,
  disconnect,
  className
}) => {
  const chain = useChain()
  const [darkMode] = useDarkTheme()
  const theme = darkMode ? 'dark' : 'light'
  const [{ web3, address, connectedChainId, isConnectionOK }, setWeb3] = useAtom(setWeb3Atom)
  const connectionOK = isConnectionOK(chain.chainId)
  const [web3Modal, setWeb3Modal] = useState(mkWeb3Modal(theme))

  const connect = useCallback(async () => {
    const w3m = mkWeb3Modal(theme)
    const provider = await w3m.connect()

    const web3 = new Web3(provider)
    // TODO: restore
    // At the moment this is called when changing chains
    // we don't want to reset the app when chain changed
    // provider.on('disconnect', () => resetApp())
    provider.on('accountsChanged', (_accounts) => { setWeb3(web3) })
    provider.on('chainChanged', chainIdHex => { setWeb3(web3) })

    setWeb3(web3)
    setWeb3Modal(w3m)
  }, [web3Modal, theme])

  const resetApp = useCallback(() => {
    setWeb3(null)
    web3Modal.clearCachedProvider()
    setWeb3Modal(null)
  }, [setWeb3])


  // Auto connect on startup
  useEffect(() => {
    if (!web3 && web3Modal?.cachedProvider &&
      !web3Modal?.cachedProvider.includes('walletconnect')
    ) {
      connect()
    }
  }, [])

  return (
    <WalletButton
      address={address}
      connect={connect}
      connectionOK={connectionOK}
      resetApp={resetApp}
      connectedChainId={connectedChainId}
      label={label}
      disconnect={disconnect}
      className={className}
    />
  )
}

const ConnectWalletSuspense = props => (
  <Suspense fallback={<WalletButton label="Connecting..." />}>
    <ConnectWallet {...props} />
  </Suspense>
)
export default memo(ConnectWalletSuspense)

