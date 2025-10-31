import { useEffect, useState } from "react";
import API from "../api";
import { Link } from "react-router-dom";

export default function RoutesList() {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const res = await API.get("/routes");
        // Each route should include stops and schedules arrays
        setRoutes(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRoutes();
  }, []);

  if (loading) return <p>Loading routes...</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>Available Routes</h2>
      <ul>
        {routes.map((r) => (
          <li key={r.id} style={{ marginBottom: "15px" }}>
            <strong>{r.name}</strong> — {r.description} <br />
            Stops: {r.stops ? r.stops.length : 0} | Schedules: {r.schedules ? r.schedules.length : 0} <br />
            <Link to={`/routes/${r.id}/stops`} style={{ marginRight: "10px" }}>
              Manage Stops
            </Link>
            <Link to={`/routes/${r.id}/schedules`}>
              Manage Schedules
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
