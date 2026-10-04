// Set EXPO_PUBLIC_API_URL at launch for a phone or another server; .env is unchanged.
export const CONFIG = {
  API_BASE_URL: process.env.EXPO_PUBLIC_API_URL || "http://119.59.102.161:3012/api",
  TOKEN_KEY: "sft_token",
};
