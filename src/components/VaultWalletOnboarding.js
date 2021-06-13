import { memo, useCallback } from 'react'
import { CgExternal } from 'react-icons/cg'
import dynamic from 'next/dynamic'

import bsc from 'constants/bsc'
import heco from 'constants/heco'
import { otherChains } from 'constants/chains'
import { useChain } from 'context/chain'
import { useWeb3 } from 'context/web3'

const ConnectWallet = dynamic(
  () => import('./ConnectWallet'),
  { ssr: false }
)

const guideLinks = {
  [bsc.chainId]: {
    label: 'Get started with Binance Smart Chain',
    url: 'https://academy.binance.cc/en/articles/how-to-get-started-with-binance-smart-chain-bsc',
    metamask: 'https://autofarm.gitbook.io/autofarm-network/how-tos/binance-smart-chain-bsc/metamask-add-binance-smart-chain-bsc-network'
  },
  [heco.chainId]: {
    label: 'Get started with HECO',
    url: 'https://autofarm.gitbook.io/autofarm-network/how-tos/huobi-eco-chain-heco/metamask-add-huobi-eco-chain-heco-network',
    metamask: 'https://autofarm.gitbook.io/autofarm-network/how-tos/huobi-eco-chain-heco/metamask-add-huobi-eco-chain-heco-network',
  }
}

const VaultWalletOnboarding = () => {
  const [{web3, isConnectionOK, connectedChainId}] = useWeb3()
  const chain = useChain()
  const connectionOK = isConnectionOK(chain.chainId)
  const guideLink = guideLinks[chain.chainId]
  const switchWalletToCurrentChain = useCallback(() =>
    window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
          chainId: web3.utils.numberToHex(chain.chainId),
          chainName: chain.networkName,
          nativeCurrency: {
              name: chain.nativeCurrency,
              symbol: chain.nativeCurrency,
              decimals: 18
          },
          rpcUrls: [chain.rpcURL]
      }]
    }),
    [web3, chain]
  )

  return (
    <div
      className="flex flex-auto  flex-col space-y-2 py-4 justify-center
        items-center text-center"
    >
      <div className="sm:text-xl font-semibold">
        { connectionOK === null
          ? 'Connect your wallet to start using Autofarm'
          : 'You\'re connected to the wrong network'
        }
      </div>
      { connectionOK === null ? (
        <>
          <ConnectWallet />
          <div className="text-sm">
            <div className="dark:text-gray-500 font-semibold">
              Don't have a wallet setup?
            </div>
            <a
              href={guideLink.url}
              target="_blank"
              className="text-blue-500 whitespace-nowrap"
            >
              { guideLink.label }
              <CgExternal className="inline-block text-lg" />
            </a>
          </div>
        </>
      ) : (
        <>
          <div className="text-sm">
            Please change the network on your wallet to&nbsp;
            <span className="font-semibold">{chain.label}</span>. <br />
            {window?.ethereum?.isMetaMask && (
              <a
                href={guideLink.metamask}
                target="_blank"
                className="text-blue-500 whitespace-nowrap"
              >
                Read our guide for setting up MetaMask
                <CgExternal className="inline-block text-lg" />
              </a>
            ) }
          </div>
          <div className="flex space-x-2">
            <ConnectWallet disconnect />
            {window?.ethereum?.isMetaMask && (
              <button
                className="btn border items-center flex space-x-2"
                onClick={switchWalletToCurrentChain}
              >
                <div>Switch to {chain.label}</div>
                <img
                  src="https://docs.metamask.io/metamask-fox.svg"
                  className="h-4"
                />
              </button>
            ) }
          </div>
        </>
      ) }
    </div>
  )
}

export default memo(VaultWalletOnboarding)

