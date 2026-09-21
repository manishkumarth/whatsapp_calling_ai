const toE164 = (phone) => {
  if (!phone) return null;
  const cleaned = phone.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) return cleaned;
  if (cleaned.length >= 10) return `+${cleaned}`;
  return null;
};

const isValidPhone = (phone) => {
  const e164 = toE164(phone);
  if (!e164) return false;
  return /^\+[1-9]\d{6,14}$/.test(e164);
};

module.exports = { toE164, isValidPhone };
