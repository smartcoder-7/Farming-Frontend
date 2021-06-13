import { useMemo, useCallback } from 'react'
import { useQuery } from 'react-query'
import { ethers } from 'ethers'
import Web3 from 'web3'
import {
  map,
  applyTo,
  mergeLeft,
  indexBy,
  filter,
  lt,
  nth,
  reduce,
  compose,
  fromPairs,
  toPairs,
  zip,
  mapObjIndexed,
  sum,
  values
} from 'ramda'
import { useAtom } from 'jotai'
import {BigNumber} from '@ethersproject/bignumber'

import { dust } from 'constants/index'
import { chainsById } from 'constants/chains'
import { getERC20TokenContract, getAutoFarmContract } from 'contracts'
import { getWeb3Atom } from 'context/web3'
import { multiplyTokenPrice, displayTokenUnits } from 'lib/numFormat'
import ERC20 from 'contracts/abis/ERC20.json'
import AutoFarm from 'contracts/abis/AutoFarm.json'
import multicall from 'contracts/multicall'

const mkPendingAUTOCalls = ({ autoContractAddress, address, pools }) => ({
  abi: AutoFarm.abi,
  calls: pools.map(({ pid }) => ({
    address: autoContractAddress,
    name: 'pendingAUTO',
    params: [pid, address]
  }))
})

const mkBalancesCalls = ({ address, pools }) => ({
  abi: ERC20.abi,
  calls: pools.map(({ pid, pool }) => ({
    address: pool.wantAddress,
    name: 'balanceOf',
    params: [address]
  }))
})

const mkAllowancesCalls = ({ address, autoContractAddress, pools }) => ({
  abi: ERC20.abi,
  calls: pools.map(({ pool }) => ({
    address: pool?.wantAddress || pool?.poolInfo?.want,
    name: 'allowance',
    params: [address, autoContractAddress]
  }))
})

const mkStakedCalls = ({ autoContractAddress, address, pools }) => ({
  abi: AutoFarm.abi,
  calls: pools.map(({ pid }) => ({
    address: autoContractAddress,
    name: 'stakedWantTokens',
    params: [pid, address]
  }))
})

const withdraw = ({ autoContract, address, notify}) => ({ pid, amt, emergency }) => {
  if (!amt) {
    return
  }
  const normalizedAmt = (amt.match(/,/g) || []).length === 1
    ? amt.replace(',', '.')
    : amt

  const parsedAmt = ethers.utils.parseUnits(normalizedAmt, 18)

  const method = emergency
    ? autoContract.methods.emergencyWithdraw(pid)
    : autoContract.methods.withdraw(pid, parsedAmt)



  return new Promise((resolve, reject) => {
    method.send({ from: address }, (err, data) => { if (err) { console.log(err) } } )
      .on('error', function(error){
        console.error(error)
        reject(error)
      })
      .on('transactionHash', (transactionHash) => {
        notify("Withdraw pending...");
        console.log(transactionHash, "pending...")
      })
      .on('receipt', (receipt) => {
        notify('Withdraw complete')
        resolve(receipt)
      })
      .on('confirmation', (confirmationNumber, receipt) => {
        // console.log(confirmationNumber, "confirmation") // contains the new contract address
      })
  })
}

const harvestAll = ({ web3, autoContract, address, pids, notify }) =>
  async () => {
    const batch = new web3.BatchRequest()

    const requests = pids.map(pid =>
      new Promise((resolve, reject) => batch.add(
        autoContract.methods.withdraw(pid, 0)
          .send.request({ from: address }, (err, data) => {
            if (err) { return reject(err) }
            resolve(data)
          })
      ))
    )
    batch.execute()
    await Promise.all(requests)
    await new Promise(resolve => setTimeout(resolve, 7000))
    notify('All rewards harvested')
  }


const deposit = ({
  autoContract,
  userData,
  poolsByPid,
  address,
  notify,
  autoFarmContractAddress,
}) => ({ pid, amt, bypassBalanceCheck }) => {
  if (!amt) {
    return
  }
  const normalizedAmt = (amt.match(/,/g) || []).length === 1
    ? amt.replace(',', '.')
    : amt

  const amount = ethers.utils.parseUnits(normalizedAmt, 18)
  const balance = userData.data?.balances[pid] || BigNumber.from(0)
  if (amount.gt(balance) && !bypassBalanceCheck) {
    notify('Insufficient balance')
    return
  }

  const autoRewards = userData.data?.pendingAUTO?.[pid]

  const contractDeposit = (pid) => new Promise((resolve, reject) => {
    autoContract.methods.deposit(pid, amount).send({ from: address}, (err, data) => { if (err) { console.log(err) } } )
    .on('error', (error) => {
      reject(error)
    })
    .on('transactionHash', (transactionHash) => { notify("Deposit pending..."); console.log(transactionHash, "pending...") })
    .on('receipt', (receipt) => {
      console.log(receipt, "receipt") // contains the new contract address
      let message = 'Deposit complete!'
      if (autoRewards > 0) {
        message += ` ${displayTokenUnits(autoRewards)} AUTO Harvested`
      }
      notify(message)
      resolve(receipt)
    })
    .on('confirmation', function(confirmationNumber, receipt){ 
      // console.log(receipt, "confirmation") // contains the new contract address
    })
  })

  // Approve if allowance less than amt
  const vault = poolsByPid?.[pid]
  if (!vault) {
    // TODO: report to rollbar
    return
  }

  const allowance = userData.data?.allowances[pid] || BigNumber.from(0)

  if (allowance.lt(amount)) {
    notify("Approval required.")
    let wantTokenContract = vault.contract
    return new Promise((resolve, reject) => {
      wantTokenContract.methods.approve(
        autoFarmContractAddress,
        ethers.utils.parseUnits("5", 76)
      ).send({ from: address.toLowerCase() }, (err, data) => { if (err) { console.log(err) } } )
      .on('error', (error) => {  console.log(error); reject(error)  })
      .on('transactionHash', (transactionHash) => {
        notify("Approving...")
        console.log(transactionHash, "Approving...")
      })
      .on('receipt', (receipt) => {
        console.log("receipt") // contains the new contract address
        notify("Approval complete!")
        resolve(contractDeposit(pid))
      })
      .on('confirmation', (confirmationNumber, receipt) => { 
        console.log(receipt, "confirmation") // contains the new contract address
      })
    })

  } else {
    // console.log("APPROVED ALR", this.state.userWantsAllowance[wantAddress.toLowerCase()])
    return contractDeposit(pid)
  }
}

const batchCalls = chainId => args => map(applyTo(args), {
  balances: mkBalancesCalls,
  allowances: mkAllowancesCalls,
  staked: mkStakedCalls,
  ...(chainId !== 128 ? {
    pendingAUTO: mkPendingAUTOCalls,
  } : {})
})

const useWallet = ({ farms, chain, notify }) => {
  const autoContractAddress = chain.autoFarmContractAddress

  const [{ web3, address, isConnectionOK }] = useAtom(getWeb3Atom)
  const connectionOK = isConnectionOK(chain.chainId)

  const autoContract = useMemo(
    () => web3 && getAutoFarmContract(web3)(autoContractAddress),
    [web3, autoContractAddress],
  )
  const pools = useMemo(() => web3 && farms?.data?.poolsDisplayOrder?.map(pid => {
    const pool = farms.data.pools?.[pid]
    if (!pool) {
      return
    }
    let wantAddress = pool?.wantAddress || pool?.poolInfo?.want
    const contract = getERC20TokenContract(web3)(wantAddress)
    return { pid, pool, contract }
  }).filter(Boolean), [farms?.data, web3])

  const poolsByPid = useMemo(() => indexBy(v => v.pid, pools || []), [pools])
  const multicallInstance = multicall(web3, address, chain.chainId)

  const userData = useQuery(
    ['userData', address, autoContractAddress],
    async () => {
      const calls = batchCalls(chain.chainId)({ pools, address, autoContractAddress })
      const results = await multicallInstance(calls)
      const resultsWithPids = map(compose(
        fromPairs,
        zip(pools.map(({ pid }) => pid))
      ), results)
      return resultsWithPids
    },
    {
      enabled: !!connectionOK && !!pools && !!address &&
        !!web3 && !!farms.data?.pools,
      refetchInterval: 10000,
    }
  )

  const harvestablePools = useMemo(() =>
    filter(
      lt(dust),
      userData.data?.pendingAUTO || {}
    ),
    [userData.data?.pendingAUTO]
  )
  const totalPendingAUTO = useMemo(
    () => reduce((a, b) => b.add(a), 0, values(userData?.data?.pendingAUTO)),
    [userData?.data?.pendingAUTO]
  )

  const stakedValueByPid = useMemo(
    () => mapObjIndexed(
      (staked, pid) => {
        const pool = farms?.data?.pools?.[pid]
        if (!pool) return 0
        return multiplyTokenPrice(staked, pool?.wantPrice || 0, pool.wantDecimals)
      },
      userData?.data?.staked
    ),
    [userData?.data?.staked, farms?.data?.pools]
  )
  const totalStaked = useMemo(() => sum(values(stakedValueByPid)), [stakedValueByPid])
  const totalNumStaked = useMemo(
    () => sum(values(mapObjIndexed(
      (staked, pid) => {
        return stakedValueByPid?.[pid] > 1
      },
      userData?.data?.staked
    ))),
    [userData?.data?.staked, stakedValueByPid]
  )

  return {
    userData,
    autoContract,
    poolsByPid,
    harvestablePools,
    stakedValueByPid,
    totalStaked,
    totalNumStaked,
    totalPendingAUTO,
    withdraw: useCallback(
      withdraw({ autoContract, address, notify }),
      [autoContract, address, notify]
    ),
    harvestAll: useCallback(
      harvestAll({
        autoContract,
        address,
        notify,
        pids: Object.keys(harvestablePools),
        web3
      }),
      [ autoContract, notify, address,
        harvestablePools, web3
      ]
    ),
    deposit: useCallback(
      deposit({
        userData,
        autoContract,
        poolsByPid,
        address,
        notify,
        autoFarmContractAddress: chain.autoFarmContractAddress
      }),
      [userData.data, autoContract,
        poolsByPid, address, notify,
        chain.autoFarmContractAddress
      ]
    )
  }
}

export default useWallet

