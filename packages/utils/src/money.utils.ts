// All monetary values are stored/computed in INR (paisa-level precision via Decimal)

// Rounds to 2 decimal places to avoid floating point drift in billing
export const roundMoney = (amount: number): number =>
  Math.round(amount * 100) / 100;

// Calculates platform fee and provider earning from a session amount
export const splitAmount = (
  totalAmount: number,
  commissionRate: number,
): { platformFee: number; providerEarning: number } => {
  const platformFee = roundMoney(totalAmount * commissionRate);
  const providerEarning = roundMoney(totalAmount - platformFee);
  return { platformFee, providerEarning };
};

// Calculates the charge for a given number of seconds at a per-minute rate
export const calcSessionCharge = (
  durationSec: number,
  ratePerMin: number,
): number => roundMoney((durationSec / 60) * ratePerMin);
