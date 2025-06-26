import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    // Try to get branding settings, but handle gracefully if table doesn't exist
    const { data: branding, error } = await supabase.from("branding").select("*").single()

    if (error) {
      console.log("Branding table error:", error.message)

      // Return default branding settings if database isn't set up
      const defaultBranding = {
        id: 1,
        business_name: "Loyalty Card App",
        primary_color: "#3b82f6",
        secondary_color: "#10b981",
        logo_url: "",
        welcome_message: "Join our loyalty program and earn rewards!",
        updated_at: new Date().toISOString(),
      }

      // Try to create the branding record
      try {
        const { data: newBranding, error: insertError } = await supabase
          .from("branding")
          .insert([
            {
              business_name: "Loyalty Card App",
              primary_color: "#3b82f6",
              secondary_color: "#10b981",
              logo_url: "",
              welcome_message: "Join our loyalty program and earn rewards!",
            },
          ])
          .select()
          .single()

        if (!insertError && newBranding) {
          return NextResponse.json(newBranding)
        }
      } catch (insertErr) {
        console.log("Could not create branding, using defaults")
      }

      // Return defaults if we can't create in database
      return NextResponse.json(defaultBranding)
    }

    return NextResponse.json(branding)
  } catch (error) {
    console.error("Branding GET error:", error)

    // Return default branding as fallback
    return NextResponse.json({
      id: 1,
      business_name: "Loyalty Card App",
      primary_color: "#3b82f6",
      secondary_color: "#10b981",
      logo_url: "",
      welcome_message: "Join our loyalty program and earn rewards!",
      updated_at: new Date().toISOString(),
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const newBranding = await request.json()

    // Validate required fields
    if (!newBranding.business_name) {
      return NextResponse.json({ error: "Business name is required" }, { status: 400 })
    }

    // First, get the current branding to get the ID
    const { data: currentBranding, error: getCurrentError } = await supabase.from("branding").select("id").single()

    if (getCurrentError) {
      // If no branding exists, create new ones
      const { data: branding, error: insertError } = await supabase
        .from("branding")
        .insert([
          {
            business_name: newBranding.business_name || "Loyalty Card App",
            primary_color: newBranding.primary_color || "#3b82f6",
            secondary_color: newBranding.secondary_color || "#10b981",
            logo_url: newBranding.logo_url || "",
            welcome_message: newBranding.welcome_message || "Join our loyalty program and earn rewards!",
          },
        ])
        .select()
        .single()

      if (insertError) {
        console.error("Branding insert error:", insertError)
        return NextResponse.json({ error: "Failed to create branding settings" }, { status: 500 })
      }

      return NextResponse.json({ success: true, branding })
    }

    // Update the existing branding
    const { data: branding, error } = await supabase
      .from("branding")
      .update({
        business_name: newBranding.business_name || "Loyalty Card App",
        primary_color: newBranding.primary_color || "#3b82f6",
        secondary_color: newBranding.secondary_color || "#10b981",
        logo_url: newBranding.logo_url || "",
        welcome_message: newBranding.welcome_message || "Join our loyalty program and earn rewards!",
        updated_at: new Date().toISOString(),
      })
      .eq("id", currentBranding.id)
      .select()
      .single()

    if (error) {
      console.error("Branding update error:", error)
      return NextResponse.json({ error: "Failed to update branding settings" }, { status: 500 })
    }

    return NextResponse.json({ success: true, branding })
  } catch (error) {
    console.error("Branding POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
