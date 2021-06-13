import React, { useState } from "react";
import cx from "classnames";
import { useMutation } from "urql";
import { GoAlert } from "react-icons/go";
import { AiOutlineLoading } from "react-icons/ai";

import { TRACK_WALLET } from "../dashboard.queries";

export function DashboardUntrackedComponent({ walletAddress, refetch }) {
  const [loading, setLoading] = useState(false);
  const [{ data }, trackWallet] = useMutation(TRACK_WALLET);

  const handleClick = async () => {
    setLoading(true);

    if (!loading) {
      try {
        await trackWallet({ walletAddress });
        await refetch({ requestPolicy: "network-only" });
      } catch (err) {
        console.error(err.message);
      }
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl">Welcome to your new dashboard</h1>
      <p className="mt-4">
        Hey, seems like you are new here!
        <br />
        This is a service we are providing for free to all $AUTO holders via{" "}
        <a
          className="underline"
          target="_default"
          href="https://www.farmfol.io"
        >
          ƒarmƒol.io
        </a>
        <br />
        It allows you to track the performance over time of your assets staked
        on autofarm.
        <br />
        When you stop using autofarm to stake your assets you will lose access
        to your dashboard.
      </p>
      <div className="dark:bg-black bg-white inline-block mt-4">
        <div
          className={cx("btn-tertiary", { ["cursor-not-allowed"]: loading })}
          onClick={handleClick}
        >
          {loading ? (
            <div className="flex items-center opacity-70">
              <AiOutlineLoading className="animate-spin" />
              <span className="ml-3">Loading...</span>
            </div>
          ) : (
            <span>Start tracking</span>
          )}
        </div>
      </div>
      {data?.result?.success === false && (
        <div className="relative w-1/2 px-6 py-4 mb-4 text-white bg-red-500 border-0 rounded mt-4">
          <span className="inline-block mr-5 text-xl align-middle">
            <GoAlert />
          </span>
          <span className="inline-block mr-8 align-middle">
            <pre className="text-sm">{data?.result?.message}</pre>
          </span>
        </div>
      )}
    </div>
  );
}
