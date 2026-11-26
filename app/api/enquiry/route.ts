import { NextResponse } from "next/server"

const MAX = { name: 100, email: 254, phone: 40, message: 4000 }
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : ""
}

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 })
  }

  // Hidden field that real visitors never fill in.
  if (typeof body.website === "string" && body.website.length > 0) {
    return NextResponse.json({ ok: true })
  }

  const enquiry = {
    firstName: text(body.firstName, MAX.name),
    lastName: text(body.lastName, MAX.name),
    email: text(body.email, MAX.email),
    phone: text(body.phone, MAX.phone),
    message: text(body.message, MAX.message),
  }

  if (!enquiry.firstName || !enquiry.lastName || !EMAIL_PATTERN.test(enquiry.email)) {
    return NextResponse.json({ error: "Please complete the required fields with a valid email." }, { status: 400 })
  }

  const destination = process.env.ENQUIRY_WEBHOOK_URL
  if (!destination) {
    console.error("Enquiry not delivered: ENQUIRY_WEBHOOK_URL is not set.")
    return NextResponse.json(
      { error: "Enquiries are not being accepted yet. Please try again later." },
      { status: 503 },
    )
  }

  try {
    const response = await fetch(destination, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: "harvynex.com/start", receivedAt: new Date().toISOString(), ...enquiry }),
      signal: AbortSignal.timeout(10_000),
    })
    if (!response.ok) {
      console.error(`Enquiry delivery failed with status ${response.status}.`)
      return NextResponse.json({ error: "We could not send your enquiry. Please try again." }, { status: 502 })
    }
  } catch (error) {
    console.error("Enquiry delivery failed:", error)
    return NextResponse.json({ error: "We could not send your enquiry. Please try again." }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
