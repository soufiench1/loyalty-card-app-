"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { UserPlus, CreditCard, Download, Copy } from "lucide-react"
import Image from "next/image"
import { downloadQRCode } from "@/lib/qr-generator"

interface RegistrationResult {
  customerId: string
  qrCode: string
  name: string
}

export default function HomePage() {
  const [name, setName] = useState("")
  const [pin, setPin] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [registrationResult, setRegistrationResult] = useState<RegistrationResult | null>(null)
  const [copied, setCopied] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage("")

    try {
      const response = await fetch("/api/customers/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, pin }),
      })

      const data = await response.json()

      if (response.ok) {
        setRegistrationResult({
          customerId: data.customerId,
          qrCode: data.qrCode,
          name: name,
        })
        setMessage("Registration successful!")
        setName("")
        setPin("")
      } else {
        setMessage(data.error || "Registration failed")
      }
    } catch (error) {
      setMessage("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadQRCode = () => {
    if (!registrationResult) return
    downloadQRCode(registrationResult.qrCode, registrationResult.name)
  }

  const copyCustomerId = async () => {
    if (!registrationResult) return

    try {
      await navigator.clipboard.writeText(registrationResult.customerId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea")
      textArea.value = registrationResult.customerId
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const startNewRegistration = () => {
    setRegistrationResult(null)
    setMessage("")
    setCopied(false)
  }

  if (registrationResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <CreditCard className="mx-auto h-12 w-12 text-indigo-600" />
            <h1 className="mt-4 text-3xl font-bold text-gray-900">Your Loyalty Card</h1>
            <p className="mt-2 text-gray-600">Save this QR code for earning points!</p>
          </div>

          <Card>
            <CardHeader className="text-center">
              <CardTitle>Welcome, {registrationResult.name}!</CardTitle>
              <CardDescription>Your digital loyalty card is ready</CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="flex justify-center">
                <Image
                  src={registrationResult.qrCode || "/placeholder.svg"}
                  alt="QR Code"
                  width={200}
                  height={200}
                  className="border rounded-lg"
                />
              </div>

              {/* Customer ID Display */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Customer ID (for manual entry):</p>
                <div className="flex items-center justify-center gap-2">
                  <code className="bg-white px-3 py-1 rounded border text-sm font-mono">
                    {registrationResult.customerId}
                  </code>
                  <Button variant="outline" size="sm" onClick={copyCustomerId} className="h-8 w-8 p-0">
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                {copied && <p className="text-xs text-green-600 mt-1">Copied to clipboard!</p>}
              </div>

              <div className="space-y-2">
                <Button onClick={handleDownloadQRCode} className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Download QR Code
                </Button>

                <Button variant="outline" onClick={startNewRegistration} className="w-full">
                  Register Another Customer
                </Button>
              </div>

              <div className="text-xs text-gray-500 text-center">
                <p>Show this QR code or provide your Customer ID when making purchases to earn points!</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <CreditCard className="mx-auto h-12 w-12 text-indigo-600" />
          <h1 className="mt-4 text-3xl font-bold text-gray-900">Loyalty Card</h1>
          <p className="mt-2 text-gray-600">Join our loyalty program and earn rewards!</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Customer Registration
            </CardTitle>
            <CardDescription>Enter your details to create your digital loyalty card</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pin">PIN (4 digits)</Label>
                <Input
                  id="pin"
                  type="password"
                  placeholder="Enter 4-digit PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  maxLength={4}
                  pattern="[0-9]{4}"
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Registering..." : "Register"}
              </Button>
            </form>

            {message && (
              <div
                className={`mt-4 p-3 rounded-md text-sm ${
                  message.includes("successful")
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {message}
              </div>
            )}
          </CardContent>
        </Card>

        
      </div>
    </div>
  )
}
