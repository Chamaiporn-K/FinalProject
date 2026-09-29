// ------------------------------------------------------------------
// The ONLY file with URLs in it. Backend dev sets API_BASE_URL,
// AI dev sets AI_API_BASE_URL. On a real phone/simulator "localhost"
// won't reach your laptop's server — use your machine's LAN IP
// (e.g. http://192.168.1.23:4000/api) or an ngrok/tunnel URL instead.
// ------------------------------------------------------------------
export const CONFIG = {
  API_BASE_URL: "http://localhost:4000/api",
  AI_API_BASE_URL: "http://localhost:5000/ai",
  TOKEN_KEY: "sft_token",
};
