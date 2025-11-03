import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import API from "../api";

export default function PublicRouteDetails() {
  const { id } = useParams();
  const [route, setRoute] = useState(null);
  const [nextBus, setNextBus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [routeRes, busRes] = await Promise.all([
          API.get(`/public/routes/${id}`),
          API.get(`/public/next-bus/${id}`),
        ]);
        setRoute(routeRes.data);
        setNextBus(busRes.data);
      } catch (err) {
        console.error("Error fetching route data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <p style={{ textAlign: "center" }}>Loading route details...</p>;
  if (!route) return <p style={{ textAlign: "center" }}>Route not found.</p>;

  return (
    <div
      style={{
        padding: "40px 20px",
        maxWidth: "800px",
        margin: "0 auto",
        background: "#162b02ff",
      }}
    >
      <h1 style={{ color: "#ecc30cff" }}>{route.name}</h1>
      {route.description && (
        <p style={{ color: "#555" }}>{route.description}</p>
      )}

      <section style={{ marginTop: "25px" }}>
        <h2>🗺️ Stops</h2>
        <ol
          style={{
            background: "white",
            padding: "15px 20px",
            borderRadius: "8px",
            boxShadow: "0 2px 6px rgba(241, 164, 10, 1)",
          }}
        >
          {route.stops.map((s) => (
            <li key={s.id} style={{ padding: "5px 0" }}>
              {s.name}
            </li>
          ))}
        </ol>
      </section>

      {route.schedules?.length > 0 && (
        <section style={{ marginTop: "25px" }}>
          <h2 style={{ color: "#ecc30cff" }}>🕒 Schedules</h2>
          <ul
            style={{
              background: "white",
              padding: "15px 20px",
              borderRadius: "8px",
            boxShadow: "0 2px 6px rgba(241, 164, 10, 1)",
              listStyle: "none",
            }}
          >
            {route.schedules.map((sc) => (
              <li
                key={sc.id}
                style={{
                  marginBottom: "8px",
                  borderBottom: "1px solid #eee",
                  paddingBottom: "5px",
                }}
              >
                Departure: <strong>{sc.departure}</strong> — Every{" "}
                <strong>{sc.frequency_min}</strong> min
              </li>
            ))}
          </ul>
        </section>
      )}

      {nextBus && (
        <section style={{ marginTop: "25px" }}>
          <h2 style={{ color: "#ecc30cff" }}>🚍 Next Bus</h2>
          <div
            style={{
              background: "#e9f7ef",
              padding: "15px 20px",
              borderRadius: "8px",
            boxShadow: "0 2px 6px rgba(241, 164, 10, 1)",
            }}
          >
            <p>
              <strong>Current Time:</strong> {nextBus.current_time}
            </p>
            <p>
              <strong>Next Departure:</strong> {nextBus.next_bus} (
              {nextBus.frequency})
            </p>

            {nextBus.etas && (
              <div style={{ marginTop: "10px" }}>
                <h3>Estimated Arrivals</h3>
                <ul>
                  {nextBus.etas.map((stop, i) => (
                    <li key={i}>
                      {stop.stop}: <strong>{stop.eta}</strong>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      <div style={{ textAlign: "center", marginTop: "30px" }}>
        <Link
          to={`/public/route/${id}/map`}
          style={{
            background: "#065f00",
            color: "white",
            padding: "10px 20px",
            borderRadius: "8px",
            textDecoration: "none",
            fontWeight: "500",
          }}
        >
          🗺️ View on Map
        </Link>
      </div>
    </div>
  );
}
