"use client"

import { useState, useEffect, useCallback } from "react"

interface Customer {
  id: string
  name: string
  points: number
  rewards: number
  created_at: string
}

export function useRealtimeCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const fetchCustomers = useCallback(async () => {
    try {
      const timestamp = Date.now()
      const response = await fetch(`/api/admin/customers?t=${timestamp}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setCustomers((prev) => {
          // Only update if data actually changed
          if (JSON.stringify(prev) !== JSON.stringify(data)) {
            console.log("🔄 Customer list updated:", data.length, "customers")
            setLastUpdate(new Date())
            return data
          }
          return prev
        })
        setError("")
      } else {
        setError("Failed to fetch customers")
      }
    } catch (err) {
      console.error("Customer fetch error:", err)
      setError("Network error")
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  // Real-time polling every 500ms
  useEffect(() => {
    const interval = setInterval(fetchCustomers, 500)
    return () => clearInterval(interval)
  }, [fetchCustomers])

  // Listen for customer creation events
  useEffect(() => {
    const handleCustomerCreated = () => {
      console.log("🚀 Customer creation detected, refreshing...")
      fetchCustomers()
    }

    // Listen for storage events (cross-tab communication)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "customer_created") {
        handleCustomerCreated()
      }
    }

    // Listen for custom events
    window.addEventListener("customerCreated", handleCustomerCreated)
    window.addEventListener("storage", handleStorageChange)

    return () => {
      window.removeEventListener("customerCreated", handleCustomerCreated)
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [fetchCustomers])

  return {
    customers,
    isLoading,
    error,
    lastUpdate,
    refetch: fetchCustomers,
  }
}
