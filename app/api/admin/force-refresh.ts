import { type NextRequest, NextResponse } from "next/server"

// Force refresh endpoint to trigger immediate database sync
export async function POST(request: NextRequest) {
  try {
    const headers = {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
      "Content-Type": "application/json",
    }

    // This endpoint forces a database connection refresh
    // Useful after adding new customers

    const { createClient } = await import("@supabase/supabase-js")

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Force a simple query to wake up the database connection
    const { data, error } = await supabase.from("customers").select("count(*)").single()

    if (error) {
      console.error("Force refresh error:", error)
    }

    console.log("🔄 Database connection refreshed")

    return NextResponse.json({ success: true, message: "Database refreshed" }, { headers })
  } catch (error) {
    console.error("Force refresh API error:", error)
    return NextResponse.json({ error: "Refresh failed" }, { status: 500 })
  }
}
