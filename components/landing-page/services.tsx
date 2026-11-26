import { Code2, Link2, Workflow } from "lucide-react"

const services = [
  {
    id: 1,
    title: "Build",
    tagline: "Web and backend software",
    description: "Custom applications and backend systems designed around how your team actually works.",
    icon: Code2,
  },
  {
    id: 2,
    title: "Connect",
    tagline: "Odoo, ERP and fintech integrations",
    description: "Link the systems you already rely on so data moves between them instead of being re-typed.",
    icon: Link2,
  },
  {
    id: 3,
    title: "Automate",
    tagline: "Workflows and AI-assisted tasks",
    description: "Take repetitive work off your team and hand off to a person when judgement is needed.",
    icon: Workflow,
  },
]

export default function Services() {
  return (
    <section id="services" className="my-20 scroll-mt-24">
      <h2 className="text-black dark:text-white mb-6 text-3xl md:text-4xl lg:text-5xl font-medium leading-tight">
        Build. Connect.
        <span className="block text-[#7A7FEE] dark:text-[#7A7FEE]">Automate.</span>
      </h2>
      <p className="mb-12 max-w-2xl text-gray-700 dark:text-gray-300">
        Three areas where we help teams get their software and tools working as one system.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {services.map((service) => (
          <div key={service.id} className="card p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="bg-[#7A7FEE] w-12 h-12 rounded-full flex items-center justify-center mb-4 shadow-sm">
              <service.icon className="w-6 h-6 text-white" aria-hidden="true" />
            </div>
            <h3 className="text-xl font-semibold mb-1 text-black dark:text-white">{service.title}</h3>
            <p className="mb-3 text-sm font-medium text-[#5b60d6] dark:text-[#a3a7ff]">{service.tagline}</p>
            <p className="text-gray-700 dark:text-gray-300">{service.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
