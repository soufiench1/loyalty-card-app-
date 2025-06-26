import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const customerId = params.id

    // Delete customer (this will cascade delete related records due to foreign key constraints)
    const { error } = await supabase.from("customers").delete().eq("id", customerId)

    if (error) {
      console.error("Delete customer error:", error)
      return NextResponse.json({ error: "Failed to delete customer" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Customer deleted successfully" })
  } catch (error) {
    console.error("Delete customer API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
