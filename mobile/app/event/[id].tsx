import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";

import { api } from "../../lib/api";
import type { Event } from "../../lib/types";

export default function EventDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!id) return;
    setError("");
    api
      .getEvent(Number(id))
      .then(setEvent)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleRegister = async () => {
    if (!userName.trim() || !email.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    setSubmitting(true);
    setSuccess("");
    try {
      await api.register(Number(id), {
        user_name: userName,
        email,
      });
      setSuccess("Successfully registered!");
      setUserName("");
      setEmail("");
    } catch (e) {
      Alert.alert("Error", (e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1976d2" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  if (!event) return null;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Stack.Screen options={{ title: event.name }} />

        <Text style={styles.title}>{event.name}</Text>
        <Text style={styles.description}>{event.description}</Text>
        <View style={styles.row}>
          <Text style={styles.meta}>Date: {event.date}</Text>
          <Text style={styles.meta}>
            Capacity: {event.attendee_count} / {event.max_capacity}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Register</Text>
          {success ? (
            <Text style={styles.success}>{success}</Text>
          ) : null}
          <TextInput
            style={styles.input}
            placeholder="Name"
            value={userName}
            onChangeText={setUserName}
            autoCapitalize="words"
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Pressable
            style={({ pressed }) => [
              styles.button,
              pressed && { opacity: 0.8 },
              submitting && { opacity: 0.5 },
            ]}
            onPress={handleRegister}
            disabled={submitting}
          >
            <Text style={styles.buttonText}>
              {submitting ? "Registering..." : "Register"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  error: { color: "red" },
  container: { padding: 16 },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 8 },
  description: { fontSize: 15, color: "#555", marginBottom: 12 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  meta: { color: "#888", fontSize: 14 },
  section: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
  },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 12 },
  success: {
    color: "#2e7d32",
    fontWeight: "600",
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 12,
    fontSize: 15,
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#1976d2",
    borderRadius: 6,
    padding: 14,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});
