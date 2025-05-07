"use client"

import { useState, useEffect } from "react"
import { useForm, useFormState, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { getCountryCallingCode } from "libphonenumber-js"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { logAllCookies, checkAuthCookies } from "@/lib/debug-cookies"

const countryCodeRegex = /^\+\d{1,4}$/

const formSchema = z.object({
  countryCode: z.string().regex(countryCodeRegex, "Invalid country code. Format: +X to +XXXX"),
  phone: z.string().min(10, "Invalid phone number. Must be at least 10 digits."),
  password: z.string(),
})

export default function FormLogin() {
  const { login } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [detectedCountryCode, setDetectedCountryCode] = useState("")
  const [loginError, setLoginError] = useState<string | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      countryCode: "",
      phone: "",
      password: "",
    },
  })

  const { isSubmitting } = useFormState({
    control: form.control,
  })

  useEffect(() => {
    const detectCountryCode = async () => {
      try {
        const response = await fetch("https://ipapi.co/json/")
        const data = await response.json()
        const countryCode = getCountryCallingCode(data.country_code)
        setDetectedCountryCode(`+${countryCode}`)
        form.setValue("countryCode", `+${countryCode}`)
      } catch (error) {
        console.error("Error detecting country code:", error)
      }
    }

    detectCountryCode()
  }, [form])

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedCredentials = localStorage.getItem("loginCredentials")
      if (savedCredentials) {
        try {
          const { phone, password } = JSON.parse(savedCredentials)
          const countryCode = phone.slice(0, phone.length - 10)
          const phoneNumber = phone.slice(-10)
          form.setValue("countryCode", countryCode)
          form.setValue("phone", phoneNumber)
          form.setValue("password", password)
          localStorage.removeItem("loginCredentials")
        } catch (error) {
          console.error("Error parsing saved credentials:", error)
        }
      }
    }
  }, [form])

  const formatPhoneNumber = (value: string) => {
    const phoneNumber = value.replace(/\D/g, "")
    const phoneNumberLength = phoneNumber.length
    if (phoneNumberLength < 4) return phoneNumber
    if (phoneNumberLength < 7) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`
    }
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`
  }

  const unformatPhoneNumber = (value: string) => {
    return value.replace(/\D/g, "")
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoginError(null)
    try {
      // Ensure phone number is formatted correctly by removing any formatting characters
      const cleanPhone = values.phone.replace(/\D/g, "")
      const fullPhone = `${values.countryCode}${cleanPhone}`

      console.log("Attempting login with:", { phone: fullPhone })
      const result = await login({ phone: fullPhone, password: values.password })

      // Log cookies after successful login
      console.log("Login successful, checking cookies:")
      logAllCookies()
      checkAuthCookies()

      // Success handling
      toast({
        title: "Login successful",
        description: "You have been logged in successfully.",
      })

      // Store auth in localStorage as a backup
      localStorage.setItem("auth-backup", JSON.stringify({ authenticated: true, timestamp: Date.now() }))

      // Redirect with a slight delay to allow cookies to be set
      setTimeout(() => {
        router.push("/")
      }, 500)
    } catch (error: any) {
      console.error("Login error:", error)
      setLoginError(error.message || "Invalid credentials. Please try again.")
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <div className="flex space-x-2">
          <FormField
            control={form.control}
            name="countryCode"
            render={({ field }) => (
              <FormItem className="flex-shrink-0 w-24">
                <p
                  style={{
                    fontWeight: 600,
                    fontFamily: "Satoshi, system-ui, sans-serif",
                    fontSize: "13px",
                    letterSpacing: "0.02em",
                    lineHeight: 1.2,
                  }}
                  className="text-foreground/80 mb-1.5"
                >
                  Code
                </p>
                <FormControl>
                  <Input
                    className="text-black border-input bg-background focus:ring-primary/30"
                    placeholder="+1"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem className="flex-grow">
                <p
                  style={{
                    fontWeight: 600,
                    fontFamily: "Satoshi, system-ui, sans-serif",
                    fontSize: "13px",
                    letterSpacing: "0.02em",
                    lineHeight: 1.2,
                  }}
                  className="text-foreground/80 mb-1.5"
                >
                  Phone
                </p>
                <FormControl>
                  <Controller
                    name="phone"
                    control={form.control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        placeholder="(123) 456-7890"
                        value={formatPhoneNumber(field.value)}
                        onChange={(e) => {
                          const formatted = formatPhoneNumber(e.target.value)
                          const unformatted = unformatPhoneNumber(formatted)
                          field.onChange(unformatted)
                        }}
                        className="border-input bg-background focus:ring-primary/30"
                      />
                    )}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <p
                style={{
                  fontWeight: 600,
                  fontFamily: "Satoshi, system-ui, sans-serif",
                  fontSize: "13px",
                  letterSpacing: "0.02em",
                  lineHeight: 1.2,
                }}
                className="text-foreground/80 mb-1.5"
              >
                Password
              </p>
              <FormControl>
                <Input
                  placeholder=""
                  {...field}
                  type="password"
                  className="border-input bg-background focus:ring-primary/30"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {loginError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md text-sm">{loginError}</div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            fontWeight: 600,
            fontFamily: "Satoshi, system-ui, sans-serif",
            fontSize: "16px",
            letterSpacing: "0.02em",
            lineHeight: 1.2,
          }}
          className="w-full bg-primary hover:bg-primary/90 text-white text-center p-3 rounded-md h-12 mt-4 transition-colors duration-200"
        >
          {isSubmitting ? "Logging in..." : "Sign In"}
        </button>
      </form>
    </Form>
  )
}
