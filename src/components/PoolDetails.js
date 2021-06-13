import { useEffect, memo, useState, useCallback } from 'react'
import { ethers } from 'ethers'
import { useMutation } from 'react-query'
import { newForOldVault, oldVaults } from 'lib/venusMigration'
import { BigNumber } from '@ethersproject/bignumber'

import { displayTokenUnits, formatTokenUnits, multiplyTokenPrice, currency, formatNumber } from 'lib/numFormat'
import {ErrorOutline} from "@material-ui/icons";

const sleep = t => new Promise(resolve => {
  setTimeout(resolve, t)
})

const PoolDetails = ({
  pid,
  pool,
  userStakedWantToken,
  userWantsBalance,
  userPendingAUTO,
  priceAUTO,
  deposit,
  withdraw,
  onTxSuccess,
  hasAutoRewards = true,
  shouldWithdraw = false,
  alertText,
  chain,
  emergencyWithdraw = chain.emergencyWithdraw
}) => {
  const depositMutation = useMutation(deposit, { onSuccess: onTxSuccess })
  const withdrawMutation = useMutation(withdraw, { onSuccess: onTxSuccess })
  const harvestMutation = useMutation(withdraw, { onSuccess: onTxSuccess })
  const [depositAmt, setDepositAmt] = useState('')
  const [withdrawAmt, setWithdrawAmt] = useState('')
  useEffect(() => {
    if (emergencyWithdraw && userStakedWantToken) {
      setWithdrawAmt(formatTokenUnits(userStakedWantToken))
    }
  }, [emergencyWithdraw, userStakedWantToken])
  const disabled = pool.categoryName === "Disabled"
  const allowDeposits = pool.allowDeposits && !disabled
  const handleNoop = useCallback((e) => {
    e.preventDefault();
  }, [])
  const handleDeposit = useCallback((e) => {
    e.preventDefault();
    depositMutation.mutateAsync({ pid, amt: depositAmt })
      .then(() => setDepositAmt(''))
  }, [depositAmt, depositMutation, pid])
  const handleWithdraw = useCallback((e) => {
    e.preventDefault();
    withdrawMutation.mutateAsync({ pid, amt: withdrawAmt, emergency: emergencyWithdraw && chain.chainId === 128 })
      .then(() => setWithdrawAmt(''))
  }, [withdrawAmt, migrationMutation, pid, emergencyWithdraw])
  const migrationMutation = useMutation(async () => {
    const originalAmtUnits = userStakedWantToken
    const amt = formatTokenUnits(userStakedWantToken)
    await withdraw({ pid, amt })
    const res = await onTxSuccess()
    const balance = res.data.balances[pid]
    const newAmt = balance.lte(originalAmtUnits)
      ? balance
      : originalAmtUnits
    const newPid = newForOldVault(pid)
    return deposit({ pid: newPid, amt: formatTokenUnits(newAmt), bypassBalanceCheck: true })
  }, { onSuccess: onTxSuccess })
  const handleMigrate = useCallback((e) => {
    e.preventDefault()
    setWithdrawAmt(formatTokenUnits(userStakedWantToken))
    migrationMutation.mutateAsync()
      .then(() => setWithdrawAmt(''))
  }, [migrationMutation, pid])
  const handleHarvest = useCallback(() => {
    harvestMutation.mutate({ pid, amt: '0' })
  }, [harvestMutation, pid])
  const [depositWarn, setDepositWarn] = useState(true)

  return (
    <div className="mx-auto max-w-xs sm:max-w-none my-5 p-3 sm:mx-3 border dark:border-gray-900 shadow-lg dark:bg-gray-900 rounded-lg flex-auto m-auto">
      {pool.alertText || alertText ?
        <div className="flex justify-left py-2 md:flex-row text-xs sm:text-sm items-center">
          <ErrorOutline/><span className="px-2">{pool.alertText || alertText}</span>
        </div> : ''
      }
      <div className="flex items-stretch space-y-3 md:space-y-0 md:space-x-3 flex-col md:flex-row">
        <div className="flex-auto flex flex-col">
          <div className="flex justify-between flex-auto text-sm 2xl:text-base">
            <div className="font-semibold">Balance</div>
            <div onClick={() => setDepositAmt(formatTokenUnits(userWantsBalance))} className="cursor-pointer text-right">
              {displayTokenUnits(userWantsBalance)} ({currency(multiplyTokenPrice(userWantsBalance, pool.wantPrice)) })
            </div>
          </div>
          { !emergencyWithdraw && allowDeposits ? <form onSubmit={allowDeposits ? handleDeposit : handleNoop}>
            <div className="flex space-x-1 mt-1 dark:bg-gray-800 border dark:border-gray-800 border-gray-300 rounded px-2 w-full mb-2 appearance-none focus:outline-none focus:ring focus:border-blue-300">
            <input
              className="bg-transparent w-full"
              onChange={e => setDepositAmt(e.target.value)}
              value={depositAmt}
              type="number"
              step="any"
              min="0"
              inputMode="decimal"
              placeholder="0"
              disabled={!allowDeposits || depositMutation.isLoading}
            />
            <div className="text-xs btn text-blue-500 cursor-pointer"
              onClick={() => setDepositAmt(formatTokenUnits(userWantsBalance))}
            >MAX</div>
            </div>

            <button className={"btn " + (allowDeposits ? "btn-primary w-full" : "btn-disabled w-full")} disabled={depositAmt <= 0 || deposit.isLoading}>
              {depositMutation.isLoading
                  ? 'Depositing...'
                  : `Deposit`
              }
            </button>
          </form> : <div className="flex-auto flex justify-center items-center">Deposit is temporarily disabled</div> }
        </div>
        <div className="flex-auto">
          <div className="flex justify-between text-sm 2xl:text-base">
            <div className="font-semibold">Deposit </div>
            <div onClick={() => setWithdrawAmt(formatTokenUnits(userStakedWantToken))} className="cursor-pointer text-right">
              {displayTokenUnits(userStakedWantToken)} ({currency(multiplyTokenPrice(userStakedWantToken, pool.wantPrice)) })
              <div className="text-gray-500">
                { userStakedWantToken && pool.wantLockedTotal > 0 &&
                    userStakedWantToken.mul(10e5).mul(100).div(pool.wantLockedTotal) / 10e5
                }% of vault
              </div>
            </div>
          </div>
          <form onSubmit={handleWithdraw}>
            <div className="flex space-x-1 mt-1 dark:bg-gray-800 border dark:border-gray-800 border-gray-300 rounded px-2 w-full mb-2 appearance-none focus:outline-none focus:ring focus:border-blue-300">
            <input
              className="bg-transparent w-full"
              value={withdrawAmt}
              onChange={e => setWithdrawAmt(e.target.value)}
              type="number"
              step="any"
              min="0"
              inputMode="decimal"
              placeholder="0"
              disabled={emergencyWithdraw || withdrawMutation.isLoading}
            />
            <div className="text-xs btn text-blue-500 cursor-pointer"
              onClick={() => setWithdrawAmt(formatTokenUnits(userStakedWantToken))}
            >MAX</div>
            </div>

            { shouldWithdraw ? (
              <div className="grid grid-cols-2 gap-2">
                <button onClick={handleMigrate} className="btn btn-primary w-full" disabled={migrationMutation.isLoading}>
                  {migrationMutation.isLoading ? 'Migrating...' : (
                    `${userPendingAUTO > 1e-6 ? 'Harvest & ' : ''}Migrate all`
                  )}
                </button>
                <button className="btn btn-primary w-full" disabled={withdrawAmt <= 0 || withdraw.isLoading}>
                  {withdrawMutation.isLoading ? 'Withdrawing...' : (
                    `${userPendingAUTO > 1e-6 ? 'Harvest & ' : ''}Withdraw`
                  )}
                </button>
              </div>
            ) : (
              <button className="btn btn-primary w-full" disabled={withdrawAmt <= 0 || withdraw.isLoading}>
                {withdrawMutation.isLoading ? 'Withdrawing...' : (
                  `${userPendingAUTO > 1e-6 ? 'Harvest & ' : ''}Withdraw${emergencyWithdraw ? ' All' : ''}`
                )}
              </button>
            ) }
          </form>
        </div>

        { hasAutoRewards && (
        <div className="text-left flex sm:flex-col flex-wrap space-y-1">
          <div className="font-semibold text-sm">AUTO&nbsp;Rewards</div>
          <div className="flex flex-auto flex-col justify-end text-right sm:text-left">
            <div> 
              <div className="md:text-lg sm:font-semibold leading-none">
                {displayTokenUnits(userPendingAUTO)}
              </div>
              <div className="text-gray-500">
                {currency(multiplyTokenPrice(userPendingAUTO,  priceAUTO)) }
              </div>
            </div>

          </div>

          <button
            disabled={ !userPendingAUTO || parseFloat(userPendingAUTO) === 0 || withdrawMutation.isLoading }
            onClick={handleHarvest}
            className="btn btn-secondary w-full"
          >
            {withdrawMutation.isLoading || harvestMutation.isLoading
              ? 'Harvesting...'
              : 'Harvest'
            }
          </button>
        </div>
        )}

      </div>
    </div>
  )
}

export default memo(PoolDetails)
