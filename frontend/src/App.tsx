import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import EventList from "./components/EventList";
import EventDetail from "./components/EventDetail";
import NewEvent from "./components/NewEvent";
import StatsDashboard from "./components/StatsDashboard";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<EventList />} />
          <Route path="/events/:id" element={<EventDetail />} />
          <Route path="/new" element={<NewEvent />} />
          <Route path="/stats" element={<StatsDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
