export function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatArea(sqm: number): string {
  if (sqm >= 1000000) {
    return `${(sqm / 1000000).toFixed(2)} km²`;
  }
  if (sqm >= 10000) {
    return `${(sqm / 10000).toFixed(2)} hectares`;
  }
  return `${sqm.toLocaleString()} m²`;
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    available: "success",
    pending: "warning",
    sold: "slate",
    disputed: "danger",
  };
  return colors[status] || "slate";
}

export function getStatusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}
