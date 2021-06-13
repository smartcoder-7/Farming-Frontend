import React, { useState } from "react";
import cx from "classnames";
import { GoAlert } from "react-icons/go";
import { AiOutlineLoading } from "react-icons/ai";

import { useDashboardPrices } from "../utils/dashboard.use-prices.utils";
import { useUpdateLastConnect } from "../utils/dashboard.update-last-connect.utils";
import { DashboardButtonsComponent } from "./dashboard.buttons.component";

import { DashboardHeroComponent } from "./dashboard.hero.component";
import { DashboardPoolComponent } from "./dashboard.pool.component";
import { getTokensFromPoolName } from "../utils/dashboard.fns.utils";

export function DashboardTrackedComponent({ walletAddress }) {
  const [dataKey, setDataKey] = useState("stakedInUsd");
  const [layout, setLayout] = useState("col");
  const [displayFiat, setDisplayFiat] = useState(false);

  const data = useDashboardPrices(walletAddress);
  const pools = data?.pools?.filter((pool) => pool.now.stakedInUsd > 5) || [];

  useUpdateLastConnect(walletAddress);

  const isOnlyStable = pools.every((pool) =>
    getTokensFromPoolName(pool.name).every((t) =>
      t.toLowerCase().includes("usd")
    )
  );

  if ((data.fetching && !data?.total?.length) || !data?.total?.length) {
    return (
      <>
        <div className="flex justify-center mt-24">
          <AiOutlineLoading className="animate-spin opacity-70 text-5xl" />
        </div>
        {data?.error?.message && (
          <div className="relative px-6 py-4 mb-4 text-white bg-red-500 border-0 rounded mt-4">
            <span className="inline-block mr-5 text-xl align-middle">
              <GoAlert />
            </span>
            <span className="inline-block mr-8 align-middle">
              <pre className="text-sm p-2 overflow-auto">
                {data?.error?.message}
              </pre>
            </span>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="px-2 lg:px-0">
      <DashboardHeroComponent {...data} isStable={isOnlyStable} />
      <DashboardButtonsComponent
        dataKey={dataKey}
        setDataKey={setDataKey}
        layout={layout}
        setLayout={setLayout}
        poolsCount={pools?.length}
      />
      <div className="flex flex-wrap -mx-1">
        {pools.map((pool, idx) => (
          <div
            key={pool.farm + pool.pid}
            className={cx(
              "px-1",
              layout === "col" &&
                pools.length > 3 &&
                !(idx === pools.length - 1 && pools.length % 2)
                ? "lg:w-1/2 w-full"
                : "w-full"
            )}
          >
            <DashboardPoolComponent
              pool={pool}
              dataKey={dataKey}
              displayFiat={displayFiat}
              toggleFiat={() => setDisplayFiat(!displayFiat)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
