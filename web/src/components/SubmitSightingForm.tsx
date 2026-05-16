"use client"

import { useState } from "react"

type Status = "found" | "not_found" | "sold_out"

type Props = {
  articleId: string
  articleTitle: string
  onSubmitted?: () => void
}

export default function SubmitSightingForm({
  articleId,
  articleTitle,
  onSubmitted,
}: Props) {
  const [storeName, setStoreName] = useState("")
  const [storeAddress, setStoreAddress] = useState("")
  const [comment, setComment] = useState("")
  const [status, setStatus] = useState<Status>("found")

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function submit() {
    if (!storeName.trim()) {
      setMessage("店舗名を入力してください")
      return
    }

    setLoading(true)
    setMessage(null)

    const res = await fetch("/api/sightings/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        article_id: articleId,
        store_name: storeName,
        store_address: storeAddress,
        comment,
        status,
      }),
    })

    setLoading(false)

    if (!res.ok) {
      setMessage("投稿に失敗しました")
      return
    }

    setStoreName("")
    setStoreAddress("")
    setComment("")
    setStatus("found")
    setMessage("投稿しました！")

    onSubmitted?.()
  }

  return (
    <div className="rounded-3xl bg-white p-4 shadow-sm">
      <div className="mb-4">
        <h2 className="text-sm font-black">この商品の目撃場所を投稿</h2>
        <p className="mt-1 line-clamp-2 text-xs text-slate-400">
          {articleTitle}
        </p>
      </div>

      <div className="space-y-3">
        <input
          value={storeName}
          onChange={(e) => setStoreName(e.target.value)}
          placeholder="店舗名 例：ガシャポンのデパート 池袋総本店"
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-amber-400"
        />

        <input
          value={storeAddress}
          onChange={(e) => setStoreAddress(e.target.value)}
          placeholder="住所（任意）"
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-amber-400"
        />

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="コメント（任意）例：2階のガチャコーナーにありました"
          rows={3}
          className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-amber-400"
        />

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setStatus("found")}
            className={`rounded-2xl px-3 py-3 text-xs font-black ${
              status === "found"
                ? "bg-green-600 text-white"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            ✅ あった
          </button>

          <button
            type="button"
            onClick={() => setStatus("sold_out")}
            className={`rounded-2xl px-3 py-3 text-xs font-black ${
              status === "sold_out"
                ? "bg-orange-500 text-white"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            ⚠️ 売り切れ
          </button>

          <button
            type="button"
            onClick={() => setStatus("not_found")}
            className={`rounded-2xl px-3 py-3 text-xs font-black ${
              status === "not_found"
                ? "bg-slate-700 text-white"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            ❌ なかった
          </button>
        </div>

        <button
          type="button"
          onClick={submit}
          disabled={loading}
          className="w-full rounded-2xl bg-amber-400 px-4 py-3 text-sm font-black text-slate-900 transition hover:bg-amber-300 disabled:opacity-50"
        >
          {loading ? "投稿中..." : "投稿する"}
        </button>

        {message && (
          <p className="rounded-2xl bg-slate-50 px-4 py-3 text-xs font-bold text-slate-600">
            {message}
          </p>
        )}
      </div>
    </div>
  )
}