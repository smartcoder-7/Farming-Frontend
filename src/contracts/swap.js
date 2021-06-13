import { useMemo, useCallback, useState, useEffect } from 'react'
import { useAtom } from 'jotai'
import bytes32 from 'bytes32'
import {
  unnest,
  partition,
  toPairs,
  maxBy,
  __,
  reduce,
  compose,
  flatten,
  zipWith,
  concat,
  values,
  max,
  take
} from 'ramda'
import { BigNumber } from '@ethersproject/bignumber'
import { getWeb3Atom } from 'context/web3'

import AutoSwap from './abis/AutoSwap.json'
import bsc from 'constants/bsc'
import { useContract, getERC20TokenContract } from './index'
import { tokensBySymbol, normalizeBNBAddress, addressesEqual } from 'lib/tokens'
import PCSRouter from './abis/PancakeSwapRouter.json'
import BakeryRouter from './abis/BakerySwapRouter.json'
import StreetRouter from './abis/StreetRouter.json'
import VpegRouter from './abis/VpegRouter.json'
import { traverseTreeFromFinal } from 'lib/tree'

const AUTOSWAP_CONTRACT = {
  abi: AutoSwap,
  address: process.env.NEXT_PUBLIC_SWAP_CONTRACT
}

const tx_settings_obj = {
  //gasPrice: (10e9).toString(),
  //gasLimit: (3000000).toString(),
}

export const useAutoSwapContract = () => useContract(AUTOSWAP_CONTRACT)

const zeroAddress = '0x0000000000000000000000000000000000000000'

export const useSwap = ({ referrer = zeroAddress, directSwap, inputToken }) => {
  const [{ web3, address }] = useAtom(getWeb3Atom)
  const swapContract = useAutoSwapContract()

  const inputTokenContract = useMemo(
    () => getERC20TokenContract(web3)(inputToken),
    [web3, inputToken]
  )

  const generateApproveResetCallData = (tokenAddress, spender) => {
    const call = {
      spenderIfIsApproval: spender,
      target: tokenAddress,
      value: 0,
      data: 0
    }

    return call
  }

  const generateSwapCallData = (uniRouterAddress, uniRouterABI, value, functionName, args) => {
    let contract = new web3.eth.Contract(uniRouterABI, uniRouterAddress)
    const data = contract.methods[functionName](...args).encodeABI()

    const call = {
      spenderIfIsApproval: zeroAddress,
      target: uniRouterAddress,
      value,
      data
    }
    return call
  }

  const [approvals, setApproved] = useState({})
  const approvalAmount = BigNumber.from(10).pow(28)
  useEffect(() => {
    if (!inputToken) {
      setApproved(a => ({ ...a, [inputToken]: null}))
      return
    }
    if (addressesEqual(inputToken, tokensBySymbol.BNB.address)) {
      setApproved(a => ({ ...a, [inputToken]: true}))
      return
    }
    const checkAllowance = async () => {
      if (!inputTokenContract) {
        return
      }
      const allowance = await inputTokenContract.methods.allowance(
        address,
        AUTOSWAP_CONTRACT.address
      ).call({})
      setApproved(a => ({
        ...a,
        [inputToken]: BigNumber.from(allowance).gte(approvalAmount)
      }))
    }
    checkAllowance()
  }, [inputToken, inputTokenContract, address])
  const approved = approvals[inputToken]

  const approve = useCallback(() => inputTokenContract?.methods.approve(
      AUTOSWAP_CONTRACT.address,
      approvalAmount,
    ).send({ from: address }).then(() => {
      setApproved(a => ({ ...a, [inputToken]: true }))
    }),
    [inputTokenContract, address, inputToken]
  )

  const callArgsForSwap = {
    swapExactTokensForTokens: swap => swap.uniRouterAddress === routers.vpeg
      ? [swap.path[0], swap.path[1], swap.amountIn, swap.amountOutMin, swap.path, swap.to, swap.deadline]
      : [swap.amountIn, swap.amountOutMin, swap.path, swap.to, swap.deadline],
    swapExactETHForTokens: swap => [swap.amountOutMin, swap.path, swap.to, swap.deadline],
    swapExactBNBForTokens: swap => [swap.amountOutMin, swap.path, swap.to, swap.deadline],
    swapExactTokensForETH: swap => [swap.amountIn, swap.amountOutMin, swap.path, swap.to, swap.deadline],
    swapExactTokensForBNB: swap => [swap.amountIn, swap.amountOutMin, swap.path, swap.to, swap.deadline]
  }
  /**
   * @param {Array} swaps - See runExample()
   */
  const generateCalls = (swaps) => unnest(swaps.map(swap => [
    // Approve inAmount to be spent by DEX router
    generateApproveResetCallData(swap.path[0], swap.uniRouterAddress),
    //generateApproveResetCallData(swap.path[1], swap.uniRouterAddress),

    // Swap
    generateSwapCallData(
      swap.uniRouterAddress, swap.uniRouterABI, swap.value, swap.functionName,
      callArgsForSwap[swap.functionName](swap)
    )
  ]))


  /**
   * Payable function to approve spending of tokens by spender.
   * @param {address} inToken
   * @param {address} outToken
   * @param {BigNumber} inAmount
   * @param {BigNumber} minOutAmount - The amt u will get back assuming -ve slippage limit is hit
   * @param {BigNumber} guaranteedAmount - The max amount u will get assuming we set feeRate to 100% - ie, we eat the +ve slippage. If we set feeRate to 0, users will take all the +ve slippage.
   * @param {address} referrer
   * @param {Array} calls - Generated by generateCalls()
   */
  const doSwap = async ( inToken, outToken, inAmount, minOutAmount, guaranteedAmount, referrer, calls) =>
    swapContract.methods.swap(
      inToken,
      outToken,
      inAmount,
      minOutAmount,
      guaranteedAmount,
      referrer,
      calls
    ).send({
      from: address,
      value: addressesEqual(inToken, tokensBySymbol.BNB.address) ? inAmount : 0,
      ...tx_settings_obj
    })

  return {
    swap: useCallback(async (
      inputToken, outputToken, inputAmount, minOutAmount, quote, slippage = 1
    ) => {
      const applySlippage = n => BigNumber.from(n).mul(10000-slippage).div(10000)
      const afterSlippage = applySlippage(minOutAmount)

      return doSwap(
        inputToken,
        outputToken,
        inputAmount,
        afterSlippage,
        minOutAmount,
        referrer,
        quote.calls.map(call => ({
          ...call,
          data: call.data === '0' ? 0 : call.data,
          value: call.value === '0' ? 0 : call.value,
        }))
      )
    }, [web3, address]),
    approved,
    approve
  }
}

const routers = {
  pancake: '0x05ff2b0db69458a0750badebc4f9e13add608c7f',
  bakery: '0xcde540d7eafe93ac5fe6233bee57e1270d3e330f',
  street: '0x3bc677674df90a9e5d741f28f6ca303357d0e4ec',
  vpeg: '0xb7e19a1188776f32e8c2b790d9ca578f2896da7c',
  jul: '0xbd67d157502A23309Db761c41965600c2Ec788b2'
}

const routerABIs = {
  pancake: PCSRouter,
  vpeg: VpegRouter,
  bakery: BakeryRouter,
  street: StreetRouter,
  jul: BakeryRouter
}

export const mkRoute = (pairs, inputToken) => {
  const [inputPairs, otherPairs] = partition(
    ({ token_in }) => addressesEqual(token_in, inputToken),
    pairs
  )
  const outTokens = inputPairs.map(({ token_out }) => token_out)

  return inputPairs.map(pair => ({
    pair,
    children: mkRoute(otherPairs, pair.token_out),
  }))
}

// Creates a nested array of BST tree
function mkPairsTree(outputToken, pairs) {
  const edges = pairs.map(pair => ({
    input: pair.token_in,
    output: pair.token_out,
    pair
  }))
  const [[head, ...list]] = traverseTreeFromFinal(outputToken, edges)
  console.log(list)
  return list.map(ps => ps.map(({ pair }) => pair))
}

// startToken and finalToken is potentially BNB
export function orderedSwaps(pairsTree, startToken, finalToken) {
  const depth = pairsTree.length
  return compose(
    flatten,
    tree => tree.map((pairs, level) => {
      let transformer = callConfigForPair
      if (addressesEqual(startToken, tokensBySymbol.BNB.address) && level === 0) {
        transformer = callConfigForPairFromBNB
      }
      if (addressesEqual(finalToken, tokensBySymbol.BNB.address) && level === depth - 1) {
        transformer = callConfigForPairToBNB
      }
      return pairs.map(transformer)
    })
  )(pairsTree)
}


const swapExactETHForTokens = {
  pancake: 'swapExactETHForTokens',
  bakery: 'swapExactBNBForTokens',
  street: 'swapExactBNBForTokens',
  vpeg: 'swapExactETHForTokens',
  jul: 'swapExactBNBForTokens'
}
const swapExactTokensForETH = {
  pancake: 'swapExactTokensForETH',
  bakery: 'swapExactTokensForBNB',
  street: 'swapExactTokensForBNB',
  vpeg: 'swapExactTokensForETH',
  jul: 'swapExactTokensForBNB'
}

const callConfigForPair = ({ token_in, token_out, pair_addresses_obj }) =>
  values(pair_addresses_obj)
    .map(({input_amt, output_amt, dex}) => ({
      uniRouterAddress: routers[dex],
      uniRouterABI: routerABIs[dex],
      functionName: 'swapExactTokensForTokens',
      value: 0,
      amountIn: BigNumber.from(input_amt).toString(),
      amountOutMin: BigNumber.from(0).toString(),
      path: [token_in, token_out],
      to: AUTOSWAP_CONTRACT.address,
      deadline: parseInt(Date.now() / 1000) + 600
    }))

const callConfigForPairFromBNB = ({ token_in, token_out, pair_addresses_obj }) =>
  values(pair_addresses_obj)
    .map(({input_amt, output_amt, dex}) => ({
      uniRouterAddress: routers[dex],
      uniRouterABI: routerABIs[dex],
      functionName: swapExactETHForTokens[dex],
      value: BigNumber.from(input_amt).toString(),
      amountOutMin: BigNumber.from(0).toString(),
      path: [token_in, token_out],
      to: AUTOSWAP_CONTRACT.address,
      deadline: parseInt(Date.now() / 1000) + 600
    }))

const callConfigForPairToBNB = ({ token_in, token_out, pair_addresses_obj }) =>
  values(pair_addresses_obj)
    .map(({input_amt, output_amt, dex}) => ({
      uniRouterAddress: routers[dex],
      uniRouterABI: routerABIs[dex],
      functionName: swapExactTokensForETH[dex],
      value: 0,
      amountIn: BigNumber.from(input_amt).toString(),
      amountOutMin: BigNumber.from(0).toString(),
      path: [token_in, token_out],
      to: AUTOSWAP_CONTRACT.address,
      deadline: parseInt(Date.now() / 1000) + 600
    }))

