import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import type { Metadata } from "next"
import SightingButtons from "@/components/SightingButtons"


const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
)

type Props = {
  params: Promise<{ id: string }>
}

async function getProduct(id: string) {
  const { data } = await supabase
    .from("articles")
    .select("id, title, image_url, url, site")
    .eq("id", id)
    .single()

  return data
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {

  const { id } = await params

  const { data: article } = await supabase
    .from("articles")
    .select("title, image_url")
    .eq("id", id)
    .single()

  if (!article) {
    return {
      title: "商品が見つかりません",
    }
  }

  return {
    title: `${article.title}｜リラックマのガチャ設置場所まとめ`,

    description:
      `${article.title} の設置場所・目撃情報・取扱店舗を掲載しています。`,

    openGraph: {
      title: `${article.title}｜リラックマのガチャ設置場所まとめ`,
      description:
        `${article.title} の設置場所・目撃情報まとめ`,
      images: article.image_url
        ? [article.image_url]
        : ["/ogp.png"],
    },

    twitter: {
      card: "summary_large_image",
      title: `${article.title}｜リラックマのガチャ設置場所まとめ`,
      description:
        `${article.title} の設置場所・目撃情報まとめ`,
      images: article.image_url
        ? [article.image_url]
        : ["/ogp.png"],
    },
  }
}
export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params
  const article = await getProduct(id)

  if (!article) notFound()

  const { data: storeData } = await supabase
  .from("stores")
  .select("id, name, address, latitude, longitude")
  .not("latitude", "is", null)
  .not("longitude", "is", null)
  .limit(20)

let locations: any[] = storeData || []

const sightingSummary: Record<
  string,
  {
    found: number
    not_found: number
    sold_out: number
  }
> = {}

  const { data: otherArticles } = await supabase
    .from("articles")
    .select("id, title, image_url")
    .eq("site", article.site)
    .neq("id", id)
    .limit(8)

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <Link href="/" className="mb-4 inline-block text-sm font-bold text-blue-600">
          ← 検索ページに戻る
        </Link>

        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="grid gap-6 md:grid-cols-[260px_1fr]">
            {article.image_url ? (
              <img
                src={article.image_url}
                alt={article.title}
                className="h-64 w-full rounded-3xl object-cover"
              />
            ) : (
              <div className="flex h-64 w-full items-center justify-center rounded-3xl bg-slate-100 text-sm text-slate-400">
                No Image
              </div>
            )}

            <div>
              <p className="text-xs font-black text-slate-400">ガチャ商品</p>

              <h1 className="mt-2 text-2xl font-black leading-snug">
                {article.title}
              </h1>

              <a
  href={`https://www.amazon.co.jp/s?k=${encodeURIComponent(article.title)}&tag=wakana1889-22`}
  target="_blank"
  rel="noopener noreferrer"
  className="mt-4 inline-flex items-center rounded-2xl bg-amber-400 px-5 py-3 text-sm font-black text-black transition hover:scale-[1.02]"
>
  🛒 Amazonで探す
</a>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600">
                  設置店舗 {locations.length}件
                </span>

                {article.site && (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                    {article.site}
                  </span>
                )}
              </div>

              {article.url && (
                <a
                  href={article.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-block rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-700"
                >
                  公式ページを見る
                </a>
              )}
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-3xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-black">設置店舗</h2>
              <p className="mt-1 text-xs text-slate-400">
                この商品が設置されている店舗一覧
              </p>
            </div>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
              {locations.length}件
            </span>
          </div>

          {locations.length === 0 ? (
            <p className="text-sm text-slate-400">設置店舗情報はまだありません</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {locations.map((location) => (
                <div
                  key={location.id}
                  className="rounded-2xl border border-slate-100 p-4"
                >
                  <p className="font-black">{location.name}</p>

                  {location.address && (
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      {location.address}
                    </p>
                  )}
<div className="mt-3 rounded-2xl bg-slate-50 p-3">
  <p className="mb-2 text-xs font-black text-slate-500">
    目撃情報
  </p>

  <div className="flex flex-wrap gap-2 text-xs font-black">
    <span className="rounded-full bg-green-50 px-3 py-1.5 text-green-600">
      ✅ あった {sightingSummary[String(location.id)]?.found || 0}
    </span>

    <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-600">
      ❌ なかった {sightingSummary[String(location.id)]?.not_found || 0}
    </span>

    <span className="rounded-full bg-orange-50 px-3 py-1.5 text-orange-600">
      ⚠️ 売り切れ {sightingSummary[String(location.id)]?.sold_out || 0}
    </span>
  </div>
</div>
                  <SightingButtons
                    articleId={article.id}
                    storeId={location.id}
                    storeName={location.name}
                    storeAddress={location.address}
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-5 rounded-3xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-black">ほかの商品</h2>
              <p className="mt-1 text-xs text-slate-400">関連するガチャ商品</p>
            </div>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
              {otherArticles?.length || 0}件
            </span>
          </div>

          {!otherArticles || otherArticles.length === 0 ? (
            <p className="text-sm text-slate-400">ほかの商品はまだありません</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
              {otherArticles.map((item) => (
                <Link
                  key={item.id}
                  href={`/products/${item.id}`}
                  className="rounded-2xl border border-slate-100 p-3 transition hover:bg-slate-50"
                >
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="h-28 w-full rounded-xl object-cover"
                    />
                  ) : (
                    <div className="flex h-28 w-full items-center justify-center rounded-xl bg-slate-100 text-xs text-slate-400">
                      No Image
                    </div>
                  )}

                  <p className="mt-3 line-clamp-2 text-sm font-black">
                    {item.title}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}