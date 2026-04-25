import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import SearchBar from '../../components/SearchBar';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

const BACKEND_URL = 'https://luct-reporting-app-bmx1.onrender.com/api/reports/excel';

export default function LecturerMonitoringScreen() {
  const { user, registerSub } = useAuth();
  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'reports'), where('lecturerId', '==', user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setReports(data); setLoading(false);
    }, (error) => { if (error.code !== 'permission-denied') console.error(error); });
    
    registerSub(unsub);
    return unsub;
  }, [user, registerSub]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const fileUri = FileSystem.documentDirectory + 'luct_report.xlsx';
      
      const downloadResult = await FileSystem.downloadAsync(BACKEND_URL, fileUri);
      
      if (downloadResult.status !== 200) {
        throw new Error('Backend returned error status');
      }

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, { mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', dialogTitle: 'Open Report' });
      } else {
        Alert.alert('Success', `Report saved to device storage at:\n${fileUri}`);
      }
    } catch (err) {
      console.error('Download failed:', err);
      Alert.alert('Export Failed', 'Could not download report. Ensure backend is running and IP is correct.');
    } finally {
      setExporting(false);
    }
  };

  const filtered = reports.filter(r => (r.courseCode || '').toLowerCase().includes(search.toLowerCase()));
  if (loading) return <ActivityIndicator style={styles.center} size="large" color="#007AFF" />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Reports Status</Text>
        <TouchableOpacity style={styles.exportBtn} onPress={handleExport} disabled={exporting}>
          <Text style={styles.exportText}>{exporting ? ' Downloading...' : ' Export Excel'}</Text>
        </TouchableOpacity>
      </View>
      
      <SearchBar placeholder="Search reports..." value={search} onChangeText={setSearch} />
      
      <FlatList data={filtered} keyExtractor={item => item.id} contentContainerStyle={{ padding: 12 }}
        renderItem={({ item }) => {
          const reviewed = !!item.prlFeedback;
          return (
            <View style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.code}>{item.courseCode} | {item.week}</Text>
                <View style={[styles.badge, reviewed ? styles.green : styles.orange]}>
                  <Text style={styles.badgeText}>{reviewed ? ' Reviewed' : ' Pending'}</Text>
                </View>
              </View>
              <Text style={styles.topic}>{item.topic || 'No topic'}</Text>
              {reviewed && <Text style={styles.feedback}>PRL: "{item.prlFeedback}"</Text>}
            </View>
          );
        }} ListEmptyComponent={<Text style={styles.empty}>No reports submitted.</Text>} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' }, center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a' },
  exportBtn: { backgroundColor: '#28a745', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
  exportText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  card: { backgroundColor: '#fff', padding: 14, borderRadius: 10, marginBottom: 10, elevation: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, code: { fontWeight: 'bold', fontSize: 14, color: '#007AFF' },
  badge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 12 }, green: { backgroundColor: '#e8f5e9' }, orange: { backgroundColor: '#fff3e0' },
  badgeText: { fontSize: 11, fontWeight: 'bold', color: '#333' },
  topic: { fontSize: 13, color: '#333', marginTop: 6 }, feedback: { fontSize: 13, color: '#007AFF', marginTop: 6, fontStyle: 'italic' },
  empty: { textAlign: 'center', marginTop: 40, color: '#666' }
});