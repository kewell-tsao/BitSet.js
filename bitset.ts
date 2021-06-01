/**
 * @license BitSet.js v5.1.1 2/1/2020
 * http://www.xarg.org/2014/03/javascript-bit-array/
 *
 * Copyright (c) 2020, Robert Eisele (robert@xarg.org)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 **/

/**
 * The number of bits of a word
 * @const
 * @type number
 */
const WORD_LENGTH: number = 32;

/**
 * The log base 2 of WORD_LENGTH
 * @const
 * @type number
 */
const WORD_LOG: number = 5;

/**
 * Calculates the number of set bits
 *
 * @param {number} v
 * @returns {number}
 */
function popCount(v: number): number {
  // Warren, H. (2009). Hacker`s Delight. New York, NY: Addison-Wesley
  v -= (v >>> 1) & 0x55555555;
  v = (v & 0x33333333) + ((v >>> 2) & 0x33333333);
  return (((v + (v >>> 4)) & 0xf0f0f0f) * 0x1010101) >>> 24;
}

/**
 * Divide a number in base two by B
 *
 * @param {number[]} arr
 * @param {number} B
 * @returns {number}
 */
function divide(arr: number[], B: number): number {
  let r = 0;

  for (let i = 0; i < arr.length; i++) {
    r *= 2;
    let d = ((arr[i] + r) / B) | 0;
    r = (arr[i] + r) % B;
    arr[i] = d;
  }
  return r;
}

/**
 * Parses the parameters and set variable P
 *
 * @param {Object} P
 * @param {string|BitSet|Array|Uint8Array|number=} val
 */
function parse(P: Object, val: (string | BitSet | Array<any> | Uint8Array | number) | undefined): boolean {
  if (val == null) {
    P['data'] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    P['_'] = 0;
    return true;
  }

  if (val instanceof BitSet) {
    P['data'] = val['data'];
    P['_'] = val['_'];
    return false;
  }

  switch (typeof val) {
    case 'number':
      P['data'] = [val | 0];
      P['_'] = 0;
      break;

    case 'string':
      let base = 2;
      let len = WORD_LENGTH;

      if (val.indexOf('0b') === 0) {
        val = val.substr(2);
      } else if (val.indexOf('0x') === 0) {
        val = val.substr(2);
        base = 16;
        len = 8;
      }

      P['data'] = [];
      P['_'] = 0;

      let a = val.length - len;
      let b = val.length;

      do {
        let num = parseInt(val.slice(a > 0 ? a : 0, b), base);

        if (isNaN(num)) {
          throw SyntaxError('Invalid param');
        }

        P['data'].push(num | 0);

        if (a <= 0) break;

        a -= len;
        b -= len;
      } while (1);

      break;

    default:
      P['data'] = [0];
      let data = P['data'];

      if (val instanceof Array) {
        for (let i = val.length - 1; i >= 0; i--) {
          let ndx = val[i];

          if (ndx === Infinity) {
            P['_'] = -1;
          } else {
            scale(P, ndx);
            data[ndx >>> WORD_LOG] |= 1 << ndx;
          }
        }
        break;
      }

      if (Uint8Array && val instanceof Uint8Array) {
        let bits = 8;

        scale(P, val.length * bits);

        for (let i = 0; i < val.length; i++) {
          let n = val[i];

          for (let j = 0; j < bits; j++) {
            let k = i * bits + j;

            data[k >>> WORD_LOG] |= ((n >> j) & 1) << k;
          }
        }
        break;
      }
      throw SyntaxError('Invalid param');
  }
  return true;
}

function scale(dst: BitSet | object, ndx: number) {
  let l = ndx >>> WORD_LOG;
  let d = dst['data'];
  let v = dst['_'];

  for (let i = d.length; l >= i; l--) {
    d.push(v);
  }
}

const P = {
  data: [], // Holds the actual bits in form of a 32bit integer array.
  _: 0, // Holds the MSB flag information to make indefinitely large bitsets inversion-proof
};

export interface ReadOnlyBitSet {
  /**
   * Creates the bitwise AND of two sets.
   *
   * Ex:
   * bs1 = new BitSet(10);
   * bs2 = new BitSet(10);
   *
   * res = bs1.and(bs2);
   *
   * @param {ReadOnlyBitSet} other A bitset object
   * @returns {BitSet} A new BitSet object, containing the bitwise AND of this and other
   */
  and(other: ReadOnlyBitSet): BitSet;

  /**
   * Creates the bitwise OR of two sets.
   *
   * Ex:
   * bs1 = new BitSet(10);
   * bs2 = new BitSet(10);
   *
   * res = bs1.or(bs2);
   *
   * @param {ReadOnlyBitSet} other A bitset object
   * @returns {BitSet} A new BitSet object, containing the bitwise OR of this and other
   */
  or(other: ReadOnlyBitSet): BitSet;

  /**
   * Creates the bitwise AND NOT (not confuse with NAND!) of two sets.
   *
   * Ex:
   * bs1 = new BitSet(10);
   * bs2 = new BitSet(10);
   *
   * res = bs1.notAnd(bs2);
   *
   * @param {ReadOnlyBitSet} other A bitset object
   * @returns {BitSet} A new BitSet object, containing the bitwise AND NOT of this and other
   */
  andNot(other: ReadOnlyBitSet): BitSet;

  /**
   * Creates the bitwise NOT of a set.
   *
   * Ex:
   * bs1 = new BitSet(10);
   *
   * res = bs1.not();
   *
   * @returns {BitSet} A new BitSet object, containing the bitwise NOT of this
   */
  not(): BitSet;

  /**
   * Creates the bitwise XOR of two sets.
   *
   * Ex:
   * bs1 = new BitSet(10);
   * bs2 = new BitSet(10);
   *
   * res = bs1.xor(bs2);
   *
   * @param {ReadOnlyBitSet} other A bitset object
   * @returns {BitSet} A new BitSet object, containing the bitwise XOR of this and other
   */
  xor(other: ReadOnlyBitSet): BitSet;

  /**
   * Compares two BitSet objects
   *
   * Ex:
   * bs1 = new BitSet(10);
   * bs2 = new BitSet(10);
   *
   * bs1.equals(bs2) ? 'yes' : 'no'
   *
   * @param {ReadOnlyBitSet} other A bitset object
   * @returns {boolean} Whether the two BitSets have the same bits set (valid for indefinite sets as well)
   */
  equals(other: ReadOnlyBitSet): boolean;

  /**
   * Clones the actual object
   *
   * Ex:
   * bs1 = new BitSet(10);
   *
   * bs2 = bs1.clone();
   *
   * @returns {ReadOnlyBitSet} A new BitSet object, containing a copy of the actual object
   */
  clone(): BitSet;

  /**
   * Check if the BitSet is empty, means all bits are unset
   *
   * Ex:
   * bs1 = new BitSet(10);
   *
   * bs1.isEmpty() ? 'yes' : 'no'
   *
   * @returns {boolean} Whether the bitset is empty
   */
  isEmpty(): boolean;

  /**
   * Overrides the toString method to get a binary representation of the BitSet
   *
   * @param {number=} base
   * @returns string A binary string
   */
  toString(base?: number): string;

  /**
   * Gets a list of set bits
   *
   * @returns {Array}
   */
  toArray(): Array<number>;

  /**
   * Calculates the number of bits set
   *
   * Ex:
   * bs1 = new BitSet(10);
   *
   * num = bs1.cardinality();
   *
   * @returns {number} The number of bits set
   */
  cardinality(): number;

  /**
   * Calculates the Most Significant Bit / log base two
   *
   * Ex:
   * bs1 = new BitSet(10);
   *
   * logbase2 = bs1.msb();
   *
   * truncatedTwo = Math.pow(2, logbase2); // May overflow!
   *
   * @returns {number} The index of the highest bit set
   */
  msb(): number;

  /**
   * Calculates the Least Significant Bit
   *
   * Ex:
   * bs1 = new BitSet(10);
   *
   * lsb = bs1.lsb();
   *
   * @returns {number} The index of the lowest bit set
   */
  lsb(): number;

  /**
   * Calculates the number of trailing zeros
   *
   * Ex:
   * bs1 = new BitSet(10);
   *
   * ntz = bs1.ntz();
   *
   * @returns {number} The index of the lowest bit set
   */
  ntz(): number;

  /**
   * Get a single bit flag of a certain bit position
   *
   * Ex:
   * bs1 = new BitSet();
   * isValid = bs1.get(12);
   *
   * @param {number} index the index to be fetched
   * @returns {number|null} The binary flag
   */
  get(index: number): number;

  /**
   * Gets an entire range as a new bitset object
   *
   * Ex:
   * bs1 = new BitSet();
   *
   * let res = bs1.slice(4, 8);
   *
   * @param {number=} fromIndex The start index of the range to be get
   * @param {number=} toIndex The end index of the range to be get
   * @returns {BitSet|null} A new smaller bitset object, containing the extracted range
   */
  slice(fromIndex?: number, toIndex?: number): BitSet;

  /**
   * Iterates over the set bits
   */
  [Symbol.iterator](): Iterator<number>;
}

export default class BitSet implements ReadOnlyBitSet {
  private data: number[] = [];
  private _: number = 0;

  /**
   * @constructor create a new BitSet
   * @param {String | number | BitSet | Array<number> | Uint8Array | ReadOnlyBitSet} input
   *
   * Strings
   *
   * - Binary strings "010101"
   * - Binary strings with prefix "0b100101"
   * - Hexadecimal strings with prefix "0xaffe"
   *
   * Arrays
   * - The values of the array are the indizes to be set to 1
   *
   * Uint8Array
   * - A binary representation in 8 bit form
   *
   * Number
   * - A binary value
   *
   * BitSet | ReadOnlyBitSet
   * - A BitSet object, which is cloned
   *
   */
  constructor(param: (string | BitSet | number) | undefined) {
    const newDate = parse(this, param);
    if (!newDate) this.data = this.data.slice();
  }

  /**
   * Set a single bit flag
   *
   * Ex:
   * bs1 = new BitSet(10);
   * bs1.set(3, 1);
   *
   * @param {number} index The index of the bit to be set
   * @param {number=} value Optional value that should be set on the index (0 or 1)
   * @returns {BitSet} this
   */
  set(ndx: number, value: number | undefined): BitSet {
    ndx |= 0;

    scale(this, ndx);

    if (value === undefined || value) {
      this.data[ndx >>> WORD_LOG] |= 1 << ndx;
    } else {
      this.data[ndx >>> WORD_LOG] &= ~(1 << ndx);
    }
    return this;
  }

  /**
   * Get a single bit flag of a certain bit position
   *
   * Ex:
   * bs1 = new BitSet();
   * isValid = bs1.get(12);
   *
   * @param {number} index the index to be fetched
   * @returns {number|null} The binary flag
   */
  get(ndx: number): number {
    ndx |= 0;

    let d = this.data;
    let n = ndx >>> WORD_LOG;

    if (n >= d.length) {
      return this._ & 1;
    }
    return (d[n] >>> ndx) & 1;
  }

  /**
   * Creates the bitwise NOT of a set.
   *
   * Ex:
   * bs1 = new BitSet(10);
   * res = bs1.not();
   *
   * @returns {BitSet} A new BitSet object, containing the bitwise NOT of this
   */
  not(): BitSet {
    // invert()

    let t = this['clone']();
    let d = t['data'];
    for (let i = 0; i < d.length; i++) {
      d[i] = ~d[i];
    }

    t['_'] = ~t['_'];

    return t;
  }

  /**
   * Creates the bitwise AND of two sets.
   *
   * Ex:
   * bs1 = new BitSet(10);
   * bs2 = new BitSet(10);
   * res = bs1.and(bs2);
   *
   * @param {ReadOnlyBitSet} other A bitset object
   * @returns {BitSet} A new BitSet object, containing the bitwise AND of this and other
   */
  and(value: BitSet): BitSet {
    // intersection

    parse(P, value);

    let T = this['clone']();
    let t = T['data'];
    let p = P['data'];

    let pl = p.length;
    let p_ = P['_'];
    let t_ = T['_'];

    // If this is infinite, we need all bits from P
    if (t_ !== 0) {
      scale(T, pl * WORD_LENGTH - 1);
    }

    let tl = t.length;
    let l = Math.min(pl, tl);
    let i = 0;

    for (; i < l; i++) {
      t[i] &= p[i];
    }

    for (; i < tl; i++) {
      t[i] &= p_;
    }

    T['_'] &= p_;

    return T;
  }

  /**
   * Creates the bitwise OR of two sets.
   *
   * Ex:
   * bs1 = new BitSet(10);
   * bs2 = new BitSet(10);
   * res = bs1.or(bs2);
   *
   * @param {ReadOnlyBitSet} other A bitset object
   * @returns {BitSet} A new BitSet object, containing the bitwise OR of this and other
   */
  or(val: BitSet): BitSet {
    // union

    parse(P, val);

    let t = this['clone']();
    let d = t['data'];
    let p = P['data'];

    let pl = p.length - 1;
    let tl = d.length - 1;

    let minLength = Math.min(tl, pl);

    // Append backwards, extend array only once
    for (let i = pl; i > minLength; i--) {
      d[i] = p[i];
    }

    for (let i = minLength; i >= 0; i--) {
      d[i] |= p[i];
    }

    t['_'] |= P['_'];

    return t;
  }

  /**
   * Creates the bitwise XOR of two sets.
   *
   * Ex:
   * bs1 = new BitSet(10);
   * bs2 = new BitSet(10);
   * res = bs1.xor(bs2);
   *
   * @param {ReadOnlyBitSet} other A bitset object
   * @returns {BitSet} A new BitSet object, containing the bitwise XOR of this and other
   */
  xor(val: BitSet): BitSet {
    // symmetric difference

    parse(P, val);

    let t = this['clone']();
    let d = t['data'];
    let p = P['data'];

    let t_ = t['_'];
    let p_ = P['_'];

    let i = 0;

    let tl = d.length - 1;
    let pl = p.length - 1;

    // Cut if tl > pl
    for (i = tl; i > pl; i--) {
      d[i] ^= p_;
    }

    // Cut if pl > tl
    for (i = pl; i > tl; i--) {
      d[i] = t_ ^ p[i];
    }

    // XOR the rest
    for (; i >= 0; i--) {
      d[i] ^= p[i];
    }

    // XOR infinity
    t['_'] ^= p_;

    return t;
  }

  /**
   * Creates the bitwise AND NOT (not confuse with NAND!) of two sets.
   *
   * Ex:
   * bs1 = new BitSet(10);
   * bs2 = new BitSet(10);
   * res = bs1.notAnd(bs2);
   *
   * @param {ReadOnlyBitSet} other A bitset object
   * @returns {BitSet} A new BitSet object, containing the bitwise AND NOT of this and other
   */
  andNot(val: BitSet): BitSet {
    // difference
    return this['and'](new BitSet(val)['flip']());
  }

  /**
   * Flip/Invert a range of bits by setting
   *
   * Ex:
   * bs1 = new BitSet();
   * bs1.flip(); // Flip entire set
   * bs1.flip(5); // Flip single bit
   * bs1.flip(3,10); // Flip a bit range
   *
   * @param {number=} fromIndex The start index of the range to be flipped
   * @param {number=} toIndex The end index of the range to be flipped
   * @returns {BitSet} this
   */
  flip(from: number | undefined = undefined, to: number | undefined = undefined): BitSet {
    if (from === undefined) {
      let d = this.data;
      for (let i = 0; i < d.length; i++) {
        d[i] = ~d[i];
      }

      this._ = ~this._;
    } else if (to === undefined) {
      scale(this, from);

      this.data[from >>> WORD_LOG] ^= 1 << from;
    } else if (0 <= from && from <= to) {
      scale(this, to);

      for (let i = from; i <= to; i++) {
        this.data[i >>> WORD_LOG] ^= 1 << i;
      }
    }
    return this;
  }

  /**
   * Clear a range of bits by setting it to 0
   *
   * Ex:
   * bs1 = new BitSet();
   * bs1.clear(); // Clear entire set
   * bs1.clear(5); // Clear single bit
   * bs1.clar(3,10); // Clear a bit range
   *
   * @param {number=} fromIndex The start index of the range to be cleared
   * @param {number=} toIndex The end index of the range to be cleared
   * @returns {BitSet} this
   */
  clear(from: number | undefined = undefined, to: number | undefined = undefined): BitSet {
    let data = this.data;

    if (from === undefined) {
      for (let i = data.length - 1; i >= 0; i--) {
        data[i] = 0;
      }
      this._ = 0;
    } else if (to === undefined) {
      from |= 0;

      scale(this, from);

      data[from >>> WORD_LOG] &= ~(1 << from);
    } else if (from <= to) {
      scale(this, to);

      for (let i = from; i <= to; i++) {
        data[i >>> WORD_LOG] &= ~(1 << i);
      }
    }
    return this;
  }

  /**
   * Gets an entire range as a new bitset object
   *
   * Ex:
   * bs1 = new BitSet();
   * var res = bs1.slice(4, 8);
   *
   * @param {number=} fromIndex The start index of the range to be get
   * @param {number=} toIndex The end index of the range to be get
   * @returns {BitSet|null} A new smaller bitset object, containing the extracted range
   */
  slice(from: number | undefined = undefined, to: number | undefined = undefined): BitSet {
    if (from === undefined) {
      return this['clone']();
    } else if (to === undefined) {
      to = this.data.length * WORD_LENGTH;

      let im = Object.create(BitSet.prototype);

      im['_'] = this._;
      im['data'] = [0];

      for (let i = from; i <= to; i++) {
        im['set'](i - from, this['get'](i));
      }
      return im;
    } else if (from <= to && 0 <= from) {
      let im = Object.create(BitSet.prototype);
      im['data'] = [0];

      for (let i = from; i <= to; i++) {
        im['set'](i - from, this['get'](i));
      }
      return im;
    }
    return null;
  }

  /**
   * Set a range of bits
   *
   * Ex:
   * bs1 = new BitSet();
   * bs1.setRange(10, 15, 1);
   *
   * @param {number} fromIndex The start index of the range to be set
   * @param {number} toIndex The end index of the range to be set
   * @param {number=} value Optional value that should be set on the index (0 or 1)
   * @returns {BitSet} this
   */
  setRange(from: number, to: number, value: number): BitSet {
    for (let i = from; i <= to; i++) {
      this['set'](i, value);
    }
    return this;
  }

  /**
   * Clones the actual object
   *
   * Ex:
   * bs1 = new BitSet(10);
   * bs2 = bs1.clone();
   *
   * @returns {ReadOnlyBitSet} A new BitSet object, containing a copy of the actual object
   */
  clone(): BitSet {
    const im = Object.create(BitSet.prototype);
    im['data'] = this.data.slice();
    im['_'] = this._;
    return im;
  }

  /**
   * Gets a list of set bits
   *
   * @returns {Array}
   */
  toArray(): number[] {
    let ret = [];
    let data = this.data;

    for (let i = data.length - 1; i >= 0; i--) {
      let num = data[i];

      while (num !== 0) {
        let t = 31 - Math.clz32(num);
        num ^= 1 << t;
        ret.unshift(i * WORD_LENGTH + t);
      }
    }

    if (this._ !== 0) ret.push(Infinity);

    return ret;
  }

  /**
   * Overrides the toString method to get a binary representation of the BitSet
   *
   * @param {number=} base
   * @returns string A binary string
   */
  toString(base: number | undefined = null): string {
    let data = this.data;

    if (!base) base = 2;

    // If base is power of two
    if ((base & (base - 1)) === 0 && base < 36) {
      let ret = '';
      let len = (2 + Math.log(4294967295 /*Math.pow(2, WORD_LENGTH)-1*/) / Math.log(base)) | 0;

      for (let i = data.length - 1; i >= 0; i--) {
        let cur = data[i];

        // Make the number unsigned
        if (cur < 0) cur += 4294967296 /*Math.pow(2, WORD_LENGTH)*/;

        let tmp = cur.toString(base);

        if (ret !== '') {
          // Fill small positive numbers with leading zeros. The +1 for array creation is added outside already
          ret += '0'.repeat(len - tmp.length - 1);
        }
        ret += tmp;
      }

      if (this._ === 0) {
        ret = ret.replace(/^0+/, '');

        if (ret === '') ret = '0';
        return ret;
      } else {
        // Pad the string with ones
        ret = '1111' + ret;
        return ret.replace(/^1+/, '...1111');
      }
    } else {
      if (2 > base || base > 36) throw SyntaxError('Invalid base');

      let ret: string[] = [];
      let arr: number[] = [];

      // Copy every single bit to a new array
      for (let i = data.length; i--; ) {
        for (let j = WORD_LENGTH; j--; ) {
          arr.push((data[i] >>> j) & 1);
        }
      }

      do {
        ret.unshift(divide(arr, base).toString(base));
      } while (
        !arr.every(function (x) {
          return x === 0;
        })
      );

      return ret.join('');
    }
  }

  /**
   * Check if the BitSet is empty, means all bits are unset
   *
   * Ex:
   * bs1 = new BitSet(10);
   * bs1.isEmpty() ? 'yes' : 'no'
   *
   * @returns {boolean} Whether the bitset is empty
   */
  isEmpty(): boolean {
    if (this._ !== 0) return false;

    let d = this.data;

    for (let i = d.length - 1; i >= 0; i--) {
      if (d[i] !== 0) return false;
    }
    return true;
  }

  /**
   * Calculates the number of bits set
   *
   * Ex:
   * bs1 = new BitSet(10);
   * num = bs1.cardinality();
   *
   * @returns {number} The number of bits set
   */
  cardinality(): number {
    if (this._ !== 0) {
      return Infinity;
    }

    let s = 0;
    let d = this.data;
    for (let i = 0; i < d.length; i++) {
      let n = d[i];
      if (n !== 0) s += popCount(n);
    }
    return s;
  }

  /**
   * Calculates the Most Significant Bit / log base two
   *
   * Ex:
   * bs1 = new BitSet(10);
   * logbase2 = bs1.msb();
   * truncatedTwo = Math.pow(2, logbase2); // May overflow!
   *
   * @returns {number} The index of the highest bit set
   */
  msb(): number {
    if (this._ !== 0) {
      return Infinity;
    }

    let data = this.data;

    for (let i = data.length; i-- > 0; ) {
      let c = Math.clz32(data[i]);

      if (c !== WORD_LENGTH) {
        return i * WORD_LENGTH + WORD_LENGTH - 1 - c;
      }
    }
    return Infinity;
  }

  /**
   * Calculates the number of trailing zeros
   *
   * Ex:
   * bs1 = new BitSet(10);
   * ntz = bs1.ntz();
   *
   * @returns {number} The index of the lowest bit set
   */
  ntz(): number {
    let data = this.data;

    for (let j = 0; j < data.length; j++) {
      let v = data[j];

      if (v !== 0) {
        v = (v ^ (v - 1)) >>> 1; // Set v's trailing 0s to 1s and zero rest

        return j * WORD_LENGTH + popCount(v);
      }
    }
    return Infinity;
  }

  /**
   * Calculates the Least Significant Bit
   *
   * Ex:
   * bs1 = new BitSet(10);
   * lsb = bs1.lsb();
   *
   * @returns {number} The index of the lowest bit set
   */
  lsb(): number {
    let data = this.data;

    for (let i = 0; i < data.length; i++) {
      let v = data[i];
      let c = 0;

      if (v) {
        let bit = v & -v;

        for (; (bit >>>= 1); c++) {}
        return WORD_LENGTH * i + c;
      }
    }
    return this._ & 1;
  }

  /**
   * Compares two BitSet objects
   *
   * Ex:
   * bs1 = new BitSet(10);
   * bs2 = new BitSet(10);
   * bs1.equals(bs2) ? 'yes' : 'no'
   *
   * @param {ReadOnlyBitSet} other A bitset object
   * @returns {boolean} Whether the two BitSets have the same bits set (valid for indefinite sets as well)
   */
  equals(val: BitSet): boolean {
    parse(P, val);

    let t = this.data;
    let p = P['data'];

    let t_ = this._;
    let p_ = P['_'];

    let tl = t.length - 1;
    let pl = p.length - 1;

    if (p_ !== t_) {
      return false;
    }

    let minLength = tl < pl ? tl : pl;
    let i = 0;

    for (; i <= minLength; i++) {
      if (t[i] !== p[i]) return false;
    }

    for (i = tl; i > pl; i--) {
      if (t[i] !== p_) return false;
    }

    for (i = pl; i > tl; i--) {
      if (p[i] !== t_) return false;
    }
    return true;
  }

  /**
   * Iterates over the set bits
   */
  [Symbol.iterator](): Iterator<number> {
    let d = this.data;
    let ndx = 0;

    if (this._ === 0) {
      // Find highest index with something meaningful
      let highest = 0;
      for (let i = d.length - 1; i >= 0; i--) {
        if (d[i] !== 0) {
          highest = i;
          break;
        }
      }

      return {
        next: function () {
          let n = ndx >>> WORD_LOG;

          return {
            done: n > highest || (n === highest && d[n] >>> ndx === 0),
            value: n > highest ? 0 : (d[n] >>> ndx++) & 1,
          };
        },
      };
    } else {
      // Endless iterator!
      return {
        next: function () {
          let n = ndx >>> WORD_LOG;

          return {
            done: false,
            value: n < d.length ? (d[n] >>> ndx++) & 1 : 1,
          };
        },
      };
    }
  }

  static fromBinaryString(str: string): BitSet {
    return new BitSet('0b' + str);
  }

  static fromHexString(str: string): BitSet {
    return new BitSet('0x' + str);
  }

  static Random(n: number | undefined = null): BitSet {
    if (n === undefined || n < 0) {
      n = WORD_LENGTH;
    }

    let m = n % WORD_LENGTH;

    // Create an array, large enough to hold the random bits
    let t = [];
    let len = Math.ceil(n / WORD_LENGTH);

    // Create an bitset instance
    let s = Object.create(BitSet.prototype);

    // Fill the vector with random data, uniformly distributed
    for (let i = 0; i < len; i++) {
      t.push((Math.random() * 4294967296) | 0);
    }

    // Mask out unwanted bits
    if (m > 0) {
      t[len - 1] &= (1 << m) - 1;
    }

    s['data'] = t;
    s['_'] = 0;
    return s;
  }
}
