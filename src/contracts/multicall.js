import { Interface } from '@ethersproject/abi'
import {
  map,
  compose,
  nth,
  toPairs,
  fromPairs,
  unnest,
  take,
  reduce,
  splitAt
} from 'ramda'
import MultiCallAbi from './abis/multicall.json'
import { chainsById } from 'constants/chains'
import { getContract } from './index'

export const mkCalldata = (itf, calls) => calls.map((call) => [
  call.address?.toLowerCase(),
  itf.encodeFunctionData(call.name, call.params),
])


// Multi-contract multicall
// Example reqObj
// { myRequest: { abi, calls: [{ address, name, params }] } }
export const multicall = (web3, address, chainId) => async (reqObj, payable = false) => {
  const multicallContract = getContract(web3)({
    abi: MultiCallAbi,
    address: chainsById[chainId].multicallContractAddress
  })

  const reqConfig = map(
    ({ abi, calls }) => {
      const itf = new Interface(abi)
      const calldata = mkCalldata(itf, calls)
      return { itf, calldata, calls }
    },
    reqObj
  )
  // Ensure ordering by converting to pairs
  const reqConfigPairs = toPairs(reqConfig)
  const calldata = compose(
    unnest,
    map(({ calldata }) => calldata),
    map(nth(1))
  )(reqConfigPairs)

  const method = multicallContract.methods.aggregate(calldata)
  const { returnData } = await (payable
    ? method.send({ from: address })
    : method.call({}))
  const { pairs } = reduce(({ pairs, res }, [key, {itf, calls}]) => {
    const [resDataForKey, rest] = splitAt(calls.length, res)
    const resForKey = resDataForKey.map((call, index) =>
      itf.decodeFunctionResult(calls[index].name, call)[0]
    )
    return {
      pairs: [...pairs, [key, resForKey]],
      res: rest
    }
  }, { pairs: [], res: returnData }, reqConfigPairs)

  return compose(
    fromPairs,
  )(pairs)
}

export default multicall

