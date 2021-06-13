import React from "react";
import { useQuery } from "urql";
import { useAtom } from "jotai";

import { getWeb3Atom } from "context/web3";

import { GET_WALLET } from "./dashboard.queries";
import { GraphQLContextProvider } from "./utils/dashboard.graphql.utils";

import { DashboardUntrackedComponent } from "./components/dashboard.untracked.component";
import { DashboardTrackedComponent } from "./components/dashboard.tracked.component";

function DashboardComponent() {
  const [{ address }] = useAtom(getWeb3Atom);
  const walletAddress = address && address.toLowerCase();

  const [{ data, fetching }, refetch] = useQuery({
    pause: !walletAddress,
    query: GET_WALLET,
    variables: { walletAddress },
  });

  if (!walletAddress) {
    return (
      <div>
        <h1 className="text-2xl text-center">Please connect your wallet...</h1>
      </div>
    );
  }

  if (walletAddress && data && data.wallet === null) {
    return (
      <DashboardUntrackedComponent
        walletAddress={walletAddress}
        refetch={refetch}
      />
    );
  }

  return (
    <>
      <DashboardTrackedComponent walletAddress={walletAddress} />
      <p className="text-center text-sm opacity-60">
        Wallet tracking and prices data provided by{" "}
        <a href="https://www.farmfol.io">ƒarmƒol.io</a>
      </p>
    </>
  );
}

export function DashboardModule() {
  return (
    <GraphQLContextProvider>
      <div className="max-w-5xl m-auto flex flex-col space-y-6 my-20">
        <DashboardComponent />
      </div>
    </GraphQLContextProvider>
  );
}
