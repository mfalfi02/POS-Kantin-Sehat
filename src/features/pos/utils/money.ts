export function decimalToCents(value: string): bigint {
  const [whole, fraction = ""] = value.split(".");
  return BigInt(whole || "0") * BigInt(100) + BigInt((fraction + "00").slice(0, 2));
}

export function centsToDecimal(value: bigint): string {
  const whole = value / BigInt(100);
  const fraction = (value % BigInt(100)).toString().padStart(2, "0");
  return `${whole}.${fraction}`;
}

export function formatCents(value: bigint): string {
  const whole = value / BigInt(100);
  const fraction = value % BigInt(100);
  const grouped = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(Number(whole));
  return `Rp${grouped}${fraction === BigInt(0) ? "" : `,${fraction.toString().padStart(2, "0")}`}`;
}
