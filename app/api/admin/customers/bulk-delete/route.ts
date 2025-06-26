import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function DELETE(request: NextRequest) {
  try {
    const { customerIds, deleteAll } = await request.json()

    if (deleteAll) {
      // Delete all customers
      const { error } = await supabase.from("customers").delete().neq("id", "")

      if (error) {
        console.error("Delete all customers error:", error)
        return NextResponse.json({ error: "Failed to delete all customers" }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: "All customers deleted successfully" })
    } else if (customerIds && Array.isArray(customerIds)) {
      // Delete selected customers
      const { error } = await supabase.from("customers").delete().in("id", customerIds)

      if (error) {
        console.error("Delete selected customers error:", error)
        return NextResponse.json({ error: "Failed to delete selected customers" }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: `${customerIds.length} customers deleted successfully`,
      })
    } else {
      return NextResponse.json({ error: "Invalid request parameters" }, { status: 400 })
    }
  } catch (error) {
    console.error("Bulk delete customers API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
