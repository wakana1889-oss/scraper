"use client"

import { useState } from "react"

type Status = "found" | "not_found" | "sold_out"

type Props = {
  articleId: string
  storeId: string
  storeName?: string | null
  storeAddress?: string | null
  onSubmitted?: (status: Status) => void
}

const options: Record<
  Status,
  {
    label: string
    icon: string
    className: string
  }
> = {
  found: {
    label: "あった",
    icon: "✅",
    className: "bg-green-600 text-white hover:bg-green-700",
  },
  not_found: {
    label: "なかった",
    icon: "❌",
    className: "bg-slate-700 text-white hover:bg-slate-800",
  },
  sold_out: {
    label: "売り切れ",
    icon: "⚠️",
    className: "bg-orange-500 text-white hover:bg-orange-600",
  },
}

export default function SightingButtons({
  articleId,
  storeId,
  storeName,
  storeAddress,
  onSubmitted,
}: Props) {
  const [loadingStatus, setLoadingStatus] = useState<Status | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function submit(status: Status) {
    setLoadingStatus(status)
    setMessage(null)

    const res = await fetch("/api/sightings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        article_id: articleId,
        location_id: storeId,
        store_name: storeName,
        store_address: storeAddress,
        status,
      }),
    })

    setLoadingStatus(null)

    if (!res.ok) {
      setMessage("投稿に失敗しました")
      return
    }

    setMessage("投稿しました！")

    onSubmitted?.(status)
  }

  return (
    <div className="mt-4 rounded-2xl bg-slate-50 p-3">
      <p className="mb-2 text-xs font-black text-slate-500">
        この店舗の目撃情報を投稿
      </p>

      <div className="grid grid-cols-3 gap-2">
        {(Object.keys(options) as Status[]).map((status) => {
          const option = options[status]

          return (
            <button
              key={status}
              onClick={() => submit(status)}
              disabled={loadingStatus !== null}
              className={`rounded-2xl px-3 py-3 text-center text-xs font-black shadow-sm transition disabled:opacity-50 ${option.className}`}
            >
              <span className="block text-lg">{option.icon}</span>

              <span className="mt-1 block">
                {loadingStatus === status ? "送信中" : option.label}
              </span>
            </button>
          )
        })}
      </div>

      {message && (
        <p className="mt-3 rounded-xl bg-white px-3 py-2 text-xs font-bold text-green-600">
          {message}
        </p>
      )}
    </div>
  )
}