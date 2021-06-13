import { useMemo, useState } from 'react'
import { useWeb3 } from 'context/web3'
import { useQuery } from 'react-query'

import PortfolioTracker from 'contracts/abis/PortfolioTracker.json'
import TokensModal from 'components/SwapSelectTokenModal'
import tokenImages from 'constants/pools-images'
import { tokensByAddressLowerCase } from 'lib/tokens'

const ptAddress = '0x4ed7c70F96B99c776995fB64377f0d4aB3B0e1C1'

const Trade = () => {
  const [{ web3, address }] = useWeb3()
  const pt = useMemo(
    () => web3 && new web3.eth.Contract( PortfolioTracker, ptAddress ),
    [web3]
  )
  const portfolios = useQuery(
    ['portfolios', address],
    () => pt.methods.portfolios(address).call(),
    { enabled: !!web3 }
  )
  const [modalOpen, setModalOpen] = useState()
  const [selectedTokens, setSelectedTokens] = useState([])
   
  return (
    <div className="flex flex-col items-center flex-auto">
      <div>Create new portfolio</div>
      <div className="btn-primary" onClick={() => setModalOpen(true)}>Add</div>
      { process.browser && modalOpen && (
        <TokensModal
          closeModal={() => setModalOpen(false)}
          onSelectToken={token => {
            setSelectedTokens(s => [...s, token])
            setModalOpen(false)
          }}
        />
      )}
      { selectedTokens.map(t => (
        <div key={t}>
          { tokensByAddressLowerCase[t.toLowerCase()].symbol }
        </div>
      )) }
    </div>
  )
}

export default Trade

