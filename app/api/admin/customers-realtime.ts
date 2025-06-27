import { type NextRequest, NextResponse } from "next/server"

// This endpoint is optimized for real-time updates in production
export async function GET(request: NextRequest) {
  try {
    // Add cache-busting headers
    const headers = {
      "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
      Pragma: "no-cache",
      Expires: "0",
      "Content-Type": "application/json",
    }

    // Force fresh database connection for each request
    const { createClient } = await import("@supabase/supabase-js")

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      db: {
        schema: "public",
      },
    })

    // Get customers with fresh data
    const { data: customers, error } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500, headers })
    }

    // Transform data to match expected format
    const formattedCustomers =
      customers?.map((customer) => ({
        id: customer.id,
        name: customer.name,
        points: customer.total_points || 0,
        rewards: customer.total_rewards || 0,
        created_at: customer.created_at,
      })) || []

    console.log(`✅ Real-time customers fetch: ${formattedCustomers.length} customers`)

    return NextResponse.json(formattedCustomers, { headers })
  } catch (error) {
    console.error("Real-time customers API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    )
  }
}
