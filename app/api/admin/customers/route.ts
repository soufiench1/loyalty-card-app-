import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    // Get all customers with fresh data
    const { data: customers, error } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 })
    }

    // Transform data to match your admin panel format
    const formattedCustomers =
      customers?.map((customer) => ({
        id: customer.id,
        name: customer.name,
        points: customer.total_points || 0,
        rewards: customer.total_rewards || 0,
        created_at: customer.created_at,
      })) || []

    console.log(`✅ Admin customers fetch: ${formattedCustomers.length} customers`)

    return NextResponse.json(formattedCustomers, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
        Pragma: "no-cache",
        Expires: "0",
        "Content-Type": "application/json",
      },
    })
  } catch (error) {
    console.error("Admin customers API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
