export interface AppConfig {
  env: string;
  port: number;
  apiPrefix: string;
  corsOrigins: string[];
  jwt: {
    accessSecret: string;
    accessTtl: string;
    refreshSecret: string;
    refreshTtl: string;
  };
  cookie: {
    domain: string;
    secure: boolean;
    sameSite: 'lax' | 'strict' | 'none';
  };
  tokens: {
    emailVerificationTtl: number;
    passwordResetTtl: number;
  };
  throttle: {
    ttl: number;
    limit: number;
    authTtl: number;
    authLimit: number;
  };
  subscription: {
    trialDays: number;
  };
  mail: {
    from: string;
    provider: string;
  };
}

export default (): AppConfig => ({
  env: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '4000', 10),
  apiPrefix: process.env.API_PREFIX ?? 'api',
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret',
    accessTtl: process.env.JWT_ACCESS_TTL ?? '900s',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret',
    refreshTtl: process.env.JWT_REFRESH_TTL ?? '30d',
  },
  cookie: {
    domain: process.env.COOKIE_DOMAIN ?? 'localhost',
    secure: (process.env.COOKIE_SECURE ?? 'false') === 'true',
    sameSite: (process.env.COOKIE_SAMESITE as 'lax' | 'strict' | 'none') ?? 'lax',
  },
  tokens: {
    emailVerificationTtl: parseInt(process.env.EMAIL_VERIFICATION_TTL ?? '86400', 10),
    passwordResetTtl: parseInt(process.env.PASSWORD_RESET_TTL ?? '3600', 10),
  },
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL ?? '60', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT ?? '120', 10),
    authTtl: parseInt(process.env.AUTH_THROTTLE_TTL ?? '60', 10),
    authLimit: parseInt(process.env.AUTH_THROTTLE_LIMIT ?? '10', 10),
  },
  subscription: {
    trialDays: parseInt(process.env.TRIAL_DAYS ?? '3', 10),
  },
  mail: {
    from: process.env.MAIL_FROM ?? 'Kiddy <no-reply@kiddy.app>',
    provider: process.env.MAIL_PROVIDER ?? 'console',
  },
});
