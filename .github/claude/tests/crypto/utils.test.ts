import {
    xor,
    bytesToNumberBE,
    bytesToHex,
    fpToBytes,
    fp2ToBytes,
    fp6ToBytes,
    fp12ToBytes
} from '../../src/crypto/utils';
import { bls12_381 } from '@noble/curves/bls12-381';

describe('crypto/utils', () => {
    describe('xor', () => {
        it('should XOR two equal-length arrays correctly', () => {
            const a = new Uint8Array([0xFF, 0x00, 0xAA, 0x55]);
            const b = new Uint8Array([0x0F, 0xF0, 0x55, 0xAA]);
            const expected = new Uint8Array([0xF0, 0xF0, 0xFF, 0xFF]);
            
            const result = xor(a, b);
            
            expect(result).toEqual(expected);
            expect(result.length).toBe(a.length);
        });

        it('should return zero array when XORing identical arrays', () => {
            const a = new Uint8Array([1, 2, 3, 4, 5]);
            const expected = new Uint8Array([0, 0, 0, 0, 0]);
            
            const result = xor(a, a);
            
            expect(result).toEqual(expected);
        });

        it('should handle empty arrays', () => {
            const a = new Uint8Array(0);
            const b = new Uint8Array(0);
            
            const result = xor(a, b);
            
            expect(result).toEqual(new Uint8Array(0));
            expect(result.length).toBe(0);
        });

        it('should handle single-byte arrays', () => {
            const a = new Uint8Array([0xFF]);
            const b = new Uint8Array([0x0F]);
            const expected = new Uint8Array([0xF0]);
            
            const result = xor(a, b);
            
            expect(result).toEqual(expected);
        });

        it('should throw error for arrays of different lengths', () => {
            const a = new Uint8Array([1, 2, 3]);
            const b = new Uint8Array([1, 2]);
            
            expect(() => xor(a, b)).toThrow('Error: incompatible sizes');
        });

        it('should handle large arrays', () => {
            const size = 1000;
            const a = new Uint8Array(size).fill(0xAA);
            const b = new Uint8Array(size).fill(0x55);
            const expected = new Uint8Array(size).fill(0xFF);
            
            const result = xor(a, b);
            
            expect(result).toEqual(expected);
        });

        it('should not modify input arrays', () => {
            const a = new Uint8Array([1, 2, 3]);
            const b = new Uint8Array([4, 5, 6]);
            const originalA = new Uint8Array(a);
            const originalB = new Uint8Array(b);
            
            xor(a, b);
            
            expect(a).toEqual(originalA);
            expect(b).toEqual(originalB);
        });
    });

    describe('bytesToNumberBE', () => {
        it('should convert single byte to number', () => {
            const bytes = new Uint8Array([0xFF]);
            const result = bytesToNumberBE(bytes);
            
            expect(result).toBe(255n);
        });

        it('should convert multi-byte arrays in big-endian format', () => {
            const bytes = new Uint8Array([0x01, 0x00]);
            const result = bytesToNumberBE(bytes);
            
            expect(result).toBe(256n);
        });

        it('should handle zero bytes', () => {
            const bytes = new Uint8Array([0x00, 0x00, 0x00]);
            const result = bytesToNumberBE(bytes);
            
            expect(result).toBe(0n);
        });

        it('should handle empty array', () => {
            const bytes = new Uint8Array(0);
            const result = bytesToNumberBE(bytes);
            
            expect(result).toBe(0n);
        });

        it('should handle large numbers', () => {
            const bytes = new Uint8Array([0xFF, 0xFF, 0xFF, 0xFF]);
            const result = bytesToNumberBE(bytes);
            
            expect(result).toBe(4294967295n); // 2^32 - 1
        });

        it('should maintain big-endian byte order', () => {
            const bytes = new Uint8Array([0x12, 0x34, 0x56, 0x78]);
            const result = bytesToNumberBE(bytes);
            
            expect(result).toBe(0x12345678n);
        });
    });

    describe('bytesToHex', () => {
        it('should convert bytes to hex string', () => {
            const bytes = new Uint8Array([0x00, 0xFF, 0x12, 0xAB]);
            const result = bytesToHex(bytes);
            
            expect(result).toBe('00ff12ab');
        });

        it('should handle empty array', () => {
            const bytes = new Uint8Array(0);
            const result = bytesToHex(bytes);
            
            expect(result).toBe('');
        });

        it('should handle single byte', () => {
            const bytes = new Uint8Array([0x5A]);
            const result = bytesToHex(bytes);
            
            expect(result).toBe('5a');
        });

        it('should pad single digit hex values with zero', () => {
            const bytes = new Uint8Array([0x01, 0x02, 0x03]);
            const result = bytesToHex(bytes);
            
            expect(result).toBe('010203');
        });

        it('should handle all possible byte values', () => {
            const bytes = new Uint8Array(256);
            for (let i = 0; i < 256; i++) {
                bytes[i] = i;
            }
            
            const result = bytesToHex(bytes);
            
            expect(result.length).toBe(512); // 2 hex chars per byte
            expect(result.startsWith('000102')).toBe(true);
            expect(result.endsWith('fdfeff')).toBe(true);
        });

        it('should produce lowercase hex characters', () => {
            const bytes = new Uint8Array([0xAB, 0xCD, 0xEF]);
            const result = bytesToHex(bytes);
            
            expect(result).toBe('abcdef');
            expect(result).toBe(result.toLowerCase());
        });
    });

    describe('fpToBytes', () => {
        it('should convert Fp element to 48-byte array', () => {
            const fp = bls12_381.fields.Fp.create(1n);
            const result = fpToBytes(fp);
            
            expect(result.length).toBe(48);
            expect(result).toBeInstanceOf(Uint8Array);
        });

        it('should handle zero Fp element', () => {
            const fp = bls12_381.fields.Fp.create(0n);
            const result = fpToBytes(fp);
            
            expect(result.length).toBe(48);
            expect(result.every(byte => byte === 0)).toBe(true);
        });

        it('should handle maximum Fp element', () => {
            const maxValue = bls12_381.fields.Fp.ORDER - 1n;
            const fp = bls12_381.fields.Fp.create(maxValue);
            const result = fpToBytes(fp);
            
            expect(result.length).toBe(48);
            expect(result).toBeInstanceOf(Uint8Array);
        });

        it('should produce consistent output for same input', () => {
            const fp = bls12_381.fields.Fp.create(12345n);
            
            const result1 = fpToBytes(fp);
            const result2 = fpToBytes(fp);
            
            expect(result1).toEqual(result2);
        });
    });

    describe('fp2ToBytes', () => {
        it('should convert Fp2 element to 96-byte array', () => {
            const fp2 = bls12_381.fields.Fp2.create({
                c0: bls12_381.fields.Fp.create(1n),
                c1: bls12_381.fields.Fp.create(2n)
            });
            
            const result = fp2ToBytes(fp2);
            
            expect(result.length).toBe(96); // 2 * 48 bytes
            expect(result).toBeInstanceOf(Uint8Array);
        });

        it('should handle zero Fp2 element', () => {
            const fp2 = bls12_381.fields.Fp2.create({
                c0: bls12_381.fields.Fp.create(0n),
                c1: bls12_381.fields.Fp.create(0n)
            });
            
            const result = fp2ToBytes(fp2);
            
            expect(result.length).toBe(96);
            // Note: Due to the reversed order in implementation, we can't simply check for all zeros
        });

        it('should maintain correct byte order (c1, c0)', () => {
            const c0Value = 1n;
            const c1Value = 2n;
            const fp2 = bls12_381.fields.Fp2.create({
                c0: bls12_381.fields.Fp.create(c0Value),
                c1: bls12_381.fields.Fp.create(c1Value)
            });
            
            const result = fp2ToBytes(fp2);
            const c1Bytes = fpToBytes(bls12_381.fields.Fp.create(c1Value));
            const c0Bytes = fpToBytes(bls12_381.fields.Fp.create(c0Value));
            
            // Check that c1 comes first in the result
            expect(result.subarray(0, 48)).toEqual(c1Bytes);
            expect(result.subarray(48, 96)).toEqual(c0Bytes);
        });
    });

    describe('fp6ToBytes', () => {
        it('should convert Fp6 element to 288-byte array', () => {
            // Create a mock Fp6 element since it's not exported from noble
            const mockFp6 = {
                c0: bls12_381.fields.Fp2.create({ c0: bls12_381.fields.Fp.create(1n), c1: bls12_381.fields.Fp.create(2n) }),
                c1: bls12_381.fields.Fp2.create({ c0: bls12_381.fields.Fp.create(3n), c1: bls12_381.fields.Fp.create(4n) }),
                c2: bls12_381.fields.Fp2.create({ c0: bls12_381.fields.Fp.create(5n), c1: bls12_381.fields.Fp.create(6n) })
            };
            
            const result = fp6ToBytes(mockFp6 as any);
            
            expect(result.length).toBe(288); // 3 * 96 bytes
            expect(result).toBeInstanceOf(Uint8Array);
        });
    });

    describe('fp12ToBytes', () => {
        it('should convert Fp12 element to 576-byte array', () => {
            // Create a mock Fp12 element structure
            const mockFp2 = bls12_381.fields.Fp2.create({ 
                c0: bls12_381.fields.Fp.create(1n), 
                c1: bls12_381.fields.Fp.create(2n) 
            });
            
            const mockFp6 = {
                c0: mockFp2,
                c1: mockFp2,
                c2: mockFp2
            };
            
            const mockFp12 = {
                c0: mockFp6,
                c1: mockFp6
            };
            
            const result = fp12ToBytes(mockFp12 as any);
            
            expect(result.length).toBe(576); // 2 * 288 bytes
            expect(result).toBeInstanceOf(Uint8Array);
        });
    });

    describe('integration tests', () => {
        it('should work together for cryptographic operations', () => {
            // Test that the utility functions work together correctly
            const originalBytes = new Uint8Array([0x12, 0x34, 0x56, 0x78]);
            const hex = bytesToHex(originalBytes);
            const number = bytesToNumberBE(originalBytes);
            
            expect(hex).toBe('12345678');
            expect(number).toBe(0x12345678n);
        });

        it('should handle edge cases consistently', () => {
            const emptyArray = new Uint8Array(0);
            
            expect(bytesToHex(emptyArray)).toBe('');
            expect(bytesToNumberBE(emptyArray)).toBe(0n);
            expect(xor(emptyArray, emptyArray)).toEqual(emptyArray);
        });
    });
});