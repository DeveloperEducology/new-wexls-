/**
 * Measurement Shared Utility Functions & SeededRandom Helper
 */

export class SeededRandom {
  constructor(seed) {
    this.seed = typeof seed === 'number' ? seed : parseInt(seed) || Date.now();
  }

  next() {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  int(min, max) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  float(min, max, decimals = 1) {
    const val = this.next() * (max - min) + min;
    return parseFloat(val.toFixed(decimals));
  }

  pick(arr) {
    return arr[this.int(0, arr.length - 1)];
  }

  shuffle(arr) {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = this.int(0, i);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

/**
 * Great Common Divisor (GCD)
 */
export function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

/**
 * Least Common Multiple (LCM)
 */
export function lcm(a, b) {
  return Math.abs(a * b) / gcd(a, b);
}

/**
 * Format standard fraction string (e.g. "3 1/2")
 */
export function formatFraction(whole, num, den) {
  if (num === 0) return whole.toString();
  const divisor = gcd(num, den);
  const sNum = num / divisor;
  const sDen = den / divisor;
  if (whole === 0) return `${sNum}/${sDen}`;
  return `${whole} ${sNum}/${sDen}`;
}
