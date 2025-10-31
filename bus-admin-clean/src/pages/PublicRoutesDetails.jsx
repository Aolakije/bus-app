import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../api";

export default function PublicRouteDetails() {
  const { id } = useParams();
  const [route, setRoute] = useState(null);

  useEffect(() => {
    API.get(`/public/routes/${id}`).then(res => setRoute(res.data));
  }, [id]);

  if (!route) return <p>Loading...</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>{route.name}</h2>
      <p>{route.description}</p>

      <h3>Stops</h3>
      <ol>
        {route.stops.map(s => (
          <li key={s.id}>{s.name}</li>
        ))}
      </ol>

      <h3>Schedules</h3>
      <ul>
        {route.schedules.map(sc => (
          <li key={sc.id}>
            Departure: {sc.departure}, Every {sc.frequency_min} min
          </li>
        ))}
      </ul>
    </div>
  );
}
