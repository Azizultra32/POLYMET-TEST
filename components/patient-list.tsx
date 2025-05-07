"use client"

import { useState, useMemo } from "react"
import { Search, Plus, Filter, SortDesc, SortAsc, AlertCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import PatientListItem from "@/components/patient-list-item"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface Patient {
  id: string
  date: string
  time: string
  isLocked?: boolean
  status?: "completed" | "in-progress" | "pending"
  tags?: string[]
}

interface PatientListProps {
  patients: Patient[]
  activePatientId?: string
  onPatientSelect: (patientId: string) => void
  onNewPatient?: () => void
  isOnline?: boolean
}

export default function PatientList({
  patients,
  activePatientId,
  onPatientSelect,
  onNewPatient,
  isOnline = true,
}: PatientListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [filterStatus, setFilterStatus] = useState<string | null>(null)

  // Filter and sort patients
  const filteredPatients = useMemo(() => {
    return patients
      .filter((patient) => {
        // Apply search filter
        if (searchQuery) {
          return patient.id.toLowerCase().includes(searchQuery.toLowerCase())
        }

        // Apply status filter
        if (filterStatus && patient.status) {
          return patient.status === filterStatus
        }

        return true
      })
      .sort((a, b) => {
        // Sort by date
        const dateA = new Date(`${a.date} ${a.time}`).getTime()
        const dateB = new Date(`${b.date} ${b.time}`).getTime()

        return sortOrder === "asc" ? dateA - dateB : dateB - dateA
      })
  }, [patients, searchQuery, filterStatus, sortOrder])

  return (
    <div className="h-full flex flex-col border-r bg-card shadow-sm">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold flex items-center">
            Patient List
            {isOnline ? (
              <Badge
                variant="outline"
                className="ml-2 bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900"
              >
                <span className="w-2 h-2 rounded-full bg-green-500 mr-1.5 animate-pulse"></span>
                Online
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="ml-2 bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900"
              >
                <span className="w-2 h-2 rounded-full bg-amber-500 mr-1.5"></span>
                Offline
              </Badge>
            )}
          </h2>

          <div className="flex items-center gap-1.5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-primary/10"
                  aria-label="Filter patients"
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setFilterStatus(null)}
                  className={cn("cursor-pointer", !filterStatus ? "bg-primary/10 font-medium" : "")}
                >
                  All Patients
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setFilterStatus("completed")}
                  className={cn("cursor-pointer", filterStatus === "completed" ? "bg-primary/10 font-medium" : "")}
                >
                  <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                  Completed
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setFilterStatus("in-progress")}
                  className={cn("cursor-pointer", filterStatus === "in-progress" ? "bg-primary/10 font-medium" : "")}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500 mr-2"></span>
                  In Progress
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setFilterStatus("pending")}
                  className={cn("cursor-pointer", filterStatus === "pending" ? "bg-primary/10 font-medium" : "")}
                >
                  <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                  Pending
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-primary/10"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              aria-label={sortOrder === "asc" ? "Sort descending" : "Sort ascending"}
            >
              {sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search patients..."
            className="pl-9 bg-background h-9 rounded-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {filteredPatients.length > 0 ? (
        <ScrollArea className="flex-1">
          <div className="divide-y">
            {filteredPatients.map((patient) => (
              <PatientListItem
                key={patient.id}
                patientId={patient.id}
                date={patient.date}
                time={patient.time}
                isActive={activePatientId === patient.id}
                isLocked={patient.isLocked}
                status={patient.status}
                tags={patient.tags}
                onClick={() => onPatientSelect(patient.id)}
              />
            ))}
          </div>
        </ScrollArea>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="rounded-full bg-muted p-3 mb-3">
            <AlertCircle className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">
            {searchQuery ? "No patients match your search" : "No patients available"}
          </p>
          {searchQuery && (
            <Button variant="ghost" size="sm" className="mt-2" onClick={() => setSearchQuery("")}>
              Clear search
            </Button>
          )}
        </div>
      )}

      {onNewPatient && (
        <div className="p-3 border-t mt-auto bg-card/80 backdrop-blur-sm">
          <Button
            onClick={onNewPatient}
            className="w-full rounded-full shadow-sm transition-all hover:shadow"
            size="lg"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Patient
          </Button>
        </div>
      )}
    </div>
  )
}
