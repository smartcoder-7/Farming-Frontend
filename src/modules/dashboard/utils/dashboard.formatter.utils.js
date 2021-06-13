export const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const fiatDataKeys = [
  "stakedInUsd",
  "autoRewardsInUsd",
  "total",
  "priceInUsd",
  "tvl",
];

export function formatter(value, dataKey, trim) {
  const val = typeof value === "string" ? parseFloat(value) : value;

  if (dataKey === 'apy') {
    return `${Math.round(val * 100) / 100}%`;
  }

  if (fiatDataKeys.includes(dataKey)) {
    const fiat = usdFormatter.format(val);
    return !trim && dataKey !== 'tvl'
      ? fiat
      : fiat
          .replace(/\.\d\d/, "")
          .replace(/,\d+,\d+$/, "M")
          .replace(/,\d+$/, "K");
  }

  return (Math.round(val * 10e4) / 10e4).toString();
}
