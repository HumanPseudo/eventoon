import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Link, useFocusEffect } from "expo-router";

import { api } from "../../lib/api";
import type { Event } from "../../lib/types";

export default function EventList() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      setError("");
      api
        .listEvents()
        .then(setEvents)
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
      renderItem={({ item }) => (
        <Link href={`/event/${item.id}`} asChild>
          <TouchableOpacity style={styles.card} activeOpacity={0.7}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.desc} numberOfLines={2}>
              {item.description}
            </Text>
            <View style={styles.row}>
              <Text style={styles.meta}>Date: {item.date}</Text>
              <Text style={styles.meta}>
                Capacity: {item.attendee_count} / {item.max_capacity}
              </Text>
            </View>
          </TouchableOpacity>
        </Link>
      )}
    />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  error: { color: "red" },
  empty: { textAlign: "center", marginTop: 40, color: "#666" },
  list: { padding: 12 },
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
    cursor: "pointer",
  },
  name: { fontSize: 18, fontWeight: "600", marginBottom: 4 },
  desc: { color: "#555", marginBottom: 8 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  meta: { color: "#888", fontSize: 13 },
});
