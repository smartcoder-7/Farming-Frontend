import { memo, useState, useMemo, useCallback } from 'react'
import commaNumber from 'comma-number'
import { CgExternal } from 'react-icons/cg'
import { ImMagicWand } from 'react-icons/im'
import BN from 'bignumber.js'

import useSoteria from 'contracts/soteria'
import { chainsById } from 'constants/chains'
import SoteriaModal from 'components/SoteriaModal'
import { dust } from 'constants/index'
import bsc from 'constants/bsc'
import Announcement from 'components/Announcement'
import { multiplyTokenPrice } from 'lib/numFormat'
import { oldVaults } from 'lib/venusMigration'
import { addressesEqual } from 'lib/tokens'
import { poolsImages as tokenImages } from 'constants/pools-images'
import LPMaker from 'components/LPMaker'

const WBNB = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c'
const normalizeBNB = (token, BNB = 'ETH') => addressesEqual(token, WBNB)
  ? BNB : token

const farmURLs = {
  PCS: `https://exchange.pancakeswap.finance/#/add/`,
  Bakery: `https://www.bakeryswap.org/#/add/`,
  MDEX: `https://bsc.mdex.com/#/add/`,
}
const farmBNB = {
  PCS: 'BNB',
  Bakery: 'ETH',
  MDEX: 'BNB'
}
const LPAddress = pool => {
  let dex
  if (pool.wantLink.includes('pancake')) {
    dex = 'PCS'
  }
  else if (pool.wantLink.includes('bakery')) {
    dex = 'Bakery'
  }
  else if (pool.wantLink.includes('mdex')) {
    dex = 'MDEX'
  }
  else {
    return null
  }

  const url = farmURLs[dex]
  const params = [
    normalizeBNB(pool.wantToken0Address, farmBNB[dex]),
    normalizeBNB(pool.wantToken1Address, farmBNB[dex]),
  ].join('/')
  return url + params
}

const PoolInfo = ({ pid, stake, pool, chain, openSoteriaModal, enabled, onTxSuccess }) => {
  const { blockExplorerURLBase } = chain
  const farmContractLink = blockExplorerURLBase +
    'address/' + pool.farmContractAddress
  const vaultContractLink = blockExplorerURLBase +
    'address/' + pool.poolInfo.strat

  const stakeInUSD = useMemo(() => enabled && stake && pool?.wantPrice &&
    multiplyTokenPrice(stake, pool.wantPrice),
    [stake, pool, enabled]
  )
  const { isMember, hasCapacity, stakeInBNB } = useSoteria({ enabled, stakeInUSD })
  const handleOpenSoteriaModal = useCallback(() => {
    openSoteriaModal({ stakeInBNB })
  }, [stakeInBNB, openSoteriaModal])

  const lpLink = useMemo(() =>
    pool.wantIsLP && pool.wantToken0Address && pool.wantToken1Address &&
    LPAddress(pool),
    [pool]
  )
  const addToMetamask = useCallback(() => {
    if (!window.ethereum) {
      return
    }
    window.ethereum.request({
      method: 'wallet_watchAsset',
      params: {
        type: 'ERC20',
        options: {
          address: pool.wantAddress,
          symbol: pool.wantName,
          decimals: pool.wantDecimals,
          image: tokenImages[pool.wantName.toLowerCase()]?.url,
        },
      },
    });
  }, [pool.wantAddress])
  const [lpOpen, setLPOpen] = useState()
  const pcsLPs = ['PCS', 'PCSv2', 'AUTO', 'BZX', 'Belt', 'bDollar', 'Goose', 'Kebab']
  const lpWizard = pool.wantIsLP && pcsLPs.includes(pool.farmName)
  const handleClickLP = (e) => {
    if (!lpWizard) {
      return
    }
    e.preventDefault()
    setLPOpen(s => !s)
  }

  return (
    <>
      <div className="flex flex-col space-y-4">
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row sm:space-x-2">
          { lpLink &&
            <a href={lpLink} className="btn-tertiary" target="_blank" onClick={handleClickLP}>
              Create LP&nbsp;{ lpWizard ? <ImMagicWand /> : <CgExternal /> }
            </a>
          }
          { !lpLink && window?.ethereum?.isMetaMask &&
            <button className="btn-tertiary" onClick={addToMetamask}>
              Add to Metamask&nbsp;
              <img
                className="h-4"
                src="https://docs.metamask.io/metamask-fox.svg"
              />
            </button>
          }
          <a href={farmContractLink} className="btn-tertiary">Farm contract <CgExternal /></a>
          <a href={vaultContractLink} className="btn-tertiary">Vault contract <CgExternal /></a>
          { process.env.NEXT_PUBLIC_SOTERIA &&
            stake > dust && chain.chainId === bsc.chainId &&
            hasCapacity && (
            <div
              className="btn-tertiary"
              style={{ background: '#fc5653' }}
              onClick={handleOpenSoteriaModal}
            >
              <img src="https://s2.coinmarketcap.com/static/img/coins/64x64/8381.png" className="w-4" />
              Purchase Cover
            </div>
          ) }
        </div>
        { lpWizard && enabled && lpOpen && <LPMaker pool={pool} onTxSuccess={onTxSuccess} /> }
        <div className="text-xs grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="">
            <div style={{ textAlign:"left", paddingBottom:"5px"}}>
              
              <div> <b>Vault Details</b></div>
              <div>Asset:
                <a target="_blank" rel="noreferrer" href={pool.wantLink}  style={{ textDecoration: "none", color: "inherit", paddingLeft:"3px" }}>
                  <u>{pool.wantName}</u>
                </a> 
                <span style={{color:"grey", display:!isNaN(pool.APR) ? "" : "none" }}> (${pool?.wantPrice && commaNumber(parseFloat(pool.wantPrice).toFixed(2))})</span>

              </div>
             
              <div>AUTO multiplier:  { (pool.poolInfo.allocPoint / 100).toFixed(2) }x </div>
              <div>Type:  { pool.stratType ? pool.stratType : "auto-compounding" } </div>

              <div>Farm name:  { pool.farmName ? pool.farmName : "" } </div>
            </div>
          </div>
          <div  className="">
                <div style={{ textAlign:"left", paddingBottom:"5px"}}>
                    <div> <b>APY Calculations</b> </div>
                    <div> Farm APR: {!isNaN(pool.APR) ? (pool.APR * 100 ).toFixed(1) + "%": "TBD" }
                      <span style={{color:"grey", display:!isNaN(pool.APR) ? "" : "none" }}> ({commaNumber((pool.APR * 100 / 364 ).toFixed(2))}%&nbsp;daily)</span>
                    </div>
                    <div> Optimal compounds per year: {!isNaN(pool.compoundsPerYear) ? commaNumber(pool.compoundsPerYear): "TBD"} </div>
                    <div> Farm APY: {!isNaN(pool.APY) ? commaNumber((pool.APY * 100 ).toFixed(1))  + "%": "TBD"}  </div>
                    <div> AUTO APR: {!isNaN(pool.APR_AUTO) ? (pool.APR_AUTO * 100 ).toFixed(1)  + "%": "TBD"} 
                      <span style={{color:"grey", display:!isNaN(pool.APR_AUTO) ? "" : "none" }}> ({commaNumber((pool.APR_AUTO * 100 / 364 ).toFixed(2))}%&nbsp;daily)</span>
                    </div>

                    <div> Total APY: {!isNaN(pool.APY_total) ? commaNumber((pool.APY_total * 100 ).toFixed(1))  + "%": "TBD"} </div>
                </div>
          </div>
          <div  className="">
                <div style={{ textAlign:"left", paddingBottom:"5px"}}>
                    <div> <b>Fees</b> </div>
                    <div> Controller fee: {pool.controllerFeeText}</div>
                    <div> Platform fee: {pool.platformFeeText || 'none'}</div>
                    <div> AUTO buyback rate: {pool.buybackrateText}</div>
                    <div> Entrance fee: {pool.entranceFeeText
                      ? pool.entranceFeeText : 'none'} </div>
                    <div> Withdrawal fee: {pool.withdrawalFeeText || 'none'} </div>
                </div>
          </div>
          { pool.notes && pool.notes.length > 0 && (
            <div className="">
              <div className="font-bold">Notes</div>
              {pool.notes && pool.notes.map((note, idx) => <div key={idx}>{note}</div>)}
            </div>
          ) }

        </div>
      </div>
    </>
  )
}

export default memo(PoolInfo)

