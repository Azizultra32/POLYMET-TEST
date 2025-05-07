"use client"

import { LockIcon, Clock, CheckCircle, AlertCircle, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface PatientListItemProps {
  patientId: string
  date: string
  time: string
  isActive?: boolean
  isLocked?: boolean
  status?: "completed" | "in-progress" | "pending"
  tags?: string[]
  onClick: () => void
}

export default function PatientListItem({
  patientId,
  date,
  time,
  isActive = false,
  isLocked = false,
  status = "pending",
  tags,
  onClick,
}: PatientListItemProps) {
  // Status configuration
  const statusConfig = {
    completed: {
      icon: CheckCircle,
      color: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      borderColor: "border-green-200 dark:border-green-800",
      label: "Completed",
    },
    "in-progress": {
      icon: Clock,
      color: "text-amber-500",
      bgColor: "bg-amber-50 dark:bg-amber-900/20",
      borderColor: "border-amber-200 dark:border-amber-800",
      label: "In Progress",
    },
    pending: {
      icon: AlertCircle,
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      borderColor: "border-blue-200 dark:border-blue-800",
      label: "Pending",
    },
  }

  const StatusIcon = statusConfig[status].icon

  return (
    <div
      className={cn(
        "p-4 border-b cursor-pointer transition-all duration-200",
        isActive ? "bg-primary/10 border-l-2 border-l-primary" : "hover:bg-muted/50 border-l-2 border-l-transparent",
      )}
      onClick={onClick}
    >
      <div className="flex justify-between items-center mb-1.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <User className="h-4 w-4 text-primary" />
          </div>
          <span className="font-medium truncate">{patientId}</span>
          {isLocked && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex-shrink-0">
                    <LockIcon className="h-4 w-4 text-amber-500" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>This patient record is locked</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        <Badge
          variant="outline"
          className={cn(
            "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border",
            statusConfig[status].bgColor,
            statusConfig[status].color,
            statusConfig[status].borderColor,
          )}
        >
          <StatusIcon className="h-3 w-3" />
          <span>{statusConfig[status].label}</span>
        </Badge>
      </div>

      <div className="text-xs text-muted-foreground ml-10">
        {date} • {time}
      </div>

      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2 ml-10">
          {tags.map((tag, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
