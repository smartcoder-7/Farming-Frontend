import { gql } from "urql";

export const GET_WALLET = gql`
  query getWallet($walletAddress: String!) {
    wallet: wallets_by_pk(address: $walletAddress) {
      address
      created_at
    }
  }
`;

export const GET_HOLDINGS = gql`
  query getHoldings($walletAddress: String!) {
    result: getAutofarmHoldings(walletAddress: $walletAddress) {
      prices {
        pid
        farm
        staked
        stakedInUsd: staked_in_usd
        autoRewards: rewards
        autoRewardsInUsd: rewards_in_usd
        time
      }

      now {
        pid
        farm
        staked
        stakedInUsd: staked_in_usd
        autoRewards: rewards
        autoRewardsInUsd: rewards_in_usd
        time
      }

      pools {
        pid
        farm
        name
        prices {
          pid
          farm
          tvl
          apy
          priceInUsd: price_in_usd
          time: bucket
        }
      }

      total {
        total: staked_in_usd
        rewards: rewards_in_usd
        time
      }
    }
  }
`;

export const TRACK_WALLET = gql`
  mutation trackWallet($walletAddress: String!) {
    result: trackAutofarmWallet(walletAddress: $walletAddress) {
      success
      message
    }
  }
`;
