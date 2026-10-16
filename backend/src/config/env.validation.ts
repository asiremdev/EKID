/**
 * Lightweight environment validation executed at boot. Throws on missing
 * required variables so the app fails fast instead of misbehaving at runtime.
 */
export function validateEnv(config: Record<string, unknown>): Record<string, unknown> {
  const required = ['DATABASE_URL', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
  const missing = required.filter((key) => !config[key]);

  if (missing.length > 0 && (config.NODE_ENV ?? 'development') === 'production') {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return config;
}
