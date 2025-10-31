import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import RoutesList from "./pages/RoutesList";
import CreateRoute from "./pages/CreateRoute";
import AddSchedule from "./pages/AddSchedule"; 
import AddStops from "./pages/AddStops";
import UploadCSV from "./pages/UploadCSV";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/routes" element={<RoutesList />} />
        <Route path="/create-route" element={<CreateRoute />} />
        <Route path="/routes/:routeId/schedules" element={<AddSchedule />} />
        <Route path="/upload-csv" element={<UploadCSV />} />
        <Route path="/routes/:routeId/stops" element={<AddStops />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
