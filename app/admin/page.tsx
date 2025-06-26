"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Shield, Users, BarChart3, ShoppingCart, Plus, Edit, Trash2, QrCode, UserX, AlertTriangle } from "lucide-react"
import {
  createAdminSession,
  isAdminSessionValid,
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
  is_active: boolean
}

interface Customer {
  id: string
  name: string
  points: number
  rewards: number
  created_at: string
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [customers, setCustomers] = useState<Customer[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [stats, setStats] = useState({ totalCustomers: 0, totalPoints: 0, totalRewards: 0 })
  const [settings, setSettings] = useState({
    store_pin: "1234",
    points_for_reward: 10,
    admin_username: "admin",
    admin_password: "password123",
  })
  const [remainingTime, setRemainingTime] = useState(0)
  const [isSavingSettings, setIsSavingSettings] = useState(false)

  // Customer deletion state
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([])
  const [isDeleting, setIsDeleting] = useState(false)

  // Item form state
  const [itemForm, setItemForm] = useState({
    id: 0,
    name: "",
    description: "",
    points_value: 1,
    price: 0,
    is_active: true,
  })
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false)
  const [isEditingItem, setIsEditingItem] = useState(false)

  // Check session on mount
  useEffect(() => {
    if (isAdminSessionValid()) {
      setIsAuthenticated(true)
      loadData()
    }
  }, [])

  // Update remaining time every second
  useEffect(() => {
    if (!isAuthenticated) return

    const interval = setInterval(() => {
      const remaining = getRemainingTime("admin")
      setRemainingTime(remaining)

      if (remaining <= 0) {
        handleLogout()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [isAuthenticated])

  const handleLogin = async (e: any) => {
    e.preventDefault()

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      if (response.ok) {
        createAdminSession() // This also creates scan session
        setIsAuthenticated(true)
        setRemainingTime(getRemainingTime("admin"))
        loadData()
      } else {
        alert("Invalid credentials")
      }
    } catch (error) {
      alert("Login failed")
    }
  }

  const handleLogout = () => {
    clearAllSessions()
    setIsAuthenticated(false)
  }

  const loadData = async () => {
    try {
      // Load customers
      const customersResponse = await fetch("/api/admin/customers")
      if (customersResponse.ok) {
        const customersData = await customersResponse.json()
        setCustomers(customersData)
      }

      // Load items
      const itemsResponse = await fetch("/api/items")
      if (itemsResponse.ok) {
        const itemsData = await itemsResponse.json()
        setItems(itemsData)
      }

      // Load stats
      const statsResponse = await fetch("/api/admin/stats")
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }

      // Load settings
      const settingsResponse = await fetch("/api/admin/settings")
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json()
        setSettings(settingsData)
      }
    } catch (error) {
      console.error("Failed to load data:", error)
    }
  }

  const handleSaveSettings = async () => {
    setIsSavingSettings(true)
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        alert("Settings saved successfully!")
      } else {
        alert("Failed to save settings")
      }
    } catch (error) {
      alert("Error saving settings")
    } finally {
      setIsSavingSettings(false)
    }
  }

  const handleSaveItem = async (e: any) => {
    e.preventDefault()

    try {
      const url = isEditingItem ? `/api/items/${itemForm.id}` : "/api/items"
      const method = isEditingItem ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(itemForm),
      })

      if (response.ok) {
        setIsItemDialogOpen(false)
        resetItemForm()
        loadData()
        alert(isEditingItem ? "Item updated successfully!" : "Item created successfully!")
      } else {
        alert("Failed to save item")
      }
    } catch (error) {
      alert("Error saving item")
    }
  }

  const handleEditItem = (item: Item) => {
    setItemForm(item)
    setIsEditingItem(true)
    setIsItemDialogOpen(true)
  }

  const handleDeleteItem = async (itemId: number) => {
    if (!confirm("Are you sure you want to delete this item?")) return

    try {
      const response = await fetch(`/api/items/${itemId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        loadData()
        alert("Item deleted successfully!")
      } else {
        alert("Failed to delete item")
      }
    } catch (error) {
      alert("Error deleting item")
    }
  }

  const handleDeleteCustomer = async (customerId: string, customerName: string) => {
    if (!confirm(`Are you sure you want to delete customer "${customerName}"? This action cannot be undone.`)) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/admin/customers/${customerId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        loadData()
        alert("Customer deleted successfully!")
      } else {
        alert("Failed to delete customer")
      }
    } catch (error) {
      alert("Error deleting customer")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedCustomers.length === 0) {
      alert("Please select customers to delete")
      return
    }

    if (
      !confirm(
        `Are you sure you want to delete ${selectedCustomers.length} selected customers? This action cannot be undone.`,
      )
    )
      return

    setIsDeleting(true)
    try {
      const response = await fetch("/api/admin/customers/bulk-delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ customerIds: selectedCustomers }),
      })

      if (response.ok) {
        setSelectedCustomers([])
        loadData()
        alert(`${selectedCustomers.length} customers deleted successfully!`)
      } else {
        alert("Failed to delete selected customers")
      }
    } catch (error) {
      alert("Error deleting customers")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteAllCustomers = async () => {
    if (
      !confirm(
        "⚠️ WARNING: This will delete ALL customers and their data permanently. This action cannot be undone. Are you absolutely sure?",
      )
    )
      return

    if (
      !confirm(
        "This is your final warning. Deleting all customers will remove all loyalty data, points, and transaction history. Type 'DELETE ALL' in the next prompt to confirm.",
      )
    )
      return

    const confirmation = prompt('Type "DELETE ALL" to confirm deletion of all customers:')
    if (confirmation !== "DELETE ALL") {
      alert("Deletion cancelled - confirmation text did not match")
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch("/api/admin/customers/bulk-delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ deleteAll: true }),
      })

      if (response.ok) {
        setSelectedCustomers([])
        loadData()
        alert("All customers deleted successfully!")
      } else {
        alert("Failed to delete all customers")
      }
    } catch (error) {
      alert("Error deleting all customers")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSelectCustomer = (customerId: string, checked: boolean) => {
    if (checked) {
      setSelectedCustomers([...selectedCustomers, customerId])
    } else {
      setSelectedCustomers(selectedCustomers.filter((id) => id !== customerId))
    }
  }

  const handleSelectAllCustomers = (checked: boolean) => {
    if (checked) {
      setSelectedCustomers(customers.map((customer) => customer.id))
    } else {
      setSelectedCustomers([])
    }
  }

  const resetItemForm = () => {
    setItemForm({
      id: 0,
      name: "",
      description: "",
      points_value: 1,
      price: 0,
      is_active: true,
    })
    setIsEditingItem(false)
  }

  const openNewItemDialog = () => {
    resetItemForm()
    setIsItemDialogOpen(true)
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="mx-auto h-12 w-12 text-purple-600" />
            <CardTitle>Admin Login</CardTitle>
            <CardDescription>Enter your admin credentials to access the dashboard</CardDescription>
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
              <p className="text-xs text-blue-600 mt-2">Change these credentials in Settings after logging in.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Manage your loyalty card system</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">Session: {formatRemainingTime(remainingTime)}</div>
            <Button asChild>
              <a href="/scan">
                <QrCode className="mr-2 h-4 w-4" />
                Scan QR Code
              </a>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="items">Items</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalCustomers}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Items</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{items.filter((item) => item.is_active).length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Rewards Redeemed</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalRewards}</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="customers" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Customer Management</CardTitle>
                    <CardDescription>All registered customers and their points</CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    {selectedCustomers.length > 0 && (
                      <Button variant="destructive" onClick={handleBulkDelete} disabled={isDeleting}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Selected ({selectedCustomers.length})
                      </Button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" disabled={isDeleting || customers.length === 0}>
                          <UserX className="mr-2 h-4 w-4" />
                          Delete All Customers
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                            Delete All Customers
                          </AlertDialogTitle>
                          <AlertDialogDescription className="space-y-2">
                            <p className="font-semibold text-red-600">⚠️ DANGER ZONE ⚠️</p>
                            <p>
                              This will permanently delete <strong>ALL {customers.length} customers</strong> and their
                              associated data including:
                            </p>
                            <ul className="list-disc list-inside space-y-1 text-sm">
                              <li>Customer profiles and contact information</li>
                              <li>All accumulated points for all items</li>
                              <li>Reward redemption history</li>
                              <li>Transaction logs and purchase history</li>
                            </ul>
                            <p className="font-semibold text-red-600">This action cannot be undone!</p>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteAllCustomers} className="bg-red-600 hover:bg-red-700">
                            I understand, Delete All
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {customers.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No customers registered yet.</p>
                  ) : (
                    <>
                      {/* Select All Checkbox */}
                      <div className="flex items-center space-x-2 pb-2 border-b">
                        <Checkbox
                          id="select-all"
                          checked={selectedCustomers.length === customers.length}
                          onCheckedChange={handleSelectAllCustomers}
                        />
                        <Label htmlFor="select-all" className="text-sm font-medium">
                          Select All ({customers.length} customers)
                        </Label>
                      </div>

                      {/* Customer List */}
                      {customers.map((customer) => (
                        <div key={customer.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Checkbox
                              checked={selectedCustomers.includes(customer.id)}
                              onCheckedChange={(checked) => handleSelectCustomer(customer.id, checked as boolean)}
                            />
                            <div>
                              <h3 className="font-medium">{customer.name}</h3>
                              <p className="text-sm text-gray-500">ID: {customer.id}</p>
                              <p className="text-xs text-gray-400">
                                Joined: {new Date(customer.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <p className="font-medium">{customer.points} points</p>
                              <p className="text-sm text-gray-500">{customer.rewards} rewards</p>
                            </div>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteCustomer(customer.id, customer.name)}
                              disabled={isDeleting}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="items" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Item Management</CardTitle>
                  <CardDescription>Manage your store items and their point values</CardDescription>
                </div>
                <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={openNewItemDialog}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Item
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{isEditingItem ? "Edit Item" : "Add New Item"}</DialogTitle>
                      <DialogDescription>
                        {isEditingItem ? "Update item details" : "Create a new item for your store"}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSaveItem} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="itemName">Item Name</Label>
                        <Input
                          id="itemName"
                          value={itemForm.name}
                          onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="itemDescription">Description</Label>
                        <Textarea
                          id="itemDescription"
                          value={itemForm.description}
                          onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="itemPrice">Price ($)</Label>
                          <Input
                            id="itemPrice"
                            type="number"
                            step="0.01"
                            min="0"
                            value={itemForm.price}
                            onChange={(e) => setItemForm({ ...itemForm, price: Number.parseFloat(e.target.value) })}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="itemPoints">Points Value</Label>
                          <Input
                            id="itemPoints"
                            type="number"
                            min="1"
                            value={itemForm.points_value}
                            onChange={(e) =>
                              setItemForm({ ...itemForm, points_value: Number.parseInt(e.target.value) })
                            }
                            required
                          />
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="itemActive"
                          checked={itemForm.is_active}
                          onCheckedChange={(checked) => setItemForm({ ...itemForm, is_active: checked })}
                        />
                        <Label htmlFor="itemActive">Active</Label>
                      </div>

                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setIsItemDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit">{isEditingItem ? "Update" : "Create"} Item</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {items.length === 0 ? (
                    <p className="text-gray-500">No items created yet.</p>
                  ) : (
                    items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{item.name}</h3>
                            {!item.is_active && (
                              <span className="px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded">Inactive</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{item.description}</p>
                          <p className="text-sm font-medium">
                            ${item.price} • {item.points_value} points
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditItem(item)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDeleteItem(item.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>Configure your loyalty program settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="storePin">Store PIN</Label>
                    <Input
                      id="storePin"
                      type="password"
                      value={settings.store_pin}
                      onChange={(e) => setSettings({ ...settings, store_pin: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pointsForReward">Points for Reward</Label>
                    <Input
                      id="pointsForReward"
                      type="number"
                      value={settings.points_for_reward}
                      onChange={(e) => setSettings({ ...settings, points_for_reward: Number.parseInt(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adminUsername">Admin Username</Label>
                    <Input
                      id="adminUsername"
                      type="text"
                      value={settings.admin_username}
                      onChange={(e) => setSettings({ ...settings, admin_username: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adminPassword">Admin Password</Label>
                    <Input
                      id="adminPassword"
                      type="password"
                      value={settings.admin_password}
                      onChange={(e) => setSettings({ ...settings, admin_password: e.target.value })}
                    />
                  </div>
                </div>

                <Button onClick={handleSaveSettings} className="w-full" disabled={isSavingSettings}>
                  {isSavingSettings ? "Saving..." : "Save Settings"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Analytics</CardTitle>
                <CardDescription>Loyalty program performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-4 text-gray-500">Analytics dashboard coming soon...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-8 text-center">
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>
    </div>
  )
}
