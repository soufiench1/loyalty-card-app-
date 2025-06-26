"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import jsQR from "jsqr"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Camera, CameraOff, RotateCcw } from "lucide-react"

interface QRScannerProps {
  onScan: (result: string) => void
  isActive: boolean
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan, isActive }) => {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string>("")
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationRef = useRef<number>()

  // Auto-start scanning when component becomes active
  useEffect(() => {
    if (isActive && !isScanning) {
      startScanning()
    } else if (!isActive && isScanning) {
      stopScanning()
    }
  }, [isActive])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanning()
    }
  }, [])

  const startScanning = async () => {
    try {
      setError("")

      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Use back camera if available
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      })

      streamRef.current = stream
      setHasPermission(true)

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        setIsScanning(true)

        // Start scanning loop
        scanQRCode()
      }
    } catch (err) {
      console.error("Error accessing camera:", err)
      setHasPermission(false)

      if (err instanceof Error) {
        if (err.name === "NotAllowedError") {
          setError("Camera permission denied. Please allow camera access and try again.")
        } else if (err.name === "NotFoundError") {
          setError("No camera found on this device.")
        } else {
          setError("Failed to access camera. Please check your device settings.")
        }
      }
    }
  }

  const stopScanning = () => {
    setIsScanning(false)

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current || !isScanning) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext("2d")

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationRef.current = requestAnimationFrame(scanQRCode)
      return
    }

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    try {
      // Get image data for QR code detection
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height)

      // Detect QR code using jsQR
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      })

      if (code) {
        console.log("QR Code detected:", code.data)
        onScan(code.data)
        stopScanning() // Stop scanning after successful detection
        return
      }
    } catch (err) {
      console.error("Error scanning QR code:", err)
    }

    // Continue scanning
    if (isScanning) {
      animationRef.current = requestAnimationFrame(scanQRCode)
    }
  }

  const toggleScanning = () => {
    if (isScanning) {
      stopScanning()
    } else {
      startScanning()
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold">QR Code Scanner</h3>
            <p className="text-sm text-gray-600">
              {isScanning ? "Point camera at QR code" : "Click start to begin scanning"}
            </p>
          </div>

          <div className="relative">
            {/* Video element */}
            <video
              ref={videoRef}
              className={`w-full max-w-md mx-auto rounded-lg border ${isScanning ? "block" : "hidden"}`}
              playsInline
              muted
            />

            {/* Scanning overlay */}
            {isScanning && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="relative w-full h-full">
                  {/* Corner indicators */}
                  <div className="absolute top-4 left-4 w-6 h-6 border-l-2 border-t-2 border-green-500"></div>
                  <div className="absolute top-4 right-4 w-6 h-6 border-r-2 border-t-2 border-green-500"></div>
                  <div className="absolute bottom-4 left-4 w-6 h-6 border-l-2 border-b-2 border-green-500"></div>
                  <div className="absolute bottom-4 right-4 w-6 h-6 border-r-2 border-b-2 border-green-500"></div>

                  {/* Scanning line animation */}
                  <div className="absolute inset-x-4 top-1/2 h-0.5 bg-green-500 animate-pulse"></div>
                </div>
              </div>
            )}

            {/* Hidden canvas for processing */}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Error message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Controls */}
          <div className="flex justify-center space-x-2">
            <Button
              onClick={toggleScanning}
              variant={isScanning ? "destructive" : "default"}
              className="flex items-center gap-2"
            >
              {isScanning ? (
                <>
                  <CameraOff className="h-4 w-4" />
                  Stop Scanning
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4" />
                  Start Scanning
                </>
              )}
            </Button>

            {error && hasPermission === false && (
              <Button onClick={startScanning} variant="outline" className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4" />
                Retry
              </Button>
            )}
          </div>

          <div className="text-xs text-gray-500 text-center">
            <p>Make sure the QR code is clearly visible and well-lit</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default QRScanner
