import {UserPlus, FileSearch, FileUp, Calendar, Share2, BookOpen} from "lucide-react";
import { JSX } from "react";

export interface QuickAction {
    title: string
    icon: JSX.Element
    bgColor: string
}


export const quickActions = [
    {
      title: "Add Member",
      icon: <UserPlus className="h-5 w-5 text-blue-400" />,
      bgColor: "bg-gradient-to-br from-blue-500/20 to-indigo-500/20",
    },
    {
      title: "Search Records",
      icon: <FileSearch className="h-5 w-5 text-amber-400" />,
      bgColor: "bg-gradient-to-br from-amber-500/20 to-orange-500/20",
    },
    {
      title: "Import Data",
      icon: <FileUp className="h-5 w-5 text-emerald-400" />,
      bgColor: "bg-gradient-to-br from-emerald-500/20 to-teal-500/20",
    },
    {
      title: "View Timeline",
      icon: <Calendar className="h-5 w-5 text-purple-400" />,
      bgColor: "bg-gradient-to-br from-purple-500/20 to-indigo-500/20",
    },
    {
      title: "Share Tree",
      icon: <Share2 className="h-5 w-5 text-cyan-400" />,
      bgColor: "bg-gradient-to-br from-cyan-500/20 to-blue-500/20",
    },
    {
      title: "Add Story",
      icon: <BookOpen className="h-5 w-5 text-red-400" />,
      bgColor: "bg-gradient-to-br from-red-500/20 to-pink-500/20",
    },
  ]