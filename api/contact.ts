import type { VercelRequest, VercelResponse } from "@vercel/node"

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Method not allowed",
    })
  }

  try {
    const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL

    if (!webhookUrl) {
      throw new Error(
        "GOOGLE_SHEETS_WEBHOOK_URL is not configured"
      )
    }

    const data = req.body

    // Send the complete form data to Google Apps Script
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(
        `Google Apps Script request failed: ${response.status}`
      )
    }

    const result = await response.text()

    console.log("[contact] Google Apps Script response:", result)

    return res.status(200).json({
      ok: true,
    })

  } catch (error) {
    console.error("[contact] error:", error)

    return res.status(500).json({
      ok: false,
      error: "Failed to submit contact request",
    })
  }
}