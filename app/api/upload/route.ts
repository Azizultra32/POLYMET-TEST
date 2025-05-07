import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const path = formData.get("path") as string

    if (!file || !path) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = createServerClient()

    // Get the current user from the session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 })
    }

    const userId = session.user.id

    // Ensure the path starts with the user's ID to maintain proper access control
    if (!path.startsWith(`${userId}/`)) {
      return NextResponse.json({ error: "Invalid path" }, { status: 403 })
    }

    // Check if the bucket exists
    try {
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

      if (bucketsError) {
        console.error("Error listing buckets:", bucketsError)
        return NextResponse.json(
          {
            error: "Error checking storage buckets",
            fallbackToLocal: true,
          },
          { status: 503 },
        )
      }

      const bucketExists = buckets?.some((bucket) => bucket.name === "audio-chunks")

      if (!bucketExists) {
        console.error("Bucket 'audio-chunks' does not exist")

        // Try to create the bucket if we have permission
        try {
          const { error: createError } = await supabase.storage.createBucket("audio-chunks", {
            public: false,
            fileSizeLimit: 52428800, // 50MB
          })

          if (createError) {
            console.error("Error creating bucket:", createError)
            return NextResponse.json(
              {
                error: "Storage bucket not available and could not be created",
                fallbackToLocal: true,
              },
              { status: 503 },
            )
          }

          console.log("Successfully created 'audio-chunks' bucket")
        } catch (createError) {
          console.error("Error creating bucket:", createError)
          return NextResponse.json(
            {
              error: "Storage bucket not available and could not be created",
              fallbackToLocal: true,
            },
            { status: 503 },
          )
        }
      }
    } catch (error) {
      console.error("Error checking bucket:", error)
      return NextResponse.json(
        {
          error: "Error checking storage bucket",
          fallbackToLocal: true,
        },
        { status: 503 },
      )
    }

    // Try to upload the file
    try {
      const { data, error } = await supabase.storage.from("audio-chunks").upload(path, file, {
        cacheControl: "3600",
        upsert: true,
      })

      if (error) {
        console.error("Error uploading file:", error)
        return NextResponse.json(
          {
            error: "Failed to upload file",
            message: error.message,
            fallbackToLocal: true,
          },
          { status: 500 },
        )
      }

      return NextResponse.json({ success: true, path: data.path })
    } catch (uploadError) {
      console.error("Error during upload:", uploadError)
      return NextResponse.json(
        {
          error: "Upload failed",
          fallbackToLocal: true,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error processing upload:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        fallbackToLocal: true,
      },
      { status: 500 },
    )
  }
}
