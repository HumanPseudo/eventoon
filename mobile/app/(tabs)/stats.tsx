import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";

import { api } from "../../lib/api";
import type { Event, EventStats } from "../../lib/types";

export default function StatsScreen() {
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<Record<number, EventStats>>({});
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
          const map: Record<number, EventStats> = {};
          for (const e of list) {
            try {
              map[e.id] = await api.getStats(e.id);
            } catch {}
          }
          setStats(map);
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
        return (
          <View style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.stat}>
              {s
                ? `${s.total_registrations} / ${s.max_capacity} registrations`
                : "Loading..."}
            </Text>
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
  stat: { color: "#1976d2", fontSize: 14 },
});
