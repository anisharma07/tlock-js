import { unpaddedBase64, unpaddedBase64Buffer, chunked, sliceUntil } from '../../src/age/utils';
import { Buffer } from 'buffer';

describe('age/utils', () => {
    describe('unpaddedBase64', () => {
        it('should encode string to unpadded base64', () => {
            const input = 'hello world';
            const result = unpaddedBase64(input);
            const expected = Buffer.from(input).toString('base64').replace(/=+$/, '');
            
            expect(result).toBe(expected);
            expect(result).not.toContain('=');
        });

        it('should encode Uint8Array to unpadded base64', () => {
            const input = new Uint8Array([72, 101, 108, 108, 111]); // 'Hello'
            const result = unpaddedBase64(input);
            
            expect(result).toBe('SGVsbG8');
            expect(result).not.toContain('=');
        });

        it('should handle empty input', () => {
            const result = unpaddedBase64('');
            expect(result).toBe('');
        });

        it('should handle input that normally requires padding', () => {
            const inputs = ['a', 'ab', 'abc', 'abcd'];
            
            inputs.forEach(input => {
                const result = unpaddedBase64(input);
                expect(result).not.toContain('=');
                expect(result.length).toBeGreaterThan(0);
            });
        });

        it('should handle binary data', () => {
            const binaryData = new Uint8Array([0, 255, 128, 64, 32]);
            const result = unpaddedBase64(binaryData);
            
            expect(result).toBe('AP+AUCA');
            expect(result).not.toContain('=');
        });

        it('should handle unicode characters', () => {
            const unicodeString = '你好世界🌍';
            const result = unpaddedBase64(unicodeString);
            
            expect(result).not.toContain('=');
            expect(result.length).toBeGreaterThan(0);
        });
    });

    describe('unpaddedBase64Buffer', () => {
        it('should return Buffer from unpadded base64', () => {
            const input = 'hello';
            const result = unpaddedBase64Buffer(input);
            
            expect(Buffer.isBuffer(result)).toBe(true);
            expect(result.toString()).toBe(Buffer.from(unpaddedBase64(input), 'base64').toString());
        });

        it('should handle Uint8Array input', () => {
            const input = new Uint8Array([1, 2, 3, 4, 5]);
            const result = unpaddedBase64Buffer(input);
            
            expect(Buffer.isBuffer(result)).toBe(true);
        });

        it('should roundtrip correctly', () => {
            const originalData = 'test data for roundtrip';
            const buffer = unpaddedBase64Buffer(originalData);
            const decoded = Buffer.from(unpaddedBase64(originalData), 'base64').toString();
            
            expect(buffer.toString()).toBe(decoded);
        });
    });

    describe('chunked', () => {
        it('should chunk string into specified sizes', () => {
            const input = 'hello world';
            const result = chunked(input, 2);
            
            expect(result).toEqual(['he', 'll', 'o ', 'wo', 'rl', 'd']);
        });

        it('should add suffix to each chunk', () => {
            const input = 'hello world';
            const result = chunked(input, 2, '.');
            
            expect(result).toEqual(['he.', 'll.', 'o .', 'wo.', 'rl.', 'd.']);
        });

        it('should handle input shorter than chunk size', () => {
            const input = 'hi';
            const result = chunked(input, 5);
            
            expect(result).toEqual(['hi']);
        });

        it('should handle empty input', () => {
            const result = chunked('', 3);
            expect(result).toEqual(['']);
        });

        it('should handle single character chunks', () => {
            const input = 'abc';
            const result = chunked(input, 1);
            
            expect(result).toEqual(['a', 'b', 'c']);
        });

        it('should handle exact chunk size divisions', () => {
            const input = 'abcdef';
            const result = chunked(input, 3);
            
            expect(result).toEqual(['abc', 'def']);
        });

        it('should handle chunk size of 0', () => {
            const input = 'test';
            const result = chunked(input, 0);
            
            // This should handle edge case appropriately
            expect(result).toBeDefined();
        });

        it('should work with different suffixes', () => {
            const input = 'test';
            const result = chunked(input, 2, '\n');
            
            expect(result).toEqual(['te\n', 'st\n']);
        });
    });

    describe('sliceUntil', () => {
        it('should slice until first occurrence of search term', () => {
            const input = 'hello world';
            const result = sliceUntil(input, 'll');
            
            expect(result).toBe('hell');
        });

        it('should return whole string if search term not found', () => {
            const input = 'hello world';
            const result = sliceUntil(input, 'xyz');
            
            expect(result).toBe(input);
        });

        it('should handle search term at beginning', () => {
            const input = 'hello world';
            const result = sliceUntil(input, 'he');
            
            expect(result).toBe('he');
        });

        it('should handle search term at end', () => {
            const input = 'hello world';
            const result = sliceUntil(input, 'ld');
            
            expect(result).toBe('hello world');
        });

        it('should handle single character search', () => {
            const input = 'abcdef';
            const result = sliceUntil(input, 'c');
            
            expect(result).toBe('abc');
        });

        it('should handle repeated characters correctly', () => {
            const input = 'aabbcc';
            const result = sliceUntil(input, 'bb');
            
            expect(result).toBe('aabb');
        });

        it('should handle overlapping patterns', () => {
            const input = 'abababab';
            const result = sliceUntil(input, 'aba');
            
            expect(result).toBe('aba');
        });

        it('should handle partial matches correctly', () => {
            const input = 'abcabc';
            const result = sliceUntil(input, 'abc');
            
            expect(result).toBe('abc');
        });

        it('should handle empty search term', () => {
            const input = 'test';
            const result = sliceUntil(input, '');
            
            expect(result).toBe('');
        });

        it('should handle empty input string', () => {
            const result = sliceUntil('', 'test');
            expect(result).toBe('');
        });

        it('should reset pattern matching correctly', () => {
            const input = 'ababcab';
            const result = sliceUntil(input, 'abc');
            
            expect(result).toBe('ababc');
        });
    });
});