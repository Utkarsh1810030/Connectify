import { z } from 'zod';

export const AppConfigSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),

  // Database
  DATABASE_URL: z.string().min(1),
  MONGODB_URI: z.string().min(1),

  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  // Agora
  AGORA_APP_ID: z.string().min(1),
  AGORA_APP_CERTIFICATE: z.string().min(1),

  // Razorpay
  RAZORPAY_KEY_ID: z.string().min(1),
  RAZORPAY_KEY_SECRET: z.string().min(1),
  RAZORPAY_WEBHOOK_SECRET: z.string().min(1),

  // MSG91 (OTP)
  MSG91_AUTH_KEY: z.string().min(1),
  MSG91_TEMPLATE_ID: z.string().min(1),

  // Platform
  PLATFORM_COMMISSION_RATE: z.coerce.number().min(0).max(1).default(0.15),
  MIN_WALLET_BALANCE_WARNING: z.coerce.number().default(30),

  // Feature Flags (can be overridden via DB)
  FEATURE_KAFKA_ENABLED: z.coerce.boolean().default(false),
  FEATURE_AI_MODERATION_ENABLED: z.coerce.boolean().default(false),
  FEATURE_AUDIO_TRANSCRIPTION_ENABLED: z.coerce.boolean().default(false),
});

export type AppConfig = z.infer<typeof AppConfigSchema>;

export const validateConfig = (config: Record<string, unknown>): AppConfig => {
  const result = AppConfigSchema.safeParse(config);
  if (!result.success) {
    throw new Error(`Configuration validation failed:\n${result.error.toString()}`);
  }
  return result.data;
};
