import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { generateQRCode } from "@/lib/qr-generator"

// Mock database - in production, use MongoDB
const customers: any[] = []

export async function POST(request: NextRequest) {
  try {
    const { name, pin } = await request.json()

    if (!name || !pin) {
      return NextResponse.json({ error: "Name and PIN are required" }, { status: 400 })
    }

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return NextResponse.json({ error: "PIN must be exactly 4 digits" }, { status: 400 })
    }

    // Generate unique customer ID
    const customerId = `LC${Date.now()}`

    // Generate QR code locally
    const qrCode = await generateQRCode(customerId)

    // Insert customer into Supabase
    const { data, error } = await supabase
      .from("customers")
      .insert([
        {
          id: customerId,
          name,
          pin,
          points: 0,
          rewards: 0,
          qr_code: qrCode,
        },
      ])
      .select()

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ error: "Failed to register customer" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      customerId,
      qrCode,
      message: "Customer registered successfully",
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
