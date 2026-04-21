/**
 * Utility script untuk development
 * Generate password hash, session secret, dll
 */

import crypto from 'crypto';

export function generatePasswordHash(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export function generateSessionSecret(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function generateVerifyToken(): string {
  return crypto.randomBytes(16).toString('hex');
}

// Main untuk CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];
  const value = process.argv[3];

  switch (command) {
    case 'hash-password':
      if (!value) {
        console.error('Usage: node utils.ts hash-password <password>');
        process.exit(1);
      }
      console.log(generatePasswordHash(value));
      break;

    case 'session-secret':
      console.log(generateSessionSecret());
      break;

    case 'verify-token':
      console.log(generateVerifyToken());
      break;

    default:
      console.log('Available commands:');
      console.log('  hash-password <password> - Generate password hash');
      console.log('  session-secret           - Generate session secret');
      console.log('  verify-token             - Generate verify token');
  }
}
