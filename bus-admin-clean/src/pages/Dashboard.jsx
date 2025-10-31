import { Link, useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>🚌 Lagos Transport Admin Dashboard</h1>
      <button onClick={logout}>Logout</button>
      <hr />
      <ul>
       <li><Link to="/routes">View Routes</Link></li> 
        <li><Link to="/create-route">Create New Route</Link></li>
        <li><Link to="/upload-csv">Upload Routes via CSV</Link></li>
      </ul>
    </div>
  );
}
