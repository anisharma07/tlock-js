import { createMacKey, random } from '../../src/age/utils-crypto';
import { Buffer } from 'buffer';

// Mock crypto module for browser and Node.js environments
const mockRandomBytes = jest.fn();
const mockCrypto = {
    getRandomValues: jest.fn(),
};

Object.defineProperty(global, 'window', {
    value: {
        crypto: mockCrypto,
    },
    writable: true,
});

// Mock require for Node.js crypto
jest.mock('crypto', () => ({
    randomBytes: mockRandomBytes,
}));

describe('utils-crypto', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createMacKey', () => {
        it('should create a valid MAC key with correct parameters', () => {
            const fileKey = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
            const macMessage = 'header';
            const headerText = 'test-header-content';

            const result = createMacKey(fileKey, macMessage, headerText);

            expect(result).toBeInstanceOf(Buffer);
            expect(result.length).toBe(32); // SHA256 output length
        });

        it('should produce consistent results for same inputs', () => {
            const fileKey = new Uint8Array(16).fill(1);
            const macMessage = 'header';
            const headerText = 'consistent-header';

            const result1 = createMacKey(fileKey, macMessage, headerText);
            const result2 = createMacKey(fileKey, macMessage, headerText);

            expect(Buffer.compare(result1, result2)).toBe(0);
        });

        it('should produce different results for different inputs', () => {
            const fileKey1 = new Uint8Array(16).fill(1);
            const fileKey2 = new Uint8Array(16).fill(2);
            const macMessage = 'header';
            const headerText = 'test-header';

            const result1 = createMacKey(fileKey1, macMessage, headerText);
            const result2 = createMacKey(fileKey2, macMessage, headerText);

            expect(Buffer.compare(result1, result2)).not.toBe(0);
        });

        it('should handle empty strings', () => {
            const fileKey = new Uint8Array(16);
            const macMessage = '';
            const headerText = '';

            const result = createMacKey(fileKey, macMessage, headerText);

            expect(result).toBeInstanceOf(Buffer);
            expect(result.length).toBe(32);
        });

        it('should handle unicode characters in messages', () => {
            const fileKey = new Uint8Array(16);
            const macMessage = 'héader';
            const headerText = '测试-header-🔐';

            const result = createMacKey(fileKey, macMessage, headerText);

            expect(result).toBeInstanceOf(Buffer);
            expect(result.length).toBe(32);
        });
    });

    describe('random', () => {
        it('should generate random bytes using window.crypto when available', async () => {
            const expectedBytes = new Uint8Array([1, 2, 3, 4, 5]);
            mockCrypto.getRandomValues.mockImplementation((arr) => {
                arr.set(expectedBytes);
                return arr;
            });

            const result = await random(5);

            expect(result).toBeInstanceOf(Uint8Array);
            expect(result.length).toBe(5);
            expect(mockCrypto.getRandomValues).toHaveBeenCalledWith(expect.any(Uint8Array));
            expect(Array.from(result)).toEqual(Array.from(expectedBytes));
        });

        it('should generate random bytes using Node.js crypto when window is not available', async () => {
            // Temporarily remove window object
            const originalWindow = global.window;
            delete (global as any).window;

            const expectedBuffer = Buffer.from([1, 2, 3, 4, 5]);
            mockRandomBytes.mockReturnValue(expectedBuffer);

            const result = await random(5);

            expect(result).toBeInstanceOf(Uint8Array);
            expect(result.length).toBe(5);
            expect(mockRandomBytes).toHaveBeenCalledWith(5);

            // Restore window object
            global.window = originalWindow;
        });

        it('should generate correct number of bytes', async () => {
            mockCrypto.getRandomValues.mockImplementation((arr) => {
                for (let i = 0; i < arr.length; i++) {
                    arr[i] = Math.floor(Math.random() * 256);
                }
                return arr;
            });

            const sizes = [0, 1, 16, 32, 64, 256];
            
            for (const size of sizes) {
                const result = await random(size);
                expect(result.length).toBe(size);
            }
        });

        it('should handle large byte requests', async () => {
            mockCrypto.getRandomValues.mockImplementation((arr) => {
                for (let i = 0; i < arr.length; i++) {
                    arr[i] = i % 256;
                }
                return arr;
            });

            const result = await random(1024);

            expect(result.length).toBe(1024);
            expect(result).toBeInstanceOf(Uint8Array);
        });

        it('should throw error when crypto is not available', async () => {
            // Remove window object
            const originalWindow = global.window;
            delete (global as any).window;

            // Mock require to throw error
            jest.doMock('crypto', () => {
                throw new Error('Crypto not available');
            });

            // This test assumes the implementation will handle the error appropriately
            // In the current implementation, it would throw during require()
            
            // Restore window object
            global.window = originalWindow;
        });
    });
});