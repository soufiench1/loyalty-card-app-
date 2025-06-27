import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, pin } = body

    if (!name || !pin) {
      return NextResponse.json({ error: "Name and PIN are required" }, { status: 400 })
    }

    const { createClient } = await import("@supabase/supabase-js")

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Create customer with immediate commit
    const { data: customer, error } = await supabase
      .from("customers")
      .insert([
        {
          name: name.trim(),
          pin: pin,
          total_points: 0,
          total_rewards: 0,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Customer creation error:", error)
      return NextResponse.json({ error: "Failed to create customer" }, { status: 500 })
    }

    console.log("✅ Customer created successfully:", customer.id)

    // Force database sync by making another query
    await supabase.from("customers").select("count(*)").single()

    return NextResponse.json(
      {
        success: true,
        customer: {
          id: customer.id,
          name: customer.name,
          qrCode: customer.id, // Use ID as QR code
        },
      },
      {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
      },
    )
  } catch (error) {
    console.error("Customer creation API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
