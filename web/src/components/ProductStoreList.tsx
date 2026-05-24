"use client"

import { useEffect, useMemo, useState } from "react"
import SightingButtons from "@/components/SightingButtons"

type Location = {
  id: string
  name: string
  address: string | null
  latitude: number
  longitude: number
}

type Props = {
  articleId: string
  locations: Location[]
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

export default function ProductStoreList({
  articleId,
  locations,
}: Props) {
  const [userPosition, setUserPosition] = useState<{
    latitude: number
    longitude: number
  } | null>(null)

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

  const sortedLocations = useMemo(() => {
    return [...locations]
      .map((location) => ({
        ...location,
        distance:
          userPosition &&
          typeof location.latitude === "number" &&
          typeof location.longitude === "number"
            ? getDistanceKm(
                userPosition.latitude,
                userPosition.longitude,
                location.latitude,
                location.longitude
              )
            : undefined,
      }))
      .sort((a, b) => {
        if (typeof a.distance !== "number") return 1
        if (typeof b.distance !== "number") return -1
        return a.distance - b.distance
      })
  }, [locations, userPosition])

  if (sortedLocations.length === 0) {
    return (
      <p className="text-sm text-slate-400">
        近くの候補店舗はまだありません
      </p>
    )
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {sortedLocations.map((location) => (
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

          {typeof location.distance === "number" && (
            <p className="mt-2 inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-600">
              現在地から約 {location.distance.toFixed(1)} km
            </p>
          )}

          <SightingButtons
            articleId={articleId}
            storeId={location.id}
            storeName={location.name}
            storeAddress={location.address}
          />
        </div>
      ))}
    </div>
  )
}