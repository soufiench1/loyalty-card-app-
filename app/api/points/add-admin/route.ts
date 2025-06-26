import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { customerId, itemId } = await request.json()

    if (!customerId || !itemId) {
      return NextResponse.json({ error: "Customer ID and item ID are required" }, { status: 400 })
    }

    // Get current settings (no PIN check for admin)
    const { data: settings, error: settingsError } = await supabase.from("settings").select("*").single()

    if (settingsError || !settings) {
      return NextResponse.json({ error: "Failed to load settings" }, { status: 500 })
    }

    // Get customer
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("*")
      .eq("id", customerId)
      .single()

    if (customerError || !customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    // Get item
    const { data: item, error: itemError } = await supabase
      .from("items")
      .select("*")
      .eq("id", itemId)
      .eq("is_active", true)
      .single()

    if (itemError || !item) {
      return NextResponse.json({ error: "Item not found or inactive" }, { status: 404 })
    }

    // Get or create customer item points record
    let { data: customerItemPoints, error: cipError } = await supabase
      .from("customer_item_points")
      .select("*")
      .eq("customer_id", customerId)
      .eq("item_id", itemId)
      .single()

    if (cipError && cipError.code !== "PGRST116") {
      // Error other than "not found"
      return NextResponse.json({ error: "Failed to fetch customer item points" }, { status: 500 })
    }

    if (!customerItemPoints) {
      // Create new record
      const { data: newRecord, error: createError } = await supabase
        .from("customer_item_points")
        .insert([
          {
            customer_id: customerId,
            item_id: itemId,
            points: 0,
          },
        ])
        .select()
        .single()

      if (createError) {
        return NextResponse.json({ error: "Failed to create customer item points record" }, { status: 500 })
      }

      customerItemPoints = newRecord
    }

    // Add points based on item's point value
    const newItemPoints = customerItemPoints.points + item.points_value
    let rewardEarned = false

    // Check for reward
    if (newItemPoints >= settings.points_for_reward) {
      rewardEarned = true
      // Update customer rewards
      await supabase
        .from("customers")
        .update({
          rewards: customer.rewards + 1,
        })
        .eq("id", customerId)
    }

    // Update customer item points
    const { error: updateError } = await supabase
      .from("customer_item_points")
      .update({
        points: rewardEarned ? newItemPoints - settings.points_for_reward : newItemPoints,
      })
      .eq("customer_id", customerId)
      .eq("item_id", itemId)

    if (updateError) {
      return NextResponse.json({ error: "Failed to update customer item points" }, { status: 500 })
    }

    // Log transaction
    await supabase.from("point_transactions").insert([
      {
        customer_id: customerId,
        item_id: itemId,
        points_added: item.points_value,
        reward_earned: rewardEarned,
      },
    ])

    return NextResponse.json({
      success: true,
      itemName: item.name,
      totalItemPoints: rewardEarned ? newItemPoints - settings.points_for_reward : newItemPoints,
      rewardEarned,
      message: rewardEarned
        ? `${item.points_value} points added for ${item.name} and reward earned!`
        : `${item.points_value} points added for ${item.name}`,
    })
  } catch (error) {
    console.error("Add points error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
