import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { auth, db } from "../../config/firebase";
import { useAuth } from '../../context/AuthContext';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

const BACKEND_URL = 'https://luct-reporting-app-bmx1.onrender.com/api/reports/excel';

export default function PlMonitoringScreen() {
  const { user, registerSub } = useAuth();
  const [stats, setStats] = useState({ courses: 0, reports: 0, reviewed: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsubUser = onSnapshot(doc(db, 'users', user.uid), async (docSnap) => {
      const faculty = docSnap.data()?.faculty || '';
      
      const unsubCourses = onSnapshot(
        query(collection(db, 'courses'), where('assignedBy', '==', user.uid)),
        (snap) => setStats(prev => ({ ...prev, courses: snap.size }))
      );

      const unsubReports = onSnapshot(
        query(collection(db, 'reports'), where('faculty', '==', faculty)),
        (snap) => {
          const data = snap.docs.map(d => d.data());
          const reviewed = data.filter(r => !!r.prlFeedback).length;
          setStats(prev => ({ ...prev, reports: snap.size, reviewed, pending: snap.size - reviewed }));
          setLoading(false);
        }
      );
      registerSub(unsubCourses);
      registerSub(unsubReports);
      return () => { unsubCourses(); unsubReports(); };
    });
    return unsubUser;
  }, [user, registerSub]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const fileUri = FileSystem.documentDirectory + 'luct_pl_report.xlsx';
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

  const reviewRate = stats.reports > 0 ? Math.round((stats.reviewed / stats.reports) * 100) : 0;
  if (loading) return <ActivityIndicator style={styles.center} size="large" color="#007AFF" />;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>PL Progress Dashboard</Text>
        <TouchableOpacity style={styles.exportBtn} onPress={handleExport} disabled={exporting}>
          <Text style={styles.exportText}>{exporting ? '...' : ' Export'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.grid}>
        <View style={[styles.box, { backgroundColor: '#e3f2fd' }]}><Text style={styles.num}>{stats.courses}</Text><Text style={styles.label}>Courses Added</Text></View>
        <View style={[styles.box, { backgroundColor: '#e8f5e9' }]}><Text style={styles.num}>{stats.reviewed}</Text><Text style={styles.label}>Reviewed by PRL</Text></View>
        <View style={[styles.box, { backgroundColor: '#fff3e0' }]}><Text style={styles.num}>{stats.pending}</Text><Text style={styles.label}>Pending Review</Text></View>
        <View style={[styles.box, { backgroundColor: '#fce4ec' }]}><Text style={styles.num}>{reviewRate}%</Text><Text style={styles.label}>Review Rate</Text></View>
      </View>
      <View style={styles.progressWrap}>
        <Text style={styles.progressLabel}>Feedback Completion</Text>
        <View style={styles.progressBg}><View style={[styles.progressFill, { width: `${reviewRate}%` }]} /></View>
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#f5f7fa', paddingBottom: 40 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  header: { fontSize: 20, fontWeight: 'bold' },
  exportBtn: { backgroundColor: '#28a745', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
  exportText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  box: { width: '48%', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 12, elevation: 2 },
  num: { fontSize: 24, fontWeight: 'bold', color: '#333' }, label: { fontSize: 13, color: '#555', textAlign: 'center' },
  progressWrap: { backgroundColor: '#fff', padding: 16, borderRadius: 12, elevation: 2 },
  progressLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#333' },
  progressBg: { height: 12, backgroundColor: '#e0e0e0', borderRadius: 6, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#007AFF', borderRadius: 6 }
});