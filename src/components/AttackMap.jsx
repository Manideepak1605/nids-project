import React, { useEffect, useState } from 'react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { dataService } from '../services/dataService';
import Card from './Card';

const geoUrl = "https://raw.githubusercontent.com/datasets/geo-boundaries-world-110m/master/countries.geojson";

// Mock coordinates for countries
const COUNTRY_COORDS = {
    'USA': [-100, 40],
    'China': [104, 35],
    'Russia': [105, 60],
    'Germany': [10, 51],
    'Brazil': [-51, -14],
    'India': [78, 20],
    'Japan': [138, 36],
    'UK': [-2, 54],
    'France': [2, 46],
    'Canada': [-106, 56]
};

const AttackMap = () => {
    const [currentMarkers, setCurrentMarkers] = useState([]);
    const [trafficHeatmap, setTrafficHeatmap] = useState({});

    useEffect(() => {
        const unsubscribe = dataService.subscribe((newEvent) => {
            if (newEvent.attack_type !== 'Normal') {
                const coords = COUNTRY_COORDS[newEvent.country] || [0, 0];
                const newMarker = {
                    id: Date.now(),
                    coordinates: coords,
                    severity: newEvent.severity,
                    country: newEvent.country
                };

                // Add to current markers (will blink)
                setCurrentMarkers(prev => [...prev, newMarker].slice(-5));

                // Update traffic heatmap
                setTrafficHeatmap(prev => ({
                    ...prev,
                    [newEvent.country]: (prev[newEvent.country] || 0) + 1
                }));

                // Remove blinking marker after 3 seconds
                setTimeout(() => {
                    setCurrentMarkers(prev => prev.filter(m => m.id !== newMarker.id));
                }, 3000);
            }
        });

        return () => unsubscribe();
    }, []);

    const getHeatmapSize = (count) => {
        if (!count) return 0;
        return Math.min(3 + count * 0.5, 15); // Scale from 3 to 15
    };

    const getHeatmapOpacity = (count) => {
        if (!count) return 0;
        return Math.min(0.3 + count * 0.05, 0.9);
    };

    return (
        <Card className="h-[450px] mb-6 flex flex-col" glowColor="purple">
            <h3 className="text-wakanda-accent text-[10px] uppercase tracking-[0.2em] font-bold mb-4">Global Threat Map</h3>
            <div className="flex-1 bg-black/80 rounded-xl border-2 border-wakanda-purple/40 overflow-hidden relative shadow-vibranium-heavy">
                <ComposableMap
                    projectionConfig={{ scale: 140, center: [0, 20] }}
                    width={800}
                    height={400}
                    style={{ width: "100%", height: "100%" }}
                >
                    <Geographies geography={geoUrl}>
                        {({ geographies }) =>
                            geographies.map((geo) => (
                                <Geography
                                    key={geo.rsmKey}
                                    geography={geo}
                                    fill="#0a0118"
                                    stroke="#a855f7"
                                    strokeWidth={0.5}
                                    style={{
                                        default: { outline: "none" },
                                        hover: { fill: "#2d1b69", outline: "none", stroke: "#f0abfc", strokeWidth: 1 },
                                        pressed: { outline: "none" },
                                    }}
                                />
                            ))
                        }
                    </Geographies>

                    {/* Traffic Heatmap - Accumulated spots */}
                    {Object.entries(trafficHeatmap).map(([country, count]) => {
                        const coords = COUNTRY_COORDS[country];
                        if (!coords) return null;
                        return (
                            <Marker key={`heatmap-${country}`} coordinates={coords}>
                                <circle
                                    r={getHeatmapSize(count)}
                                    fill="#05acf9ff" // wakanda-blue
                                    opacity={getHeatmapOpacity(count)}
                                    className="transition-all duration-500"
                                />
                                <circle
                                    r={getHeatmapSize(count) * 0.7}
                                    fill="#f3b007ff" // wakanda-gold
                                    opacity={getHeatmapOpacity(count) * 0.8}
                                />
                            </Marker>
                        );
                    })}

                    {/* Current Attack Markers - Blinking */}
                    {currentMarkers.map(({ id, coordinates, severity }) => (
                        <Marker key={id} coordinates={coordinates}>
                            <circle
                                r={10}
                                fill={severity === 'Critical' ? '#ff3131' : '#f7b40aff'}
                                className="animate-ping"
                                opacity={0.9}
                                strokeWidth={4}
                            />
                            <circle
                                r={5}
                                fill={severity === 'Critical' ? '#ff3131' : '#f5b208ff'}
                                className="animate-pulse"
                                stroke="#000"
                                strokeWidth={1}
                            />
                        </Marker>
                    ))}
                </ComposableMap>
            </div>
        </Card>
    );
};

export default AttackMap;
