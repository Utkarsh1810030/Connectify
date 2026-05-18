// Masks a phone number for display: 9876543210 → ******3210
export const maskPhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  return `${'*'.repeat(digits.length - 4)}${digits.slice(-4)}`;
};

// Validates an Indian mobile number (10 digits, starts with 6-9)
export const isValidIndianPhone = (phone: string): boolean => {
  return /^[6-9]\d{9}$/.test(phone.replace(/^\+?91/, '').replace(/\s/g, ''));
};

// Normalizes phone to E.164 format: 9876543210 → +919876543210
export const normalizePhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('91') && digits.length === 12) return `+${digits}`;
  if (digits.length === 10) return `+91${digits}`;
  return `+${digits}`;
};
