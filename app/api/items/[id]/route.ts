import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { name, description, points_value, price, is_active } = await request.json()
    const itemId = Number.parseInt(params.id)

    if (!name || points_value < 1 || price < 0) {
      return NextResponse.json({ error: "Invalid item data" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("items")
      .update({
        name,
        description: description || "",
        points_value,
        price,
        is_active: is_active ?? true,
      })
      .eq("id", itemId)
      .select()

    if (error) {
      return NextResponse.json({ error: "Failed to update item" }, { status: 500 })
    }

    return NextResponse.json({ success: true, item: data[0] })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const itemId = Number.parseInt(params.id)

    const { error } = await supabase.from("items").delete().eq("id", itemId)

    if (error) {
      return NextResponse.json({ error: "Failed to delete item" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
