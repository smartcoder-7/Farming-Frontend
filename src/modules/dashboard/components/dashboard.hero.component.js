import React, { useState, useRef } from "react";
import dayjs from "dayjs";
import cx from "classnames";
import { throttle } from "throttle-debounce";
import { AiOutlineLoading } from "react-icons/ai";

import { usdFormatter } from "../utils/dashboard.formatter.utils";
import { toPercentage } from "../utils/dashboard.fns.utils";

import { DashboardChartComponent } from "./dashboard.chart.component";

const formatTime = (v) => dayjs(v).format("HH:mm DD-MM-YYYY");

export function DashboardHeroComponent({
  now,
  start,
  total,
  fetching,
  isStable,
}) {
  const dataKey = "total";

  const [displayed, setDisplayed] = useState();
  const { current: throttledSetDisplayed } = useRef(throttle(60, setDisplayed));

  const nowUsd = displayed?.[dataKey] ?? now?.total;
  const startUsd = start?.total;
  const positive = nowUsd - startUsd >= 0;
  const percentage = toPercentage({ now: nowUsd, start: startUsd });
  const isEqual = percentage === 0;

  return (
    <div className="text-center lg:pt-6">
      <p className="text-xs font-semibold leading-tight tracking-wider uppercase lg:text-sm">
        Holdings overview
      </p>
      <h1 className="text-3xl font-semibold tracking-wide lg:h-20 lg:text-6xl">
        <span className="relative">
          {usdFormatter.format(nowUsd)}
          {fetching && (
            <span className="absolute -right-20 top-6">
              <AiOutlineLoading className="animate-spin opacity-70 text-2xl" />
            </span>
          )}
        </span>
      </h1>
      <h2
        className={cx("text-lg lg:text-3xl tracking-wider", {
          ["text-green-500"]: !isEqual && positive,
          ["text-red-500"]: !isEqual && !positive,
        })}
      >
        {isEqual ? (
          <span className="opacity-0">=</span>
        ) : (
          <>
            <span>
              {positive ? "+" : "-"}
              {usdFormatter.format(Math.abs(nowUsd - startUsd))}
            </span>
            <span
              className={cx(
                "ml-2 font-semibold bg-opacity-10 lg:py-1 lg:px-2",
                {
                  ["bg-green-500"]: !isEqual && positive,
                  ["bg-red-500"]: !isEqual && !positive,
                }
              )}
            >
              {positive ? "+" : "-"}
              {percentage}%
            </span>
          </>
        )}
      </h2>
      <div className="-mt-6 overflow-hidden lg:-mt-6 rounded-3xl -mr-2 -ml-1">
        <DashboardChartComponent
          isStable={isStable}
          hideAxis={true}
          data={total}
          dataKey="total"
          height={260}
          onHover={({ value }) => {
            if (value?.[dataKey] !== displayed?.[dataKey]) {
              setTimeout(() => throttledSetDisplayed(value), 0);
            }
          }}
        />
      </div>
      <div className="text-center text-xs font-mono opacity-30 -mt-6">
        {displayed?.time ? (
          formatTime(displayed.time)
        ) : (
          <>
            {formatTime(start.time)} - {formatTime(now.time)}
          </>
        )}
      </div>
    </div>
  );
}
