import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from "../../config/firebase";
import { useAuth } from '../../context/AuthContext';
import SearchBar from '../../components/SearchBar';

export default function StudentAttendanceScreen() {
  const { user, registerSub } = useAuth();
  const [records, setRecords] = useState([]);
  const [classCode, setClassCode] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      if (!user) return;
      try {
        const userSnap = await getDoc(doc(db, 'users', user.uid));
        const code = userSnap.data()?.classCode || '';
        setClassCode(code);
        
        if (code) {
          // ✅ FIXED: Query the 'attendance' collection, not 'reports'
          const q = query(collection(db, 'attendance'), where('classCode', '==', code));
          
          const unsub = onSnapshot(q, (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            // Sort by date (newest first)
            data.sort((a, b) => new Date(b.date) - new Date(a.date));
            setRecords(data);
            setLoading(false);
          }, (error) => {
             if (error.code !== 'permission-denied') console.error(error);
          });
          
          registerSub(unsub);
          return () => unsub();
        }
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    init();
  }, [user, registerSub]);

  const filtered = records.filter(r => 
    (r.status || '').toLowerCase().includes(search.toLowerCase()) ||
    (new Date(r.date).toLocaleDateString() || '').includes(search)
  );

  if (loading) return <ActivityIndicator style={styles.center} size="large" color="#007AFF" />;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Attendance Records</Text>
      <SearchBar placeholder="Search by status or date..." value={search} onChangeText={setSearch} />
      <FlatList 
        data={filtered} 
        keyExtractor={item => item.id} 
        contentContainerStyle={{ padding: 12 }}
        renderItem={({ item }) => {
          const isPresent = item.status === 'present';
          return (
            <View style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.date}>{new Date(item.date).toLocaleDateString()}</Text>
                <View style={[styles.badge, isPresent ? styles.bgGreen : styles.bgRed]}>
                  <Text style={styles.badgeText}>{isPresent ? ' Present' : ' Absent'}</Text>
                </View>
              </View>
              <Text style={styles.info}>Marked by Lecturer</Text>
            </View>
          );
        }}
        ListEmptyComponent={<Text style={styles.empty}>{classCode ? 'No attendance records yet.' : 'Register with a class code first.'}</Text>} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 20, fontWeight: 'bold', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  card: { backgroundColor: '#fff', padding: 14, borderRadius: 10, marginBottom: 10, elevation: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  date: { fontWeight: 'bold', fontSize: 15, color: '#333' },
  badge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 12 },
  bgGreen: { backgroundColor: '#e8f5e9' }, bgRed: { backgroundColor: '#ffebee' },
  badgeText: { fontSize: 12, fontWeight: 'bold', color: '#333' },
  info: { fontSize: 13, color: '#666' },
  empty: { textAlign: 'center', marginTop: 40, color: '#666' }
});