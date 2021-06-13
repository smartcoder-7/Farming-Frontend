import { useMemo, useState } from 'react'
import { useQuery, useMutation } from 'react-query'
import PCSFactoryABI from './abis/PCSv2Factory.json'
import PCSPairABI from './abis/PCSv2Pair.json'
import PCSRouterABI from './abis/PancakeSwapRouter.json'
import { useContract, getContract, getERC20TokenContract  } from 'contracts/index'
import { useWeb3 } from 'context/web3'
import { tokensBySymbol, addressesEqual, bnb } from 'lib/tokens'
import { ethers } from 'ethers'

export const usePCSFactory = (version = 1) => {
  const PCSFactory = {
    address: version === 2
      ? '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73'
      : '0xBCfCcbde45cE874adCB698cC183deBcF17952812',
    abi: PCSFactoryABI
  }
  return useContract(PCSFactory)
}
export const usePCSRouter = (version = 1) => {
  const PCSRouter = {
    address: version === 2
      ? '0x10ED43C718714eb63d5aA57B78B54704E256024E'
      : '0x05ff2b0db69458a0750badebc4f9e13add608c7f',
    abi: PCSRouterABI
  }
  return { contract: useContract(PCSRouter), config: PCSRouter }
}

export const usePCSv2Pair = (token1, token2, version) => {
  const tokens = [token1, token2]
  const token = token1.toLowerCase() === tokensBySymbol.WBNB.address.toLowerCase()
    ? token2
    : token1
  const factory = usePCSFactory(version)
  const { contract: router, config: routerConfig } = usePCSRouter(version)
  const [{web3, address}] = useWeb3()
  const pairData = useQuery(
    ['PCSPair', token1, token2],
    async () => {
      const pairAddress = await factory.methods.getPair(token1, token2).call()
      const pairContract = getContract(web3)({
        address: pairAddress,
        abi: PCSPairABI
      })
      const reserves = await pairContract.methods.getReserves().call()

      return {
        pairContract,
        pairAddress,
        reserves,
      }
    },
    { enabled: !!web3 }
  )
  const [allowances, setAllowances] = useState([
    ethers.utils.parseUnits('5', 76),
    ethers.utils.parseUnits('5', 76)
  ])
  const allowancesQuery = useQuery(
    ['PCSPairApproval', token1, token2],
    async () => Promise.all([token1, token2].map(t => {
      const tokenContract = getERC20TokenContract(web3)(t)
      return tokenContract.methods.allowance(
        address,
        routerConfig.address
      ).call()
    })),
    { enabled: !!web3 && !!address, refetchInterval: 5000, onSuccess: setAllowances }
  )
  const approveToken1 = useMutation(
    () => {
      const tokenContract = getERC20TokenContract(web3)(token1)
      return tokenContract.methods.approve(
        routerConfig.address,
        ethers.utils.parseUnits('5', 76)
      ).send({ from: address })
    },
    { onSuccess: () => setAllowances((as) => [
        ethers.utils.parseUnits('5', 76),
        as[1]
      ])
    }
  )
  const approveToken2 = useMutation(
    () => {
      const tokenContract = getERC20TokenContract(web3)(token2)
      return tokenContract.methods.approve(
        routerConfig.address,
        ethers.utils.parseUnits('5', 76)
      ).send({ from: address })
    },
    { onSuccess: () => setAllowances((as) => [
        as[0],
        ethers.utils.parseUnits('5', 76),
      ])
    }
  )
  const approveTokensMutations = [approveToken1, approveToken2]
  const isBNBPair = tokens.some(t => addressesEqual(t, tokensBySymbol.WBNB.address))
  const addLiquidity = useMutation(
    async (amounts) => {
      if (isBNBPair) {
        const token = tokens.find(t => !addressesEqual(t, tokensBySymbol.WBNB.address))
        const [tokenAmt, bnbAmt] =  [amounts[token], amounts[bnb.address]]
        return router.methods.addLiquidityETH(
          token,
          tokenAmt,
          '0',
          '0',
          address,
          Date.now() + 1000000
        ).send({ from: address, value: bnbAmt.toString() })
      }
      return router.methods.addLiquidity(
        token1,
        token2,
        amounts[token1],
        amounts[token2],
        '0',
        '0',
        address,
        Date.now() + 1000000
      ).send({ from: address })
    }
  )
  const removeLiquidity = useMutation(
    async (amt) => {
      if (!amt) { return }
      const allowance = await pairData.data.pairContract.methods.allowance(
        address,
        routerConfig.address
      ).call()
      if (amt.gt(allowance)) {
        await pairData.data.pairContract.methods.approve(
          routerConfig.address,
          ethers.utils.parseUnits('5', 18)
        ).send({ from: address.toLowerCase() })
      }
      return router.methods.removeLiquidityETH(
        token,
        amt,
        0,
        0,
        address,
        Date.now() + 1000000
      ).send({ from: address })
    }
  )

  return {
    pairData,
    addLiquidity,
    removeLiquidity,
    allowances,
    approveTokensMutations
  }
}

