export function isTouchDevice() {
  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0
  );
}

function calcPercent(now, start) {
  // decrease
  if (now < start) {
    const decrease = start - now;
    const percent = (decrease / start) * 100;
    return percent;
  }

  const increase = now - start;
  const percent = (increase / start) * 100;
  return percent;
}

export function toPercentage({ now, start }) {
  if (Math.round(now * 10e4) / 10e4 === 0) return 0;
  const percent = Math.abs(calcPercent(now, start));
  if (percent === Infinity) return 100;
  return abbreviateNumber(Math.round(percent * 100) / 100);
}

export function abbreviateNumber(n) {
  if (n < 1e3) return n;
  if (n >= 1e3 && n < 1e6) return `${Number((n / 1e3).toFixed(1))}K`;
  if (n >= 1e6 && n < 1e9) return `${Number((n / 1e6).toFixed(1))}M`;
  if (n >= 1e9 && n < 1e12) return `${Number((n / 1e9).toFixed(1))}B`;
  if (n >= 1e12) return `${Number((n / 1e12).toFixed(1))}T`;
  return n;
}

export function maxBy(arr, k) {
  const results = arr.map((obj) => obj?.[k]);
  const min = Math.max(...results);
  return arr[results.indexOf(min)];
}

export function minBy(arr, k) {
  const results = arr.map((obj) => obj?.[k]);
  const min = Math.min(...results);
  return arr[results.indexOf(min)];
}

export function getTokensFromPoolName(poolName) {
  return poolName
    .replace(/ LP.*/, "")
    .replace(/^i/, "")
    .toLowerCase()
    .split("-");
}
