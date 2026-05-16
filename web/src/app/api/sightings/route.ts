import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
)

export async function GET() {
  const { data, error } = await supabase
    .from("sightings")
    .select(`
      id,
      article_id,
      store_id,
      location_id,
      status,
      comment,
      store_name,
      store_address,
      source,
      created_at,
      articles (
        id,
        title,
        url,
        image_url,
        type
      ),
      stores (
        id,
        name,
        address,
        prefecture,
        city,
        latitude,
        longitude
      )
    `)
    .order("created_at", { ascending: false })
    .limit(20)

  if (error) {
    console.error("sightings fetch error:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({
    sightings: data ?? [],
  })
}