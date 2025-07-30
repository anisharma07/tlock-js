import { createTimelockDecrypter } from '../../src/drand/timelock-decrypter';
import { Stanza } from '../../src/age/age-encrypt-decrypt';
import { Buffer } from 'buffer';

// Mock dependencies
const mockChainInfo = {
    schemeID: 'pedersen-bls-unchained',
    period: 30000,
    genesis_time: Date.now() - 100000
};

const mockBeacon = {
    round: 100,
    randomness: 'mock-randomness',
    signature: '1234567890abcdef',
    previous_signature: 'previous-sig'
};

const mockChainClient = {
    chain: jest.fn(() => ({
        info: jest.fn().mockResolvedValue(mockChainInfo)
    }))
};

const mockFetchBeacon = jest.fn().mockResolvedValue(mockBeacon);
const mockRoundTime = jest.fn().mockReturnValue(Date.now() - 1000); // Past time

// Mock the drand-client module
jest.mock('drand-client', () => ({
    fetchBeacon: (...args: any[]) => mockFetchBeacon(...args),
    roundTime: (...args: any[]) => mockRoundTime(...args)
}));

// Mock the IBE module
const mockDecryptOnG1 = jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4]));
const mockDecryptOnG2 = jest.fn().mockResolvedValue(new Uint8Array([5, 6, 7, 8]));

jest.mock('../../src/crypto/ibe', () => ({
    decryptOnG1: (...args: any[]) => mockDecryptOnG1(...args),
    decryptOnG2: (...args: any[]) => mockDecryptOnG2(...args)
}));

// Mock console.log to avoid test output pollution
const originalConsoleLog = console.log;
beforeAll(() => {
    console.log = jest.fn();
});

afterAll(() => {
    console.log = originalConsoleLog;
});

describe('createTimelockDecrypter', () => {
    let timelockDecrypter: (recipients: Array<Stanza>) => Promise<Uint8Array>;

    beforeEach(() => {
        jest.clearAllMocks();
        timelockDecrypter = createTimelockDecrypter(mockChainClient as any);
    });

    describe('basic functionality', () => {
        it('should create a decrypter function', () => {
            expect(typeof timelockDecrypter).toBe('function');
        });

        it('should throw error if no tlock stanza found', async () => {
            const recipients: Stanza[] = [{
                type: 'other',
                args: ['100', 'chain-hash'],
                body: new Uint8Array([1, 2, 3])
            }];

            await expect(timelockDecrypter(recipients)).rejects.toThrow(
                'You must pass a timelock stanza!'
            );
        });

        it('should throw error if stanza type is not tlock', async () => {
            const recipients: Stanza[] = [{
                type: 'wrong-type',
                args: ['100', 'chain-hash'],
                body: new Uint8Array([1, 2, 3])
            }];

            await expect(timelockDecrypter(recipients)).rejects.toThrow(
                'Timelock expects the type of the stanza to be "tlock'
            );
        });

        it('should throw error if wrong number of args', async () => {
            const recipients: Stanza[] = [{
                type: 'tlock',
                args: ['100'], // Missing chain hash
                body: new Uint8Array([1, 2, 3])
            }];

            await expect(timelockDecrypter(recipients)).rejects.toThrow(
                'Timelock stanza expected 2 args: roundNumber and chainHash. Only received 1'
            );
        });

        it('should throw error if round number is not a number', async () => {
            const recipients: Stanza[] = [{
                type: 'tlock',
                args: ['not-a-number', 'chain-hash'],
                body: new Uint8Array([1, 2, 3])
            }];

            await expect(timelockDecrypter(recipients)).rejects.toThrow(
                'Expected the roundNumber arg to be a number, but it was not-a-number!'
            );
        });

        it('should throw error if it is too early to decrypt', async () => {
            mockRoundTime.mockReturnValue(Date.now() + 10000); // Future time
            
            const recipients: Stanza[] = [{
                type: 'tlock',
                args: ['100', 'chain-hash'],
                body: new Uint8Array([1, 2, 3])
            }];

            await expect(timelockDecrypter(recipients)).rejects.toThrow(
                'It\'s too early to decrypt the ciphertext - decryptable at round 100'
            );
        });
    });

    describe('scheme support', () => {
        it('should support pedersen-bls-unchained scheme', async () => {
            mockChainInfo.schemeID = 'pedersen-bls-unchained';
            const mockBody = new Uint8Array(48 + 64); // 48 bytes for G1 point + 32*2 for V,W
            
            const recipients: Stanza[] = [{
                type: 'tlock',
                args: ['100', 'chain-hash'],
                body: mockBody
            }];

            const result = await timelockDecrypter(recipients);

            expect(mockDecryptOnG1).toHaveBeenCalledWith(
                Buffer.from(mockBeacon.signature, 'hex'),
                expect.any(Object)
            );
            expect(result).toEqual(new Uint8Array([1, 2, 3, 4]));
        });

        it('should support bls-unchained-on-g1 scheme', async () => {
            mockChainInfo.schemeID = 'bls-unchained-on-g1';
            const mockBody = new Uint8Array(96 + 64); // 96 bytes for G2 point + 32*2 for V,W
            
            const recipients: Stanza[] = [{
                type: 'tlock',
                args: ['200', 'chain-hash'],
                body: mockBody
            }];

            const result = await timelockDecrypter(recipients);

            expect(mockDecryptOnG2).toHaveBeenCalledWith(
                Buffer.from(mockBeacon.signature, 'hex'),
                expect.any(Object)
            );
            expect(result).toEqual(new Uint8Array([5, 6, 7, 8]));
        });

        it('should support bls-unchained-g1-rfc9380 scheme', async () => {
            mockChainInfo.schemeID = 'bls-unchained-g1-rfc9380';
            const mockBody = new Uint8Array(96 + 64); // 96 bytes for G2 point + 32*2 for V,W
            
            const recipients: Stanza[] = [{
                type: 'tlock',
                args: ['300', 'chain-hash'],
                body: mockBody
            }];

            const result = await timelockDecrypter(recipients);

            expect(mockDecryptOnG2).toHaveBeenCalledWith(
                Buffer.from(mockBeacon.signature, 'hex'),
                expect.any(Object)
            );
            expect(result).toEqual(new Uint8Array([5, 6, 7, 8]));
        });

        it('should throw error for unsupported scheme', async () => {
            mockChainInfo.schemeID = 'unsupported-scheme';
            
            const recipients: Stanza[] = [{
                type: 'tlock',
                args: ['100', 'chain-hash'],
                body: new Uint8Array([1, 2, 3])
            }];

            await expect(timelockDecrypter(recipients)).rejects.toThrow(
                'Unsupported scheme: unsupported-scheme - you must use a drand network with an unchained scheme for timelock decryption!'
            );
        });
    });

    describe('ciphertext parsing', () => {
        it('should parse ciphertext correctly for G1 scheme', async () => {
            mockChainInfo.schemeID = 'pedersen-bls-unchained';
            
            // Create a mock body with proper structure
            const pointBytes = new Uint8Array(48).fill(1); // G1 point
            const vBytes = new Uint8Array(32).fill(2);
            const wBytes = new Uint8Array(32).fill(3);
            const mockBody = new Uint8Array([...pointBytes, ...vBytes, ...wBytes]);
            
            const recipients: Stanza[] = [{
                type: 'tlock',
                args: ['100', 'chain-hash'],
                body: mockBody
            }];

            await timelockDecrypter(recipients);

            expect(mockDecryptOnG1).toHaveBeenCalledWith(
                Buffer.from(mockBeacon.signature, 'hex'),
                {
                    U: pointBytes,
                    V: vBytes,
                    W: wBytes
                }
            );
        });

        it('should parse ciphertext correctly for G2 schemes', async () => {
            mockChainInfo.schemeID = 'bls-unchained-on-g1';
            
            // Create a mock body with proper structure for G2
            const pointBytes = new Uint8Array(96).fill(1); // G2 point
            const vBytes = new Uint8Array(32).fill(2);
            const wBytes = new Uint8Array(32).fill(3);
            const mockBody = new Uint8Array([...pointBytes, ...vBytes, ...wBytes]);
            
            const recipients: Stanza[] = [{
                type: 'tlock',
                args: ['100', 'chain-hash'],
                body: mockBody
            }];

            await timelockDecrypter(recipients);

            expect(mockDecryptOnG2).toHaveBeenCalledWith(
                Buffer.from(mockBeacon.signature, 'hex'),
                {
                    U: pointBytes,
                    V: vBytes,
                    W: wBytes
                }
            );
        });
    });

    describe('network interactions', () => {
        it('should fetch chain info', async () => {
            const recipients: Stanza[] = [{
                type: 'tlock',
                args: ['100', 'chain-hash'],
                body: new Uint8Array(48 + 64)
            }];

            await timelockDecrypter(recipients);

            expect(mockChainClient.chain).toHaveBeenCalled();
            expect(mockChainClient.chain().info).toHaveBeenCalled();
        });

        it('should fetch beacon for the specified round', async () => {
            const recipients: Stanza[] = [{
                type: 'tlock',
                args: ['150', 'chain-hash'],
                body: new Uint8Array(48 + 64)
            }];

            await timelockDecrypter(recipients);

            expect(mockFetchBeacon).toHaveBeenCalledWith(mockChainClient, 150);
        });

        it('should check round time before attempting decryption', async () => {
            const recipients: Stanza[] = [{
                type: 'tlock',
                args: ['100', 'chain-hash'],
                body: new Uint8Array(48 + 64)
            }];

            await timelockDecrypter(recipients);

            expect(mockRoundTime).toHaveBeenCalledWith(mockChainInfo, 100);
        });

        it('should log beacon information', async () => {
            const recipients: Stanza[] = [{
                type: 'tlock',
                args: ['100', 'chain-hash'],
                body: new Uint8Array(48 + 64)
            }];

            await timelockDecrypter(recipients);

            expect(console.log).toHaveBeenCalledWith(
                `beacon received: ${JSON.stringify(mockBeacon)}`
            );
        });
    });

    describe('error handling', () => {
        it('should handle network errors gracefully', async () => {
            mockFetchBeacon.mockRejectedValue(new Error('Network error'));
            
            const recipients: Stanza[] = [{
                type: 'tlock',
                args: ['100', 'chain-hash'],
                body: new Uint8Array(48 + 64)
            }];

            await expect(timelockDecrypter(recipients)).rejects.toThrow('Network error');
        });

        it('should handle chain info fetch errors', async () => {
            mockChainClient.chain().info.mockRejectedValue(new Error('Chain info error'));
            
            const recipients: Stanza[] = [{
                type: 'tlock',
                args: ['100', 'chain-hash'],
                body: new Uint8Array(48 + 64)
            }];

            await expect(timelockDecrypter(recipients)).rejects.toThrow('Chain info error');
        });

        it('should handle decryption errors', async () => {
            mockDecryptOnG1.mockRejectedValue(new Error('Decryption failed'));
            
            const recipients: Stanza[] = [{
                type: 'tlock',
                args: ['100', 'chain-hash'],
                body: new Uint8Array(48 + 64)
            }];

            await expect(timelockDecrypter(recipients)).rejects.toThrow('Decryption failed');
        });
    });
});