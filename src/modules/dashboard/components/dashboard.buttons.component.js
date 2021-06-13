import React from "react";
import cx from "classnames";
import { FiColumns } from "react-icons/fi";

const buttons = [
  ["stakedInUsd", "Staked in USD"],
  ["staked", "Staked in Token"],
  ["autoRewards", "$AUTO rewards"],
  ["autoRewardsInUsd", "$AUTO rewards in USD"],
  ["tvl", "TVL"],
  ["apy", "APY"],
  ["priceInUsd", "Price"],
];

export function DashboardButtonsComponent({
  dataKey,
  setDataKey,
  layout,
  setLayout,
  poolsCount,
}) {
  return (
    <div className="flex  mt-12">
      <div className="flex flex-wrap">
        {buttons.map(([key, label]) => (
          <div
            key={key}
            onClick={() => setDataKey(key)}
            className={cx("dark:bg-black bg-white mr-2 lg:mr-1 mb-2", {
              ["opacity-50"]: key !== dataKey,
            })}
          >
            <div className="btn-tertiary text-xs px-2 py-1 select-none">
              {label}
            </div>
          </div>
        ))}
      </div>
      {poolsCount > 3 && (
        <div className="ml-auto hidden lg:block">
          <div
            className={cx("dark:bg-black bg-white", {
              ["opacity-50"]: layout === "col",
            })}
            onClick={() => setLayout(layout === "full" ? "col" : "full")}
          >
            <div className="btn-tertiary px-2 py-1 select-none">
              <FiColumns />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
