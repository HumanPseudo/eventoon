import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Paper, Typography, TextField, Button, Alert } from "@mui/material";
import { api } from "../api";

export default function NewEvent() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [maxCapacity, setMaxCapacity] = useState("");
  const [error, setError] = useState("");
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const event = await api.createEvent({
        name,
        description,
        date,
        max_capacity: Number(maxCapacity),
      });
      navigate(`/events/${event.id}`);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 500, mx: "auto" }}>
      <Typography variant="h5" gutterBottom>
        New Event
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <form onSubmit={handleSubmit}>
        <TextField
          label="Name"
          fullWidth
          required
          sx={{ mb: 2 }}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <TextField
          label="Description"
          fullWidth
          required
          multiline
          rows={3}
          sx={{ mb: 2 }}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <TextField
          label="Date"
          type="date"
          fullWidth
          required
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ mb: 2 }}
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <TextField
          label="Max Capacity"
          type="number"
          fullWidth
          required
          sx={{ mb: 2 }}
          value={maxCapacity}
          onChange={(e) => setMaxCapacity(e.target.value)}
        />
        <Button type="submit" variant="contained">
          Create Event
        </Button>
      </form>
    </Paper>
  );
}
