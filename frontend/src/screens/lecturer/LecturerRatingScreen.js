import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import SearchBar from '../../components/SearchBar';

export default function LecturerRatingScreen() {
  const { user, registerSub } = useAuth();
  const [ratings, setRatings] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'ratings'), where('lecturerId', '==', user.uid));
    const unsub = onSnapshot(q, (snap) => { setRatings(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false); });
    registerSub(unsub);
    return unsub;
  }, [user, registerSub]);

  const filtered = ratings.filter(r => (r.courseCode || '').toLowerCase().includes(search.toLowerCase()));
  if (loading) return <ActivityIndicator style={styles.center} size="large" color="#007AFF" />;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Student Ratings (Anonymous)</Text>
      <SearchBar placeholder="Search course..." value={search} onChangeText={setSearch} />
      <FlatList data={filtered} keyExtractor={item => item.id} contentContainerStyle={{ padding: 12 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}><Text style={styles.code}>{item.courseCode}</Text><Text style={styles.stars}>{'⭐'.repeat(item.rating)}</Text></View>
            <Text style={styles.anon}> Anonymous Student</Text>
            {item.feedback ? <Text style={styles.comment}>"{item.feedback}"</Text> : <Text style={styles.noComment}>No comment</Text>}
          </View>
        )} ListEmptyComponent={<Text style={styles.empty}>No ratings yet.</Text>} />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' }, center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 20, fontWeight: 'bold', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  card: { backgroundColor: '#fff', padding: 14, borderRadius: 10, marginBottom: 10, elevation: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }, code: { fontWeight: 'bold', fontSize: 14, color: '#007AFF' }, stars: { fontSize: 14 },
  anon: { fontSize: 12, color: '#888', fontStyle: 'italic', marginBottom: 4 },
  comment: { fontSize: 13, color: '#333', lineHeight: 18 }, noComment: { fontSize: 12, color: '#999', fontStyle: 'italic' },
  empty: { textAlign: 'center', marginTop: 40, color: '#666' }
});