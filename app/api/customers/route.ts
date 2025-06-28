import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, pin } = body

    if (!name || !pin) {
      return NextResponse.json({ error: "Name and PIN are required" }, { status: 400 })
    }

    // Create customer
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

    console.log("✅ Customer created successfully:", customer.id, customer.name)

    return NextResponse.json(
      {
        success: true,
        customer: {
          id: customer.id,
          name: customer.name,
          qrCode: customer.id,
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
