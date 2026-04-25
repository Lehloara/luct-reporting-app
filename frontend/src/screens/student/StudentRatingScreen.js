import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Alert, Modal, TextInput } from 'react-native';
import { collection, query, where, addDoc, onSnapshot, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import SearchBar from '../../components/SearchBar';

export default function StudentRatingScreen() {
  const { user, registerSub } = useAuth();
  const [courses, setCourses] = useState([]);
  const [classCode, setClassCode] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (!user) return;
      const userSnap = await getDocs(query(collection(db, 'users'), where('__name__', '==', user.uid)));
      if (!userSnap.empty) {
        const code = userSnap.docs[0].data()?.classCode;
        setClassCode(code);
        const q = query(collection(db, 'courses'), where('classCode', '==', code));
        const unsub = onSnapshot(q, (snap) => setCourses(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
        registerSub(unsub);
        return () => unsub();
      }
    };
    init();
  }, [user, registerSub]);

  const checkExistingRating = async (courseId) => {
    const q = query(collection(db, 'ratings'), where('studentId', '==', user.uid), where('courseId', '==', courseId));
    const snap = await getDocs(q);
    return !snap.empty;
  };

  const handleRate = async (course) => {
    setSelected(course);
    const exists = await checkExistingRating(course.id);
    if (exists) return Alert.alert('Info', 'You have already rated this course.');
    setRating(0); setFeedback(''); setModalVisible(true);
  };

  const submitRating = async () => {
    if (rating === 0) return Alert.alert('Validation Error', 'Please select a rating (1-5)');
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'ratings'), {
        studentId: user.uid,
        courseId: selected.id,
        courseCode: selected.courseCode,
        lecturerId: selected.assignedLecturerId,
        lecturerName: selected.assignedLecturerName || 'Unknown',
        rating, feedback, role: 'student', createdAt: serverTimestamp()
      });
      Alert.alert('Success', 'Rating submitted!');
      setModalVisible(false);
    } catch (e) { Alert.alert('Error', e.message); } 
    finally { setSubmitting(false); }
  };

  const filtered = courses.filter(c => (c.courseCode || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Rate Your Lecturers</Text>
      <SearchBar placeholder="Search courses..." value={search} onChangeText={setSearch} />
      <FlatList data={filtered} keyExtractor={item => item.id} contentContainerStyle={{ padding: 12 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => handleRate(item)}>
            <Text style={styles.code}>{item.courseCode}</Text>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.info}>Lecturer: {item.assignedLecturerName || 'Unknown'}</Text>
            <Text style={styles.btnInline}>Tap to Rate</Text>
          </TouchableOpacity>
        )} />
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rate {selected?.assignedLecturerName || 'Lecturer'}</Text>
            <View style={styles.stars}>
              {[1,2,3,4,5].map(num => (
                <TouchableOpacity key={num} style={[styles.star, num <= rating && styles.starActive]} onPress={() => setRating(num)}>
                  <Text style={[styles.starText, num <= rating && {color:'#fff'}]}>{num}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={styles.input} placeholder="Optional feedback..." value={feedback} onChangeText={setFeedback} multiline numberOfLines={3} />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={[styles.btn, styles.cancel]} onPress={() => setModalVisible(false)}><Text style={styles.btnText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.save]} onPress={submitRating} disabled={submitting}><Text style={styles.btnText}>Submit</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' }, header: { fontSize: 20, fontWeight: 'bold', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  card: { backgroundColor: '#fff', padding: 14, borderRadius: 10, marginBottom: 10, elevation: 2 }, code: { fontWeight: 'bold', fontSize: 15, color: '#007AFF' },
  name: { fontSize: 14, color: '#333', marginTop: 4 }, info: { fontSize: 13, color: '#666', marginTop: 2 }, btnInline: { color: '#007AFF', fontWeight: '600', marginTop: 8 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }, modalContent: { backgroundColor: '#fff', padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, minHeight: 300 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' }, stars: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 16 },
  star: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }, starActive: { backgroundColor: '#007AFF' },
  starText: { fontWeight: 'bold', fontSize: 14, color: '#888' }, input: { backgroundColor: '#f8f9fa', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#ddd', minHeight: 80, textAlignVertical: 'top', marginBottom: 16 },
  modalBtns: { flexDirection: 'row', justifyContent: 'space-between' }, btn: { flex: 1, padding: 14, borderRadius: 10, alignItems: 'center', marginHorizontal: 5 },
  cancel: { backgroundColor: '#f0f0f0' }, save: { backgroundColor: '#007AFF' }, btnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 }
});