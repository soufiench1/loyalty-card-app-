import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    // Get total customers
    const { count: totalCustomers, error: customersError } = await supabase
      .from("customers")
      .select("*", { count: "exact", head: true })

    if (customersError) {
      console.error("Error fetching customer count:", customersError)
    }

    // Get total rewards
    const { data: customers, error: rewardsError } = await supabase.from("customers").select("rewards")

    if (rewardsError) {
      console.error("Error fetching rewards:", rewardsError)
    }

    const totalRewards = customers?.reduce((sum, customer) => sum + customer.rewards, 0) || 0

    // Get total transactions
    const { count: totalTransactions, error: transactionsError } = await supabase
      .from("point_transactions")
      .select("*", { count: "exact", head: true })

    if (transactionsError) {
      console.error("Error fetching transaction count:", transactionsError)
    }

    // Get average points per customer
    const { data: customerPoints, error: pointsError } = await supabase
      .from("customer_item_points")
      .select("customer_id, points")

    let averagePointsPerCustomer = 0
    if (!pointsError && customerPoints) {
      const customerPointsMap = new Map()
      customerPoints.forEach((cp) => {
        const current = customerPointsMap.get(cp.customer_id) || 0
        customerPointsMap.set(cp.customer_id, current + cp.points)
      })
      const totalPoints = Array.from(customerPointsMap.values()).reduce((sum, points) => sum + points, 0)
      averagePointsPerCustomer = customerPointsMap.size > 0 ? totalPoints / customerPointsMap.size : 0
    }

    // Get top items by transaction count
    const { data: topItemsData, error: topItemsError } = await supabase.from("point_transactions").select(`
    item_id,
    items!inner(name)
  `)

    let topItems: Array<{ name: string; count: number }> = []
    if (!topItemsError && topItemsData) {
      const itemCounts = new Map()
      topItemsData.forEach((transaction: any) => {
        const itemName = transaction.items?.name
        if (itemName) {
          itemCounts.set(itemName, (itemCounts.get(itemName) || 0) + 1)
        }
      })

      topItems = Array.from(itemCounts.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
    }

    // Get recent transactions
    const { data: recentTransactions, error: recentError } = await supabase
      .from("point_transactions")
      .select(`
    id,
    points_added,
    reward_earned,
    created_at,
    customers!inner(name),
    items!inner(name)
  `)
      .order("created_at", { ascending: false })
      .limit(20)

    const formattedRecentTransactions =
      recentTransactions?.map((transaction: any) => ({
        id: transaction.id,
        customer_name: transaction.customers?.name || "Unknown Customer",
        item_name: transaction.items?.name || "Unknown Item",
        points_added: transaction.points_added,
        reward_earned: transaction.reward_earned,
        created_at: transaction.created_at,
      })) || []

    // Get customer growth (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: customerGrowthData, error: growthError } = await supabase
      .from("customers")
      .select("created_at")
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: true })

    let customerGrowth: Array<{ date: string; count: number }> = []
    if (!growthError && customerGrowthData) {
      const growthMap = new Map()
      customerGrowthData.forEach((customer) => {
        const date = new Date(customer.created_at).toISOString().split("T")[0]
        growthMap.set(date, (growthMap.get(date) || 0) + 1)
      })

      customerGrowth = Array.from(growthMap.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date))
    }

    // Get reward trends (last 30 days)
    const { data: rewardTrendsData, error: rewardTrendsError } = await supabase
      .from("point_transactions")
      .select("created_at, reward_earned")
      .gte("created_at", thirtyDaysAgo.toISOString())
      .eq("reward_earned", true)
      .order("created_at", { ascending: true })

    let rewardTrends: Array<{ date: string; rewards: number }> = []
    if (!rewardTrendsError && rewardTrendsData) {
      const trendsMap = new Map()
      rewardTrendsData.forEach((transaction) => {
        const date = new Date(transaction.created_at).toISOString().split("T")[0]
        trendsMap.set(date, (trendsMap.get(date) || 0) + 1)
      })

      rewardTrends = Array.from(trendsMap.entries())
        .map(([date, rewards]) => ({ date, rewards }))
        .sort((a, b) => a.date.localeCompare(b.date))
    }

    return NextResponse.json({
      totalCustomers: totalCustomers || 0,
      totalRewards,
      totalTransactions: totalTransactions || 0,
      averagePointsPerCustomer,
      topItems,
      recentTransactions: formattedRecentTransactions,
      customerGrowth,
      rewardTrends,
    })
  } catch (error) {
    console.error("Analytics API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
