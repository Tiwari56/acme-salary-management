import { GitCompareArrows, LayoutGrid, MessageSquare } from "lucide-react"
import type { SubNavItem } from "./nav-dropdown"
import { iconColors } from "./color-utils"

export const resourcesDropdownData: SubNavItem[][] = [
  [
    {
      title: "Services",
      description: "Build, connect, and automate",
      href: "/#services",
      icon: LayoutGrid,
      color: iconColors.resources.blog,
    },
    {
      title: "How it works",
      description: "Manual follow-ups versus a tracked task",
      href: "/#comparison",
      icon: GitCompareArrows,
      color: iconColors.resources.tutorials,
    },
    {
      title: "Discuss your project",
      description: "Tell us what you want to improve",
      href: "/start",
      icon: MessageSquare,
      color: iconColors.resources.community,
    },
  ],
]
