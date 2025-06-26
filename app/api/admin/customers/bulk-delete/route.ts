import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function DELETE(request: NextRequest) {
  try {
    const { customerIds, deleteAll } = await request.json()

    if (deleteAll) {
      // Delete all customers and their related data

      // First delete all point transactions
      const { error: transactionError } = await supabase.from("point_transactions").delete().neq("id", 0) // Delete all records

      if (transactionError) {
        console.error("Delete all transactions error:", transactionError)
      }

      // Delete all customer item points
      const { error: pointsError } = await supabase.from("customer_item_points").delete().neq("id", 0) // Delete all records

      if (pointsError) {
        console.error("Delete all customer points error:", pointsError)
      }

      // Finally delete all customers
      const { error: customerError } = await supabase.from("customers").delete().neq("id", "") // Delete all records

      if (customerError) {
        console.error("Delete all customers error:", customerError)
        return NextResponse.json({ error: "Failed to delete all customers" }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: "All customers deleted successfully" })
    } else if (customerIds && Array.isArray(customerIds)) {
      // Delete selected customers and their related data

      // Delete point transactions for selected customers
      const { error: transactionError } = await supabase
        .from("point_transactions")
        .delete()
        .in("customer_id", customerIds)

      if (transactionError) {
        console.error("Delete selected transactions error:", transactionError)
      }

      // Delete customer item points for selected customers
      const { error: pointsError } = await supabase.from("customer_item_points").delete().in("customer_id", customerIds)

      if (pointsError) {
        console.error("Delete selected customer points error:", pointsError)
      }

      // Finally delete the selected customers
      const { error: customerError } = await supabase.from("customers").delete().in("id", customerIds)

      if (customerError) {
        console.error("Delete selected customers error:", customerError)
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
