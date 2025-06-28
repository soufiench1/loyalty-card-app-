// Utility to trigger customer list refresh
export const triggerCustomerRefresh = () => {
  // Trigger storage event for cross-tab communication
  localStorage.setItem("customer_created", Date.now().toString())
  localStorage.removeItem("customer_created")

  // Trigger custom event for same-tab communication
  window.dispatchEvent(
    new CustomEvent("customerCreated", {
      detail: { timestamp: Date.now() },
    }),
  )

  console.log("🚀 Customer refresh triggered")
}
