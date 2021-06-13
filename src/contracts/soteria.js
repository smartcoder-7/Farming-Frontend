import { useMemo, useState, useEffect, useCallback } from 'react'
import { atom, useAtom } from 'jotai'
import { useQuery, useMutation } from 'react-query'
import { ethers } from 'ethers'
import BN from 'bignumber.js'

import { useContract, getContractByName, contractsConfig } from './index'
import { getWeb3Atom } from 'context/web3'
import { getCoverCapacity } from 'api/soteria'
import { formatTokenUnits, parseTokenUnits } from 'lib/numFormat'
import Soteria from './abis/Soteria.json'
import SoteriaMembership from './abis/SoteriaMembership.json'
import SoteriaCover from './abis/SoteriaCover.json'
import { useChainlinkPrice } from 'contracts/chainlink'

// TODO: make cross chain compatible
export const SoteriaContracts = {
  Soteria: {
    address: '0x0613aC702a7257645D18Ed06F294B7dD1D54972c',
    abi: Soteria
  },
  SoteriaMembership: {
    address: '0x2d1a01E3B6Dd8a3D22660E2a55316C3f4fe2C4CF',
    abi: SoteriaMembership
  },
  SoteriaCover: {
    address: '0x0D255C1ACA03D55589BE31897850292dd71F5ECe',
    abi: SoteriaCover
  },
  Sote: {
    address: '0x541e619858737031a1244a5d0cd47e5ef480342c',
  },
  TokenController: {
    address: '0xfda62a0378f995def0dd7b75d686fff1fa4e4589'
  }
}

const useCapacityQuery = ({ enabled }) => useQuery(
  ['coverCapacity'],
  getCoverCapacity,
  {
    enabled,
    refetchOnMount: false,
    cacheTime: 3600000,
    staleTime: Infinity,
    refetchOnWindowFocus: false
  }
)


const isMemberAtom = atom(null)

export const initSoteria = () => {
  const [{ address, connectionOK }] = useAtom(getWeb3Atom)
  const contract = useContract(SoteriaContracts.Soteria)
  const [_isMember, setIsMember] = useAtom(isMemberAtom)

  return useEffect(() => {
    if (!connectionOK) {
      return
    }
    async function getMembership () {
      return contract?.methods.isMember(address).call()
    }
    getMembership().then(setIsMember)
  }, [contract, address])
}

const soteriaAtom = atom((get) => ({
  isMember: get(isMemberAtom),
}))

const useSoteria = ({ enabled, stakeInUSD }) => {
  const [isMember, setIsMember] = useAtom(isMemberAtom)
  const membershipContract = useContract(SoteriaContracts.SoteriaMembership)
  const coverContract = useContract(SoteriaContracts.SoteriaCover)

  const [{ web3, address }] = useAtom(getWeb3Atom)
  const register = useMutation(
    () => membershipContract.methods.payJoiningFee(address).send({
      from: address,
      value: 1e17
    }), {
      onSuccess: () => setIsMember(true)
    }
  )

  const soteContract = useContract(SoteriaContracts.Sote)
  const purchaseCover = useMutation(
    async (quote) => {
      //await soteContract.methods.approve(
      //  SoteriaContracts.SoteriaCover.address,
      //  ethers.utils.parseUnits('5', 20)
      //).send({ from: address })
      return coverContract.methods.makeCoverBegin(
        quote.contract,
        '0x424e4200',
        [ quote.amount,
          quote.price,
          quote.priceInNXM,
          quote.expiresAt.toString(),
          quote.generatedAt.toString()
        ],
        quote.period,
        quote.v,
        quote.r,
        quote.s,
      ).send({ from: address, value: quote.price })
    },
  )

  const bnbPrice = useChainlinkPrice('BNB/USD')
  const stakeInBNB = useMemo(() =>
    stakeInUSD && bnbPrice.data?.price &&
    BN(stakeInUSD).div(
      formatTokenUnits(bnbPrice.data?.price, bnbPrice.data.decimals)
    ),
    [stakeInUSD, bnbPrice.data]
  )

  const capacityQuery = useCapacityQuery({ enabled: !!web3 && enabled })
  const hasCapacity = useMemo(() => capacityQuery.data?.capacityBNB &&
    stakeInBNB &&
    BN(capacityQuery.data?.capacityBNB).gte(
      stakeInBNB.times(BN(10e8)).toString()
    ),
    [capacityQuery.data, stakeInBNB]
  )

  return {
    ...useAtom(soteriaAtom)[0],
    register,
    purchaseCover,
    capacityQuery,
    hasCapacity,
    stakeInBNB: stakeInBNB?.toString(),

  }
}

export default useSoteria

