
const useConnectWallet = () => {
  const [{ web3, address, connectedChainId, isConnectionOK }, setWeb3] = useAtom(setWeb3Atom)
  const connectionOK = isConnectionOK(currentChainId)

  const web3Modal = useMemo(() => new Web3Modal({
    network: 'binance',
    cacheProvider: true,
    providerOptions
  }), [])

  const [showSwitchChain, setShowSwitchChain] = useState(false)
  const handleMouseoverWallet = useCallback(() => {
    setShowSwitchChain(connectionOK === false && window?.ethereum?.isMetaMask)
  }, [connectionOK])
  const handleMouseOut = useCallback(() => {
    setShowSwitchChain(false)
  }, [])
  const currentChain = chainsById[currentChainId]

  const connect = useCallback(async () => {
    const provider = await web3Modal.connect()

    const web3 = new Web3(provider)
    // TODO: restore
    // At the moment this is called when changing chains
    // we don't want to reset the app when chain changed
    // provider.on('disconnect', () => resetApp())
    provider.on('accountsChanged', (_accounts) => { setWeb3(web3) })
    provider.on('chainChanged', chainIdHex => { setWeb3(web3) })

    setWeb3(web3)
  }, [])

  const resetApp = useCallback(() => {
    setWeb3(null)
    web3Modal.clearCachedProvider()
  }, [setWeb3])

  const switchWalletToCurrentChain = useCallback(() => window.ethereum.request({
    method: 'wallet_addEthereumChain',
    params: [{
        chainId: web3.utils.numberToHex(currentChain.chainId),
        chainName: currentChain.networkName,
        nativeCurrency: {
            name: currentChain.nativeCurrency,
            symbol: currentChain.nativeCurrency,
            decimals: 18
        },
        rpcUrls: [currentChain.rpcURL]
    }]
  }), [web3, currentChain])

  // Auto connect on startup
  useEffect(() => {
    if (web3Modal.cachedProvider &&
      !web3Modal.cachedProvider.includes('walletconnect')
    ) {
      connect().catch(() => {
        resetApp()
      })
    }
  }, [connect])
