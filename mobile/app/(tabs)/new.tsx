import React, { useState } from "react";
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
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { api } from "../../lib/api";

export default function NewEventScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [maxCapacity, setMaxCapacity] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState("");

  const dateString = date.toISOString().split("T")[0];

  const handleDateChange = (_: unknown, selected?: Date) => {
    setShowPicker(Platform.OS !== "web");
    if (selected) setDate(selected);
  };

  const handleAISuggest = async () => {
    const input = description.trim();
    if (!input || input.length < 5) {
      Alert.alert("Input Needed", "Write at least 5 characters in description first.");
      return;
    }
    setAiLoading(true);
    try {
      const res = await api.getAISuggestion({
        name: name.trim() || "Untitled Event",
        description: input,
        date: dateString,
        max_capacity: Number(maxCapacity) || 0,
      });
      setDescription(res.suggestion.slice(0, 1000));
    } catch {
      Alert.alert("AI Error", "Failed to improve description.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async () => {
    setError("");
    if (!name.trim() || !description.trim() || !maxCapacity.trim()) {
      setError("Please fill in all fields");
      return;
    }
    const cap = Number(maxCapacity);
    if (!Number.isInteger(cap) || cap < 1) {
      setError("Max capacity must be a positive integer.");
      return;
    }
    setSubmitting(true);
    try {
      const event = await api.createEvent({
        name: name.trim(),
        description: description.trim(),
        date: dateString,
        max_capacity: cap,
      });
      setName("");
      setDescription("");
      setDate(new Date());
      setMaxCapacity("");
      setError("");
      router.push(`/event/${event.id}`);
    } catch (e) {
      const msg =
        typeof e === "object" && e !== null && "message" in e
          ? (e as Error).message
          : String(e);
      setError(msg || "Something went wrong");
      Alert.alert("Error", msg || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Create New Event</Text>

        <View style={styles.form}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <Text style={styles.label}>Event Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Annual Tech Summit"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Date</Text>
          {Platform.OS === "web"
            ? React.createElement("input", {
                type: "date",
                value: dateString,
                onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                  setDate(new Date(e.target.value + "T12:00:00")),
                style: styles.input,
              })
            : (
            <>
              <TouchableOpacity
                onPress={() => setShowPicker(true)}
                style={styles.dateButton}
                activeOpacity={0.7}
              >
                <Ionicons name="calendar" size={18} color="#555" />
                <Text style={styles.dateText}>{dateString}</Text>
              </TouchableOpacity>
              {showPicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                />
              )}
            </>
          )}

          <Text style={styles.label}>Maximum Capacity</Text>
          <TextInput
            style={styles.input}
            placeholder="100"
            value={maxCapacity}
            onChangeText={setMaxCapacity}
            keyboardType="numeric"
          />

          <View style={styles.row}>
            <Text style={styles.label}>Description</Text>
            {Platform.OS === "web"
              ? React.createElement("button", {
                  type: "button",
                  onClick: handleAISuggest,
                  disabled: aiLoading,
                  style: {
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "row" as const,
                    alignItems: "center",
                    padding: 4,
                    gap: 4,
                  },
                },
                React.createElement("span", {
                  style: { color: "#1976d2", fontSize: 13, fontWeight: "600" },
                }, aiLoading ? "Thinking..." : "AI Improve")
              )
              : (
              <TouchableOpacity
                onPress={handleAISuggest}
                disabled={aiLoading}
                style={styles.aiButton}
                activeOpacity={0.7}
              >
                {aiLoading ? (
                  <ActivityIndicator size="small" color="#1976d2" />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={16} color="#1976d2" />
                    <Text style={styles.aiButtonText}>AI Improve</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="What is the event about?"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />

          {Platform.OS === "web"
            ? React.createElement("button", {
                type: "button",
                onClick: handleSubmit,
                disabled: submitting || aiLoading,
                style: {
                  backgroundColor: "#1976d2",
                  border: "none",
                  borderRadius: 8,
                  padding: 16,
                  cursor: "pointer",
                  width: "100%",
                  marginTop: 10,
                  opacity: (submitting || aiLoading) ? 0.5 : 1,
                },
              },
              React.createElement("span", {
                style: { color: "#fff", fontWeight: "700", fontSize: 16 },
              }, submitting ? "Creating..." : "Create Event")
            )
            : (
            <TouchableOpacity
              style={[
                styles.submitButton,
                (submitting || aiLoading) && { opacity: 0.5 },
              ]}
              onPress={handleSubmit}
              disabled={submitting || aiLoading}
              activeOpacity={0.8}
            >
              <Text style={styles.submitButtonText}>
                {submitting ? "Creating..." : "Create Event"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 20, textAlign: "center" },
  form: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  label: { fontSize: 14, fontWeight: "600", color: "#333", marginBottom: 6 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    marginBottom: 16,
    backgroundColor: "#fafafa",
    cursor: "pointer",
  },
  textArea: { height: 100, textAlignVertical: "top" },
  aiButton: { flexDirection: "row", alignItems: "center", padding: 4, cursor: "pointer" },
  aiButtonText: { color: "#1976d2", fontSize: 13, fontWeight: "600", marginLeft: 4 },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: "#fafafa",
    gap: 8,
  },
  dateText: { fontSize: 15, color: "#333" },
  submitButton: {
    backgroundColor: "#1976d2",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 10,
    cursor: "pointer",
  },
  submitButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  errorText: {
    color: "#d32f2f",
    backgroundColor: "#fdecea",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 14,
    fontWeight: "500",
  },
});
