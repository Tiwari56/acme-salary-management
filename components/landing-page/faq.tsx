"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

const faqs = [
  {
    id: 1,
    question: "What kind of work do you take on?",
    answer:
      "We build custom web and backend software, connect systems such as Odoo, ERP and fintech tools, and automate repetitive workflows, including AI-assisted tasks.",
  },
  {
    id: 2,
    question: "What can I expect when we work together?",
    answer:
      "We start by understanding how your team works today and what is not connected yet, then discuss the best way to build, connect or automate it.",
  },
  {
    id: 3,
    question: "What tools do you use to build?",
    answer:
      "We use modern web technologies such as React, Next.js and Node.js, and choose tools to fit each project and the systems it needs to work with.",
  },
]

export default function Faq() {
  const [openItem, setOpenItem] = useState<number | null>(null)

  const toggleItem = (id: number) => {
    setOpenItem(openItem === id ? null : id)
  }

  return (
    <section id="faq" className="my-20">
      <div className="card p-8 md:p-10 shadow-lg">
        <h2 className="text-black dark:text-white mb-6 text-3xl md:text-4xl lg:text-5xl font-medium leading-tight">
          Frequently Asked
          <span className="block text-[#7A7FEE] dark:text-[#7A7FEE]">Questions</span>
        </h2>
        <p className="mb-8 max-w-2xl text-gray-700 dark:text-gray-300">
          A few answers about what we do and how we work. For anything else, tell us about your project.
        </p>

        <div className="space-y-4">
          {faqs.map((faq) => (
            <div key={faq.id} className="border-b pb-4 border-gray-300 dark:border-gray-700">
              <button
                onClick={() => toggleItem(faq.id)}
                className="flex justify-between items-center w-full text-left py-2 font-medium text-black dark:text-white hover:text-[#7A7FEE] dark:hover:text-[#7A7FEE] transition-colors"
                aria-expanded={openItem === faq.id}
                aria-controls={`faq-answer-${faq.id}`}
              >
                <span className="font-medium">{faq.question}</span>
                <ChevronDown
                  className={`w-5 h-5 transition-transform ${openItem === faq.id ? "rotate-180 text-[#7A7FEE]" : ""}`}
                />
              </button>
              {openItem === faq.id && (
                <div id={`faq-answer-${faq.id}`} className="mt-2 text-gray-700 dark:text-gray-300">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
