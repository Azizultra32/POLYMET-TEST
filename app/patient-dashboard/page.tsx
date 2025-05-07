"use client"

import { useState } from "react"
import PatientList from "@/components/patient-list"
import StatusBar from "@/components/status-bar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { PlusCircle, FileText, Calendar, Users, Activity } from "lucide-react"

export default function PatientDashboardPage() {
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)
  const [errorCount, setErrorCount] = useState(0)
  const [isOnline, setIsOnline] = useState(true)

  // Sample patient data with status
  const patients = [
    {
      id: "P12345",
      date: "2025-05-06",
      time: "09:30 AM",
      isLocked: false,
      status: "completed" as const,
      tags: ["Follow-up", "Cardiology"],
    },
    {
      id: "P23456",
      date: "2025-05-06",
      time: "10:15 AM",
      isLocked: true,
      status: "in-progress" as const,
      tags: ["Initial", "Neurology"],
    },
    {
      id: "P34567",
      date: "2025-05-06",
      time: "11:00 AM",
      isLocked: false,
      status: "pending" as const,
      tags: ["Follow-up"],
    },
    {
      id: "P45678",
      date: "2025-05-05",
      time: "02:30 PM",
      isLocked: false,
      status: "completed" as const,
    },
    {
      id: "P56789",
      date: "2025-05-05",
      time: "03:45 PM",
      isLocked: true,
      status: "in-progress" as const,
    },
    {
      id: "P67890",
      date: "2025-05-04",
      time: "11:30 AM",
      isLocked: false,
      status: "completed" as const,
    },
    {
      id: "P78901",
      date: "2025-05-04",
      time: "01:45 PM",
      isLocked: true,
      status: "pending" as const,
    },
    {
      id: "P89012",
      date: "2025-05-03",
      time: "09:00 AM",
      isLocked: false,
      status: "completed" as const,
    },
  ]

  const handleSendElement = () => {
    console.log("Sending element")
  }

  const handleSendConsoleErrors = () => {
    console.log("Sending console errors")
  }

  const toggleOnlineStatus = () => {
    setIsOnline(!isOnline)
  }

  const incrementErrorCount = () => {
    setErrorCount((prev) => prev + 1)
  }

  const selectedPatient = patients.find((p) => p.id === selectedPatientId)

  return (
    <div className="flex h-screen flex-col">
      <div className="flex flex-1 overflow-hidden">
        <div className="w-72">
          <PatientList
            patients={patients}
            activePatientId={selectedPatientId || undefined}
            onPatientSelect={(id) => setSelectedPatientId(id)}
            isOnline={isOnline}
            onNewPatient={() => console.log("New patient")}
          />
        </div>
        <div className="flex-1 p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">Patient Dashboard</h1>
            <div className="text-muted-foreground">View and manage patient information</div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
                <CardDescription>All patients in the system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{patients.length}</div>
                <div className="text-xs text-muted-foreground mt-1">+2 from yesterday</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Completed Records</CardTitle>
                <CardDescription>Finalized patient records</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{patients.filter((p) => p.status === "completed").length}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {Math.round((patients.filter((p) => p.status === "completed").length / patients.length) * 100)}%
                  completion rate
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Pending Records</CardTitle>
                <CardDescription>Records awaiting completion</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{patients.filter((p) => p.status === "pending").length}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {patients.filter((p) => p.status === "in-progress").length} in progress
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Patient Information</CardTitle>
                <CardDescription>
                  {selectedPatient ? `Details for patient ${selectedPatient.id}` : "Select a patient to view details"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedPatient ? (
                  <Tabs defaultValue="overview">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="records">Records</TabsTrigger>
                      <TabsTrigger value="appointments">Appointments</TabsTrigger>
                      <TabsTrigger value="billing">Billing</TabsTrigger>
                    </TabsList>
                    <TabsContent value="overview" className="space-y-4 mt-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-2">Patient Details</h3>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm">ID:</span>
                              <span className="text-sm font-medium">{selectedPatient.id}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">Status:</span>
                              <span className="text-sm font-medium capitalize">{selectedPatient.status}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">Last Visit:</span>
                              <span className="text-sm font-medium">{selectedPatient.date}</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-2">Tags</h3>
                          <div className="flex flex-wrap gap-2">
                            {selectedPatient.tags?.map((tag, i) => (
                              <span key={i} className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                                {tag}
                              </span>
                            )) || "No tags"}
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                    <TabsContent value="records">
                      <div className="py-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-sm font-medium">Medical Records</h3>
                          <Button size="sm" variant="outline">
                            <FileText className="h-4 w-4 mr-2" />
                            Add Record
                          </Button>
                        </div>
                        <div className="text-sm text-muted-foreground text-center py-8">
                          No records available for this patient
                        </div>
                      </div>
                    </TabsContent>
                    <TabsContent value="appointments">
                      <div className="py-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-sm font-medium">Upcoming Appointments</h3>
                          <Button size="sm" variant="outline">
                            <Calendar className="h-4 w-4 mr-2" />
                            Schedule
                          </Button>
                        </div>
                        <div className="text-sm text-muted-foreground text-center py-8">No appointments scheduled</div>
                      </div>
                    </TabsContent>
                    <TabsContent value="billing">
                      <div className="py-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-sm font-medium">Billing Information</h3>
                          <Button size="sm" variant="outline">
                            <Activity className="h-4 w-4 mr-2" />
                            View History
                          </Button>
                        </div>
                        <div className="text-sm text-muted-foreground text-center py-8">
                          No billing information available
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Patient Selected</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      Select a patient from the list to view their details and medical records.
                    </p>
                    <Button className="mt-4" variant="outline" onClick={() => console.log("New patient")}>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add New Patient
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Demo Controls</CardTitle>
                <CardDescription>Test functionality and UI states</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <Button onClick={toggleOnlineStatus} variant="outline">
                    {isOnline ? "Go Offline" : "Go Online"}
                  </Button>
                  <Button onClick={incrementErrorCount} variant="outline" className="text-destructive">
                    Add Error
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <StatusBar
        isOnline={isOnline}
        statusText="Processing patient data"
        onSendElement={handleSendElement}
        onSendConsoleErrors={handleSendConsoleErrors}
        errorCount={errorCount}
      />
    </div>
  )
}
