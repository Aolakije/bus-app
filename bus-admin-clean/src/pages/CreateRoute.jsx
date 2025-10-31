import { useState } from "react";
import API from "../api";
import { useNavigate } from "react-router-dom";

export default function CreateRoute() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post("/admin/routes", { name, description });
      navigate("/routes"); // go back to route list
    } catch (err) {
      setError("Failed to create route. Make sure you're logged in.");
      console.error(err);
    }
  };

  return (
    <div style={{ maxWidth: "500px", margin: "50px auto" }}>
      <h2>Create New Route</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Route Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        /><br /><br />
        <input
          type="text"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        /><br /><br />
        <button type="submit">Create Route</button>
      </form>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
