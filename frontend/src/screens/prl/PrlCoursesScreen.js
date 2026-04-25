import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import SearchBar from '../../components/SearchBar';

export default function PrlCoursesScreen() {
  const { user, registerSub } = useAuth();
  const [courses, setCourses] = useState([]);
  const [faculty, setFaculty] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => { if (!user) return; try { const snap = await getDoc(doc(db, 'users', user.uid)); setFaculty(snap.data()?.faculty || ''); } catch (e) { console.error(e); } };
    init();
  }, [user]);

  useEffect(() => {
    if (!faculty) return;
    const q = query(collection(db, 'courses'), where('faculty', '==', faculty));
    const unsub = onSnapshot(q, (snap) => { setCourses(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false); });
    registerSub(unsub);
    return unsub;
  }, [faculty, registerSub]);

  const filtered = courses.filter(c => (c.courseCode || c.assignedLecturerName || '').toLowerCase().includes(search.toLowerCase()));
  if (loading || !faculty) return <ActivityIndicator style={styles.center} size="large" color="#007AFF" />;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Courses & Lectures ({faculty})</Text>
      <SearchBar placeholder="Search course or lecturer..." value={search} onChangeText={setSearch} />
      <FlatList data={filtered} keyExtractor={item => item.id} contentContainerStyle={{ padding: 12 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.code}>{item.courseCode}</Text>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.info}>lecturer: {item.assignedLecturerName || 'Unassigned'}</Text>
            <Text style={styles.info}>class code: {item.classCode} | venue: {item.venue || 'TBA'} | time: {item.scheduledTime || 'TBA'}</Text>
          </View>
        )} ListEmptyComponent={<Text style={styles.empty}>No courses in {faculty} stream yet.</Text>} />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' }, center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 20, fontWeight: 'bold', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  card: { backgroundColor: '#fff', padding: 14, borderRadius: 10, marginBottom: 10, elevation: 2 },
  code: { fontWeight: 'bold', fontSize: 15, color: '#007AFF' }, name: { fontSize: 14, color: '#333', marginTop: 2 }, info: { fontSize: 13, color: '#666', marginTop: 1 }, empty: { textAlign: 'center', marginTop: 40, color: '#666' }
});