import QRCode from "qrcode"

export async function generateQRCode(customerId: string): Promise<string> {
  try {
    // Generate QR code as base64 data URL
    const qrCodeDataURL = await QRCode.toDataURL(customerId, {
      width: 200,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    })

    return qrCodeDataURL
  } catch (error) {
    console.error("Error generating QR code:", error)
    throw new Error("Failed to generate QR code")
  }
}

export async function generateQRCodeBuffer(customerId: string): Promise<Buffer> {
  try {
    const buffer = await QRCode.toBuffer(customerId, {
      width: 200,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    })

    return buffer
  } catch (error) {
    console.error("Error generating QR code buffer:", error)
    throw new Error("Failed to generate QR code")
  }
}

// Convert base64 data URL to downloadable blob
export function downloadQRCode(dataURL: string, customerName: string) {
  const link = document.createElement("a")
  link.download = `loyalty-card-${customerName.replace(/\s+/g, "-").toLowerCase()}.png`
  link.href = dataURL
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
