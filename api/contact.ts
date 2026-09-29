import type { VercelRequest, VercelResponse } from "@vercel/node"
import { UAParser } from "ua-parser-js"

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Method not allowed",
    })
  }

  try {
    // -----------------------------
    // WEBSITE FORM DATA
    // -----------------------------

    const data = req.body || {}

    const webhookUrl =
      process.env.GOOGLE_SHEETS_WEBHOOK_URL

    if (!webhookUrl) {
      throw new Error(
        "GOOGLE_SHEETS_WEBHOOK_URL is not configured"
      )
    }


    // -----------------------------
    // VISITOR INFORMATION
    // -----------------------------

    const userAgent =
      req.headers["user-agent"] || ""

    const parser = new UAParser(userAgent)
    const result = parser.getResult()

    const deviceType =
      result.device.type === "mobile"
        ? "Mobile"
        : result.device.type === "tablet"
          ? "Tablet"
          : "Desktop"

    const deviceModel =
      result.device.model ||
      (deviceType === "Desktop"
        ? "Desktop"
        : "Unknown")

    const operatingSystem =
      [
        result.os.name,
        result.os.version,
      ]
        .filter(Boolean)
        .join(" ") || "Unknown"

    const browser =
      [
        result.browser.name,
        result.browser.version,
      ]
        .filter(Boolean)
        .join(" ") || "Unknown"


    // -----------------------------
    // VERCEL VISITOR LOCATION
    // -----------------------------

    const country =
      req.headers["x-vercel-ip-country"] ||
      "Unknown"

    const city =
      req.headers["x-vercel-ip-city"] ||
      "Unknown"

    const region =
      req.headers["x-vercel-ip-country-region"] ||
      "Unknown"


    // -----------------------------
    // VISITOR DATA
    // -----------------------------

    const visitor = {
      country,
      city,
      region,

      device_type: deviceType,
      device_model: deviceModel,

      operating_system:
        operatingSystem,

      browser,

      page:
        data.page ||
        data.currentPage ||
        "/",

      referrer:
        data.referrer ||
        null,

      visited_at:
        new Date().toISOString(),
    }


    // -----------------------------
    // COMBINE CONTACT + VISITOR DATA
    // -----------------------------

    const payload = {
      ...data,
      visitor,
    }


    // -----------------------------
    // SEND TO GOOGLE APPS SCRIPT
    // -----------------------------

    const response = await fetch(
      webhookUrl,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify(payload),
      }
    )


    if (!response.ok) {
      throw new Error(
        `Google Apps Script request failed: ${response.status}`
      )
    }


    // -----------------------------
    // LOG RESPONSE
    // -----------------------------

    const resultText =
      await response.text()

    console.log(
      "[contact] Google Apps Script response:",
      resultText
    )


    // -----------------------------
    // SUCCESS
    // -----------------------------

    return res.status(200).json({
      ok: true,
    })

  } catch (error) {

    console.error(
      "[contact] error:",
      error
    )

    return res.status(500).json({
      ok: false,
      error:
        "Failed to submit contact request",
    })
  }
}