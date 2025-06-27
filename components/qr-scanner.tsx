"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import jsQR from "jsqr"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Camera, CameraOff, RotateCcw, CheckCircle, AlertCircle } from "lucide-react"

interface QRScannerProps {
  onScan: (result: string) => void
  isActive: boolean
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan, isActive }) => {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string>("")
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [lastScanTime, setLastScanTime] = useState<number>(0)
  const [scanSuccess, setScanSuccess] = useState<string>("")
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationFrameRef = useRef<number | null>(null)

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
      setScanSuccess("")

      // Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }

      // Try different camera constraints in order of preference
      const constraintOptions = [
        // High quality back camera
        {
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1920, min: 640 },
            height: { ideal: 1080, min: 480 },
            frameRate: { ideal: 60, min: 30 },
          },
        },
        // Standard back camera
        {
          video: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        },
        // Any camera fallback
        {
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        },
        // Basic fallback
        {
          video: true,
        },
      ]

      let stream: MediaStream | null = null
      let lastError: Error | null = null

      for (const constraints of constraintOptions) {
        try {
          console.log("Trying camera constraints:", constraints)
          stream = await navigator.mediaDevices.getUserMedia(constraints)
          break
        } catch (err) {
          console.log("Camera constraint failed:", err)
          lastError = err as Error
          continue
        }
      }

      if (!stream) {
        throw lastError || new Error("No camera access available")
      }

      streamRef.current = stream
      setHasPermission(true)

      if (videoRef.current) {
        videoRef.current.srcObject = stream

        // Wait for video metadata to load
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            const playPromise = videoRef.current.play()

            if (playPromise !== undefined) {
              playPromise
                .then(() => {
                  console.log("Video started playing")
                  setIsScanning(true)
                  startScanningLoop()
                })
                .catch((error) => {
                  console.error("Error playing video:", error)
                  setError("Failed to start video playback. Try refreshing the page.")
                })
            }
          }
        }

        // Handle video errors
        videoRef.current.onerror = (e) => {
          console.error("Video error:", e)
          setError("Video playback error. Please try again.")
        }
      }
    } catch (err) {
      console.error("Error accessing camera:", err)
      setHasPermission(false)
      setIsScanning(false)

      if (err instanceof Error) {
        switch (err.name) {
          case "NotAllowedError":
            setError(
              "Camera permission denied. Please allow camera access in your browser settings and refresh the page.",
            )
            break
          case "NotFoundError":
            setError("No camera found on this device. Please ensure you have a working camera.")
            break
          case "NotReadableError":
            setError("Camera is being used by another application. Please close other apps using the camera.")
            break
          case "OverconstrainedError":
            setError("Camera constraints not supported. Trying with basic settings...")
            break
          case "SecurityError":
            setError("Camera access blocked by security policy. Please use HTTPS or localhost.")
            break
          default:
            setError(`Camera error: ${err.message}. Please try refreshing the page.`)
        }
      }
    }
  }

  const startScanningLoop = () => {
    const scanFrame = () => {
      if (isScanning) {
        scanQRCode()
        animationFrameRef.current = requestAnimationFrame(scanFrame)
      }
    }
    animationFrameRef.current = requestAnimationFrame(scanFrame)
  }

  const stopScanning = () => {
    setIsScanning(false)

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  const scanQRCode = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isScanning) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext("2d", { willReadFrequently: true })

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) {
      return
    }

    try {
      // Set canvas dimensions to match video
      const { videoWidth, videoHeight } = video
      if (videoWidth === 0 || videoHeight === 0) return

      canvas.width = videoWidth
      canvas.height = videoHeight

      // Draw video frame to canvas
      context.drawImage(video, 0, 0, videoWidth, videoHeight)

      // Get image data for QR code detection
      const imageData = context.getImageData(0, 0, videoWidth, videoHeight)

      // Detect QR code using jsQR with optimized options
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "attemptBoth",
      })

      if (code && code.data && code.data.trim()) {
        const now = Date.now()
        // Prevent duplicate scans within 0.5 seconds
        if (now - lastScanTime > 500) {
          console.log("QR Code detected:", code.data)
          setLastScanTime(now)
          setScanSuccess(`Successfully scanned: ${code.data}`)
          onScan(code.data.trim())

          // Stop scanning after successful detection
          setTimeout(() => {
            stopScanning()
          }, 1500)
        }
      }
    } catch (err) {
      console.error("Error scanning QR code:", err)
    }
  }, [isScanning, lastScanTime, onScan])

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
            <p className="text-sm text-gray-600">{isScanning ? "Scanning..." : "Click start to scan"}</p>
          </div>

          <div className="relative">
            {/* Video element */}
            <video
              ref={videoRef}
              className={`w-full max-w-md mx-auto rounded-lg border-2 ${
                isScanning ? "border-green-500 block" : "border-gray-300 hidden"
              }`}
              playsInline
              muted
              autoPlay
              style={{ maxHeight: "400px" }}
            />

            {/* Scanning overlay */}
            {isScanning && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="relative w-48 h-48 border-2 border-green-500 rounded-lg">
                  {/* Corner indicators */}
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-l-4 border-t-4 border-green-400"></div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-r-4 border-t-4 border-green-400"></div>
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-l-4 border-b-4 border-green-400"></div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-r-4 border-b-4 border-green-400"></div>

                  {/* Scanning line */}
                  <div className="absolute inset-x-0 top-1/2 h-0.5 bg-green-400 animate-pulse"></div>

                  {/* Center text */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">Scan QR code</div>
                  </div>
                </div>
              </div>
            )}

            {/* Hidden canvas for processing */}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Success message */}
          {scanSuccess && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <p className="text-sm text-green-700">{scanSuccess}</p>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <div className="flex-1">
                <p className="text-sm text-red-700">{error}</p>
                {error.includes("permission") && (
                  <div className="mt-2 text-xs text-red-600">
                    <p>To fix this:</p>
                    <ul className="list-disc list-inside mt-1">
                      <li>Click the camera icon in your browser's address bar</li>
                      <li>Select "Allow" for camera access</li>
                      <li>Refresh the page</li>
                    </ul>
                  </div>
                )}
              </div>
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
              <Button onClick={startScanning} variant="outline" className="flex items-center gap-2 bg-transparent">
                <RotateCcw className="h-4 w-4" />
                Retry
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default QRScanner
