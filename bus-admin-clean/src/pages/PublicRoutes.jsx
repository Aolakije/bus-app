import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api";

export default function PublicRoutes() {
  const [routes, setRoutes] = useState([]);

  useEffect(() => {
    API.get("/public/routes").then(res => setRoutes(res.data));
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Available Bus Routes</h2>
      <ul>
        {routes.map(r => (
          <li key={r.id}>
            <strong>{r.name}</strong> — {r.description} &nbsp;
            <Link to={`/public/route/${r.id}`}>View Details</Link>
            <Link to={`/public/route/${route.id}/map`}>View on Map</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
