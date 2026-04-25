import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import SearchBar from '../../components/SearchBar';

export default function PlLecturesScreen() {
  const { user, registerSub } = useAuth();
  const [lecturers, setLecturers] = useState([]);
  const [faculty, setFaculty] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => { if (!user) return; const snap = await getDoc(doc(db, 'users', user.uid)); setFaculty(snap.data()?.faculty || ''); };
    init();
  }, [user]);

  useEffect(() => {
    if (!faculty) return;
    const q = query(collection(db, 'users'), where('role', '==', 'lecturer'), where('faculty', '==', faculty));
    const unsub = onSnapshot(q, (snap) => { setLecturers(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false); });
    registerSub(unsub);
    return unsub;
  }, [faculty, registerSub]);

  const filtered = lecturers.filter(l => (l.name || l.email || '').toLowerCase().includes(search.toLowerCase()));
  if (loading || !faculty) return <ActivityIndicator style={styles.center} size="large" color="#007AFF" />;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Lecturers Directory ({faculty})</Text>
      <SearchBar placeholder="Search lecturer..." value={search} onChangeText={setSearch} />
      <FlatList data={filtered} keyExtractor={item => item.id} contentContainerStyle={{ padding: 12 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>lecturer: {item.name}</Text>
            <Text style={styles.email}>email: {item.email}</Text>
            <Text style={styles.status}>Role: Lecturer | Status: Active</Text>
          </View>
        )} ListEmptyComponent={<Text style={styles.empty}>No lecturers in {faculty}.</Text>} />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' }, center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 20, fontWeight: 'bold', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  card: { backgroundColor: '#fff', padding: 14, borderRadius: 10, marginBottom: 10, elevation: 2 },
  name: { fontWeight: 'bold', fontSize: 15, color: '#1a1a1a' }, email: { fontSize: 13, color: '#666', marginTop: 2 },
  status: { fontSize: 12, color: '#2e7d32', marginTop: 4, fontWeight: '500' }, empty: { textAlign: 'center', marginTop: 40, color: '#666' }
});