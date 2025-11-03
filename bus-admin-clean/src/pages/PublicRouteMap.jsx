import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  GoogleMap,
  Marker,
  Polyline,
  useJsApiLoader,
  DirectionsRenderer,
} from "@react-google-maps/api";
import API from "../api";

export default function MultiBusMap() {
  const { id } = useParams();
  const [route, setRoute] = useState(null);
  const [buses, setBuses] = useState([]);
  const [simulationTime, setSimulationTime] = useState(0);
  const [mapCenter, setMapCenter] = useState(null);
  const [directions, setDirections] = useState(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  const interpolate = (start, end, progress) => start + (end - start) * progress;

  // Get position along the curved route path
  const getPositionOnPath = (pathPoints, progress) => {
    if (!pathPoints || pathPoints.length === 0) return null;
    
    const totalPoints = pathPoints.length;
    const targetIndex = Math.floor(progress * (totalPoints - 1));
    const nextIndex = Math.min(targetIndex + 1, totalPoints - 1);
    
    const localProgress = (progress * (totalPoints - 1)) - targetIndex;
    
    const current = pathPoints[targetIndex];
    const next = pathPoints[nextIndex];
    
    return {
      lat: interpolate(current.lat(), next.lat(), localProgress),
      lng: interpolate(current.lng(), next.lng(), localProgress),
    };
  };

  const calculateBusPosition = (bus, stops, simTime, index, routePath) => {
    const departureDelay = index * 30 * 60;
    const timeSinceDeparture = simTime - departureDelay;

    if (timeSinceDeparture < 0) {
      const minutesUntil = Math.abs(Math.floor(timeSinceDeparture / 60));
      return {
        lat: stops[0].latitude,
        lng: stops[0].longitude + index * 0.001,
        status: `🕒 Departs in ${minutesUntil} min`,
        departed: false,
      };
    }

    // Calculate total route duration
    let totalDuration = 0;
    for (let i = 0; i < bus.etas.length - 1; i++) {
      const [h1, m1] = bus.etas[i].eta.split(":").map(Number);
      const [h2, m2] = bus.etas[i + 1].eta.split(":").map(Number);
      const t1 = h1 * 60 + m1;
      const t2 = h2 * 60 + m2;
      totalDuration += (t2 - t1) * 60; // in seconds
    }

    // Calculate progress along entire route (0 to 1)
    const progress = Math.min(timeSinceDeparture / totalDuration, 1);

    // If we have the directions path, follow it
    if (routePath && routePath.length > 0) {
      const position = getPositionOnPath(routePath, progress);
      if (position) {
        const currentStopIndex = Math.floor(progress * (stops.length - 1));
        const nextStop = stops[Math.min(currentStopIndex + 1, stops.length - 1)];
        
        return {
          ...position,
          status: progress >= 1 ? "✅ Arrived" : `🚌 En route to ${nextStop.name}`,
          departed: true,
        };
      }
    }

    // Fallback to straight line if no path available
    const segments = [];
    for (let i = 0; i < bus.etas.length - 1; i++) {
      const [h1, m1] = bus.etas[i].eta.split(":").map(Number);
      const [h2, m2] = bus.etas[i + 1].eta.split(":").map(Number);
      const t1 = h1 * 60 + m1;
      const t2 = h2 * 60 + m2;
      segments.push({
        duration: (t2 - t1) * 60,
        fromStop: stops[i],
        toStop: stops[i + 1],
      });
    }

    let elapsed = timeSinceDeparture;
    for (let seg of segments) {
      if (elapsed <= seg.duration) {
        const segProgress = elapsed / seg.duration;
        return {
          lat: interpolate(seg.fromStop.latitude, seg.toStop.latitude, segProgress),
          lng: interpolate(seg.fromStop.longitude, seg.toStop.longitude, segProgress),
          status: `🚌 En route to ${seg.toStop.name}`,
          departed: true,
        };
      }
      elapsed -= seg.duration;
    }

    const last = stops[stops.length - 1];
    return { lat: last.latitude, lng: last.longitude, status: "✅ Arrived", departed: true };
  };

  useEffect(() => {
    const timer = setInterval(() => setSimulationTime((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch directions when route is loaded
  useEffect(() => {
    if (route && window.google && !directions) {
      const directionsService = new window.google.maps.DirectionsService();
      
      const waypoints = route.stops.slice(1, -1).map(stop => ({
        location: { lat: stop.latitude, lng: stop.longitude },
        stopover: true,
      }));

      const origin = { lat: route.stops[0].latitude, lng: route.stops[0].longitude };
      const destination = { 
        lat: route.stops[route.stops.length - 1].latitude, 
        lng: route.stops[route.stops.length - 1].longitude 
      };

      directionsService.route(
        {
          origin,
          destination,
          waypoints,
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK) {
            setDirections(result);
          }
        }
      );
    }
  }, [route, directions]);

  useEffect(() => {
    const fetchData = async () => {
      const routeRes = await API.get(`/public/routes/${id}`);
      setRoute(routeRes.data);
      if (!mapCenter)
        setMapCenter({
          lat: routeRes.data.stops[0].latitude,
          lng: routeRes.data.stops[0].longitude,
        });

      const busRes = await API.get(`/public/next-bus/${id}`);
      setBuses(busRes.data.buses || []);
    };
    fetchData();
  }, [id]);

  if (!isLoaded) return <p>Loading map...</p>;
  if (!route || !mapCenter) return <p>Loading route...</p>;

  // Extract path points from directions for bus movement
  const routePath = directions?.routes[0]?.overview_path || [];

  const busPositions = buses.map((bus, i) => ({
    ...bus,
    ...calculateBusPosition(bus, route.stops, simulationTime, i, routePath),
  }));

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div style={{ height: "92vh", width: "100%", background: "#fafafa" }}>
      {/* HEADER */}
      <div
        style={{
          background: "#162b02ff",
          color: "yellow",
          padding: "15px 25px",
          borderRadius: "0 0 15px 15px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
        }}
      >
        <h2 style={{ margin: 0 }}>{route.name}</h2>
        <p style={{ margin: "5px 0 0", opacity: 0.9 }}>
          🚍 Real-time Bus Simulation | Simulation Time: {formatTime(simulationTime)}
        </p>
      </div>

      {/* BUS STATUS LIST */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          padding: "15px 25px",
          overflowX: "auto",
          background: "white",
          borderBottom: "1px solid #ddd",
        }}
      >
        {busPositions.map((bus, i) => (
          <div
            key={i}
            style={{
              minWidth: "200px",
              borderRadius: "10px",
              padding: "10px",
              background: bus.departed ? "#E8F5E9" : "#FFF8E1",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              border: "1px solid #ddd",
            }}
          >
            <strong style={{ fontSize: "16px" }}>🚌 Bus {i + 1}</strong>
            <p style={{ margin: "5px 0" }}>Departs: {bus.departure}</p>
            <p style={{ margin: "0", color: "#333" }}>{bus.status}</p>
          </div>
        ))}
      </div>

      {/* MAP */}
      <div
        style={{
          height: "70vh",
          width: "100%",
          padding: "15px",
          borderRadius: "15px",
        }}
      >
        <GoogleMap
          mapContainerStyle={{
            width: "100%",
            height: "100%",
            borderRadius: "15px",
            boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
          }}
          center={mapCenter}
          zoom={12}
          options={{
            disableDefaultUI: false,
            gestureHandling: "greedy",
            styles: [
              {
                featureType: "road",
                elementType: "geometry",
                stylers: [{ color: "#065f00" }],
              },
              {
                featureType: "water",
                stylers: [{ color: "#a0c4ff" }],
              },
              {
                featureType: "landscape",
                stylers: [{ color: "#c7f3a5" }],
              },
            ],
          }}
        >
          {route.stops.map((stop, i) => (
            <Marker
              key={`stop-${i}`}
              position={{ lat: stop.latitude, lng: stop.longitude }}
              label={{
                text: `${i + 1}`,
                color: "white",
                fontSize: "12px",
                fontWeight: "bold",
              }}
              icon={{
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: "#012101ff",
                fillOpacity: 1,
                strokeColor: "#fff",
                strokeWeight: 2,
              }}
              title={stop.name}
            />
          ))}

          {/* Render curved route following roads */}
          {directions && (
            <DirectionsRenderer
              directions={directions}
              options={{
                suppressMarkers: true,
                polylineOptions: {
                  strokeColor: "rgba(3, 7, 84, 1)",
                  strokeOpacity: 1,
                  strokeWeight: 7,
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                },
              }}
            />
          )}

          {busPositions.map((bus, i) => (
            <Marker
              key={`bus-${i}`}
              position={{ lat: bus.lat, lng: bus.lng }}
              label={{
                text: "🚌",
                fontSize: "32px",
              }}
              title={`Bus ${i + 1}: ${bus.status}`}
            />
          ))}
        </GoogleMap>
      </div>
    </div>
  );
}