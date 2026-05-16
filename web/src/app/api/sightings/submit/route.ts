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
      store_name,
      store_address,
      comment,
      status,
    } = body

    if (!article_id || !store_name || !status) {
      return NextResponse.json(
        {
          error: "missing required fields",
        },
        {
          status: 400,
        }
      )
    }

    // 既存店舗検索
    let storeId: string | null = null

    const { data: existingStore } = await supabase
      .from("stores")
      .select("id")
      .eq("name", store_name)
      .maybeSingle()

    // 店舗がある場合
    if (existingStore?.id) {
      storeId = existingStore.id
    } else {
      // 新規店舗作成
      const { data: createdStore, error: createStoreError } =
        await supabase
          .from("stores")
          .insert({
            name: store_name,
            address: store_address || null,
          })
          .select("id")
          .single()

      if (createStoreError || !createdStore) {
        return NextResponse.json(
          {
            error: createStoreError?.message ||
              "failed to create store",
          },
          {
            status: 500,
          }
        )
      }

      storeId = createdStore.id
    }

    // article_stores 紐づけ
    await supabase
      .from("article_stores")
      .upsert(
        {
          article_id,
          store_id: storeId,
        },
        {
          onConflict: "article_id,store_id",
        }
      )

    // sightings 投稿
    const { data: sighting, error: sightingError } =
      await supabase
        .from("sightings")
        .insert({
          article_id,
          store_id: storeId,
          status,
          comment: comment || null,
          store_name,
          store_address: store_address || null,
          source: "user",
        })
        .select()
        .single()

    if (sightingError) {
      return NextResponse.json(
        {
          error: sightingError.message,
        },
        {
          status: 500,
        }
      )
    }

    return NextResponse.json({
      success: true,
      sighting,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "unexpected error",
      },
      {
        status: 500,
      }
    )
  }
}