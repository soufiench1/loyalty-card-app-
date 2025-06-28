"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { triggerCustomerRefresh } from "@/lib/customer-sync"

export default function CustomerForm() {
  const [name, setName] = useState("")
  const [pin, setPin] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify({ name, pin }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log("✅ Customer created:", result)

        // Trigger immediate refresh in admin panel
        triggerCustomerRefresh()

        // Reset form
        setName("")
        setPin("")

        alert("Customer created successfully!")
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error("Error creating customer:", error)
      alert("Failed to create customer")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input type="text" placeholder="Customer Name" value={name} onChange={(e) => setName(e.target.value)} required />
      <Input type="password" placeholder="PIN" value={pin} onChange={(e) => setPin(e.target.value)} required />
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "Creating..." : "Create Customer"}
      </Button>
    </form>
  )
}
