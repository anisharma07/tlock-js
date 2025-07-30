# tlock-js

A TypeScript library for timelock encryption that enables encrypting data which can only be decrypted at a specific time in the future using the [drand](https://drand.love) threshold network. The library implements AGE (Actually Good Encryption) for symmetric encryption and uses pairing-based cryptography to ensure temporal access control.

## 🚀 Features

- **Timelock Encryption**: Encrypt data that can only be decrypted after a specific round/time
- **Drand Integration**: Leverages the drand threshold network for trustless timelock functionality
- **AGE Compatibility**: Uses the AGE encryption format for symmetric encryption
- **Cross-Platform**: Supports both Node.js and browser environments
- **TypeScript First**: Fully typed with comprehensive TypeScript definitions
- **Pairing-Based Cryptography**: Uses BLS12-381 curves for identity-based encryption
- **Armored Output**: Supports ASCII-armored encrypted payloads
- **Future-Proof**: Compatible with other drand tlock implementations

## 🛠️ Tech Stack

### Core Technologies
- **TypeScript 5.1+** - Primary language with strict type checking
- **Node.js 16+** - Runtime environment
- **AGE Encryption** - Symmetric encryption standard

### Cryptography Stack
- **@noble/curves** - BLS12-381 elliptic curve operations
- **@noble/hashes** - Cryptographic hash functions (SHA-256, HKDF, HMAC)
- **@stablelib/chacha20poly1305** - ChaCha20-Poly1305 AEAD cipher
- **drand-client** - Drand threshold network client

### Development Tools
- **Jest** - Testing framework with comprehensive test coverage
- **ESLint** - TypeScript linting with strict configuration
- **ts-node** - TypeScript execution environment
- **Buffer polyfill** - Cross-platform buffer support

### Browser Compatibility
- **BigInt support required** - Modern browsers (ES2020+)
- **WebCrypto API** - For secure random number generation
- **Fetch API** - HTTP client functionality

## 📁 Project Structure

```
src/
├── age/                    # AGE encryption implementation
│   ├── age-encrypt-decrypt.ts    # Core AGE encryption/decryption
│   ├── age-reader-writer.ts      # AGE format serialization
│   ├── armor.ts                  # ASCII armor encoding/decoding
│   └── stream-cipher.ts          # ChaCha20-Poly1305 streaming
├── crypto/                 # Cryptographic primitives
│   ├── fp.ts              # Finite field operations
│   ├── ibe.ts             # Identity-based encryption
│   └── utils.ts           # Crypto utility functions
├── drand/                 # Drand timelock implementation
│   ├── timelock-encrypter.ts     # Timelock encryption logic
│   ├── timelock-decrypter.ts     # Timelock decryption logic
│   └── defaults.ts               # Default drand networks
└── types/                 # TypeScript type definitions
test/                      # Comprehensive test suite
├── age/                   # AGE implementation tests
├── crypto/                # Cryptography tests
└── drand/                 # Drand integration tests
```

## 🔧 Installation & Setup

### Prerequisites
- **Node.js 16+** with BigInt support
- **npm** or **yarn** package manager
- Modern browser with WebCrypto API (for browser usage)

### Installation Steps

```bash
# Install the library
npm install tlock-js

# Install drand client dependency
npm install drand-client

# For older Node.js versions, you may need a fetch polyfill
npm install isomorphic-fetch
```

### Development Setup

```bash
# Clone the repository
git clone https://github.com/anisharma07/tlock-js.git
cd tlock-js

# Install dependencies
npm install

# Generate version file and compile TypeScript
npm run compile

# Run tests to verify setup
npm test
```

## 🎯 Usage

### Basic Timelock Encryption

```typescript
import { timelockEncrypt, timelockDecrypt } from 'tlock-js';
import { HttpChainClient } from 'drand-client';

// Initialize drand client (testnet)
const chainClient = new HttpChainClient();

// Encrypt data for a future round
const roundNumber = 1000000; // Future round number
const payload = Buffer.from("Secret message for the future");

const ciphertext = await timelockEncrypt(roundNumber, payload, chainClient);
console.log("Encrypted:", ciphertext);

// Decrypt when the round is reached
try {
  const decrypted = await timelockDecrypt(ciphertext, chainClient);
  console.log("Decrypted:", decrypted.toString());
} catch (error) {
  console.log("Round not yet reached:", error.message);
}
```

### Time-Based Encryption

```typescript
import { timelockEncrypt, roundForTime, timeForRound } from 'tlock-js';
import { HttpChainClient } from 'drand-client';

const chainClient = new HttpChainClient();

// Encrypt for a specific future time
const futureTime = new Date('2024-12-31T23:59:59Z');
const networkInfo = await chainClient.chain().info();
const roundNumber = roundForTime(networkInfo, futureTime);

const payload = Buffer.from("Happy New Year 2025!");
const ciphertext = await timelockEncrypt(roundNumber, payload, chainClient);

// Check when decryption will be possible
const decryptionTime = timeForRound(networkInfo, roundNumber);
console.log(`Can decrypt at: ${decryptionTime}`);
```

### Browser Usage

```html
<script type="module">
  import { timelockEncrypt, timelockDecrypt } from 'tlock-js';
  
  // Browser implementation
  // Note: Requires BigInt support and modern JavaScript features
</script>
```

### Development Commands

```bash
# Compile TypeScript
npm run compile

# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Run tests with verbose output
npm test

# Clean build artifacts
npm run clean

# Run full CI build
npm run build:ci
```

## 📱 Platform Support

- **Node.js**: 16+ (with experimental fetch flag for older versions)
- **Browsers**: Modern browsers with BigInt and WebCrypto support
- **Vite**: Build target should be set to "es2020" or higher
- **TypeScript**: 5.1+ with ES2020 target
- **Mobile**: React Native with appropriate polyfills

### Browser Compatibility Notes

For older environments, you may need:
```javascript
// Vite configuration
export default {
  build: { target: "es2020" },
  // ... other config
}
```

## 🧪 Testing

The project includes comprehensive tests covering:

```bash
# Run all tests
npm test

# Test specific components
npm test -- test/age/
npm test -- test/crypto/
npm test -- test/drand/

# Run integration tests
npm test -- test/drand/integration.test.ts
```

### Test Coverage
- **AGE Implementation**: Encryption, decryption, armor encoding
- **Cryptographic Functions**: IBE, finite field operations, utilities
- **Drand Integration**: Timelock encryption/decryption, network compatibility
- **Compatibility**: Cross-implementation compatibility tests

## 🔄 Deployment

### Library Distribution

```bash
# Build for distribution
npm run compile

# The compiled output will be in ./dist/
# - index.js (main entry point)
# - index.d.ts (TypeScript definitions)
# - Source maps for debugging
```

### Browser Integration

The library can be integrated into web applications:
- ES modules support
- Compatible with modern bundlers (Webpack, Vite, Rollup)
- Requires BigInt polyfill for older browsers

## 📊 Performance & Optimization

### Cryptographic Performance
- Uses optimized noble cryptography libraries
- Efficient BLS12-381 curve operations
- Streaming encryption for large payloads (64KB chunks)
- Hardware-accelerated operations where available

### Network Optimization
- HTTP caching support for drand beacons
- Configurable drand client options
- Supports multiple drand network endpoints

### Memory Management
- Streaming cipher for large files
- Buffer pooling for cryptographic operations
- Efficient finite field arithmetic

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- **Code Style**: Follow ESLint configuration with TypeScript strict mode
- **Testing**: Add comprehensive tests for new features
- **Type Safety**: Maintain strict TypeScript types
- **Documentation**: Update README and code comments
- **Security**: Ensure cryptographic operations are secure

### Code Quality Standards
```bash
# Before submitting PRs
npm run lint:fix    # Fix linting issues
npm test           # Ensure all tests pass
npm run build:ci   # Run full CI pipeline
```

## 📄 License

This project is dual-licensed under:
- **Apache License 2.0**
- **MIT License**

You may choose either license for your use case. See [LICENSE-APACHE](LICENSE-APACHE) and [LICENSE-MIT](LICENSE-MIT) for details.

## 🌐 Related Projects

- **[Timevault](https://timevault.drand.love/)** - Live web demo of tlock-js
- **[drand](https://drand.love)** - Distributed randomness beacon
- **[AGE](https://age-encryption.org/)** - Simple, modern encryption tool
- **[noble-cryptography](https://paulmillr.com/noble/)** - Cryptographic primitives

## 🙏 Acknowledgments

- **drand.love team** - For the drand network and cryptographic foundation
- **AGE developers** - For the excellent encryption format
- **noble-crypto contributors** - For high-quality cryptographic libraries
- **Community contributors** - For testing and feedback

## 📞 Support & Contact

- **Issues**: [GitHub Issues](https://github.com/anisharma07/tlock-js/issues)
- **Discussions**: [GitHub Discussions](https://github.com/anisharma07/tlock-js/discussions)
- **Security**: See [SECURITY.md](SECURITY.md) for security policy
- **Drand Community**: [drand.love](https://drand.love)

### Getting Help

1. Check existing [GitHub Issues](https://github.com/anisharma07/tlock-js/issues)
2. Review the [test examples](./test/) for usage patterns
3. Try the [live demo](https://timevault.drand.love/) for quick testing
4. Join the drand community for broader timelock encryption discussions

---

**Version**: 0.9.0 | **Build Status**: TypeScript 5.1+ | **Node**: 16+ | **License**: Apache-2.0 OR MIT