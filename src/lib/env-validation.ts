/**
 * Environment Variable Validation
 *
 * Validates that all required environment variables are set at application startup.
 * This prevents runtime errors and security issues from missing configuration.
 */

interface RequiredEnvVars {
  JWT_SECRET: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface OptionalEnvVars {
  NODE_ENV?: string;
  DATABASE_URL?: string;
}

const REQUIRED_ENV_VARS: Array<keyof RequiredEnvVars> = [
  'JWT_SECRET',
];

const RECOMMENDED_ENV_VARS: string[] = [
  'DATABASE_URL',
];

/**
 * Validates that all required environment variables are present
 * @throws {Error} If any required environment variable is missing
 */
export function validateEnvironment(): void {
  const missing: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  for (const varName of REQUIRED_ENV_VARS) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  // Check recommended variables (warnings only)
  for (const varName of RECOMMENDED_ENV_VARS) {
    if (!process.env[varName]) {
      warnings.push(varName);
    }
  }

  // Fail if required variables are missing
  if (missing.length > 0) {
    const errorMessage = [
      '',
      '╔════════════════════════════════════════════════════════════════╗',
      '║  CRITICAL: Missing Required Environment Variables             ║',
      '╚════════════════════════════════════════════════════════════════╝',
      '',
      'The following environment variables are required but not set:',
      ...missing.map(v => `  ❌ ${v}`),
      '',
      'Please create a .env file in the project root with these variables.',
      'See .env.example for reference.',
      '',
    ].join('\n');

    throw new Error(errorMessage);
  }

  // Warn about recommended variables
  if (warnings.length > 0 && process.env.NODE_ENV !== 'test') {
    console.warn('\n⚠️  Warning: Recommended environment variables not set:');
    warnings.forEach(v => console.warn(`  - ${v}`));
    console.warn('');
  }

  // Success message in development
  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Environment validation passed');
  }
}

/**
 * Gets a required environment variable, throwing if not found
 */
export function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Required environment variable ${name} is not set`);
  }
  return value;
}

/**
 * Gets an optional environment variable with a default value
 */
export function getOptionalEnv(name: string, defaultValue: string): string {
  return process.env[name] || defaultValue;
}

/**
 * Checks if we're in production environment
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Checks if we're in development environment
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Checks if we're in test environment
 */
export function isTest(): boolean {
  return process.env.NODE_ENV === 'test';
}
