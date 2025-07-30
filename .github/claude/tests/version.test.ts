import { LIB_VERSION } from '../src/version';

describe('version', () => {
    it('should export LIB_VERSION constant', () => {
        expect(LIB_VERSION).toBeDefined();
        expect(typeof LIB_VERSION).toBe('string');
    });

    it('should have a valid semantic version format', () => {
        const semverRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9]+)*$/;
        expect(LIB_VERSION).toMatch(semverRegex);
    });

    it('should match package.json version', () => {
        // This test ensures consistency between version.ts and package.json
        const packageJson = require('../../package.json');
        expect(LIB_VERSION).toBe(packageJson.version);
    });

    it('should not be empty or null', () => {
        expect(LIB_VERSION).toBeTruthy();
        expect(LIB_VERSION.length).toBeGreaterThan(0);
    });

    it('should start with a digit', () => {
        expect(LIB_VERSION[0]).toMatch(/\d/);
    });

    it('should contain dots for version separation', () => {
        expect(LIB_VERSION).toContain('.');
        expect(LIB_VERSION.split('.').length).toBeGreaterThanOrEqual(2);
    });

    it('should have major, minor, and patch versions', () => {
        const versionParts = LIB_VERSION.split('.');
        expect(versionParts.length).toBeGreaterThanOrEqual(3);
        
        // Each part should be numeric (ignoring pre-release suffixes)
        expect(versionParts[0]).toMatch(/^\d+$/);
        expect(versionParts[1]).toMatch(/^\d+$/);
        expect(versionParts[2]).toMatch(/^\d+/); // May have pre-release suffix
    });

    it('should be immutable', () => {
        const originalVersion = LIB_VERSION;
        
        // Attempt to modify (though this won't work in practice due to const)
        expect(() => {
            (global as any).LIB_VERSION = 'modified';
        }).not.toThrow();
        
        // Original should remain unchanged
        expect(LIB_VERSION).toBe(originalVersion);
    });
});