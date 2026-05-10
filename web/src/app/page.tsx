"use client"

import { useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import { createClient } from "@supabase/supabase-js"
import SightingButtons from "@/components/SightingButtons"

const Map = dynamic(() => import("@/components/Map"), {
  ssr: false,
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
)

type Article = {
  id: string
  title: string
  image_url: string | null
}

type Location = {
  id: string
  name: string
  address: string | null
  latitude: number
  longitude: number
}

type LocationWithDistance = Location & {
  distance?: number
}

type News = {
  id: string
  site: string
  title: string
  url: string
  image_url: string | null
  summary: string | null
  published_at: string | null
}

function getDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2

  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export default function Home() {
  const [keyword, setKeyword] = useState("")
  const [articles, setArticles] = useState<Article[]>([])
  const [suggestions, setSuggestions] = useState<Article[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  const [locations, setLocations] = useState<LocationWithDistance[]>([])
  const [candidateStores, setCandidateStores] = useState<
  LocationWithDistance[]
>([])
  const [storeArticles, setStoreArticles] = useState<Article[]>([])
  const [sightingSummary, setSightingSummary] = useState<
  Record<
    string,
    {
      found: number
      not_found: number
      sold_out: number
    }
  >
>({})
  const [news, setNews] = useState<News[]>([])

  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)
  const [selectedLocation, setSelectedLocation] =
    useState<LocationWithDistance | null>(null)

  const [userPosition, setUserPosition] = useState<{
    latitude: number
    longitude: number
  } | null>(null)

  const [radiusKm, setRadiusKm] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!navigator.geolocation) return

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPosition({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        })
      },
      () => {
        setUserPosition(null)
      }
    )
  }, [])

  useEffect(() => {
  fetchInitialArticles()
  fetchNews()
  async function fetchCandidateStores() {
  const { data, error } = await supabase
    .from("stores")
    .select(`
      id,
      name,
      address,
      latitude,
      longitude
    `)
    .eq("status", "candidate")
    .not("latitude", "is", null)
    .not("longitude", "is", null)
    .limit(200)

  if (error) {
    console.error(error)
    return
  }

  const mapped =
    (data || []).map((store: any) => {
      if (!userPosition) return store

      return {
        ...store,
        distance: getDistanceKm(
          userPosition.latitude,
          userPosition.longitude,
          store.latitude,
          store.longitude
        ),
      }
    }) || []

  setCandidateStores(mapped)
}
  fetchCandidateStores()
}, [])

  useEffect(() => {
    const q = keyword.trim()

    if (q.length < 2) {
      setSuggestions([])
      return
    }

    const timer = setTimeout(async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("id, title, image_url")
        .eq("site", "ip4")
        .ilike("title", `%${q}%`)
        .limit(8)

      if (error) return

      setSuggestions((data || []) as Article[])
      setShowSuggestions(true)
    }, 250)

    return () => clearTimeout(timer)
  }, [keyword])

  async function fetchInitialArticles() {
    setLoading(true)
    setErrorMessage(null)

    const { data, error } = await supabase
      .from("articles")
      .select("id, title, image_url")
      .eq("site", "ip4")
      .order("created_at", { ascending: false })
      .limit(30)

    if (error) {
      setErrorMessage(error.message)
      setLoading(false)
      return
    }

    setArticles((data || []) as Article[])
    setLoading(false)
  }

  async function fetchNews() {
    const { data, error } = await supabase
      .from("news")
      .select("id, site, title, url, image_url, summary, published_at")
      .order("created_at", { ascending: false })
      .limit(6)

    if (error) return

    setNews((data || []) as News[])
  }

  async function searchArticles() {
    if (!keyword.trim()) {
      setShowSuggestions(false)
      setSuggestions([])
      await fetchInitialArticles()
      return
    }

    setLoading(true)
    setErrorMessage(null)
    setShowSuggestions(false)
    setSuggestions([])
    setSelectedArticle(null)
    setSelectedLocation(null)
    setStoreArticles([])
    setLocations([])

    const { data, error } = await supabase
      .from("articles")
      .select("id, title, image_url")
      .eq("site", "ip4")
      .ilike("title", `%${keyword}%`)
      .limit(50)

    if (error) {
      setErrorMessage(error.message)
      setLoading(false)
      return
    }

    const result = (data || []) as Article[]
    setArticles(result)

    if (result.length === 0) {
      setErrorMessage("該当する商品が見つかりませんでした")
    }

    setLoading(false)
  }

  async function selectArticle(article: Article) {
    setSelectedArticle(article)
    setSelectedLocation(null)
    setStoreArticles([])
    setErrorMessage(null)
    setShowSuggestions(false)
    setLoading(true)

    const { data, error } = await supabase
      .from("article_locations")
      .select(
        `
        location:locations (
          id,
          name,
          address,
          latitude,
          longitude
        )
      `
      )
      .eq("article_id", article.id)

    if (error) {
      setErrorMessage(error.message)
      setLoading(false)
      return
    }

const mapped: LocationWithDistance[] = (data || [])
  .map((row: any) => row.location)
  .filter(
    (location: Location | null): location is Location =>
      !!location &&
      typeof location.latitude === "number" &&
      typeof location.longitude === "number"
  )
  .map((location: Location): LocationWithDistance => {
    if (!userPosition) {
      return {
        ...location,
      }
    }

    return {
      ...location,
      distance: getDistanceKm(
        userPosition.latitude,
        userPosition.longitude,
        location.latitude,
        location.longitude
      ),
    }
  })
  .sort((a, b) => {
    if (typeof a.distance !== "number") return 1
    if (typeof b.distance !== "number") return -1
    return a.distance - b.distance
  })
const locationIds = mapped.map((loc) => loc.id)

if (locationIds.length > 0) {
  const { data: summaryData } = await supabase
    .from("sighting_summary")
.select(`
  location_id,
  found_count,
  not_found_count,
  sold_out_count
`)
    .eq("article_id", article.id)
    .in("store_id", locationIds)

  const summaryMap: Record<
    string,
    {
      found: number
      not_found: number
      sold_out: number
    }
  > = {}

  ;(summaryData || []).forEach((row: any) => {
   summaryMap[String(row.location_id)] = {
  found: row.found_count || 0,
  not_found: row.not_found_count || 0,
  sold_out: row.sold_out_count || 0,
}
  })

  setSightingSummary(summaryMap)
}
    setLocations(mapped)
    setLoading(false)
  }

  async function selectLocation(location: LocationWithDistance) {
    setSelectedLocation(location)
    setStoreArticles([])
    setErrorMessage(null)
    setLoading(true)

    const { data: links, error: linkError } = await supabase
      .from("article_locations")
      .select("article_id")
      .eq("location_id", location.id)

    if (linkError) {
      setErrorMessage(linkError.message)
      setLoading(false)
      return
    }

    const articleIds = Array.from(
      new Set((links || []).map((row: any) => row.article_id).filter(Boolean))
    )

    if (articleIds.length === 0) {
      setErrorMessage("この店舗に紐づく商品が見つかりませんでした")
      setLoading(false)
      return
    }

    const { data: articles, error: articleError } = await supabase
      .from("articles")
      .select("id, title, image_url")
      .in("id", articleIds)

    if (articleError) {
      setErrorMessage(articleError.message)
      setLoading(false)
      return
    }

    setStoreArticles((articles || []) as Article[])
    setLoading(false)
  }

  const filteredLocations = useMemo(() => {
    if (!radiusKm) return locations

    return locations.filter((location) => {
      if (typeof location.distance !== "number") return true
      return location.distance <= radiusKm
    })
  }, [locations, radiusKm])

  const sortedLocations = useMemo(() => {
  return [...filteredLocations].sort((a, b) => {
    const aFound = sightingSummary[String(a.id)]?.found || 0
    const bFound = sightingSummary[String(b.id)]?.found || 0

    return bFound - aFound
  })
}, [filteredLocations, sightingSummary])

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-[1600px] px-4 py-4">
       <header className="rounded-3xl bg-gradient-to-br from-yellow-100 via-orange-50 to-amber-100 p-6 shadow-sm">
  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
    <div>
      <p className="text-xs font-black tracking-widest text-amber-600">
        RILAKKUMA GACHA MAP
      </p>

      <h1 className="mt-2 text-3xl font-black leading-tight text-slate-900 md:text-5xl">
        リラックマの
        <br />
        ガチャ設置場所まとめ
      </h1>

      <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
        リラックマ・コリラックマ・キイロイトリ・チャイロイコグマの
        ガチャガチャ設置情報をまとめています。
        ユーザー投稿から「今ありそう」な店舗も探せます。
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        <span className="rounded-full bg-white px-4 py-2 text-xs font-black text-amber-700 shadow-sm">
          🔥 目撃情報対応
        </span>

        <span className="rounded-full bg-white px-4 py-2 text-xs font-black text-green-700 shadow-sm">
          📍 関東中心
        </span>

        <span className="rounded-full bg-white px-4 py-2 text-xs font-black text-pink-700 shadow-sm">
          🧸 リラックマ特化
        </span>
      </div>
    </div>

    <div className="flex shrink-0 items-center justify-center">
      <div className="rounded-[32px] bg-white/80 p-4 shadow-lg backdrop-blur">
        <img
          src="/rilakkuma-hero.png"
          alt="リラックマ"
          className="h-40 w-40 object-contain md:h-52 md:w-52"
        />
      </div>
    </div>
  </div>
</header>
<div className="my-4 rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 p-4 shadow-sm">
  <p className="text-xs font-black tracking-widest text-amber-600">
    AD / PICK UP
  </p>

  <p className="mt-2 text-sm font-black text-slate-900">
    リラックマ関連グッズ・ガチャ情報はこちら
  </p>

  <p className="mt-1 text-xs text-slate-500">
    後でアフィリエイトリンクを設置できます
  </p>
</div>
        <section className="mb-4 rounded-3xl bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-black">
                {keyword.trim() ? "検索結果" : "最新商品一覧"}
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                商品カードを選ぶと設置店舗が地図に表示されます
              </p>
            </div>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
              {articles.length}件
            </span>
          </div>
          

          {articles.length === 0 ? (
            <p className="text-sm text-slate-400">
              商品データがまだありません
            </p>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {articles.map((article) => (
                <div
                  key={article.id}
                  className={`w-[220px] shrink-0 rounded-3xl border p-3 transition ${
                    selectedArticle?.id === article.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-100 bg-white"
                  }`}
                >
                  <button
                    onClick={() => selectArticle(article)}
                    className="w-full text-left"
                  >
                    {article.image_url ? (
                      <img
                        src={article.image_url}
                        alt={article.title}
                        className="h-32 w-full rounded-2xl object-cover"
                      />
                    ) : (
                      <div className="flex h-32 w-full items-center justify-center rounded-2xl bg-slate-100 text-xs text-slate-400">
                        No Image
                      </div>
                    )}

                    <p className="mt-3 line-clamp-2 min-h-[40px] text-sm font-black">
                      {article.title}
                    </p>

                    <div className="mt-3 flex items-center justify-between">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600">
                        店舗を見る
                      </span>

                      {selectedArticle?.id === article.id && (
                        <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white">
                          選択中
                        </span>
                      )}
                    </div>
                  </button>

                  <a
                    href={`/products/${article.id}`}
                    className="mt-3 block rounded-2xl bg-slate-900 px-4 py-2 text-center text-xs font-bold text-white hover:bg-slate-700"
                  >
                    詳細ページ
                  </a>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mb-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl bg-white p-4 shadow-sm">
            <p className="text-xs font-black text-slate-400">選択中の商品</p>

            {selectedArticle ? (
              <div className="mt-3 flex gap-4">
                {selectedArticle.image_url ? (
                  <img
                    src={selectedArticle.image_url}
                    alt={selectedArticle.title}
                    className="h-24 w-24 rounded-2xl object-cover"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-slate-100 text-xs text-slate-400">
                    No Image
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <h2 className="line-clamp-2 text-lg font-black">
                    {selectedArticle.title}
                  </h2>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600">
                      設置場所 {filteredLocations.length}件
                    </span>

                    {radiusKm && (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                        {radiusKm}km以内
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-400">
                商品を選択するとここに表示されます
              </p>
            )}
          </div>

          <div className="rounded-3xl bg-white p-4 shadow-sm">
            <p className="text-xs font-black text-slate-400">選択中の店舗</p>

            {selectedLocation ? (
              <div className="mt-3">
                <h2 className="text-lg font-black">{selectedLocation.name}</h2>

                {selectedLocation.address && (
                  <p className="mt-1 text-sm text-slate-500">
                    {selectedLocation.address}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  {typeof selectedLocation.distance === "number" && (
                    <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-600">
                      現在地から約 {selectedLocation.distance.toFixed(1)} km
                    </span>
                  )}

                  <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-purple-600">
                    商品 {storeArticles.length}件
                  </span>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-400">
                店舗を選択するとここに表示されます
              </p>
            )}
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1fr_620px]">
          <section className="overflow-hidden rounded-3xl bg-white shadow-sm">
            <div className="flex h-12 items-center justify-between border-b border-slate-100 px-4">
              <div>
                <p className="text-sm font-black">マップ</p>
                <p className="text-xs text-slate-400">
                  ピンをクリックすると店舗情報を表示
                </p>
              </div>

             <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
  {selectedArticle
    ? filteredLocations.length
    : candidateStores.length}
  店舗
</span>
            </div>

            <div className="h-[420px] md:h-[720px]">
              <Map
  locations={
    selectedArticle
      ? filteredLocations
      : candidateStores
  }
  userPosition={userPosition}
  selectedLocation={selectedLocation}
  onSelectLocation={selectLocation}
/>
            </div>
          </section>

          <aside className="space-y-4">
  <div className="grid gap-4 xl:grid-cols-[1fr_260px]">
    <div className="rounded-3xl bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-black">店舗・商品情報</h2>
          <p className="mt-1 text-xs text-slate-400">
            {selectedLocation ? "この店舗の商品一覧" : "設置店舗一覧"}
          </p>
        </div>

        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
          {selectedLocation ? storeArticles.length : filteredLocations.length}件
        </span>
      </div>

      {selectedLocation ? (
        <>
          <div className="mb-4 rounded-3xl border border-blue-100 bg-blue-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="line-clamp-2 font-black text-slate-900">
                  {selectedLocation.name}
                </p>

                {selectedLocation.address && (
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                    {selectedLocation.address}
                  </p>
                )}
              </div>

              <button
                onClick={() => {
                  setSelectedLocation(null)
                  setStoreArticles([])
                  setErrorMessage(null)
                }}
                className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500 hover:bg-slate-100"
              >
                戻る
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {typeof selectedLocation.distance === "number" && (
                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-green-600">
                  約 {selectedLocation.distance.toFixed(1)} km
                </span>
              )}

              <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-purple-600">
                商品 {storeArticles.length}件
              </span>
            </div>
          </div>

          {storeArticles.length === 0 ? (
            <p className="text-sm text-slate-400">商品情報がありません</p>
          ) : (
            <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
              {storeArticles.map((article) => (
                <div
                  key={article.id}
                  className="flex gap-3 rounded-2xl border border-slate-100 bg-white p-3"
                >
                  {article.image_url ? (
                    <img
                      src={article.image_url}
                      alt={article.title}
                      className="h-14 w-14 shrink-0 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs text-slate-400">
                      No Image
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-black">
                      {article.title}
                    </p>
                    <p className="mt-2 text-xs font-bold text-slate-400">
                      この店舗で取扱い
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {filteredLocations.length === 0 ? (
            <p className="text-sm text-slate-400">
              商品を選択すると店舗一覧が表示されます
            </p>
          ) : (
            <div className="max-h-[460px] space-y-3 overflow-y-auto pr-1">
              {sortedLocations.map((location, index) => (
                <div
                  key={location.id}
                  className="w-full rounded-3xl border border-slate-100 bg-white p-4"
                >
                  <button
                    onClick={() => selectLocation(location)}
                    className="w-full text-left"
                  >
                    <div className="flex gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-black text-slate-500">
                        {index + 1}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-black">
                          {location.name}
                        </p>

                        {location.address && (
                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                            {location.address}
                          </p>
                        )}

                        <div className="mt-3 flex flex-wrap gap-2">
                          {typeof location.distance === "number" && (
                            <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-600">
                              約 {location.distance.toFixed(1)} km
                            </span>
                          )}

                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                            商品を見る
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>

                  <div className="mt-4 rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-black tracking-wide text-orange-500">
                          SIGHTING REPORT
                        </p>
                        <h3 className="text-sm font-black text-slate-900">
                          目撃情報
                        </h3>
                      </div>

                      {(sightingSummary[String(location.id)]?.found || 0) > 0 && (
                        <div className="rounded-full bg-orange-500 px-3 py-1 text-[10px] font-black text-white shadow-sm">
                          🔥 最近目撃あり
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-2xl bg-white p-3 text-center shadow-sm">
                        <div className="text-xl">✅</div>
                        <p className="mt-1 text-lg font-black text-green-600">
                          {sightingSummary[String(location.id)]?.found || 0}
                        </p>
                        <p className="mt-1 text-[10px] font-bold text-slate-400">
                          あった
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white p-3 text-center shadow-sm">
                        <div className="text-xl">❌</div>
                        <p className="mt-1 text-lg font-black text-slate-700">
                          {sightingSummary[String(location.id)]?.not_found || 0}
                        </p>
                        <p className="mt-1 text-[10px] font-bold text-slate-400">
                          なかった
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white p-3 text-center shadow-sm">
                        <div className="text-xl">⚠️</div>
                        <p className="mt-1 text-lg font-black text-orange-500">
                          {sightingSummary[String(location.id)]?.sold_out || 0}
                        </p>
                        <p className="mt-1 text-[10px] font-bold text-slate-400">
                          売り切れ
                        </p>
                      </div>
                    </div>
                  </div>

                  {selectedArticle && (
                    <SightingButtons
                      articleId={selectedArticle.id}
                      storeId={location.id}
                      storeName={location.name}
                      storeAddress={location.address}
                      onSubmitted={(status) => {
                        setSightingSummary((prev) => {
                          const key = String(location.id)
                          const current = prev[key] || {
                            found: 0,
                            not_found: 0,
                            sold_out: 0,
                          }

                          return {
                            ...prev,
                            [key]: {
                              ...current,
                              [status]: Number(current[status]) + 1,
                            },
                          }
                        })
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>

    <div className="rounded-3xl bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 p-4 shadow-sm">
  <p className="text-xs font-black tracking-widest text-amber-600">
    PICK UP
  </p>

  <div className="mt-3 flex gap-3">
    <img
      src="/rilakkuma-hero.png"
      alt="pickup"
      className="h-20 w-20 rounded-2xl object-cover"
    />

    <div className="min-w-0 flex-1">
      <p className="line-clamp-2 text-sm font-black text-slate-900">
        リラックマの人気グッズ特集
      </p>

      <p className="mt-2 text-xs leading-5 text-slate-500">
        ガチャ・ぬいぐるみ・限定グッズをチェック
      </p>

      <a
        href="#"
        className="mt-3 inline-flex rounded-full bg-amber-500 px-4 py-2 text-xs font-black text-white hover:bg-amber-600"
      >
        詳細を見る
      </a>
    </div>
  </div>
</div>
          <h2 className="text-sm font-black">最新ニュース</h2>
          <p className="mt-1 text-xs text-slate-400">公式情報</p>
        </div>

        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">
          {news.length}
        </span>
      </div>

      {news.length === 0 ? (
        <p className="text-sm text-slate-400">ニュースはまだありません</p>
      ) : (
        <div className="max-h-[460px] space-y-2 overflow-y-auto pr-1">
          {news.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="block rounded-2xl border border-slate-100 p-2.5 transition hover:bg-slate-50"
            >
              <div className="flex gap-2.5">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="h-12 w-12 shrink-0 rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[10px] text-slate-400">
                    News
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-xs font-black leading-5">
                    {item.title}
                  </p>
                  <p className="mt-1 text-[11px] font-bold text-blue-600">
                    詳細を見る
                  </p>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  </div>
</aside>
        </section>
      </div>
      <div className="fixed bottom-3 left-3 right-3 z-[9999] rounded-3xl border border-amber-200 bg-white/95 p-3 shadow-xl backdrop-blur md:hidden">
  <div className="flex items-center justify-between gap-3">
    <div>
      <p className="text-xs font-black text-amber-600">PICK UP</p>
      <p className="text-sm font-black text-slate-900">
        リラックマグッズ特集
      </p>
    </div>

    <a
      href="#"
      className="shrink-0 rounded-full bg-amber-500 px-4 py-2 text-xs font-black text-white"
    >
      見る
    </a>
  </div>
</div>
    </main>
  )
}