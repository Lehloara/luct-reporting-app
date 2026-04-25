import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import SearchBar from '../../components/SearchBar';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

const BACKEND_URL = 'http://192.168.43.121:5000/api/reports/excel';

export default function PrlMonitoringScreen() {
  const { user, registerSub } = useAuth();
  const [reports, setReports] = useState([]);
  const [faculty, setFaculty] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const init = async () => { if (!user) return; const snap = await getDoc(doc(db, 'users', user.uid)); setFaculty(snap.data()?.faculty || ''); };
    init();
  }, [user]);

  useEffect(() => {
    if (!faculty) return;
    const q = query(collection(db, 'reports'), where('faculty', '==', faculty));
    const unsub = onSnapshot(q, (snap) => {
      setReports(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (error) => { if (error.code !== 'permission-denied') console.error(error); });
    registerSub(unsub);
    return unsub;
  }, [faculty, registerSub]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const fileUri = FileSystem.documentDirectory + 'luct_prl_report.xlsx';
      const downloadResult = await FileSystem.downloadAsync(BACKEND_URL, fileUri);
      if (downloadResult.status !== 200) throw new Error('Backend error');
      
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, { mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', dialogTitle: 'Open Report' });
      } else {
        Alert.alert('Success', `Report saved to: ${fileUri}`);
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Export Failed', 'Check backend connection.');
    } finally { setExporting(false); }
  };

  const total = reports.length;
  const reviewed = reports.filter(r => !!r.prlFeedback).length;
  const pending = total - reviewed;
  const filtered = reports.filter(r => (r.courseCode || r.lecturerName || '').toLowerCase().includes(search.toLowerCase()));

  if (loading || !faculty) return <ActivityIndicator style={styles.center} size="large" color="#007AFF" />;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Monitoring ({faculty})</Text>
        <TouchableOpacity style={styles.exportBtn} onPress={handleExport} disabled={exporting}>
          <Text style={styles.exportText}>{exporting ? '...' : ' Export'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statBox, { backgroundColor: '#e3f2fd' }]}><Text style={styles.statNum}>{total}</Text><Text style={styles.statLabel}>Total</Text></View>
        <View style={[styles.statBox, { backgroundColor: '#e8f5e9' }]}><Text style={styles.statNum}>{reviewed}</Text><Text style={styles.statLabel}>Reviewed</Text></View>
        <View style={[styles.statBox, { backgroundColor: '#fff3e0' }]}><Text style={styles.statNum}>{pending}</Text><Text style={styles.statLabel}>Pending</Text></View>
      </View>
      
      <SearchBar placeholder="Search reports..." value={search} onChangeText={setSearch} />
      
      <FlatList data={filtered} keyExtractor={item => item.id} scrollEnabled={false} contentContainerStyle={{ padding: 12 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}><Text style={styles.code}>{item.courseCode}</Text>
              <View style={[styles.badge, item.prlFeedback ? styles.bgGreen : styles.bgOrange]}><Text style={styles.badgeText}>{item.prlFeedback ? '✅ Reviewed' : '⏳ Pending'}</Text></View></View>
            <Text style={styles.meta}>Lecturer: {item.lecturerName} | Week: {item.week}</Text>
            {item.prlFeedback ? <Text style={styles.comment}>feedback "{item.prlFeedback}"</Text> : null}
          </View>
        )} ListEmptyComponent={<Text style={styles.empty}>No reports to monitor.</Text>} />
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#f5f7fa', paddingBottom: 40 }, center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  header: { fontSize: 18, fontWeight: 'bold' },
  exportBtn: { backgroundColor: '#28a745', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
  exportText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 16, backgroundColor: '#fff' },
  statBox: { alignItems: 'center', padding: 12, borderRadius: 10, width: '28%' }, statNum: { fontSize: 22, fontWeight: 'bold', color: '#333' }, statLabel: { fontSize: 12, color: '#666' },
  card: { backgroundColor: '#fff', padding: 14, borderRadius: 10, marginBottom: 10, elevation: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }, code: { fontWeight: 'bold', color: '#007AFF' },
  badge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 12 }, bgGreen: { backgroundColor: '#e8f5e9' }, bgOrange: { backgroundColor: '#fff3e0' }, badgeText: { fontSize: 11, fontWeight: 'bold', color: '#333' },
  meta: { fontSize: 13, color: '#555' }, comment: { fontSize: 13, color: '#007AFF', marginTop: 6, fontStyle: 'italic' }, empty: { textAlign: 'center', marginTop: 40, color: '#666' }
});