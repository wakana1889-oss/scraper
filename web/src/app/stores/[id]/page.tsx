import { createClient } from "@supabase/supabase-js"
import Link from "next/link"
import type { Metadata } from "next"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
)

type PageProps = {
  params: Promise<{ id: string }>
}

function statusLabel(status: string) {
  if (status === "found") return "あった"
  if (status === "not_found") return "なかった"
  if (status === "sold_out") return "売り切れ"

  return status
}

function formatAgo(dateString: string) {
  const diff = Date.now() - new Date(dateString).getTime()
  const minutes = Math.floor(diff / 1000 / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (minutes < 1) return "たった今"
  if (minutes < 60) return `${minutes}分前`
  if (hours < 24) return `${hours}時間前`

  return `${days}日前`
}
export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params

  const { data: store } = await supabase
    .from("stores")
    .select("name, address")
    .eq("id", id)
    .single()

  if (!store) {
    return {
      title: "店舗が見つかりません｜リラックマのガチャ設置場所まとめ",
    }
  }

  return {
    title: `${store.name}のリラックマガチャ設置情報｜リラックマのガチャ設置場所まとめ`,
    description: `${store.name}${
      store.address ? `（${store.address}）` : ""
    }のリラックマガチャ設置情報・目撃情報・取扱商品を掲載しています。`,

    openGraph: {
      title: `${store.name}のリラックマガチャ設置情報`,
      description: `${store.name}のリラックマガチャ目撃情報・取扱商品まとめ`,
      images: ["/ogp.png"],
    },

    twitter: {
      card: "summary_large_image",
      title: `${store.name}のリラックマガチャ設置情報`,
      description: `${store.name}のリラックマガチャ目撃情報・取扱商品まとめ`,
      images: ["/ogp.png"],
    },
  }
}
export default async function StorePage({ params }: PageProps) {
  const { id } = await params

  const { data: store } = await supabase
    .from("stores")
    .select(`
      id,
      name,
      address,
      latitude,
      longitude
    `)
    .eq("id", id)
    .single()

  const { data: links } = await supabase
    .from("article_stores")
    .select(`
      articles (
        id,
        title,
        image_url,
        url,
        type
      )
    `)
    .eq("store_id", id)

  const { data: sightings } = await supabase
    .from("sightings")
    .select(`
      id,
      status,
      comment,
      created_at,
      articles (
        id,
        title,
        image_url
      )
    `)
    .eq("store_id", id)
    .order("created_at", { ascending: false })
    .limit(20)

  if (!store) {
    return (
      <main className="min-h-screen bg-slate-100 p-6">
        <div className="mx-auto max-w-3xl rounded-3xl bg-white p-6 shadow-sm">
          <p className="font-black">
            店舗が見つかりませんでした
          </p>

          <Link
            href="/"
            className="mt-4 inline-block text-sm font-bold text-blue-600"
          >
            ← トップへ戻る
          </Link>
        </div>
      </main>
    )
  }

  const articles =
    links
      ?.map((row: any) => row.articles)
      .filter(Boolean)
      .filter(
        (article: any) =>
          article.type !== "event" &&
          article.type !== "news"
      ) || []

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <Link
          href="/"
          className="text-sm font-bold text-blue-600"
        >
          ← トップへ戻る
        </Link>

        <section className="mt-4 rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-xs font-black tracking-widest text-amber-600">
            STORE DETAIL
          </p>

          <h1 className="mt-2 text-3xl font-black">
            {store.name}
          </h1>

          {store.address && (
            <p className="mt-3 text-sm text-slate-500">
              {store.address}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600">
              商品 {articles.length}件
            </span>

            <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-600">
              投稿 {sightings?.length || 0}件
            </span>
          </div>
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl bg-white p-4 shadow-sm">
            <h2 className="font-black">
              この店舗の商品
            </h2>

            {articles.length === 0 ? (
              <p className="mt-3 text-sm text-slate-400">
                商品情報はまだありません
              </p>
            ) : (
              <div className="mt-4 space-y-3">

              {articles.map((article: any) => (
  <Link
    key={article.id}
    href={`/products/${article.id}`}
    className="flex gap-3 rounded-2xl border border-slate-100 p-3 transition hover:bg-slate-50"
  >
    {article.image_url ? (
      <img
        src={article.image_url}
        alt={article.title}
        className="h-16 w-16 rounded-xl object-cover"
      />
    ) : (
      <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-slate-100 text-xs text-slate-400">
        No Image
      </div>
    )}

    <div className="min-w-0 flex-1">
      <p className="line-clamp-2 text-sm font-black">
        {article.title}
      </p>

      <p className="mt-2 text-xs font-bold text-blue-600">
        商品詳細を見る
      </p>
      <a
  href={`https://www.amazon.co.jp/s?k=${encodeURIComponent(article.title)}&tag=wakana1889-22`}
  target="_blank"
  rel="noopener noreferrer"
  className="mt-2 inline-flex rounded-full bg-amber-400 px-3 py-1 text-xs font-black text-black"
>
  🛒 Amazon
</a>
    </div>
  </Link>
))}
            </div>
          )}
        </div>

        <div className="rounded-3xl bg-white p-4 shadow-sm">
          <h2 className="font-black">
            最近の目撃情報
          </h2>

          {!sightings || sightings.length === 0 ? (
            <p className="mt-3 text-sm text-slate-400">
              投稿はまだありません
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {sightings.map((sighting: any) => (
                <div
                  key={sighting.id}
                  className="rounded-2xl border border-slate-100 p-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                      {statusLabel(sighting.status)}
                    </span>

                    <span className="text-xs font-bold text-slate-400">
                      {formatAgo(sighting.created_at)}
                    </span>
                  </div>

                  <p className="mt-2 line-clamp-2 text-sm font-black">
                    {sighting.articles?.title || "商品名未設定"}
                  </p>

                  {sighting.comment && (
                    <p className="mt-2 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">
                      {sighting.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  </main>
)
}
