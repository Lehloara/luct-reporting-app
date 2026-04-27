import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { auth, db } from "../../config/firebase";
import { useAuth } from '../../context/AuthContext';
import SearchBar from '../../components/SearchBar';

export default function PrlRatingScreen() {
  const { user, registerSub } = useAuth();
  const [ratings, setRatings] = useState([]);
  const [facultyCodes, setFacultyCodes] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      if (!user) return;
      try {
        const uSnap = await getDocs(query(collection(db, 'users'), where('__name__', '==', user.uid)));
        if (uSnap.empty) return setLoading(false);
        const f = uSnap.docs[0].data()?.faculty || '';
        const cSnap = await getDocs(query(collection(db, 'courses'), where('faculty', '==', f)));
        setFacultyCodes(cSnap.docs.map(d => d.data().courseCode));
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    init();
  }, [user]);

  useEffect(() => {
    if (facultyCodes.length === 0) return;
    const unsub = onSnapshot(collection(db, 'ratings'), (snap) => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setRatings(all.filter(r => facultyCodes.includes(r.courseCode)));
    });
    registerSub(unsub);
    return unsub;
  }, [facultyCodes, registerSub]);

  const filtered = ratings.filter(r => (r.courseCode || r.lecturerName || '').toLowerCase().includes(search.toLowerCase()));
  if (loading) return <ActivityIndicator style={styles.center} size="large" color="#007AFF" />;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Student Ratings (Anonymous)</Text>
      <SearchBar placeholder="Search course or lecturer..." value={search} onChangeText={setSearch} />
      <FlatList data={filtered} keyExtractor={item => item.id} contentContainerStyle={{ padding: 12 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}><Text style={styles.code}>{item.courseCode}</Text><Text style={styles.stars}>{'⭐'.repeat(item.rating)} ({item.rating}/5)</Text></View>
            <Text style={styles.lecturer}>Lecturer: {item.lecturerName}</Text>
            <Text style={styles.anon}>👤 Submitted by Anonymous Student</Text>
            {item.feedback ? <Text style={styles.comment}>"{item.feedback}"</Text> : <Text style={styles.noComment}>No comment</Text>}
          </View>
        )} ListEmptyComponent={<Text style={styles.empty}>No ratings yet for your stream.</Text>} />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' }, center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 20, fontWeight: 'bold', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  card: { backgroundColor: '#fff', padding: 14, borderRadius: 10, marginBottom: 10, elevation: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }, code: { fontWeight: 'bold', color: '#007AFF' }, stars: { fontWeight: 'bold', color: '#f57c00' },
  lecturer: { fontSize: 14, color: '#333', marginBottom: 4 }, anon: { fontSize: 12, color: '#888', fontStyle: 'italic', marginBottom: 6 },
  comment: { fontSize: 13, color: '#333', lineHeight: 18 }, noComment: { fontSize: 12, color: '#999', fontStyle: 'italic' }, empty: { textAlign: 'center', marginTop: 40, color: '#666' }
});