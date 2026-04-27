import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Modal, TouchableOpacity, TextInput, Alert } from 'react-native';
import { collection, query, where, onSnapshot, updateDoc, doc, getDoc } from 'firebase/firestore';
import { auth, db } from "../../config/firebase";
import { useAuth } from '../../context/AuthContext';
import SearchBar from '../../components/SearchBar';

export default function PrlReportsScreen() {
  const { user, registerSub } = useAuth();
  const [reports, setReports] = useState([]);
  const [faculty, setFaculty] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

  const handleSaveFeedback = async () => {
    if (!feedback.trim()) return Alert.alert('Error', 'Feedback cannot be empty');
    setSubmitting(true);
    try { await updateDoc(doc(db, 'reports', selected.id), { prlFeedback: feedback.trim() }); Alert.alert('Success', 'Feedback saved'); setModalVisible(false); setFeedback(''); setSelected(null); }
    catch (err) { Alert.alert('Error', err.message); } finally { setSubmitting(false); }
  };

  const filtered = reports.filter(r => (r.courseCode || r.lecturerName || '').toLowerCase().includes(search.toLowerCase()));
  if (loading || !faculty) return <ActivityIndicator style={styles.center} size="large" color="#007AFF" />;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Lecturer Reports ({faculty})</Text>
      <SearchBar placeholder="Search reports..." value={search} onChangeText={setSearch} />
      <FlatList data={filtered} keyExtractor={item => item.id} contentContainerStyle={{ padding: 12 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => { setSelected(item); setFeedback(item.prlFeedback || ''); setModalVisible(true); }}>
            <View style={styles.row}><Text style={styles.code}>{item.courseCode} | {item.week}</Text><Text style={styles.date}>{item.date}</Text></View>
            <Text style={styles.topic}>{item.topic}</Text>
            <Text style={styles.meta}>👤 {item.lecturerName} | 📊 {item.actualStudents}/{item.totalStudents}</Text>
            <Text style={item.prlFeedback ? styles.fbGreen : styles.fbPending}>{item.prlFeedback ? '✅ Feedback Added' : '⏳ Awaiting Review'}</Text>
          </TouchableOpacity>
        )} ListEmptyComponent={<Text style={styles.empty}>No reports submitted yet.</Text>} />
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}><View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Add PRL Feedback</Text><Text style={styles.modalInfo}>{selected?.courseCode} by {selected?.lecturerName}</Text>
          <TextInput style={styles.input} placeholder="Enter feedback..." value={feedback} onChangeText={setFeedback} multiline numberOfLines={4} />
          <View style={styles.modalBtns}><TouchableOpacity style={[styles.btn, styles.cancel]} onPress={() => setModalVisible(false)}><Text style={styles.btnText}>Cancel</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.save]} onPress={handleSaveFeedback} disabled={submitting}>{submitting ? <Text style={styles.btnText}>...</Text> : <Text style={styles.btnText}>Save</Text>}</TouchableOpacity></View>
        </View></View>
      </Modal>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' }, center: { flex: 1, justifyContent: 'center', alignItems: 'center' }, header: { fontSize: 20, fontWeight: 'bold', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  card: { backgroundColor: '#fff', padding: 14, borderRadius: 10, marginBottom: 10, elevation: 2 }, row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }, code: { fontWeight: 'bold', color: '#007AFF' }, date: { color: '#666', fontSize: 13 },
  topic: { fontSize: 14, color: '#333', marginBottom: 6 }, meta: { fontSize: 13, color: '#555' }, fbGreen: { color: '#2e7d32', fontWeight: '600', marginTop: 6, fontSize: 12 }, fbPending: { color: '#f57c00', fontWeight: '600', marginTop: 6, fontSize: 12 },
  empty: { textAlign: 'center', marginTop: 40, color: '#666' }, modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }, modalContent: { backgroundColor: '#fff', padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 }, modalInfo: { fontSize: 13, color: '#666', marginBottom: 12 }, input: { backgroundColor: '#f8f9fa', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#ddd', minHeight: 100, textAlignVertical: 'top' },
  modalBtns: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }, btn: { flex: 1, padding: 14, borderRadius: 10, alignItems: 'center', marginHorizontal: 5 }, cancel: { backgroundColor: '#f0f0f0' }, save: { backgroundColor: '#007AFF' }, btnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 }
});