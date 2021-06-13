import React, { useState, useRef } from "react";
import cx from "classnames";
import { throttle } from "throttle-debounce";

import { getTokensFromPoolName, toPercentage } from "../utils/dashboard.fns.utils";
import { formatter } from "../utils/dashboard.formatter.utils";
import { poolsImages } from "../../../constants/pools-images";

import { DashboardChartComponent } from "./dashboard.chart.component";

const poolDataKeys = ["apy", "tvl", "priceInUsd"];

export function DashboardPoolComponent({
  pool,
  dataKey,
  displayFiat,
  toggleFiat,
}) {
  const [displayed, setDisplayed] = useState();
  const { current: throttledSetDisplayed } = useRef(throttle(60, setDisplayed));

  const data = poolDataKeys.includes(dataKey) ? pool.prices : pool.holdings;

  const now = displayed?.[dataKey] ?? data[data.length - 1][dataKey];
  const start = data[0][dataKey];
  const diff = now - start;
  const positive = diff >= 0;

  const percentage = toPercentage({ now, start });
  const isEqual = percentage === 0;

  const tokens = getTokensFromPoolName(pool.name);
  const isStable = tokens.every(t => t.toLowerCase().includes('usd'));

  const tokensImages = tokens
    .map((t) => poolsImages[t])
    .filter((t) => t !== undefined);

  return (
    <div className="pt-4 px-4 bg-blue-500 bg-opacity-10 mb-2">
      <div className="flex flex-col lg:flex-row lg:items-center">
        <div className="flex items-center">
          <div className="mr-3 flex flex-shrink-00">
            {tokensImages.map((t, idx) => (
              <img
                key={idx}
                src={t.url}
                className={cx(
                  t.rounded && "rounded-full shadow-sm",
                  t.bg && `bg-${t.bg}`,
                  t.darkBg,
                  t.margin && `p-${t.margin}`,
                  idx > 0 && "-ml-3",
                  "w-3 h-3 sm:w-5 sm:h-5"
                )}
              />
            ))}
          </div>
          <h2 className="font-bold">{pool.name}</h2>
        </div>
        <div
          className="lg:ml-auto flex font-mono items-center cursor-pointer select-none"
          onClick={toggleFiat}
        >
          <div
            className={cx("text-sm order-2 lg:order-1", {
              ["text-blue-500"]: isEqual,
              ["text-green-500"]: !isEqual && positive,
              ["text-red-500"]: !isEqual && !positive,
            })}
          >
            {isEqual ? (
              <span>=</span>
            ) : (
              <span>
                {positive ? "+" : "-"}
                {displayFiat && dataKey !== "apy"
                  ? formatter(Math.abs(diff), dataKey)
                  : `${percentage}%`}
              </span>
            )}
          </div>
          <div className="mr-2 lg:mr-0 lg:ml-2 font-medium order-1 lg:order-2">
            {formatter(now, dataKey)}
          </div>
        </div>
      </div>
      <div className="-mr-8 -ml-3 lg:-mr-6 lg:-ml-2">
        <DashboardChartComponent
          height={120}
          dataKey={dataKey}
          data={data.slice()}
          hideLabels={true}
          isStable={isStable}
          onHover={({ value }) => {
            if (value !== displayed) {
              setTimeout(() => throttledSetDisplayed(value), 0);
            }
          }}
        />
      </div>
    </div>
  );
}
