import { createClient } from '@supabase/supabase-js'
import { UAParser } from 'ua-parser-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
)

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed')
  }

  try {
    const body = req.body || {}

    const userAgent = req.headers['user-agent'] || ''

    const parser = new UAParser(userAgent)
    const result = parser.getResult()

    const deviceType =
      result.device.type === 'mobile'
        ? 'Mobile'
        : result.device.type === 'tablet'
          ? 'Tablet'
          : 'Desktop'

    const deviceModel =
      result.device.model ||
      (deviceType === 'Desktop' ? 'Desktop' : 'Unknown')

    const operatingSystem =
      [result.os.name, result.os.version]
        .filter(Boolean)
        .join(' ') || 'Unknown'

    const browser =
      [result.browser.name, result.browser.version]
        .filter(Boolean)
        .join(' ') || 'Unknown'

    const country =
      req.headers['x-vercel-ip-country'] || 'Unknown'

    const city =
      req.headers['x-vercel-ip-city'] || 'Unknown'

    const region =
      req.headers['x-vercel-ip-country-region'] || 'Unknown'

    const visitorId = crypto.randomUUID()

    const { error } = await supabase
      .from('visitors')
      .insert({
        visitor_id: visitorId,
        visited_at: new Date().toISOString(),
        country,
        city,
        region,
        latitude: null,
        longitude: null,
        device_type: deviceType,
        device_model: deviceModel,
        operating_system: operatingSystem,
        browser,
        page: body.page || '/',
        referrer: body.referrer || null,
      })

    if (error) {
      console.error('Supabase error:', error)

      return res.status(500).json({
        success: false,
        error: 'Database error',
      })
    }

    return res.status(200).json({
      success: true,
      visitor_id: visitorId,
    })
  } catch (error) {
    console.error('Visitor API error:', error)

    return res.status(500).json({
      success: false,
      error: 'Server error',
    })
  }
}