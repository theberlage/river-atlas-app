export function formatNumber(number: number, maximumFractionDigits = 2) {
  return new Intl.NumberFormat('nl-NL', { maximumFractionDigits }).format(number)
}

