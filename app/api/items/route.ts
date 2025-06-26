import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    const { data: items, error } = await supabase.from("items").select("*").eq("is_active", true).order("name")

    if (error) {
      return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 })
    }

    return NextResponse.json(items || [])
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description, points_value, price, is_active } = await request.json()

    if (!name || points_value < 1 || price < 0) {
      return NextResponse.json({ error: "Invalid item data" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("items")
      .insert([
        {
          name,
          description: description || "",
          points_value,
          price,
          is_active: is_active ?? true,
        },
      ])
      .select()

    if (error) {
      return NextResponse.json({ error: "Failed to create item" }, { status: 500 })
    }

    return NextResponse.json({ success: true, item: data[0] })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
