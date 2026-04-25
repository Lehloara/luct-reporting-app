import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, Linking } from 'react-native';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import SearchBar from '../components/SearchBar';
import ReportCard from '../components/ReportCard';

// ✅ Use your NEW IP address
const BACKEND_URL = 'http://192.168.43.121:5000/api/reports/excel'; 

export default function MonitoringScreen() {
  const { role, user, registerSub } = useAuth();
  const [reports, setReports] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const canExport = ['lecturer', 'prl', 'pl'].includes(role);

  useEffect(() => {
    if (!user) return;
    let q;
    if (role === 'lecturer') {
      q = query(collection(db, 'reports'), where('lecturerId', '==', user.uid));
    } else {
      q = query(collection(db, 'reports'));
    }

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setReports(data);
      setLoading(false);
    }, (error) => { 
      if (error.code !== 'permission-denied') console.error(error); 
    });
    
    registerSub(unsub);
    return unsub;
  }, [role, user, registerSub]);

  const filteredReports = reports.filter(r => {
    const term = searchQuery.toLowerCase();
    return (r.courseCode || '').toLowerCase().includes(term) || 
           (r.lecturerName || '').toLowerCase().includes(term) || 
           (r.topic || '').toLowerCase().includes(term);
  });

  const handleExport = async () => {
    setExporting(true);
    try {
      const supported = await Linking.canOpenURL(BACKEND_URL);
      if (!supported) {
        Alert.alert('Error', 'Cannot connect to backend. Ensure it is running.');
        return;
      }
      await Linking.openURL(BACKEND_URL);
    } catch (err) {
      Alert.alert('Export Failed', err.message);
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#007AFF" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Reports Dashboard</Text>
        
        {canExport && (
          <TouchableOpacity style={styles.exportBtn} onPress={handleExport} disabled={exporting}>
            <Text style={styles.exportText}>{exporting ? 'Exporting...' : ' Export Excel'}</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <SearchBar placeholder="Search by course, lecturer, topic..." value={searchQuery} onChangeText={setSearchQuery} />
      
      <FlatList 
        data={filteredReports} 
        keyExtractor={item => item.id} 
        renderItem={({ item }) => <ReportCard report={item} />} 
        contentContainerStyle={styles.list} 
        ListEmptyComponent={<Text style={styles.empty}>No reports found.</Text>} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' }, 
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1a1a1a' }, 
  exportBtn: { backgroundColor: '#28a745', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 },
  exportText: { color: '#fff', fontWeight: 'bold', fontSize: 13 }, 
  list: { padding: 8, paddingBottom: 20 }, 
  empty: { textAlign: 'center', marginTop: 40, color: '#666', fontSize: 15 }
});