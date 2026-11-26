import { cn } from "@/lib/utils"

interface BrandLogoProps {
  className?: string
  showText?: boolean
}

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("h-8 w-8 shrink-0", className)}>
      <rect width="32" height="32" rx="9" fill="#7A7FEE" />
      <path d="M10 8v16M22 8v16" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
      <path d="M10 16h12" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeDasharray="0.1 5" />
      <circle cx="16" cy="16" r="2.4" fill="#fff" />
    </svg>
  )
}

export default function BrandLogo({ className, showText = true }: BrandLogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <BrandMark />
      {showText && (
        <span className="flex flex-col leading-none">
          <span className="text-xl font-semibold tracking-tight text-black dark:text-white">Harvynex</span>
          <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.22em] text-gray-600 dark:text-gray-400">
            Technologies
          </span>
        </span>
      )}
    </span>
  )
}
