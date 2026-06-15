import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
} from "@mui/material";
import { api } from "../api";
import type { Event } from "../types";

export default function EventDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [error, setError] = useState("");
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState("");
  const [regError, setRegError] = useState("");

  useEffect(() => {
    if (id) {
      api.getEvent(Number(id)).then(setEvent).catch((e) => setError(e.message));
    }
  }, [id]);

  if (error) return <Typography color="error">{error}</Typography>;
  if (!event) return <Typography>Loading...</Typography>;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess("");
    setRegError("");
    const cleanName = userName.trim().replace(/<[^>]*>/g, "");
    const cleanEmail = email.trim();
    if (!cleanName || !cleanEmail) {
      setRegError("All fields are required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setRegError("Invalid email format.");
      return;
    }
    try {
      await api.register(event.id, { user_name: cleanName, email: cleanEmail });
      setSuccess("Successfully registered!");
      setUserName("");
      setEmail("");
    } catch (err) {
      setRegError((err as Error).message);
    }
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 600, mx: "auto" }}>
      <Button onClick={() => navigate(-1)} sx={{ mb: 1, textTransform: "none" }}>
        ← Back
      </Button>
      <Typography variant="h4" gutterBottom>
        {event.name}
      </Typography>
      <Typography sx={{ mb: 2 }}>{event.description}</Typography>
      <Typography variant="body2">Date: {event.date}</Typography>
      <Typography variant="body2" sx={{ mb: 3 }}>
        Capacity: {event.attendee_count} / {event.max_capacity}
      </Typography>

      <Typography variant="h5" gutterBottom>
        Register
      </Typography>
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {regError && <Alert severity="error" sx={{ mb: 2 }}>{regError}</Alert>}
      <form onSubmit={handleRegister}>
        <TextField
          label="Name"
          fullWidth
          required
          sx={{ mb: 2 }}
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
        />
        <TextField
          label="Email"
          type="email"
          fullWidth
          required
          sx={{ mb: 2 }}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button type="submit" variant="contained">
          Register
        </Button>
      </form>
    </Paper>
  );
}
