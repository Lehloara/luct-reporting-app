import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, Alert, StyleSheet, ActivityIndicator, Keyboard } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { collection, setDoc, doc, onSnapshot, query, where, serverTimestamp, getDocs } from 'firebase/firestore'; 
import { useAuth } from '../../context/AuthContext';

export default function PlCourseManagement() {
  const { user, registerSub } = useAuth();
  const [courses, setCourses] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [classCode, setClassCode] = useState('');
  const [students, setStudents] = useState('');
  const [venue, setVenue] = useState('');
  const [time, setTime] = useState('');
  const [selectedLecturerId, setSelectedLecturerId] = useState('');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(true);

  useEffect(() => {
    const unsubCourses = onSnapshot(collection(db, 'courses'), (snap) => {
      setCourses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setSyncing(false);
    });

    const unsubLecturers = onSnapshot(
      query(collection(db, 'users'), where('role', '==', 'lecturer')),
      (snap) => setLecturers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    return () => { unsubCourses(); unsubLecturers(); };
  }, []);

  const handleAdd = async () => {
    Keyboard.dismiss();
    const finalCode = code.toUpperCase().trim();
    
    if (!finalCode || !name.trim() || !classCode.trim() || !students.trim() || !venue.trim() || !time.trim() || !selectedLecturerId) 
      return Alert.alert('Validation Error', 'All fields are required');
    if (isNaN(Number(students)) || Number(students) <= 0) 
      return Alert.alert('Validation Error', 'Total students must be a positive number');

    const lecturer = lecturers.find(l => l.id === selectedLecturerId);
    setLoading(true);
    try {
      
      await setDoc(doc(db, 'courses', finalCode), {
        courseCode: finalCode,
        name: name.trim(),
        classCode: classCode.toUpperCase(),
        totalStudents: Number(students),
        venue: venue.toUpperCase(),
        scheduledTime: time.trim(),
        assignedLecturerId: lecturer.id,
        assignedLecturerName: lecturer.name,
        faculty: lecturer.faculty || 'FICT',
        assignedBy: user.uid,
        createdAt: serverTimestamp()
      });
      
      Alert.alert('Success', 'Course created & lecturer assigned!');
      setCode(''); setName(''); setClassCode(''); setStudents(''); setVenue(''); setTime(''); setSelectedLecturerId('');
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally { setLoading(false); }
  };

  if (syncing) return <ActivityIndicator style={styles.center} size="large" color="#007AFF" />;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Course Management (PL)</Text>
      <View style={styles.form}>
        <TextInput style={styles.input} placeholder="Course Code (e.g., BIMP3210)" value={code} onChangeText={setCode} autoCapitalize="characters" />
        <TextInput style={styles.input} placeholder="Course Name" value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="Class Code (e.g., BSCSMY3S2)" value={classCode} onChangeText={setClassCode} autoCapitalize="characters" />
        <TextInput style={styles.input} placeholder="Total Registered Students" value={students} onChangeText={setStudents} keyboardType="numeric" />
        <TextInput style={styles.input} placeholder="Venue (e.g., LR1, MM1)" value={venue} onChangeText={setVenue} autoCapitalize="characters" />
        <TextInput style={styles.input} placeholder="Scheduled Time (e.g., 09:00 - 11:00)" value={time} onChangeText={setTime} />
        
        <Text style={styles.label}>Assign Lecturer</Text>
        <View style={styles.pickerContainer}>
          <Picker selectedValue={selectedLecturerId} onValueChange={setSelectedLecturerId} style={styles.picker}>
            <Picker.Item label="Select Lecturer..." value="" />
            {lecturers.map(l => <Picker.Item key={l.id} label={l.name} value={l.id} color="#333" />)}
          </Picker>
        </View>

        <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleAdd} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Add & Assign Course</Text>}
        </TouchableOpacity>
      </View>

      <Text style={styles.listHeader}>Assigned Courses</Text>
      <FlatList data={courses} keyExtractor={item => item.id} contentContainerStyle={{ padding: 12 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.courseCode}</Text>
            <Text style={styles.cardSub}>{item.name}</Text>
            <Text style={styles.cardStat}>👥 {item.totalStudents} | 📚 {item.classCode}</Text>
            <Text style={styles.cardStat}>📍 {item.venue} | ⏰ {item.scheduledTime}</Text>
            <Text style={styles.cardStat}>👨‍🏫 {item.assignedLecturerName || 'Unassigned'}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No courses created yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 20, fontWeight: 'bold', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  form: { padding: 16, backgroundColor: '#fff', margin: 12, borderRadius: 12, elevation: 3 },
  input: { backgroundColor: '#f8f9fa', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', marginBottom: 10 },
  label: { fontWeight: '600', marginBottom: 6, marginTop: 4, color: '#333' },
  pickerContainer: { backgroundColor: '#f8f9fa', borderRadius: 8, borderWidth: 1, borderColor: '#ddd', marginBottom: 10, overflow: 'hidden' },
  picker: { height: 50, width: '100%' },
  btn: { backgroundColor: '#007AFF', padding: 14, borderRadius: 8, alignItems: 'center' },
  btnDisabled: { backgroundColor: '#a0c4ff' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  listHeader: { fontSize: 16, fontWeight: '600', padding: 16, paddingBottom: 4 },
  card: { backgroundColor: '#fff', padding: 14, borderRadius: 10, marginBottom: 10, elevation: 2 },
  cardTitle: { fontWeight: 'bold', fontSize: 15, color: '#007AFF' },
  cardSub: { fontSize: 14, color: '#333', marginTop: 2 },
  cardStat: { fontSize: 13, color: '#666', marginTop: 2 },
  empty: { textAlign: 'center', marginTop: 20, color: '#666' }
});