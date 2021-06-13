import { memo, useMemo, useCallback, useState, useEffect } from 'react'
import cx from 'classnames'
import { Collapse } from '@material-ui/core'
import { useMutation } from 'react-query'
import Link from 'next/link'
import {
  BarChart,
  Bar,
  Cell,
  Legend,
  AreaChart,
  Area,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer
} from 'recharts'
import { compose, toPairs, fromPairs, range, partition } from 'ramda'
import { RiBarChartFill, RiBarChartHorizontalFill, RiLineChartLine } from 'react-icons/ri'
import isMobile from 'is-mobile'

import { chainIds, chainsById } from 'constants/chains'
import { multiplyTokenPrice, displayTokenUnits, currency } from 'lib/numFormat'
import { useDarkTheme } from 'context/theme'
import { abbrNum } from 'lib/numFormat'

const COLORS = [
  '#4958c5',
  '#d450b3',
  '#ff6882',
  '#ffab51',
  '#fff352',
]
const RADIAN = Math.PI / 180

const Dashboard = ({
  priceAUTO,
  totalPendingAUTO,
  totalStaked,
  totalNumStaked,
  harvestAll,
  chainId,
  numHarvestable = 0,
  stakedValueByPid = {},
  pools
}) => {
  const [showProjections, setShowProjections] = useState(!isMobile())
  const [showBreakdown, setShowBreakdown] = useState(!isMobile())
  const AUTOAddress = chainsById[chainId].AUTOAddress
  const harvestAllMutation = useMutation(harvestAll)
  const handleHarvestAll = useCallback(() => {
    harvestAllMutation.mutate()
  }, [harvestAllMutation])

  const [darkMode, toggleTheme] = useDarkTheme()

  const stakes = useMemo(() => {
    const [bigPairs, smallPairs] = compose(
      partition(([pid, val]) => val > totalStaked / 100),
      toPairs
    )(stakedValueByPid)
    const smallAmount = smallPairs.reduce((acc, [pid, val]) => acc + val, 0)
    return [
      ...bigPairs.map(([pid, val]) => ({
        name: pools[pid]?.wantName,
        value: val,
        theme: darkMode ? 'dark' : 'light'
      })),
      smallAmount > 10 && {
        name: 'Others',
        value: smallAmount,
        theme: darkMode ? 'dark' : 'light'
      },
    ].filter(Boolean)
  }, [stakedValueByPid, pools, darkMode])

  const averageAPY = useMemo(() => toPairs(stakedValueByPid)
    .reduce((acc, [pid, val]) => {
      const apy = pools[pid]?.APY_total || 0
      return val * apy + acc
    }, 0) / totalStaked
  , [stakedValueByPid, pools])
  const averageDailyAPR = useMemo(() => toPairs(stakedValueByPid)
    .reduce((acc, [pid, val]) => {
      const apr = pools[pid]?.APR + pools[pid]?.APR_AUTO || 0
      return val * apr + acc
    }, 0) / totalStaked / 364
  , [stakedValueByPid, pools])


  const renderCustomizedLabel = useCallback(({ cx, cy, midAngle, innerRadius, outerRadius, percent, name, index,theme }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 1.2
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    if (name === 'Others' && percent * 100 < 5) {
      return null
    }

    return (
      <>
        <text x={x} y={y} fontSize="9"
        fill={theme === 'dark' ? "white" : "black"}
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central">
          {name}
        </text>
        <text x={x} y={y+12} fontSize="9" fill={theme === 'dark' ? "white" : "black"} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
          ({`${(percent * 100).toFixed(0)}%`})
        </text>
      </>
    )
  }, [])

  const chartDays = range(1, 365)
  const getAmtAfterDays = (amt, days, apr, compoundsYearly) => {
    const compounds = days / 364 * compoundsYearly
    const interestPerCompount = (apr) / compoundsYearly
    return amt * Math.pow(1 + interestPerCompount, compounds)
  }

  const stakedPids = useMemo(() => toPairs(stakedValueByPid)
    .filter(([pid, val]) => val > 1)
    .map(([pid]) => pid),
    [stakedValueByPid])

  const data = useMemo(() => chartDays.map(d => ({
    name: `Day ${d}`,
    ...fromPairs([
      ...toPairs(stakedValueByPid)
      .filter(([pid, val]) => val > 1)
      .map(([pid, val]) => {
        const { wantName, APR, compoundsPerYear } = pools[pid]
        const projectedAmt = getAmtAfterDays(val, d, APR, compoundsPerYear)
        return [wantName, projectedAmt]
      }),
      ['AUTO', toPairs(stakedValueByPid)
        .filter(([pid, val]) => val > 1)
        .reduce((acc, [pid, val]) => {
          const { APR_AUTO } = pools[pid]
          const autoRewards = val * APR_AUTO / 365 * d
          return acc + autoRewards
        }, multiplyTokenPrice(totalPendingAUTO, priceAUTO))
      ]
    ])
  })), [pools, stakedValueByPid ,totalPendingAUTO, priceAUTO])


  return (
    <div className="">
      <div className="text-gray-600 font-semibold mb-2 text-xl xl:text-2xl">Your statistics</div>
      <div className="grid grid-cols-3 gap-x-1 gap-y-3 sm:gap-3 xl:gap-6 xl:gap-10">
        <div className="">
          <div className="font-semibold text-sm xl:text-base">Total Deposit</div>
          <div className="xl:text-xl">{currency(totalStaked)}</div>
          <div className="text-sm">{totalNumStaked} assets</div>
          <button
            className="btn-secondary text-xs sm:text-sm py-1 mt-1 space-x-1"
            onClick={() => setShowBreakdown(s => !s)}
          >
            <RiBarChartHorizontalFill /><div>Breakdown</div>
          </button>
        </div>
        <div className="">
          <div className="font-semibold text-sm xl:text-base">Average APY</div>
          <div className="xl:text-xl">{abbrNum(averageAPY * 100, 2)}%</div>
          <div className="text-sm">Daily {abbrNum(averageDailyAPR * 100, 2)}%</div>
          <button
            className="btn-secondary text-xs sm:text-sm py-1 mt-1 space-x-1 items-center"
            onClick={() => setShowProjections(s => !s)}
          >
            <RiLineChartLine /><div>Projection</div>
          </button>
        </div>
        <div className="">
          <div className="font-semibold text-sm xl:text-base">AUTO Rewards</div>
          <div className={cx(
            'xl:text-xl',
            {'text-green-600 dark:text-green-500' : totalPendingAUTO > 0 }
          )}>
            {displayTokenUnits(totalPendingAUTO)}
          </div>
          <div className="text-sm">
            {currency(multiplyTokenPrice(totalPendingAUTO, priceAUTO))}
          </div>
          <button
            className="btn-secondary text-xs sm:text-sm py-1 mt-1"
            onClick={handleHarvestAll}
            disabled={harvestAllMutation.isLoading}
          >
            { harvestAllMutation.isLoading
              ? 'Harvesting...'
              : `Harvest all (${numHarvestable})`
            }
          </button>
        </div>
        { totalStaked > 0 &&
          <>
          <div className="col-span-3">
            <Collapse in={showProjections}>
            <div className="font-semibold">Projections</div>
            <div className="text-xs mb-2">*calculated under current APYs. APYs change over time. </div>
            <div className="max-w-md mx-auto">
              <ResponsiveContainer width="100%" aspect={2}>
                <AreaChart data={data}
                  margin={{ top: 10, right: 40, left: 10 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 9 }} tickFormatter={v => `$${abbrNum(v)}`} />
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#444' : '#ccc'} />
                  {stakedPids.map((pid, index) => (
                    <Area
                      key={pid}
                      type="monotone"
                      stackId="1"
                      legendType="rect"
                      dataKey={pools[pid].wantName}
                      fill={COLORS[index % COLORS.length]}
                      fillOpacity="1"
                      stroke={COLORS[index % COLORS.length]}
                    />
                  ))}
                    <Area
                      type="monotone"
                      stackId="1"
                      dataKey="AUTO"
                      legendType="rect"
                    />
                  <Legend formatter={v => v.split(' ')[0]} verticalAlign="bottom" wrapperStyle={{ fontSize: 9 }}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
            </Collapse>
          </div>
          <div className="col-span-3">
            <Collapse in={showBreakdown}>
              <div className="font-semibold">Asset allocation (by USD)</div>
              <div className="max-w-lg mx-auto">
              <ResponsiveContainer width="100%" height={30*stakes.length + 60}>
                <BarChart data={stakes} layout="vertical" margin={{ top: 10, right: 40, left: 10 }} barSize={20}>
                  <CartesianGrid horizontal={false} stroke={darkMode ? '#444' : '#ccc'} />
                  <XAxis type="number" tick={{ fontSize: 9 }} tickFormatter={v => `$${abbrNum(v)}`} />
                  <YAxis interval={0} type="category" dataKey="name" tick={{ fontSize: 9 }} tickFormatter={v => v.split(' ')[0]} />
                  <Bar dataKey="value" fill={COLORS[0]} label={{ position: 'right', fill: darkMode ? 'white' : 'black', fontSize: 9, formatter: n => (n*100 / totalStaked).toFixed(1) + '%' }} />
                </BarChart>
              </ResponsiveContainer>
              </div>
            </Collapse>
          </div>
          </>
        }
      </div>
    </div>
  )
}

export default memo(Dashboard)

