import { useEffect, useState } from "react";
import {
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Chip,
  Box,
} from "@mui/material";
import { api } from "../api";
import type { Event, EventStats, AISummary } from "../types";

export default function StatsDashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<Record<number, EventStats>>({});
  const [summaries, setSummaries] = useState<Record<number, AISummary>>({});
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .listEvents()
      .then(async (list) => {
        setEvents(list);
        const statsMap: Record<number, EventStats> = {};
        const summariesMap: Record<number, AISummary> = {};
        
        for (const event of list) {
          try {
            const s = await api.getStats(event.id);
            statsMap[event.id] = s;
          } catch (err) {
            console.error(`Error fetching stats for event ${event.id}:`, err);
          }

          try {
            const ai = await api.getAISummary(event.id);
            summariesMap[event.id] = ai;
          } catch (err) {
            console.error(`Error fetching AI summary for event ${event.id}:`, err);
          }
        }
        setStats(statsMap);
        setSummaries(summariesMap);
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
            const ai = summaries[event.id];

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
                {ai && (
                  <Box sx={{ mt: 1, p: 1.5, bgcolor: 'grey.50', borderRadius: 1, borderLeft: 4, borderColor: 'primary.main' }}>
                    <Typography variant="body2" color="text.secondary" fontStyle="italic">
                      " {ai.summary} "
                    </Typography>
                    <Chip label="AI Insight" size="small" variant="outlined" color="primary" sx={{ mt: 1, height: 20, fontSize: '0.65rem' }} />
                  </Box>
                )}
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
