import { NoOpEncDec } from '../../src/age/no-op-encdec';
import { Stanza } from '../../src/age/age-encrypt-decrypt';

describe('NoOpEncDec', () => {
    describe('wrap', () => {
        it('should wrap file key in no-op stanza', async () => {
            const fileKey = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
            
            const result = await NoOpEncDec.wrap(fileKey);
            
            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({
                type: 'no-op',
                args: [],
                body: fileKey
            });
        });

        it('should handle empty file key', async () => {
            const fileKey = new Uint8Array(0);
            
            const result = await NoOpEncDec.wrap(fileKey);
            
            expect(result).toHaveLength(1);
            expect(result[0].type).toBe('no-op');
            expect(result[0].args).toEqual([]);
            expect(result[0].body).toEqual(fileKey);
        });

        it('should handle large file key', async () => {
            const fileKey = new Uint8Array(1024).fill(42);
            
            const result = await NoOpEncDec.wrap(fileKey);
            
            expect(result).toHaveLength(1);
            expect(result[0].body).toEqual(fileKey);
            expect(result[0].body.length).toBe(1024);
        });

        it('should create new stanza each time', async () => {
            const fileKey = new Uint8Array([1, 2, 3]);
            
            const result1 = await NoOpEncDec.wrap(fileKey);
            const result2 = await NoOpEncDec.wrap(fileKey);
            
            expect(result1).not.toBe(result2);
            expect(result1[0]).not.toBe(result2[0]);
            expect(result1[0]).toEqual(result2[0]);
        });
    });

    describe('unwrap', () => {
        it('should unwrap no-op stanza and return file key', async () => {
            const expectedFileKey = new Uint8Array([1, 2, 3, 4, 5]);
            const stanzas: Stanza[] = [{
                type: 'no-op',
                args: [],
                body: expectedFileKey
            }];
            
            const result = await NoOpEncDec.unwrap(stanzas);
            
            expect(result).toEqual(expectedFileKey);
        });

        it('should throw error for multiple stanzas', async () => {
            const stanzas: Stanza[] = [
                { type: 'no-op', args: [], body: new Uint8Array([1]) },
                { type: 'no-op', args: [], body: new Uint8Array([2]) }
            ];
            
            await expect(NoOpEncDec.unwrap(stanzas)).rejects.toThrow(
                'NoOpEncDec only expects a single stanza!'
            );
        });

        it('should throw error for empty stanza array', async () => {
            const stanzas: Stanza[] = [];
            
            await expect(NoOpEncDec.unwrap(stanzas)).rejects.toThrow(
                'NoOpEncDec only expects a single stanza!'
            );
        });

        it('should throw error for wrong stanza type', async () => {
            const stanzas: Stanza[] = [{
                type: 'wrong-type',
                args: [],
                body: new Uint8Array([1, 2, 3])
            }];
            
            await expect(NoOpEncDec.unwrap(stanzas)).rejects.toThrow(
                'NoOpEncDec expects the type of the stanza to be no-op'
            );
        });

        it('should handle stanza with args (though not expected)', async () => {
            const fileKey = new Uint8Array([5, 4, 3, 2, 1]);
            const stanzas: Stanza[] = [{
                type: 'no-op',
                args: ['unexpected', 'args'],
                body: fileKey
            }];
            
            const result = await NoOpEncDec.unwrap(stanzas);
            
            expect(result).toEqual(fileKey);
        });

        it('should handle empty file key in stanza', async () => {
            const emptyFileKey = new Uint8Array(0);
            const stanzas: Stanza[] = [{
                type: 'no-op',
                args: [],
                body: emptyFileKey
            }];
            
            const result = await NoOpEncDec.unwrap(stanzas);
            
            expect(result).toEqual(emptyFileKey);
            expect(result.length).toBe(0);
        });
    });

    describe('roundtrip', () => {
        it('should maintain file key through wrap/unwrap cycle', async () => {
            const originalFileKey = new Uint8Array([10, 20, 30, 40, 50, 60, 70, 80]);
            
            const wrapped = await NoOpEncDec.wrap(originalFileKey);
            const unwrapped = await NoOpEncDec.unwrap(wrapped);
            
            expect(unwrapped).toEqual(originalFileKey);
        });

        it('should work with various file key sizes', async () => {
            const fileSizes = [0, 1, 16, 32, 64, 128, 256];
            
            for (const size of fileSizes) {
                const fileKey = new Uint8Array(size).map((_, i) => i % 256);
                
                const wrapped = await NoOpEncDec.wrap(fileKey);
                const unwrapped = await NoOpEncDec.unwrap(wrapped);
                
                expect(unwrapped).toEqual(fileKey);
            }
        });
    });
});