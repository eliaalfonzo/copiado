/**
 * Value Object Money.
 *
 * Todo el dinero en el dominio se representa internamente en CENTAVOS
 * (numero entero) para evitar los problemas de precision del punto
 * flotante de JavaScript (0.1 + 0.2 !== 0.3). Nunca se debe operar con
 * numeros decimales de dinero directamente fuera de esta clase.
 */
export class Money {
  private readonly cents: number;

  private constructor(cents: number) {
    if (!Number.isFinite(cents)) {
      throw new Error('Monto invalido');
    }
    this.cents = Math.round(cents);
  }

  static fromCents(cents: number): Money {
    return new Money(cents);
  }

  static fromDecimal(amount: number): Money {
    return new Money(Math.round(amount * 100));
  }

  static zero(): Money {
    return new Money(0);
  }

  get valueInCents(): number {
    return this.cents;
  }

  get valueInDecimal(): number {
    return this.cents / 100;
  }

  add(other: Money): Money {
    return new Money(this.cents + other.cents);
  }

  subtract(other: Money): Money {
    return new Money(this.cents - other.cents);
  }

  multiply(factor: number): Money {
    return new Money(Math.round(this.cents * factor));
  }

  isZero(): boolean {
    return this.cents === 0;
  }

  isNegative(): boolean {
    return this.cents < 0;
  }

  isGreaterThan(other: Money): boolean {
    return this.cents > other.cents;
  }

  /**
   * Convierte a bolivares usando la tasa dada (Bs. por 1 USD).
   * La tasa se recibe como numero decimal (ej: 107.5).
   */
  toBolivares(rate: number): Money {
    return new Money(Math.round(this.cents * rate));
  }

  formatUsd(): string {
    return `$${this.valueInDecimal.toLocaleString('es-VE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  formatBs(): string {
    return `Bs. ${this.valueInDecimal.toLocaleString('es-VE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
}
