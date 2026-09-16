/**
 * Helpers de formato de moneda. La aritmetica real vive en el
 * value object Money del dominio; esto solo se encarga de presentacion.
 */
export function formatUsd(amountInCents: number): string {
  const value = amountInCents / 100;
  return `$${value.toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatBs(amountInCents: number): string {
  const value = amountInCents / 100;
  return `Bs. ${value.toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
