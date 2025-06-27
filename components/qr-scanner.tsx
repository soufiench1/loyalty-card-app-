"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import jsQR from "jsqr"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Camera, CameraOff, CheckCircle, AlertCircle } from "lucide-react"

interface QRScannerProps {
  onScan: (result: string) => void
  isActive: boolean
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan, isActive }) => {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string>("")
  const [scanSuccess, setScanSuccess] = useState<string>("")
  const [detectionMethod, setDetectionMethod] = useState<string>("")
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanningRef = useRef<boolean>(false)
  const lastScanTime = useRef<number>(0)

  useEffect(() => {
    if (isActive && !isScanning) {
      startScanning()
    } else if (!isActive && isScanning) {
      stopScanning()
    }
  }, [isActive])

  useEffect(() => {
    return () => stopScanning()
  }, [])

  const startScanning = async () => {
    try {
      setError("")
      setScanSuccess("")

      // Check what detection methods are available
      const hasBarcodeDetector = "BarcodeDetector" in window
      setDetectionMethod(hasBarcodeDetector ? "Native BarcodeDetector" : "jsQR Library")
      console.log("Detection method:", hasBarcodeDetector ? "BarcodeDetector" : "jsQR")

      // Get camera stream with better constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream

        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play().then(() => {
              console.log("Video started, beginning scan loop")
              setIsScanning(true)
              scanningRef.current = true
              scanLoop()
            })
          }
        }
      }
    } catch (err) {
      console.error("Camera error:", err)
      setError("Camera access denied or not available. Please allow camera access.")
    }
  }

  const scanLoop = async () => {
    if (!scanningRef.current || !videoRef.current) return

    try {
      // Method 1: Try BarcodeDetector API first (fastest and most reliable)
      if ("BarcodeDetector" in window) {
        const detector = new (window as any).BarcodeDetector({
          formats: ["qr_code"],
        })

        const barcodes = await detector.detect(videoRef.current)

        if (barcodes.length > 0) {
          const now = Date.now()
          if (now - lastScanTime.current > 1000) {
            // 1 second debounce
            console.log("✅ QR detected via BarcodeDetector:", barcodes[0].rawValue)
            lastScanTime.current = now
            setScanSuccess(`Scanned: ${barcodes[0].rawValue}`)
            onScan(barcodes[0].rawValue)

            // Visual feedback
            if (videoRef.current) {
              videoRef.current.style.borderColor = "#10b981"
              videoRef.current.style.boxShadow = "0 0 15px rgba(16, 185, 129, 0.6)"
              setTimeout(() => {
                if (videoRef.current) {
                  videoRef.current.style.borderColor = ""
                  videoRef.current.style.boxShadow = ""
                }
              }, 1000)
            }

            stopScanning()
            return
          }
        }
      }
      // Method 2: Fallback to jsQR for unsupported browsers
      else {
        const canvas = document.createElement("canvas")
        const context = canvas.getContext("2d")
        const video = videoRef.current

        if (context && video.videoWidth > 0 && video.videoHeight > 0) {
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          context.drawImage(video, 0, 0)

          const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "attemptBoth",
          })

          if (code && code.data) {
            const now = Date.now()
            if (now - lastScanTime.current > 1000) {
              // 1 second debounce
              console.log("✅ QR detected via jsQR:", code.data)
              lastScanTime.current = now
              setScanSuccess(`Scanned: ${code.data}`)
              onScan(code.data)

              // Visual feedback
              if (videoRef.current) {
                videoRef.current.style.borderColor = "#10b981"
                videoRef.current.style.boxShadow = "0 0 15px rgba(16, 185, 129, 0.6)"
                setTimeout(() => {
                  if (videoRef.current) {
                    videoRef.current.style.borderColor = ""
                    videoRef.current.style.boxShadow = ""
                  }
                }, 1000)
              }

              stopScanning()
              return
            }
          }
        }
      }
    } catch (err) {
      console.log("Scan error:", err)
    }

    // Continue scanning at 60fps for maximum responsiveness
    if (scanningRef.current) {
      requestAnimationFrame(scanLoop)
    }
  }

  const stopScanning = () => {
    console.log("Stopping scanner")
    setIsScanning(false)
    scanningRef.current = false

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
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
            <h3 className="text-lg font-semibold">QR Scanner</h3>
            <p className="text-sm text-gray-600">{isScanning ? "Scanning..." : "Click start to scan"}</p>
            {detectionMethod && <p className="text-xs text-blue-600">Using: {detectionMethod}</p>}
          </div>

          <div className="relative">
            <video
              ref={videoRef}
              className={`w-full max-w-md mx-auto rounded-lg border-2 transition-all duration-300 ${
                isScanning ? "border-green-500 block" : "border-gray-300 hidden"
              }`}
              playsInline
              muted
              autoPlay
              style={{ maxHeight: "400px" }}
            />

            {isScanning && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
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
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="flex justify-center">
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
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default QRScanner
