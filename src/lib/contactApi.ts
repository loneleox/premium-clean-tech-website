/* ------------------------------------------------------------------ */
/* Contact request API layer                                           */
/*                                                                     */
/* This is the ONLY place that talks to the backend. Swap the body of  */
/* `submitContactRequest` for a real fetch() to your API route (which  */
/* can then forward to Google Sheets + email notifications) without    */
/* touching any UI code.                                               */
/*                                                                     */
/* Suggested backend contract:                                         */
/*   POST /api/contact                                                  */
/*   body: ContactRequest (JSON)                                       */
/*   200 -> { ok: true }                                               */
/* ------------------------------------------------------------------ */

export interface ContactLocation {
  address: string
  lat: number
  lng: number
  mapsLink: string
}

export interface ContactRequest {
  fullName: string
  phone: string
  email: string
  location: ContactLocation | null
  message: string
  submittedAt: string
}

/**
 * Sends a contact request to the backend.
 *
 * TODO(backend): replace the placeholder below with a real call, e.g.
 *
 *   const res = await fetch("/api/contact", {
 *     method: "POST",
 *     headers: { "Content-Type": "application/json" },
 *     body: JSON.stringify(payload),
 *   })
 *   if (!res.ok) throw new Error("Request failed")
 *
 * The server route is responsible for appending the row to Google
 * Sheets and dispatching the email notification.
 */
export async function submitContactRequest(
  payload: ContactRequest
): Promise<{ ok: true }> {
  const res = await fetch("/api/contact", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    throw new Error("Request failed")
  }

  return { ok: true }
}
