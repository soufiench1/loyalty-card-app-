export function validateEnvironment() {
  const requiredEnvVars = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"]

  const missing = requiredEnvVars.filter((envVar) => !process.env[envVar])

  if (missing.length > 0) {
    console.error("Missing required environment variables:", missing)
    return false
  }

  // Check if Supabase URL is valid
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (supabaseUrl && !supabaseUrl.includes("supabase.co")) {
    console.warn("Supabase URL might be invalid:", supabaseUrl)
  }

  return true
}
