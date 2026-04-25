import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import SearchBar from '../../components/SearchBar';

export default function PrlClassesScreen() {
  const { user, registerSub } = useAuth();
  const [classes, setClasses] = useState([]);
  const [faculty, setFaculty] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => { if (!user) return; const snap = await getDoc(doc(db, 'users', user.uid)); setFaculty(snap.data()?.faculty || ''); };
    init();
  }, [user]);

  useEffect(() => {
    if (!faculty) return;
    const q = query(collection(db, 'courses'), where('faculty', '==', faculty));
    const unsub = onSnapshot(q, (snap) => { setClasses(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false); });
    registerSub(unsub);
    return unsub;
  }, [faculty, registerSub]);

  const filtered = classes.filter(c => (c.classCode || c.courseCode || '').toLowerCase().includes(search.toLowerCase()));
  if (loading || !faculty) return <ActivityIndicator style={styles.center} size="large" color="#007AFF" />;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Classes Stream ({faculty})</Text>
      <SearchBar placeholder="Search class or course..." value={search} onChangeText={setSearch} />
      <FlatList data={filtered} keyExtractor={item => item.id} contentContainerStyle={{ padding: 12 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.classCode}>class code {item.classCode}</Text>
            <Text style={styles.course}>{item.courseCode} - {item.name}</Text>
            <Text style={styles.info}>lecturer: {item.assignedLecturerName} | Total students: {item.totalStudents}</Text>
            <Text style={styles.info}>venue: {item.venue || 'TBA'} | time: {item.scheduledTime || 'TBA'}</Text>
          </View>
        )} ListEmptyComponent={<Text style={styles.empty}>No classes in {faculty} stream.</Text>} />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' }, center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 20, fontWeight: 'bold', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  card: { backgroundColor: '#fff', padding: 14, borderRadius: 10, marginBottom: 10, elevation: 2 },
  classCode: { fontWeight: 'bold', fontSize: 15, color: '#2e7d32', marginBottom: 4 }, course: { fontSize: 14, color: '#007AFF' },
  info: { fontSize: 13, color: '#666', marginTop: 1 }, empty: { textAlign: 'center', marginTop: 40, color: '#666' }
});