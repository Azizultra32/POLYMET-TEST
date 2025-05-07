"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ThemeSwitcher } from "./theme-switcher"
import { Sun } from "lucide-react"

export function DesignSystem() {
  return (
    <div className="container py-10 space-y-10">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">POLYMET Design System</h1>
        <ThemeSwitcher />
      </div>

      <Tabs defaultValue="colors">
        <TabsList>
          <TabsTrigger value="colors">Colors</TabsTrigger>
          <TabsTrigger value="typography">Typography</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
        </TabsList>

        <TabsContent value="colors" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Primary Colors</CardTitle>
              <CardDescription>The main colors used throughout the application</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                <ColorSwatch name="Primary" color="bg-primary" textColor="text-primary-foreground" />
                <ColorSwatch name="Secondary" color="bg-secondary" textColor="text-secondary-foreground" />
                <ColorSwatch name="Accent" color="bg-accent" textColor="text-accent-foreground" />
                <ColorSwatch name="Muted" color="bg-muted" textColor="text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Semantic Colors</CardTitle>
              <CardDescription>Colors with specific meanings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                <ColorSwatch name="Destructive" color="bg-destructive" textColor="text-destructive-foreground" />
                <ColorSwatch name="Border" color="bg-border" />
                <ColorSwatch name="Input" color="bg-input" />
                <ColorSwatch name="Ring" color="bg-ring" textColor="text-white" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="typography" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Headings</CardTitle>
              <CardDescription>Heading styles for different levels</CardDescription>
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Body Text</CardTitle>
              <CardDescription>Text styles for body content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <span className="text-sm text-muted-foreground block mb-2">Paragraph</span>
                <p>
                  The quick brown fox jumps over the lazy dog. This paragraph contains multiple sentences to demonstrate
                  how text flows and wraps within the container. It should maintain proper line height and spacing.
                </p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground block mb-2">Small</span>
                <small>The quick brown fox jumps over the lazy dog</small>
              </div>
              <div>
                <span className="text-sm text-muted-foreground block mb-2">Muted</span>
                <p className="text-muted-foreground">The quick brown fox jumps over the lazy dog</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="components" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Buttons</CardTitle>
              <CardDescription>Button variants for different contexts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Button variant="default">Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link</Button>
                <Button variant="destructive">Destructive</Button>
              </div>

              <div className="mt-6">
                <h4 className="text-sm font-medium mb-3">Button Sizes</h4>
                <div className="flex flex-wrap items-center gap-4">
                  <Button size="sm">Small</Button>
                  <Button size="default">Default</Button>
                  <Button size="lg">Large</Button>
                  <Button size="icon" className="h-9 w-9">
                    <Sun className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Form Elements</CardTitle>
              <CardDescription>Input fields and form controls</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 max-w-md">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" placeholder="Enter your email" type="email" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" placeholder="Enter your password" type="password" />
                </div>
                <Button>Submit</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patterns" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Common UI Patterns</CardTitle>
              <CardDescription>Reusable UI patterns and layouts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-medium mb-3">Card with Actions</h3>
                  <Card>
                    <CardHeader>
                      <CardTitle>Patient Record</CardTitle>
                      <CardDescription>View and manage patient information</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p>Patient details and medical history would appear here.</p>
                    </CardContent>
                    <div className="flex items-center justify-end p-6 pt-0 space-x-2">
                      <Button variant="outline">Cancel</Button>
                      <Button>Save Changes</Button>
                    </div>
                  </Card>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-3">Split Content</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Left Panel</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p>Content for the left panel goes here.</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle>Right Panel</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p>Content for the right panel goes here.</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
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
