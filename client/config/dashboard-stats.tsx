import { Users, Trees, GitMerge } from "lucide-react"
import { JSX } from "react"

export interface DashboardStat {
  title: string
  value: string
  change?: string
  subtext: string
  icon: JSX.Element
  bgColor: string
  chart?: string
}

export const dashboardStats: DashboardStat[] = [
  {
    title: "Family Members",
    value: "164",
    change: "+12",
    subtext: "This month",
    icon: <Users className="h-4 w-4 text-blue-400" />,
    bgColor: "bg-gradient-to-br from-blue-500/20 to-indigo-500/20",
    chart: "M10,20 L20,18 L30,22 L40,15 L50,19 L60,14 L70,17 L80,10 L90,15",
  },
  {
    title: "Active Trees",
    value: "3",
    subtext: "Across generations",
    icon: <Trees className="h-4 w-4 text-emerald-400" />,
    bgColor: "bg-gradient-to-br from-emerald-500/20 to-teal-500/20",
  },
  {
    title: "Connections",
    value: "28",
    change: "+5",
    subtext: "With other families",
    icon: <GitMerge className="h-4 w-4 text-purple-400" />,
    bgColor: "bg-gradient-to-br from-purple-500/20 to-indigo-500/20",
    chart: "M10,15 L20,10 L30,20 L40,15 L50,25 L60,15 L70,20 L80,10 L90,15",
  },
]