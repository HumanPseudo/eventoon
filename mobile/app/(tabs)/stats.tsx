import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";

import { api } from "../../lib/api";
import type { Event, EventStats, AISummary } from "../../lib/types";

export default function StatsScreen() {
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<Record<number, EventStats>>({});
  const [summaries, setSummaries] = useState<Record<number, AISummary>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      setError("");
      api
        .listEvents()
        .then(async (list) => {
          setEvents(list);
          const statsMap: Record<number, EventStats> = {};
          const summariesMap: Record<number, AISummary> = {};
          
          for (const e of list) {
            try {
              statsMap[e.id] = await api.getStats(e.id);
            } catch (err) {
              console.error(`Error fetching stats for event ${e.id}:`, err);
            }

            try {
              summariesMap[e.id] = await api.getAISummary(e.id);
            } catch (err) {
              console.error(`Error fetching AI summary for event ${e.id}:`, err);
            }
          }
          setStats(statsMap);
          setSummaries(summariesMap);
        })
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }, [])
  );

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

  return (
    <FlatList
      data={events}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.list}
      ListEmptyComponent={
        <Text style={styles.empty}>No events yet</Text>
      }
      ListHeaderComponent={
        <Text style={styles.title}>Event Statistics</Text>
      }
      renderItem={({ item }) => {
        const s = stats[item.id];
        const ai = summaries[item.id];
        
        return (
          <View style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.stat}>
              {s
                ? `${s.total_registrations} / ${s.max_capacity} registrations`
                : "Loading..."}
            </Text>
            {ai && (
              <View style={styles.aiContainer}>
                <Text style={styles.aiLabel}>AI Insight:</Text>
                <Text style={styles.aiText}>"{ai.summary}"</Text>
              </View>
            )}
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  error: { color: "red" },
  empty: { textAlign: "center", marginTop: 40, color: "#666" },
  list: { padding: 12 },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
  },
  name: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
  stat: { color: "#1976d2", fontSize: 14, marginBottom: 8 },
  aiContainer: {
    marginTop: 8,
    padding: 10,
    backgroundColor: "#f0f7ff",
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: "#1976d2",
  },
  aiLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1976d2",
    marginBottom: 2,
    textTransform: "uppercase",
  },
  aiText: {
    fontSize: 13,
    color: "#444",
    fontStyle: "italic",
  },
});
