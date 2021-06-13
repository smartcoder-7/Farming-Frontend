import React, {useContext, useState, useEffect} from 'react'
import { atom, useAtom } from 'jotai'
import { forEach, zip, compose } from 'ramda'

async function getAddress(web3) {
  if (!web3) return null
  const accounts = await web3.eth.getAccounts()
  return accounts[0]
}
async function getConnectedChainId(web3) {
  if (!web3) return null
  let connectedChainId = await web3.eth.getChainId()
  // Some apps on Android does this, not sure why
  if (connectedChainId === 86) {
    connectedChainId = 56
  }
  return connectedChainId
}

export const web3Atom = atom(null)
export const web3DataAtom = atom({
  isConnectionOK: () => null
})
export const getWeb3Atom = atom(
  (get) => ({ web3: get(web3Atom), ...get(web3DataAtom) })
)

export const setWeb3Atom = atom(
  (get) => get(getWeb3Atom),
  async (get, set, web3) => {
    const [address, connectedChainId] = await Promise.all([
      getAddress(web3),
      getConnectedChainId(web3)
    ])
    const isConnectionOK = (chainId) =>
      connectedChainId === null
        ? null
        : chainId === connectedChainId
    set(web3Atom, web3)
    set(web3DataAtom, { address, connectedChainId, isConnectionOK })
  }
)

export const useWeb3 = () => useAtom(getWeb3Atom)

