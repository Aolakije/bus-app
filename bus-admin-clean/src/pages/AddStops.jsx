import { useState, useEffect } from "react";
import API from "../api";
import { useParams, useNavigate } from "react-router-dom";

export default function AddStops() {
  const { routeId } = useParams(); // route ID from URL
  const navigate = useNavigate();
  const [stops, setStops] = useState([]);
  const [name, setName] = useState("");
  const [orderIndex, setOrderIndex] = useState("");
  const [error, setError] = useState("");

  // Fetch current stops for this route
  useEffect(() => {
    const fetchStops = async () => {
      try {
        const res = await API.get(`/routes/${routeId}`);
        setStops(res.data.stops || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchStops();
  }, [routeId]);

  const handleAddStop = async (e) => {
    e.preventDefault();
    try {
      await API.post(`/admin/routes/${routeId}/stops`, {
        name,
        order_index: parseInt(orderIndex),
      });
      setName("");
      setOrderIndex("");
      // Refresh stops
      const res = await API.get(`/routes/${routeId}`);
      setStops(res.data.stops || []);
    } catch (err) {
      console.error(err);
      setError("Failed to add stop. Make sure you're logged in.");
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "500px", margin: "0 auto" }}>
      <h2>Add Stops to Route #{routeId}</h2>
      <form onSubmit={handleAddStop}>
        <input
          type="text"
          placeholder="Stop Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        /><br /><br />
        <input
          type="number"
          placeholder="Order Index"
          value={orderIndex}
          onChange={(e) => setOrderIndex(e.target.value)}
          required
        /><br /><br />
        <button type="submit">Add Stop</button>
      </form>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <hr />
      <h3>Current Stops:</h3>
      <ul>
        {stops.map((stop) => (
          <li key={stop.id}>
            {stop.order_index}. {stop.name}
          </li>
        ))}
      </ul>
      <button onClick={() => navigate("/routes")}>Back to Routes</button>
    </div>
  );
}
