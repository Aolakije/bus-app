import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { GoogleMap, Marker, Polyline, useJsApiLoader } from "@react-google-maps/api";
import API from "../api";

export default function PublicRouteMap() {
  const { id } = useParams();
  const [route, setRoute] = useState(null);

  // Load Google Maps
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  useEffect(() => {
    API.get(`/public/routes/${id}`).then(res => setRoute(res.data));
  }, [id]);

  if (!isLoaded || !route) return <p>Loading map...</p>;

  const center = {
    lat: route.stops[0]?.latitude || 6.5244, // fallback to Lagos center
    lng: route.stops[0]?.longitude || 3.3792,
  };

  const path = route.stops.map(stop => ({
    lat: stop.latitude,
    lng: stop.longitude,
  }));

  return (
    <div style={{ height: "80vh", width: "100%", padding: "20px" }}>
      <h2>{route.name} — Map View</h2>
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "70vh" }}
        center={center}
        zoom={12}
      >
        {route.stops.map((stop, i) => (
          <Marker
            key={stop.id}
            position={{ lat: stop.latitude, lng: stop.longitude }}
            label={`${i + 1}`}
            title={stop.name}
          />
        ))}
        <Polyline
          path={path}
          options={{
            strokeColor: "#4285F4",
            strokeOpacity: 0.8,
            strokeWeight: 4,
          }}
        />
      </GoogleMap>
    </div>
  );
}
