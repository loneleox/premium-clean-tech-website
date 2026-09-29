import { createClient } from '@supabase/supabase-js'
import { UAParser } from 'ua-parser-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
)

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  try {
    const body = await request.json()

    const userAgent = request.headers.get('user-agent') || ''
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
      [result.os.name, result.os.version].filter(Boolean).join(' ') ||
      'Unknown'

    const browser =
      [result.browser.name, result.browser.version]
        .filter(Boolean)
        .join(' ') || 'Unknown'

    const country =
      request.headers.get('x-vercel-ip-country') || 'Unknown'

    const city =
      request.headers.get('x-vercel-ip-city') || 'Unknown'

    const region =
      request.headers.get('x-vercel-ip-country-region') || 'Unknown'

    const visitorId =
      request.headers.get('x-solara-visitor-id') ||
      crypto.randomUUID()

    const { error } = await supabase.from('visitors').insert({
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

      return Response.json(
        { success: false, error: 'Database error' },
        { status: 500 },
      )
    }

    return Response.json({
      success: true,
      visitor_id: visitorId,
    })
  } catch (error) {
    console.error('Visitor API error:', error)

    return Response.json(
      { success: false, error: 'Server error' },
      { status: 500 },
    )
  }
}