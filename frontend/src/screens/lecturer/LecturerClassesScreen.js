import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import SearchBar from '../../components/SearchBar';

export default function LecturerClassesScreen() {
  const { user, registerSub } = useAuth();
  const [classes, setClasses] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'courses'), where('assignedLecturerId', '==', user.uid));
    const unsub = onSnapshot(q, (snap) => {
      setClasses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    registerSub(unsub);
    return unsub;
  }, [user, registerSub]);

  const filtered = classes.filter(c => (c.courseCode || c.name || '').toLowerCase().includes(search.toLowerCase()));
  if (loading) return <ActivityIndicator style={styles.center} size="large" color="#007AFF" />;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Assigned Classes</Text>
      <SearchBar placeholder="Search classes..." value={search} onChangeText={setSearch} />
      <FlatList data={filtered} keyExtractor={item => item.id} contentContainerStyle={{ padding: 12 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.code}>{item.courseCode}</Text>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.info}> Class: {item.classCode} | total students: {item.totalStudents}</Text>
            <Text style={styles.info}> Venue: {item.venue || 'TBA'} | time: {item.scheduledTime || 'TBA'}</Text>
          </View>
        )} ListEmptyComponent={<Text style={styles.empty}>No classes assigned by PL yet.</Text>} />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' }, center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 20, fontWeight: 'bold', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  card: { backgroundColor: '#fff', padding: 14, borderRadius: 10, marginBottom: 10, elevation: 2 },
  code: { fontWeight: 'bold', fontSize: 15, color: '#007AFF' }, name: { fontSize: 14, color: '#333', marginTop: 4 },
  info: { fontSize: 13, color: '#666', marginTop: 2 }, empty: { textAlign: 'center', marginTop: 40, color: '#666' }
});