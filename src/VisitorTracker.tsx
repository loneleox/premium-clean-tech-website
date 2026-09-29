import { useEffect } from 'react'

export default function VisitorTracker() {
  useEffect(() => {
    const sendVisit = () => {
      fetch('/api/visitor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          page: window.location.pathname,
          referrer: document.referrer || null,
        }),
      }).catch(() => {
        // Don't interrupt the website if analytics fails
      })
    }

    sendVisit()
  }, [])

  return null
}