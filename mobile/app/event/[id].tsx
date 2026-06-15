import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
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
  const [regError, setRegError] = useState("");

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
    setSubmitting(true);
    setSuccess("");
    try {
      await api.register(Number(id), {
        user_name: cleanName,
        email: cleanEmail,
      });
      setSuccess("Successfully registered!");
      setUserName("");
      setEmail("");
    } catch (e) {
      const msg = (e as Error).message;
      setRegError(msg);
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
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
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
          {regError ? <Text style={styles.regError}>{regError}</Text> : null}
          {Platform.OS === "web"
            ? React.createElement("form", {
                onSubmit: (e: React.FormEvent) => {
                  e.preventDefault();
                  handleRegister();
                },
                style: { display: "flex", flexDirection: "column" as const },
              },
              React.createElement("input", {
                type: "text",
                placeholder: "Name",
                value: userName,
                onChange: (e: React.ChangeEvent<HTMLInputElement>) => setUserName(e.target.value),
                style: {
                  borderWidth: 1,
                  borderColor: "#ccc",
                  borderRadius: 6,
                  padding: 12,
                  fontSize: 15,
                  marginBottom: 12,
                  fontFamily: "inherit",
                },
              }),
              React.createElement("input", {
                type: "email",
                placeholder: "Email",
                value: email,
                onChange: (e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value),
                style: {
                  borderWidth: 1,
                  borderColor: "#ccc",
                  borderRadius: 6,
                  padding: 12,
                  fontSize: 15,
                  marginBottom: 12,
                  fontFamily: "inherit",
                },
              }),
              React.createElement("button", {
                type: "submit",
                disabled: submitting,
                style: {
                  backgroundColor: "#1976d2",
                  border: "none",
                  borderRadius: 6,
                  padding: 14,
                  cursor: "pointer",
                  width: "100%",
                  opacity: submitting ? 0.5 : 1,
                },
              },
              React.createElement("span", {
                style: { color: "#fff", fontWeight: "600", fontSize: 16 },
              }, submitting ? "Registering..." : "Register")
              )
            )
            : (
            <>
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
              <TouchableOpacity
                style={[
                  styles.button,
                  submitting && { opacity: 0.5 },
                ]}
                onPress={handleRegister}
                disabled={submitting}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonText}>
                  {submitting ? "Registering..." : "Register"}
                </Text>
              </TouchableOpacity>
            </>
          )}
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
    cursor: "pointer",
  },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  regError: {
    color: "#d32f2f",
    backgroundColor: "#fdecea",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 14,
    fontWeight: "500",
  },
});
