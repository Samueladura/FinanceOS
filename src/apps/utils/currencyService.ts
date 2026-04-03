const EXCHANGE_RATE_API = 'https://open.er-api.com/v6/latest';

export interface ExchangeRates {
  [currency: string]: number;
}

let cachedRates: ExchangeRates | null = null;
let lastFetchTime = 0;
let cachedBaseCurrency = '';
const CACHE_DURATION = 10 * 60 * 1000;

export async function fetchExchangeRates(baseCurrency: string = 'USD'): Promise<ExchangeRates> {
  const now = Date.now();
  if (cachedRates && cachedBaseCurrency === baseCurrency && now - lastFetchTime < CACHE_DURATION) {
    return cachedRates;
  }

  try {
    const response = await fetch(`${EXCHANGE_RATE_API}/${baseCurrency}`);
    if (!response.ok) throw new Error('Failed to fetch rates');
    const data = await response.json();
    cachedRates = data.rates as ExchangeRates;
    cachedBaseCurrency = baseCurrency;
    lastFetchTime = now;
    return cachedRates!;
  } catch {
    const fallbackRates: ExchangeRates = {
      USD: 1, EUR: 0.92, GBP: 0.79, NGN: 1500, JPY: 150,
      CAD: 1.36, AUD: 1.53, CHF: 0.88, INR: 83, BRL: 5.0, MXN: 17.0
    };
    return fallbackRates;
  }
}

export function convertAmount(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: ExchangeRates
): number {
  if (fromCurrency === toCurrency) return amount;
  if (!rates[fromCurrency] || !rates[toCurrency]) return amount;
  
  const inBaseCurrency = amount / rates[fromCurrency];
  return inBaseCurrency * rates[toCurrency];
}
