import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    // Get current settings
    const { data: settings, error } = await supabase.from("settings").select("*").single()

    if (error || !settings) {
      return NextResponse.json({ error: "Failed to load settings" }, { status: 500 })
    }

    if (username === settings.admin_username && password === settings.admin_password) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
