import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Paper, Typography, TextField, Button, Alert, CircularProgress, InputAdornment, IconButton, Tooltip } from "@mui/material";
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { api } from "../api";

export default function NewEvent() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [maxCapacity, setMaxCapacity] = useState("");
  const [error, setError] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const handleAISuggest = async () => {
    if (!name) {
      setError("Please enter an event name first to get an AI suggestion.");
      return;
    }
    setAiLoading(true);
    setError("");
    try {
      const res = await api.getAISuggestion(name);
      setDescription(res.suggestion.slice(0, 1000));
    } catch (err) {
      setError((err as Error).message || "AI suggestion failed.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const event = await api.createEvent({
        name,
        description: description.slice(0, 1000),
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
          placeholder="e.g. Summer Beach Party"
        />
        <TextField
          label="Description"
          fullWidth
          required
          multiline
          rows={4}
          sx={{ mb: 2 }}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title="Improve with AI">
                    <IconButton 
                      onClick={handleAISuggest} 
                      disabled={aiLoading}
                      color="primary"
                    >
                      {aiLoading ? <CircularProgress size={24} /> : <AutoAwesomeIcon />}
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              )
            }
          }}
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
        <Button type="submit" variant="contained" fullWidth size="large">
          Create Event
        </Button>
      </form>
    </Paper>
  );
}
