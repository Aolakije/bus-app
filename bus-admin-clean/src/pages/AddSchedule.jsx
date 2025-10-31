import { useState, useEffect } from "react";
import API from "../api";
import { useParams, useNavigate } from "react-router-dom";

export default function AddSchedule() {
  const { routeId } = useParams(); // route ID from URL
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [departureTime, setDepartureTime] = useState("");
  const [frequency, setFrequency] = useState("");
  const [error, setError] = useState("");

  // Fetch existing schedules
  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const res = await API.get(`/routes/${routeId}/schedules`);
        setSchedules(res.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchSchedules();
  }, [routeId]);

  const handleAddSchedule = async (e) => {
    e.preventDefault();
    try {
      await API.post(`/admin/routes/${routeId}/schedules`, {
        departure_time: departureTime,
        frequency_min: parseInt(frequency),
      });
      setDepartureTime("");
      setFrequency("");
      const res = await API.get(`/routes/${routeId}/schedules`);
      setSchedules(res.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to add schedule. Make sure you're logged in.");
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "500px", margin: "0 auto" }}>
      <h2>Add Schedule for Route #{routeId}</h2>
      <form onSubmit={handleAddSchedule}>
        <input
          type="time"
          placeholder="Departure Time"
          value={departureTime}
          onChange={(e) => setDepartureTime(e.target.value)}
          required
        /><br /><br />
        <input
          type="number"
          placeholder="Frequency (minutes)"
          value={frequency}
          onChange={(e) => setFrequency(e.target.value)}
          required
        /><br /><br />
        <button type="submit">Add Schedule</button>
      </form>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <hr />
      <h3>Current Schedules:</h3>
      <ul>
        {schedules.map((s) => (
          <li key={s.id}>
            Departure: {s.departure_time}, Frequency: {s.frequency_min} min
          </li>
        ))}
      </ul>
      <button onClick={() => navigate("/routes")}>Back to Routes</button>
    </div>
  );
}
