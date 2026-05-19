import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1716000000000 implements MigrationInterface {
  name = 'InitialSchema1716000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "users_role_enum" AS ENUM ('user', 'provider', 'admin')
    `);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "phone" varchar(15) NOT NULL UNIQUE,
        "name" varchar(100),
        "avatar_url" text,
        "role" "users_role_enum" NOT NULL DEFAULT 'user',
        "is_verified" boolean NOT NULL DEFAULT false,
        "is_banned" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "provider_profiles" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
        "display_name" varchar(100) NOT NULL,
        "bio" text,
        "categories" text[] NOT NULL DEFAULT '{}',
        "languages" text[] NOT NULL DEFAULT '{}',
        "chat_rate_per_min" decimal(10,2) NOT NULL,
        "voice_rate_per_min" decimal(10,2) NOT NULL,
        "video_rate_per_min" decimal(10,2) NOT NULL,
        "avg_rating" decimal(3,2) NOT NULL DEFAULT 0,
        "total_sessions" integer NOT NULL DEFAULT 0,
        "total_minutes" integer NOT NULL DEFAULT 0,
        "is_online" boolean NOT NULL DEFAULT false,
        "is_approved" boolean NOT NULL DEFAULT false,
        "commission_rate" decimal(5,4) NOT NULL DEFAULT 0.15,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "wallets" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
        "balance" decimal(12,2) NOT NULL DEFAULT 0,
        "currency" varchar(3) NOT NULL DEFAULT 'INR',
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "transactions_type_enum" AS ENUM ('topup', 'debit', 'earning', 'payout', 'refund')
    `);

    await queryRunner.query(`
      CREATE TABLE "transactions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "wallet_id" uuid NOT NULL REFERENCES "wallets"("id") ON DELETE CASCADE,
        "type" "transactions_type_enum" NOT NULL,
        "amount" decimal(12,2) NOT NULL,
        "balance_after" decimal(12,2) NOT NULL,
        "reference_type" varchar(50),
        "reference_id" varchar(100),
        "description" text,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_transactions_wallet_id" ON "transactions" ("wallet_id")
    `);

    await queryRunner.query(`
      CREATE TYPE "sessions_type_enum" AS ENUM ('chat', 'voice', 'video')
    `);

    await queryRunner.query(`
      CREATE TYPE "sessions_status_enum" AS ENUM ('pending', 'active', 'paused', 'completed', 'cancelled', 'failed')
    `);

    await queryRunner.query(`
      CREATE TABLE "sessions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL REFERENCES "users"("id"),
        "provider_id" uuid NOT NULL REFERENCES "users"("id"),
        "type" "sessions_type_enum" NOT NULL,
        "status" "sessions_status_enum" NOT NULL DEFAULT 'pending',
        "rate_per_min" decimal(10,2) NOT NULL,
        "total_duration_sec" integer NOT NULL DEFAULT 0,
        "total_amount" decimal(12,2) NOT NULL DEFAULT 0,
        "platform_fee" decimal(12,2) NOT NULL DEFAULT 0,
        "provider_earning" decimal(12,2) NOT NULL DEFAULT 0,
        "started_at" timestamptz,
        "ended_at" timestamptz,
        "end_reason" varchar(50),
        "agora_channel_id" varchar(100),
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_sessions_user_id" ON "sessions" ("user_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_sessions_provider_id" ON "sessions" ("provider_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_sessions_status" ON "sessions" ("status")
    `);

    await queryRunner.query(`
      CREATE TABLE "ratings" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "session_id" uuid NOT NULL UNIQUE REFERENCES "sessions"("id"),
        "user_id" uuid NOT NULL REFERENCES "users"("id"),
        "provider_id" uuid NOT NULL REFERENCES "users"("id"),
        "score" integer NOT NULL CHECK (score >= 1 AND score <= 5),
        "comment" text,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_ratings_provider_id" ON "ratings" ("provider_id")
    `);

    await queryRunner.query(`
      CREATE TYPE "payouts_status_enum" AS ENUM ('pending', 'processing', 'completed', 'failed')
    `);

    await queryRunner.query(`
      CREATE TABLE "payouts" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "provider_id" uuid NOT NULL REFERENCES "users"("id"),
        "amount" decimal(12,2) NOT NULL,
        "status" "payouts_status_enum" NOT NULL DEFAULT 'pending',
        "bank_reference" varchar(100),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "processed_at" timestamptz
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_payouts_provider_id" ON "payouts" ("provider_id")
    `);

    await queryRunner.query(`
      CREATE TYPE "moderation_logs_type_enum" AS ENUM ('keyword_match', 'phone_detected', 'handle_detected', 'manual_report', 'ai_flag')
    `);
    await queryRunner.query(`
      CREATE TYPE "moderation_logs_action_enum" AS ENUM ('warned', 'blocked', 'session_ended', 'banned')
    `);

    await queryRunner.query(`
      CREATE TABLE "moderation_logs" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "session_id" uuid REFERENCES "sessions"("id"),
        "user_id" uuid NOT NULL REFERENCES "users"("id"),
        "type" "moderation_logs_type_enum" NOT NULL,
        "content" text,
        "action_taken" "moderation_logs_action_enum" NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "reports_status_enum" AS ENUM ('pending', 'reviewed', 'resolved', 'dismissed')
    `);

    await queryRunner.query(`
      CREATE TABLE "reports" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "reporter_id" uuid NOT NULL REFERENCES "users"("id"),
        "reported_id" uuid NOT NULL REFERENCES "users"("id"),
        "session_id" uuid REFERENCES "sessions"("id"),
        "reason" text NOT NULL,
        "status" "reports_status_enum" NOT NULL DEFAULT 'pending',
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "platform_config" (
        "key" varchar(100) PRIMARY KEY,
        "value" jsonb NOT NULL,
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      INSERT INTO "platform_config" ("key", "value") VALUES
        ('commission_rate', '0.15'),
        ('min_wallet_balance_warning', '30'),
        ('min_payout_amount', '100')
      ON CONFLICT ("key") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "platform_config"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "reports"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "reports_status_enum"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "moderation_logs"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "moderation_logs_action_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "moderation_logs_type_enum"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "payouts"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "payouts_status_enum"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "ratings"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sessions"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "sessions_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "sessions_type_enum"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "transactions"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "transactions_type_enum"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "wallets"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "provider_profiles"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "users_role_enum"`);
  }
}
