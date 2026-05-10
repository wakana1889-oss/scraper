"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import Supercluster from "supercluster"

type Location = {
  id: string
  name: string
  address: string | null
  latitude: number
  longitude: number
  distance?: number
}

type Props = {
  locations: Location[]
  userPosition: {
    latitude: number
    longitude: number
  } | null
  selectedLocation: Location | null
  onSelectLocation: (location: Location) => void
}

export default function Map({
  locations,
  userPosition,
  selectedLocation,
  onSelectLocation,
}: Props) {
  const mapRef = useRef<L.Map | null>(null)
  const mapElRef = useRef<HTMLDivElement | null>(null)
  const markersRef = useRef<L.LayerGroup | null>(null)

  const [mapReady, setMapReady] = useState(false)
  const [viewTick, setViewTick] = useState(0)

  useEffect(() => {
    if (!mapElRef.current) return
    if (mapRef.current) return

    const map = L.map(mapElRef.current, {
      center: [35.681236, 139.767125],
      zoom: 12,
      zoomControl: false,
    })

    L.control.zoom({ position: "bottomright" }).addTo(map)

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map)

    markersRef.current = L.layerGroup().addTo(map)
    mapRef.current = map

    map.on("moveend zoomend", () => {
      setViewTick((v) => v + 1)
    })

    setMapReady(true)

    setTimeout(() => {
      map.invalidateSize()
    }, 300)

    return () => {
      map.remove()
      mapRef.current = null
      markersRef.current = null
    }
  }, [])

  const points = useMemo(() => {
    return locations
      .filter(
        (location) =>
          typeof location.latitude === "number" &&
          typeof location.longitude === "number"
      )
      .map((location) => ({
        type: "Feature" as const,
        properties: {
          cluster: false,
          location,
        },
        geometry: {
          type: "Point" as const,
          coordinates: [location.longitude, location.latitude],
        },
      }))
  }, [locations])

  useEffect(() => {
    const map = mapRef.current
    const layer = markersRef.current

    if (!map || !layer || !mapReady) return

    layer.clearLayers()

    if (userPosition) {
      const userIcon = L.divIcon({
        html: `
          <div style="
            width: 18px;
            height: 18px;
            border-radius: 999px;
            background: #2563eb;
            border: 4px solid white;
            box-shadow: 0 4px 12px rgba(37,99,235,.45);
          "></div>
        `,
        className: "",
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      })

      L.marker([userPosition.latitude, userPosition.longitude], {
        icon: userIcon,
      })
        .bindPopup("現在地")
        .addTo(layer)
    }

    if (points.length === 0) return

    const cluster = new Supercluster({
      radius: 80,
      maxZoom: 18,
    })

    cluster.load(points as any)

    const bounds = map.getBounds()
    const zoom = map.getZoom()

    const clusters = cluster.getClusters(
      [
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth(),
      ],
      zoom
    )

    clusters.forEach((item: any) => {
      const [lng, lat] = item.geometry.coordinates
      const props = item.properties

      if (props.cluster) {
        const count = props.point_count

        const clusterIcon = L.divIcon({
          html: `
            <div style="
              width: 46px;
              height: 46px;
              border-radius: 999px;
              background: #111827;
              color: white;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 13px;
              font-weight: 900;
              border: 3px solid white;
              box-shadow: 0 10px 24px rgba(15,23,42,.28);
            ">
              ${count}
            </div>
          `,
          className: "",
          iconSize: [46, 46],
          iconAnchor: [23, 23],
        })
const pinIcon = L.divIcon({
  html: `
    <div style="
      font-size: 28px;
      transform: translate(-2px, -6px);
    ">
      📍
    </div>
  `,
  className: "",
  iconSize: [30, 30],
  iconAnchor: [15, 30],
})
        const marker = L.marker([lat, lng], {
          icon: pinIcon,
        })

        marker.on("click", () => {
          const expansionZoom = Math.min(
            cluster.getClusterExpansionZoom(props.cluster_id),
            18
          )

          map.setView([lat, lng], expansionZoom, {
            animate: true,
          })
        })

        marker.addTo(layer)
        return
      }

      const location: Location = props.location
      const isSelected = selectedLocation?.id === location.id

      const pinIcon = L.divIcon({
        html: `
          <div style="
            position: relative;
            width: 34px;
            height: 44px;
            transform: ${isSelected ? "scale(1.18)" : "scale(1)"};
            transition: transform .15s ease;
          ">
            <div style="
              position: absolute;
              left: 50%;
              top: 0;
              width: 34px;
              height: 34px;
              transform: translateX(-50%) rotate(45deg);
              border-radius: 50% 50% 50% 8px;
              background: ${isSelected ? "#2563eb" : "#ffffff"};
              border: 3px solid ${isSelected ? "#2563eb" : "#ffffff"};
              box-shadow: 0 10px 22px rgba(15,23,42,.25);
            "></div>

            <div style="
              position: absolute;
              left: 50%;
              top: 8px;
              width: 14px;
              height: 14px;
              transform: translateX(-50%);
              border-radius: 999px;
              background: ${isSelected ? "#ffffff" : "#2563eb"};
              box-shadow: inset 0 0 0 2px rgba(255,255,255,.25);
            "></div>
          </div>
        `,
        className: "",
        iconSize: [34, 44],
        iconAnchor: [17, 44],
        popupAnchor: [0, -42],
      })

      const marker = L.marker([lat, lng], {
        icon: pinIcon,
      })

      marker.bindPopup(`
        <div style="min-width: 220px;">
          <div style="
            font-weight: 900;
            font-size: 14px;
            margin-bottom: 4px;
            color: #0f172a;
          ">
            ${location.name}
          </div>

          ${
            location.address
              ? `<div style="
                  font-size: 12px;
                  color: #64748b;
                  line-height: 1.45;
                  margin-bottom: 6px;
                ">
                  ${location.address}
                </div>`
              : ""
          }

          ${
            typeof location.distance === "number"
              ? `<div style="
                  display: inline-block;
                  font-size: 12px;
                  font-weight: 800;
                  color: #16a34a;
                  background: #f0fdf4;
                  padding: 4px 8px;
                  border-radius: 999px;
                ">
                  約 ${location.distance.toFixed(1)} km
                </div>`
              : ""
          }
        </div>
      `)

      marker.on("click", () => {
        onSelectLocation(location)
      })

      marker.addTo(layer)
    })
  }, [
    points,
    userPosition,
    selectedLocation,
    onSelectLocation,
    mapReady,
    viewTick,
  ])

  useEffect(() => {
    const map = mapRef.current
    if (!map || locations.length === 0) return

    const valid = locations.filter(
      (location) =>
        typeof location.latitude === "number" &&
        typeof location.longitude === "number"
    )

    if (valid.length === 0) return

    const bounds = L.latLngBounds(
      valid.map((location) => [location.latitude, location.longitude])
    )

    map.fitBounds(bounds, {
      padding: [48, 48],
      maxZoom: 15,
    })
  }, [locations])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !selectedLocation) return

    map.setView(
      [selectedLocation.latitude, selectedLocation.longitude],
      Math.max(map.getZoom(), 15),
      {
        animate: true,
      }
    )
  }, [selectedLocation])

  return <div ref={mapElRef} className="h-full w-full" />
}