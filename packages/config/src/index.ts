const fallbackSecret = "local-dev-secret";

export const env = {
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "Mi.Tech.Nu",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  sessionSecret: process.env.ACADEMY_SESSION_SECRET ?? fallbackSecret,
  mediaSecret: process.env.ACADEMY_MEDIA_SECRET ?? fallbackSecret,
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434",
  ollamaModel: process.env.OLLAMA_MODEL ?? "llama3.1",
  minioEndpoint: process.env.MINIO_ENDPOINT ?? "http://localhost:9000",
  minioAccessKey: process.env.MINIO_ACCESS_KEY ?? "minioadmin",
  minioSecretKey: process.env.MINIO_SECRET_KEY ?? "minioadmin",
  minioBucket: process.env.MINIO_BUCKET ?? "academy-media",
  postgresUrl: process.env.POSTGRES_URL ?? "postgres://academy:academy@localhost:5432/academy",
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379"
};

export type AppEnv = typeof env;
