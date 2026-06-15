import { useState } from "react";
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
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { api } from "../../lib/api";

export default function NewEventScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [maxCapacity, setMaxCapacity] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

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
        date: date || "TBD",
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
    if (!name.trim() || !description.trim() || !date.trim() || !maxCapacity.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    if (Number(maxCapacity) < 1) {
      Alert.alert("Error", "Max capacity must be at least 1.");
      return;
    }
    setSubmitting(true);
    try {
      const event = await api.createEvent({
        name,
        description,
        date,
        max_capacity: Number(maxCapacity),
      });
      setName("");
      setDescription("");
      setDate("");
      setMaxCapacity("");
      router.push(`/event/${event.id}`);
    } catch (e) {
      Alert.alert("Error", (e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Create New Event</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Event Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Annual Tech Summit"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            placeholder="2026-12-31"
            value={date}
            onChangeText={setDate}
          />

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
            <Pressable
              onPress={handleAISuggest}
              disabled={aiLoading}
              style={styles.aiButton}
            >
              {aiLoading ? (
                <ActivityIndicator size="small" color="#1976d2" />
              ) : (
                <>
                  <Ionicons name="sparkles" size={16} color="#1976d2" />
                  <Text style={styles.aiButtonText}>AI Improve</Text>
                </>
              )}
            </Pressable>
          </View>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="What is the event about?"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />

          <Pressable
            style={({ pressed }) => [
              styles.submitButton,
              pressed && { opacity: 0.8 },
              submitting && { opacity: 0.5 },
            ]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <Text style={styles.submitButtonText}>
              {submitting ? "Creating..." : "Create Event"}
            </Text>
          </Pressable>
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
  },
  textArea: { height: 100, textAlignVertical: "top" },
  aiButton: { flexDirection: "row", alignItems: "center", padding: 4 },
  aiButtonText: { color: "#1976d2", fontSize: 13, fontWeight: "600", marginLeft: 4 },
  submitButton: {
    backgroundColor: "#1976d2",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 10,
  },
  submitButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
