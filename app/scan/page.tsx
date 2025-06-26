"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { QrCode, Plus, Keyboard, Shield, Clock, LogOut, CheckCircle } from "lucide-react"
import QRScanner from "@/components/qr-scanner"
import {
  isScanSessionValid,
  isAdminSessionValid,
  createScanSession,
  clearAllSessions,
  getRemainingTime,
  formatRemainingTime,
} from "@/lib/session"

interface Item {
  id: number
  name: string
  description: string
  points_value: number
  price: number
}

export default function ScanPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loginError, setLoginError] = useState("")
  const [remainingTime, setRemainingTime] = useState(0)

  const [customerId, setCustomerId] = useState("")
  const [selectedItemId, setSelectedItemId] = useState("")
  const [items, setItems] = useState<Item[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [activeTab, setActiveTab] = useState("scan")

  const [customerPoints, setCustomerPoints] = useState<{ [itemId: number]: number }>({})
  const [customerInfo, setCustomerInfo] = useState<{ name: string; totalRewards: number } | null>(null)

  // Check session on mount - check both admin and scan sessions
  useEffect(() => {
    if (isScanSessionValid() || isAdminSessionValid()) {
      setIsAuthenticated(true)
      loadItems()
    }
  }, [])

  // Update remaining time every second
  useEffect(() => {
    if (!isAuthenticated) return

    const interval = setInterval(() => {
      const remaining = getRemainingTime("scan")
      setRemainingTime(remaining)

      if (remaining <= 0) {
        handleLogout()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [isAuthenticated])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError("")

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      if (response.ok) {
        createScanSession()
        setIsAuthenticated(true)
        setRemainingTime(getRemainingTime("scan"))
        loadItems()
        setUsername("")
        setPassword("")
      } else {
        setLoginError("Invalid credentials")
      }
    } catch (error) {
      setLoginError("Login failed. Please try again.")
    }
  }

  const handleLogout = () => {
    clearAllSessions()
    setIsAuthenticated(false)
    setCustomerId("")
    setSelectedItemId("")
    setMessage("")
    setActiveTab("scan")
    setCustomerInfo(null)
    setCustomerPoints({})
  }

  const loadItems = async () => {
    try {
      const response = await fetch("/api/items")
      if (response.ok) {
        const data = await response.json()
        setItems(data)
      }
    } catch (error) {
      console.error("Failed to load items:", error)
    }
  }

  const handleQRScan = async (result: string) => {
    console.log("QR Scan result:", result)
    setCustomerId(result)
    setActiveTab("manual") // Switch to manual tab after scanning

    // Fetch customer points for all items
    await fetchCustomerPoints(result)
  }

  const fetchCustomerPoints = async (customerId: string) => {
    try {
      console.log("Fetching customer points for:", customerId)
      const response = await fetch(`/api/customers/${customerId}/points`)

      if (response.ok) {
        const data = await response.json()
        console.log("Customer data received:", data)
        setCustomerPoints(data.itemPoints || {})
        setCustomerInfo({
          name: data.customerName,
          totalRewards: data.totalRewards,
        })
        setMessage(`Customer found: ${data.customerName}`)
      } else {
        const errorData = await response.json()
        console.error("Failed to fetch customer points:", errorData)
        setCustomerPoints({})
        setCustomerInfo(null)
        setMessage(`Customer not found: ${errorData.error}`)
      }
    } catch (error) {
      console.error("Failed to fetch customer points:", error)
      setCustomerPoints({})
      setCustomerInfo(null)
      setMessage("Error fetching customer data")
    }
  }

  const handleAddPoints = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage("")

    try {
      const response = await fetch("/api/points/add-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId,
          itemId: Number.parseInt(selectedItemId),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(
          `✅ Points added for ${data.itemName}! Customer now has ${data.totalItemPoints} points for this item. ${data.rewardEarned ? "🎉 Reward earned!" : ""}`,
        )

        // Refresh customer points after adding
        await fetchCustomerPoints(customerId)

        setSelectedItemId("")
      } else {
        setMessage(`❌ ${data.error || "Failed to add points"}`)
      }
    } catch (error) {
      setMessage("❌ Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="mx-auto h-12 w-12 text-purple-600" />
            <CardTitle>Scan Access</CardTitle>
            <CardDescription>Enter your credentials to access the scanning system</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full">
                Login
              </Button>
            </form>

            {loginError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-700">{loginError}</p>
              </div>
            )}

            {/* Default Credentials Info */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Default Credentials:</h4>
              <div className="text-sm text-blue-700 space-y-1">
                <p>
                  <strong>Username:</strong> admin
                </p>
                <p>
                  <strong>Password:</strong> password123
                </p>
              </div>
              <p className="text-xs text-blue-600 mt-2">Session expires after 30 minutes of inactivity.</p>
            </div>

            <div className="mt-4 text-center">
              <Button variant="outline" asChild>
                <a href="/">Back to Home</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Main scanning interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header with session info */}
        <div className="flex justify-between items-center">
          <div className="text-center flex-1">
            <QrCode className="mx-auto h-12 w-12 text-emerald-600" />
            <h1 className="mt-4 text-3xl font-bold text-gray-900">Scan & Earn</h1>
            <p className="mt-2 text-gray-600">Add points to customer loyalty cards</p>
          </div>

          {/* Session info and logout */}
          <div className="flex flex-col items-end space-y-2">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>{formatRemainingTime(remainingTime)}</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="scan" className="flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              Scan QR Code
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <Keyboard className="h-4 w-4" />
              Manual Entry
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scan" className="space-y-4">
            <QRScanner onScan={handleQRScan} isActive={activeTab === "scan"} />

            {customerId && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <p className="text-sm font-medium text-green-700">QR Code Scanned Successfully!</p>
                    </div>
                    <p className="text-sm text-gray-600">Customer ID:</p>
                    <code className="bg-gray-100 px-3 py-1 rounded text-sm font-mono">{customerId}</code>
                    <p className="text-xs text-green-600 mt-2">
                      Switch to Manual Entry tab to complete the transaction
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Add Points for Purchase
                </CardTitle>
                <CardDescription>
                  Enter customer ID and select purchased item (No PIN required for admin)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddPoints} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerId">Customer ID</Label>
                    <Input
                      id="customerId"
                      type="text"
                      placeholder="Enter customer ID or scan QR code"
                      value={customerId}
                      onChange={(e) => {
                        setCustomerId(e.target.value)
                        if (e.target.value) {
                          fetchCustomerPoints(e.target.value)
                        }
                      }}
                      required
                    />
                    <p className="text-xs text-gray-500">
                      Customer can provide their ID manually or you can scan their QR code
                    </p>
                  </div>

                  {customerInfo && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Customer: {customerInfo.name}</h4>
                      <p className="text-sm text-blue-700 mb-2">Total Rewards Earned: {customerInfo.totalRewards}</p>
                      <div className="text-sm text-blue-700">
                        <p className="font-medium mb-1">Current Points per Item:</p>
                        {items.length > 0 ? (
                          <div className="grid grid-cols-1 gap-1">
                            {items.map((item) => (
                              <div key={item.id} className="flex justify-between">
                                <span>{item.name}:</span>
                                <span className="font-medium">{customerPoints[item.id] || 0} points</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p>No items available</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="item">Item Purchased</Label>
                    <Select value={selectedItemId} onValueChange={setSelectedItemId} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select item purchased" />
                      </SelectTrigger>
                      <SelectContent>
                        {items.map((item) => (
                          <SelectItem key={item.id} value={item.id.toString()}>
                            <div className="flex justify-between items-center w-full">
                              <span>{item.name}</span>
                              <span className="text-sm text-gray-500 ml-2">
                                {item.points_value} pts - ${item.price}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading || !selectedItemId}>
                    {isLoading ? "Adding Points..." : "Add Points"}
                  </Button>
                </form>

                {message && (
                  <div
                    className={`mt-4 p-3 rounded-md text-sm ${
                      message.includes("✅") || message.includes("🎉")
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : message.includes("❌")
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : "bg-blue-50 text-blue-700 border border-blue-200"
                    }`}
                  >
                    {message}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="text-center space-x-4">
          <Button variant="outline" asChild>
            <a href="/">Back to Home</a>
          </Button>
          <Button variant="outline" asChild>
            <a href="/admin">Admin Dashboard</a>
          </Button>
        </div>
      </div>
    </div>
  )
}
