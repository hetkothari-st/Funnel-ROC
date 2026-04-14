let contractsCache = null;

export async function loadContracts() {
  if (contractsCache) return contractsCache;
  const res = await fetch('/contracts_nsefo.json');
  contractsCache = await res.json();
  return contractsCache;
}

export function getAvailableExpiries(contracts, index) {
  const searchIndex = index === 'SENSEX' ? 'BSX' : index;
  const filtered = contracts.filter((c) => c.s === searchIndex);
  const expiries = [...new Set(filtered.map((c) => c.e))].sort();
  const today = new Date().toISOString().split('T')[0];
  return expiries.filter((e) => e >= today);
}

export function getAvailableStrikes(contracts, index, expiry) {
  const searchIndex = index === 'SENSEX' ? 'BSX' : index;
  const filtered = contracts.filter(
    (c) => c.s === searchIndex && c.e === expiry
  );
  const strikes = [...new Set(filtered.map((c) => Number(c.st)))].sort(
    (a, b) => a - b
  );
  return strikes;
}

export function findContract(contracts, index, strike, type, expiry) {
  const searchIndex = index === 'SENSEX' ? 'BSX' : index;
  const strikeVal = Number(strike).toFixed(5);
  return contracts.find(
    (c) =>
      c.s === searchIndex &&
      Number(c.st).toFixed(5) === strikeVal &&
      c.p === type &&
      c.e === expiry
  );
}

export function getStrikeStep(index) {
  if (index === 'BANKNIFTY' || index === 'SENSEX') return 100;
  return 50;
}

export const INDEX_SPOT_MAP = {
  NIFTY: { tokenId: '26000', step: 50 },
  BANKNIFTY: { tokenId: '26009', step: 100 },
  FINNIFTY: { tokenId: '26000', step: 50 },
  SENSEX: { tokenId: '1', step: 100 },
};
