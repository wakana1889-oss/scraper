import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
)

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const {
      article_id,
      store_id,
      location_id,
      status,
      comment,
      store_name,
      store_address,
    } = body

    if (!status) {
      return NextResponse.json(
        { error: "status is required" },
        { status: 400 }
      )
    }

    const result = await supabase
      .from("sightings")
      .insert({
        article_id: article_id || null,
        store_id: store_id || null,
        location_id: location_id || null,
        status,
        comment: comment || null,
        store_name: store_name || null,
        store_address: store_address || null,
        source: "user",
      })
      .select()
      .single()

    if (result.error) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    })
  } catch {
    return NextResponse.json(
      { error: "unexpected error" },
      { status: 500 }
    )
  }
}