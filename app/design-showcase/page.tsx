"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import PatientList from "@/components/patient-list"

export default function DesignShowcasePage() {
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-8">Design Showcase</h1>

      <Tabs defaultValue="components" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="components">Components</TabsTrigger>
          <TabsTrigger value="colors">Color System</TabsTrigger>
          <TabsTrigger value="typography">Typography</TabsTrigger>
        </TabsList>

        <TabsContent value="components" className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Patient List</CardTitle>
                <CardDescription>A list of patients with active states and lock indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <PatientList />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Button Variants</CardTitle>
                <CardDescription>Different button styles for various contexts</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Button variant="default">Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link</Button>
                <Button variant="destructive">Destructive</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="colors" className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Color Palette</CardTitle>
              <CardDescription>Primary colors and their variations used throughout the application</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <ColorSwatch name="Primary" color="bg-primary" textColor="text-primary-foreground" />
                <ColorSwatch name="Secondary" color="bg-secondary" textColor="text-secondary-foreground" />
                <ColorSwatch name="Accent" color="bg-accent" textColor="text-accent-foreground" />
                <ColorSwatch name="Muted" color="bg-muted" textColor="text-muted-foreground" />
                <ColorSwatch name="Destructive" color="bg-destructive" textColor="text-destructive-foreground" />
                <ColorSwatch name="Border" color="bg-border" />
                <ColorSwatch name="Input" color="bg-input" />
                <ColorSwatch name="Ring" color="bg-ring" textColor="text-white" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="typography" className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Typography Scale</CardTitle>
              <CardDescription>Text styles used throughout the application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <span className="text-sm text-muted-foreground block mb-2">Heading 1</span>
                <h1>The quick brown fox jumps over the lazy dog</h1>
              </div>
              <div>
                <span className="text-sm text-muted-foreground block mb-2">Heading 2</span>
                <h2>The quick brown fox jumps over the lazy dog</h2>
              </div>
              <div>
                <span className="text-sm text-muted-foreground block mb-2">Heading 3</span>
                <h3>The quick brown fox jumps over the lazy dog</h3>
              </div>
              <div>
                <span className="text-sm text-muted-foreground block mb-2">Paragraph</span>
                <p>The quick brown fox jumps over the lazy dog</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground block mb-2">Small</span>
                <small>The quick brown fox jumps over the lazy dog</small>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ColorSwatch({
  name,
  color,
  textColor = "text-foreground",
}: { name: string; color: string; textColor?: string }) {
  return (
    <div className="flex flex-col">
      <div className={`${color} h-20 rounded-md mb-2 flex items-center justify-center ${textColor}`}>{name}</div>
      <span className="text-sm text-muted-foreground">{name}</span>
    </div>
  )
}
