import { useEffect, useState } from "react";
import {
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Chip,
} from "@mui/material";
import { api } from "../api";
import type { Event, EventStats } from "../types";

export default function StatsDashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<Record<number, EventStats>>({});
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .listEvents()
      .then(async (list) => {
        setEvents(list);
        const statsMap: Record<number, EventStats> = {};
        for (const event of list) {
          try {
            statsMap[event.id] = await api.getStats(event.id);
          } catch {
            // skip
          }
        }
        setStats(statsMap);
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Event Statistics
        </Typography>
        <List>
          {events.map((event) => {
            const s = stats[event.id];

            return (
              <ListItem key={event.id} divider sx={{ flexDirection: 'column', alignItems: 'flex-start', py: 2 }}>
                <ListItemText
                  primary={event.name}
                  secondary={
                    s
                      ? `${s.total_registrations} / ${s.max_capacity} registrations`
                      : "Loading..."
                  }
                />
              </ListItem>
            );
          })}
          {events.length === 0 && (
            <ListItem>
              <ListItemText primary="No events yet" />
            </ListItem>
          )}
        </List>
      </CardContent>
    </Card>
  );
}
