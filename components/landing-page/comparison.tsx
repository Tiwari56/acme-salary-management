import { BellRing, CheckCircle2, Clock, Inbox, ListChecks, Mail, MessageSquare, Table2, UserCheck } from "lucide-react"
import type { LucideIcon } from "lucide-react"

interface Step {
  icon: LucideIcon
  title: string
  detail: string
}

const withoutSteps: Step[] = [
  { icon: Mail, title: "Request arrives by email", detail: "It sits in a shared inbox." },
  { icon: MessageSquare, title: "Forwarded to a group chat", detail: "\u201CAnyone on this?\u201D" },
  { icon: Table2, title: "Copied into a spreadsheet", detail: "Updated by hand, when someone remembers." },
  { icon: Clock, title: "Customer follows up", detail: "Nobody is sure who has it." },
]

const withSteps: Step[] = [
  { icon: Inbox, title: "Request arrives", detail: "From email, chat, or a form." },
  { icon: ListChecks, title: "Task is created automatically", detail: "Logged in your system, no copy-paste." },
  { icon: UserCheck, title: "Assigned to a clear owner", detail: "With a due date and priority." },
  { icon: BellRing, title: "Status updates flow through", detail: "The customer and your team stay informed." },
]

export default function Comparison() {
  return (
    <section id="comparison" className="my-20 scroll-mt-24">
      <h2 className="text-black dark:text-white mb-6 text-3xl md:text-4xl lg:text-5xl font-medium leading-tight">
        One support request,
        <span className="block text-[#7A7FEE]">two very different days</span>
      </h2>
      <p className="mb-12 max-w-2xl text-gray-700 dark:text-gray-300">
        Same request, same team. The difference is whether your tools pass work to each other or leave people to do it.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6 md:p-8 shadow-md">
          <div className="mb-6 flex items-center justify-between gap-4">
            <h3 className="text-xl font-semibold text-black dark:text-white">Without Harvynex</h3>
            <span className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-medium text-red-600 dark:text-red-300">
              Manual follow-ups
            </span>
          </div>

          <ol className="relative">
            {withoutSteps.map((step, index) => (
              <li key={step.title} className="relative flex gap-4 pb-6 last:pb-0">
                {index < withoutSteps.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="absolute left-5 top-10 bottom-0 w-px border-l border-dashed border-gray-400/60 dark:border-gray-500/60"
                  />
                )}
                <span className="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-600 dark:border-gray-600 dark:bg-[#1c1d1e] dark:text-gray-300">
                  <step.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-medium text-black dark:text-white">{step.title}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{step.detail}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-8 flex flex-wrap gap-2 border-t border-gray-300/60 pt-5 dark:border-white/10">
            <span className="rounded-md bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-600 dark:text-red-300">
              Owner: unknown
            </span>
            <span className="rounded-md bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-600 dark:text-red-300">
              Status: unclear
            </span>
            <span className="rounded-md bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-600 dark:text-red-300">
              Repeated chasing
            </span>
          </div>
        </div>

        <div className="card p-6 md:p-8 shadow-md ring-1 ring-[#7A7FEE]/50">
          <div className="mb-6 flex items-center justify-between gap-4">
            <h3 className="text-xl font-semibold text-black dark:text-white">With Harvynex</h3>
            <span className="rounded-full border border-[#7A7FEE]/40 bg-[#7A7FEE]/15 px-3 py-1 text-xs font-medium text-[#5b60d6] dark:text-[#a3a7ff]">
              Tracked task
            </span>
          </div>

          <ol className="relative">
            {withSteps.map((step, index) => (
              <li key={step.title} className="relative flex gap-4 pb-6 last:pb-0">
                {index < withSteps.length - 1 && (
                  <span aria-hidden="true" className="absolute left-5 top-10 bottom-0 w-px bg-[#7A7FEE]/60" />
                )}
                <span className="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#7A7FEE] text-white shadow-sm">
                  <step.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-medium text-black dark:text-white">{step.title}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{step.detail}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-8 flex items-center gap-3 rounded-xl border border-[#7A7FEE]/30 bg-[#7A7FEE]/10 p-4">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-[#7A7FEE]" aria-hidden="true" />
            <dl className="grid flex-1 grid-cols-3 gap-2 text-sm">
              <div>
                <dt className="text-xs text-gray-600 dark:text-gray-400">Task</dt>
                <dd className="font-medium text-black dark:text-white">Support request</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-600 dark:text-gray-400">Owner</dt>
                <dd className="font-medium text-black dark:text-white">Support lead</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-600 dark:text-gray-400">Status</dt>
                <dd className="font-medium text-black dark:text-white">In progress</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </section>
  )
}
