import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import SearchBar from '../../components/SearchBar';

export default function PlReportsScreen() {
  const { user, registerSub } = useAuth();
  const [reports, setReports] = useState([]);
  const [faculty, setFaculty] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => { if (!user) return; const snap = await getDoc(doc(db, 'users', user.uid)); setFaculty(snap.data()?.faculty || ''); };
    init();
  }, [user]);

  useEffect(() => {
    if (!faculty) return;
    const q = query(collection(db, 'reports'), where('faculty', '==', faculty));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setReports(data); setLoading(false);
    });
    registerSub(unsub);
    return unsub;
  }, [faculty, registerSub]);

  const filtered = reports.filter(r => (r.courseCode || r.lecturerName || r.prlFeedback || '').toLowerCase().includes(search.toLowerCase()));
  if (loading || !faculty) return <ActivityIndicator style={styles.center} size="large" color="#007AFF" />;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Reports Dashboard ({faculty})</Text>
      <SearchBar placeholder="Search course, lecturer, feedback..." value={search} onChangeText={setSearch} />
      <FlatList data={filtered} keyExtractor={item => item.id} contentContainerStyle={{ padding: 12 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}><Text style={styles.code}>{item.courseCode} | {item.week}</Text>
              <Text style={item.prlFeedback ? styles.fbGreen : styles.fbPending}>{item.prlFeedback ? ' Reviewed by PRL' : '⏳ Pending Review'}</Text></View>
            <Text style={styles.meta}>lecturer: {item.lecturerName} | total students: {item.actualStudents}/{item.totalStudents} Present</Text>
            {item.prlFeedback && <Text style={styles.comment}>feedback: "{item.prlFeedback}"</Text>}
          </View>
        )} ListEmptyComponent={<Text style={styles.empty}>No reports yet.</Text>} />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' }, center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 20, fontWeight: 'bold', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  card: { backgroundColor: '#fff', padding: 14, borderRadius: 10, marginBottom: 10, elevation: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }, code: { fontWeight: 'bold', color: '#007AFF' },
  fbGreen: { color: '#2e7d32', fontWeight: '600', fontSize: 12 }, fbPending: { color: '#f57c00', fontWeight: '600', fontSize: 12 },
  meta: { fontSize: 13, color: '#555', marginBottom: 4 }, comment: { fontSize: 13, color: '#333', fontStyle: 'italic', borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 6 },
  empty: { textAlign: 'center', marginTop: 40, color: '#666' }
});