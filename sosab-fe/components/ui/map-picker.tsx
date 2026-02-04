"use client"

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { Search, Loader2, MapPin } from 'lucide-react'

// Fix for default marker icon in Leaflet with Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function LocationMarker({ position, setPosition }: { position: [number, number] | null, setPosition: (pos: [number, number]) => void }) {
    const map = useMapEvents({
        click(e) {
            setPosition([e.latlng.lat, e.latlng.lng])
            map.flyTo(e.latlng, map.getZoom())
        },
    })

    return position === null ? null : (
        <Marker position={position} />
    )
}

function RecenterMap({ position }: { position: [number, number] }) {
    const map = useMapEvents({})
    useEffect(() => {
        map.flyTo(position, map.getZoom())
    }, [position, map])
    return null
}

interface MapPickerProps {
    initialLat?: number
    initialLng?: number
    onLocationSelect: (lat: number, lng: number, address?: string) => void
}

export default function MapPicker({ initialLat, initialLng, onLocationSelect }: MapPickerProps) {
    const [position, setPosition] = useState<[number, number]>(
        initialLat && initialLng ? [initialLat, initialLng] : [36.8065, 10.1815]
    )

    const [searchQuery, setSearchQuery] = useState("")
    const [searchResults, setSearchResults] = useState<any[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [showResults, setShowResults] = useState(false)

    useEffect(() => {
        if (initialLat && initialLng) {
            setPosition([initialLat, initialLng])
        }
    }, [initialLat, initialLng])

    const handleSetPosition = (pos: [number, number], address?: string) => {
        setPosition(pos)
        onLocationSelect(pos[0], pos[1], address)
    }

    const reverseGeocode = async (lat: number, lng: number) => {
        try {
            // Using OpenStreetMap Nominatim
            // REMOVED User-Agent header to prevent browser blocking
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
            const data = await res.json()

            if (data && data.display_name) {
                const fullAddress = data.display_name
                setSearchQuery(fullAddress)
                return fullAddress
            }
        } catch (error) {
            console.error("Reverse geocode failed", error)
        }
        return undefined
    }

    const handleSearch = async (e?: React.FormEvent | React.KeyboardEvent) => {
        if (e) e.preventDefault()
        if (!searchQuery.trim()) return

        setIsSearching(true)
        setShowResults(false) // Temporarily hide results while new search happens

        try {
            // Support for decimal coordinates input "lat, lng"
            const coordRegex = /^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/
            const match = searchQuery.match(coordRegex)

            if (match) {
                const lat = parseFloat(match[1])
                const lng = parseFloat(match[3])
                const address = await reverseGeocode(lat, lng)
                handleSetPosition([lat, lng], address)
                return
            }

            // Support for DMS coordinates input: 34°51'45.5"N 9°46'59.4"E
            const dmsRegex = /(\d+)[°\s]+(\d+)['\s]+([\d.]+)["\s]*([NS])[, \t]+(\d+)[°\s]+(\d+)['\s]+([\d.]+)["\s]*([EW])/i
            const dmsMatch = searchQuery.match(dmsRegex)

            if (dmsMatch) {
                const parseDMS = (deg: string, min: string, sec: string, dir: string) => {
                    let val = parseFloat(deg) + parseFloat(min) / 60 + parseFloat(sec) / 3600
                    if (dir.toUpperCase() === 'S' || dir.toUpperCase() === 'W') val = -val
                    return val
                }

                const lat = parseDMS(dmsMatch[1], dmsMatch[2], dmsMatch[3], dmsMatch[4])
                const lng = parseDMS(dmsMatch[5], dmsMatch[6], dmsMatch[7], dmsMatch[8])

                const address = await reverseGeocode(lat, lng)
                handleSetPosition([lat, lng], address)
                return
            }

            // Text Search (OpenMeteo)
            setShowResults(true)
            const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchQuery)}&count=5&language=en&format=json`)
            const data = await res.json()

            if (data.results) {
                setSearchResults(data.results)
            } else {
                setSearchResults([])
            }
        } catch (error) {
            console.error("Search failed", error)
            setSearchResults([])
        } finally {
            setIsSearching(false)
        }
    }

    const selectResult = (result: any) => {
        const { latitude, longitude } = result
        const newPos: [number, number] = [latitude, longitude]

        // Construct detailed address string
        const parts = [result.name, result.admin1, result.country].filter(Boolean)
        const fullAddress = parts.join(", ")

        handleSetPosition(newPos, fullAddress)
        setSearchResults([])
        setShowResults(false)
        setSearchQuery(result.name)
    }

    return (
        <div className="space-y-3">
            <div className="relative">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search town, coordinates, or DMS..."
                            className="w-full pl-9 pr-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault()
                                    handleSearch()
                                }
                            }}
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => handleSearch()}
                        disabled={isSearching}
                        className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2"
                    >
                        {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                    </button>
                </div>

                {showResults && searchResults.length > 0 && (
                    <div className="absolute z-[1000] top-full left-0 right-0 bg-white border rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
                        {searchResults.map((result) => (
                            <button
                                key={result.id}
                                className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 border-b last:border-0 flex items-start gap-3 transition-colors"
                                onClick={() => selectResult(result)}
                                type="button"
                            >
                                <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                <div>
                                    <span className="font-medium block">{result.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {[result.admin1, result.country].filter(Boolean).join(", ")}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
                {showResults && !isSearching && searchResults.length === 0 && searchQuery && (
                    <div className="absolute z-[1000] top-full left-0 right-0 bg-white border rounded-md shadow-lg mt-1 p-4 text-sm text-center text-muted-foreground">
                        No locations found.
                    </div>
                )}
            </div>

            <div className="h-[300px] w-full rounded-md overflow-hidden border relative z-0">
                <MapContainer
                    center={position}
                    zoom={10}
                    style={{ height: '100%', width: '100%' }}
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <LocationMarker position={position} setPosition={handleSetPosition} />
                    <RecenterMap position={position} />
                </MapContainer>
            </div>
        </div>
    )
}
