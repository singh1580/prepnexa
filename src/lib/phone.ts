export function normalizeIndianMobile(value: string) {
  if (!/^[+\d\s()-]+$/.test(value)) return null;
  const digits = value.replace(/\D/g, "");
  const national = digits.length === 11 && digits.startsWith("0")
    ? digits.slice(1)
    : digits.length === 12 && digits.startsWith("91")
      ? digits.slice(2)
      : digits;

  return /^[6-9]\d{9}$/.test(national) ? `+91${national}` : null;
}
