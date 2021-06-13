import { useEffect } from "react";
import { useQuery } from "urql";

import { maxBy, minBy } from "./dashboard.fns.utils";
import { GET_HOLDINGS } from "../dashboard.queries";

export function useDashboardPrices(walletAddress) {
  const [{ data, fetching, error }, refetch] = useQuery({
    pause: !walletAddress,
    query: GET_HOLDINGS,
    variables: { walletAddress },
  });

  useEffect(() => {
    const interval = setInterval(
      () => refetch({ requestPolicy: "network-only" }),
      30 * 1000
    );
    return () => {
      clearInterval(interval);
    }
  }, [walletAddress]);

  const prices = data?.result?.prices || [];
  const pools = data?.result?.pools || [];

  const nowAll = data?.result?.now || [];
  const total = data?.result?.total || [];
  const now = total[total.length - 1];

  const [start] = total;
  const max = maxBy(total, "total");
  const min = minBy(total, "rewards");

  const poolsWithHoldings = pools
    .map((pool) => ({
      ...pool,
      holdings: prices.filter(
        ({ pid, farm }) => pid === pool.pid && farm === pool.farm
      ),
      now: nowAll.find(
        ({ pid, farm }) => pid === pool.pid && farm === pool.farm
      ),
    }))
    .sort((a, b) => b.now.stakedInUsd - a.now.stakedInUsd);

  return {
    prices,
    pools: poolsWithHoldings,
    total,
    start,
    now,
    max,
    min,
    nowAll,
    fetching,
    error,
  };
}
