import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
} from "@mui/material";
import { api } from "../api";
import type { Event } from "../types";

export default function EventList() {
  const [events, setEvents] = useState<Event[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.listEvents().then(setEvents).catch((e) => setError(e.message));
  }, []);

  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {events.map((event) => (
        <Card key={event.id}>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              {event.name}
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 1 }}>
              {event.description}
            </Typography>
            <Typography variant="body2">
              Date: {event.date}
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Capacity: {event.max_capacity}
            </Typography>
            <Chip
              label={event.max_capacity > 0 ? "Open" : "Full"}
              color={event.max_capacity > 0 ? "success" : "error"}
              size="small"
            />
          </CardContent>
          <Button
            component={Link}
            to={`/events/${event.id}`}
            size="small"
            sx={{ m: 1 }}
          >
            View Details
          </Button>
        </Card>
      ))}
    </div>
  );
}
