import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    // Get customer count
    const { count: totalCustomers, error: customersError } = await supabase
      .from("customers")
      .select("*", { count: "exact", head: true })

    if (customersError) {
      return NextResponse.json({ error: "Failed to fetch customer stats" }, { status: 500 })
    }

    // Get total points and rewards
    const { data: customers, error: pointsError } = await supabase.from("customers").select("points, rewards")

    if (pointsError) {
      return NextResponse.json({ error: "Failed to fetch points stats" }, { status: 500 })
    }

    const totalPoints = customers?.reduce((sum, customer) => sum + customer.points, 0) || 0
    const totalRewards = customers?.reduce((sum, customer) => sum + customer.rewards, 0) || 0

    return NextResponse.json({
      totalCustomers: totalCustomers || 0,
      totalPoints,
      totalRewards,
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
