import React from "react";
import dayjs from "dayjs";
import { MdHourglassEmpty } from "react-icons/md";
import { niceScale } from "@aryth/nice-scale";

import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import { isTouchDevice, maxBy, minBy } from "../utils/dashboard.fns.utils";
import { formatter } from "../utils/dashboard.formatter.utils";

const calcX = (x, idx, dataLength) => {
  if (idx === 0) return x + 5;
  if (idx === dataLength - 1) return x - 50;
  if (idx > dataLength - 6) return x - 20;
  return x;
};

const calcTextAnchor = (idx, dataLength) => {
  if (idx < 5) return "left";
  if (idx > dataLength - 6) return "right";
  return "middle";
};

export function DashboardChartComponent({
  data,
  dataKey,
  height,
  hideAxis,
  hideLabels,
  onHover,
  isStable,
}) {
  if (data.length < 5) {
    return (
      <p className="flex flex-col items-center justify-center py-10 text-sm text-white text-opacity-50">
        <MdHourglassEmpty size={36} className="mb-4" />
        <span>Chart not available yet, come back in a few minutes.</span>
        <span>
          We need at least half an hour of data to display your daily chart.
        </span>
      </p>
    );
  }

  let max = maxBy(data, dataKey)?.[dataKey];
  let min = minBy(data, dataKey)?.[dataKey];

  if (
    isStable &&
    (dataKey === "stakedInUsd" ||
      dataKey === "priceInUsd" ||
      dataKey === "total")
  ) {
    max = max + max * 0.1;
    min = min - min * 0.1;
  }

  const ticks = niceScale.call({ ticks: 5 }, { min, max });
  const stepSize = ticks[1] - ticks[0];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data}>
        <defs>
          <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#4DAEFE" stopOpacity={0.15} />
            <stop offset="100%" stopColor="#15182F" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        {onHover && !isTouchDevice() && (
          <Tooltip
            cursor={false}
            animationDuration={200}
            content={({ payload, label }) => {
              onHover({ value: payload?.[0]?.payload, label });
              return null;
            }}
          />
        )}
        <Area
          animationDuration={200}
          fillOpacity={1}
          fill="url(#colorUv)"
          dataKey={dataKey}
          stroke="#4DAEFE"
          strokeWidth={2}
          label={({ x, y, value, index }) => {
            if (
              hideLabels ||
              data.findIndex((d) => d[dataKey] === value) !== index
            ) {
              return null;
            }

            if (value === max || value === min) {
              const computedX = calcX(x, index, data.length);
              const textAnchor = calcTextAnchor(index, data.length);

              return (
                <text
                  x={computedX}
                  y={y}
                  dy={value === max ? -10 : 18}
                  fill="#4DAEFE"
                  fontSize={10}
                  textAnchor={textAnchor}
                  fontWeight={600}
                >
                  {formatter(value, dataKey)}
                </text>
              );
            }

            return null;
          }}
        />
        <YAxis
          hide={hideAxis}
          fontSize="10"
          orientation="right"
          strokeWidth={0}
          domain={[ticks[0] - stepSize, ticks[ticks.length - 1] + stepSize]}
          ticks={ticks}
          tickFormatter={(value) => formatter(value, dataKey, true)}
        />
        <XAxis
          hide={hideAxis}
          dataKey="time"
          fontSize="10"
          strokeWidth={0}
          tickFormatter={(date) => dayjs(date).format("MM-DD HH:mm")}
        />
        {!hideAxis && (
          <CartesianGrid
            vertical={false}
            radius="1"
            strokeWidth="1"
            strokeDasharray="0 80 4 80"
            strokeOpacity={0.5}
            horizontalPoints={[20, 60]}
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
