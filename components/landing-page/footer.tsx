import Link from "next/link"
import BrandLogo from "./brand-logo"

export default function Footer() {
  return (
    <footer className="container py-8 border-t border-gray-200 dark:border-gray-800">
      <div className="flex flex-col items-center text-center">
        <Link href="/" className="flex items-center justify-center mb-4">
          <span className="sr-only">Harvynex Technologies home</span>
          <BrandLogo />
        </Link>
        <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-8">
          Custom software, system integrations, and workflow automation.
        </p>

        <p className="text-sm text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} Harvynex Technologies. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
