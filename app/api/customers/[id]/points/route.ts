import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const customerId = params.id
    console.log("Fetching customer points for ID:", customerId)

    // Get customer info
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("name, rewards")
      .eq("id", customerId)
      .single()

    if (customerError) {
      console.error("Customer query error:", customerError)
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    if (!customer) {
      console.log("No customer found for ID:", customerId)
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    // Get customer item points
    const { data: customerItemPoints, error: pointsError } = await supabase
      .from("customer_item_points")
      .select("item_id, points")
      .eq("customer_id", customerId)

    if (pointsError) {
      console.error("Points query error:", pointsError)
      return NextResponse.json({ error: "Failed to fetch customer points" }, { status: 500 })
    }

    // Convert to object with item_id as key
    const itemPoints: { [key: number]: number } = {}
    customerItemPoints?.forEach((record) => {
      itemPoints[record.item_id] = record.points
    })

    console.log("Successfully fetched customer data:", { customerId, customerName: customer.name, itemPoints })

    return NextResponse.json({
      customerName: customer.name,
      totalRewards: customer.rewards,
      itemPoints,
    })
  } catch (error) {
    console.error("Get customer points error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

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
