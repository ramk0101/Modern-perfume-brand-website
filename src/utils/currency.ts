import { Currency } from "../types";

export const CURRENCY_CONFIG = {
  USD: { symbol: "$", rate: 1.0, label: "USD ($)" },
  EUR: { symbol: "€", rate: 0.92, label: "EUR (€)" },
  GBP: { symbol: "£", rate: 0.78, label: "GBP (£)" },
};

/**
 * Converts a base price in USD to the target currency and rounds it to the nearest integer.
 */
export function convertPrice(priceInUSD: number, currency: Currency): number {
  const config = CURRENCY_CONFIG[currency];
  return Math.round(priceInUSD * config.rate);
}

/**
 * Returns a fully formatted price string (e.g., "$185", "€170", "£144").
 */
export function formatPrice(priceInUSD: number, currency: Currency): string {
  const symbol = CURRENCY_CONFIG[currency].symbol;
  const converted = convertPrice(priceInUSD, currency);
  return `${symbol}${converted}`;
}
