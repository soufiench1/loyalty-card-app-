// Utility to trigger immediate customer list refresh
export const triggerCustomerRefresh = () => {
  // Trigger storage event to notify admin panel
  localStorage.setItem("customer_created", Date.now().toString())
  localStorage.removeItem("customer_created")

  // Also trigger a custom event
  window.dispatchEvent(
    new CustomEvent("customerCreated", {
      detail: { timestamp: Date.now() },
    }),
  )
}

// Function to force refresh customer data
export const forceCustomerRefresh = async () => {
  try {
    const timestamp = Date.now()
    const response = await fetch(`/api/admin/customers?t=${timestamp}&force=true`, {
      method: "GET",
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    })

    if (response.ok) {
      const data = await response.json()
      console.log("🔄 Force refresh successful:", data.length, "customers")
      return data
    }
  } catch (error) {
    console.error("Force refresh failed:", error)
  }
}
