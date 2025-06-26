import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    const { data: settings, error } = await supabase.from("settings").select("*").single()

    if (error) {
      // If no settings exist, create default ones
      const defaultSettings = {
        store_pin: "1234",
        points_for_reward: 10,
        admin_username: "admin",
        admin_password: "password123",
      }

      const { data: newSettings, error: insertError } = await supabase
        .from("settings")
        .insert([defaultSettings])
        .select()
        .single()

      if (insertError) {
        return NextResponse.json({ error: "Failed to create default settings" }, { status: 500 })
      }

      return NextResponse.json(newSettings)
    }

    return NextResponse.json(settings)
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const newSettings = await request.json()

    // First, get the current settings to get the ID
    const { data: currentSettings, error: getCurrentError } = await supabase.from("settings").select("id").single()

    if (getCurrentError) {
      return NextResponse.json({ error: "Failed to get current settings" }, { status: 500 })
    }

    // Update the settings
    const { data: settings, error } = await supabase
      .from("settings")
      .update({
        store_pin: newSettings.store_pin,
        points_for_reward: newSettings.points_for_reward,
        admin_username: newSettings.admin_username,
        admin_password: newSettings.admin_password,
        updated_at: new Date().toISOString(),
      })
      .eq("id", currentSettings.id)
      .select()
      .single()

    if (error) {
      console.error("Settings update error:", error)
      return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
    }

    return NextResponse.json({ success: true, settings })
  } catch (error) {
    console.error("Settings API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
