"use client"

import type React from "react"

import { useState } from "react"
import { ArrowRight } from "lucide-react"

type Status = "idle" | "submitting" | "success" | "error"

const inputClass =
  "w-full px-4 py-3 bg-[#4a4a4a] border border-[#5a5a5a] rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7A7FEE] focus:border-transparent transition-all"

const initialData = { firstName: "", lastName: "", email: "", phone: "", message: "", website: "" }

export default function ProjectForm() {
  const [formData, setFormData] = useState(initialData)
  const [status, setStatus] = useState<Status>("idle")
  const [errorMessage, setErrorMessage] = useState("")

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (status === "submitting") return
    setStatus("submitting")
    setErrorMessage("")

    try {
      const response = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      if (!response.ok) {
        const result = await response.json().catch(() => null)
        throw new Error(result?.error || "We could not send your enquiry. Please try again.")
      }
      setFormData(initialData)
      setStatus("success")
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "We could not send your enquiry. Please try again.")
      setStatus("error")
    }
  }

  return (
    <div className="container mx-auto py-12 px-6 md:px-10">
      <div className="max-w-xl mx-auto w-full">
        <div className="bg-[#3a3a3a] rounded-2xl p-6 md:p-8 shadow-lg">
          {status === "success" ? (
            <div role="status" className="py-6">
              <h3 className="text-white text-xl font-medium mb-3">Thanks, your enquiry has been sent.</h3>
              <p className="text-white/80 text-base leading-relaxed">
                We have received your details and will use your email to reply.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <p className="text-white text-base md:text-lg leading-relaxed">
                  Tell us what you want to build, connect or automate, and how to reach you.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="firstName" className="block text-white text-sm font-medium mb-3">
                    What is your first name? <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    maxLength={100}
                    autoComplete="given-name"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-white text-sm font-medium mb-3">
                    Last name? <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    maxLength={100}
                    autoComplete="family-name"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-white text-sm font-medium mb-3">
                    What is your email? <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    maxLength={254}
                    autoComplete="email"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-white text-sm font-medium mb-3">
                    Your phone number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    maxLength={40}
                    autoComplete="tel"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-white text-sm font-medium mb-3">
                    What would you like to build, connect or automate?
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    maxLength={4000}
                    rows={4}
                    className={inputClass}
                  />
                </div>

                <div className="hidden" aria-hidden="true">
                  <label htmlFor="website">Leave this field empty</label>
                  <input
                    type="text"
                    id="website"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </div>

                {status === "error" && (
                  <p role="alert" className="text-red-300 text-sm">
                    {errorMessage}
                  </p>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={status === "submitting"}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#7A7FEE] text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                  >
                    {status === "submitting" ? "Sending..." : "Send enquiry"}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
