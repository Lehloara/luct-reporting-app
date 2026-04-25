import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { Picker } from '@react-native-picker/picker';

export default function LecturerAttendanceScreen() {
  const { user, registerSub } = useAuth();
  const [classes, setClasses] = useState([]);
  const [selectedClassCode, setSelectedClassCode] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  // 1. Load all classes assigned to this lecturer by the PL
  useEffect(() => {
    const q = query(collection(db, 'courses'), where('assignedLecturerId', '==', user.uid));
    const unsub = onSnapshot(q, (snap) => {
      setClasses(snap.docs.map(d => d.data()));
    });
    registerSub(unsub);
    return unsub;
  }, [user, registerSub]);

  // 2. When a class is selected, load all students registered in that classCode
  useEffect(() => {
    if (!selectedClassCode) { 
      setStudents([]); 
      return; 
    }
    
    setLoading(true);
    const q = query(
      collection(db, 'users'), 
      where('role', '==', 'student'), 
      where('classCode', '==', selectedClassCode)
    );
    
    const unsub = onSnapshot(q, (snap) => {
      setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (error) => {
      if (error.code !== 'permission-denied') console.error(error);
      setLoading(false);
    });
    
    registerSub(unsub);
    return unsub;
  }, [selectedClassCode, registerSub]);

  const markAttendance = async (studentId, name, status) => {
    try {
      await addDoc(collection(db, 'attendance'), {
        studentId,
        studentName: name,
        classCode: selectedClassCode,
        status, // 'present' or 'absent'
        markedBy: user.uid,
        date: new Date().toISOString(),
        createdAt: serverTimestamp()
      });
      Alert.alert('Success', `${name} marked as ${status}`);
    } catch (err) { 
      Alert.alert('Error', err.message); 
    }
  };

  if (classes.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>No classes assigned to you by the PL yet.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Student Attendance</Text>
      
      {/* Class Selector */}
      <View style={styles.pickerWrap}>
        <Text style={styles.label}>Select Class to Mark Attendance</Text>
        <View style={styles.pickerContainer}>
          <Picker 
            selectedValue={selectedClassCode} 
            onValueChange={(itemValue) => setSelectedClassCode(itemValue)} 
            style={styles.picker}
          >
            <Picker.Item label="Choose a class..." value="" />
            {classes.map(c => (
              <Picker.Item 
                key={c.id} 
                label={`${c.courseCode} - ${c.classCode}`} 
                value={c.classCode} 
              />
            ))}
          </Picker>
        </View>
      </View>

      {/* Student List */}
      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />
      ) : !selectedClassCode ? (
        <Text style={styles.hint}>Select a class above to load students</Text>
      ) : (
        <FlatList 
          data={students} 
          keyExtractor={item => item.id} 
          contentContainerStyle={{ padding: 12 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.email}>{item.email}</Text>
              <View style={styles.btnGroup}>
                <TouchableOpacity 
                  style={[styles.btn, { backgroundColor: '#e8f5e9' }]} 
                  onPress={() => markAttendance(item.id, item.name, 'present')}
                >
                  <Text style={styles.btnText}> Present</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.btn, { backgroundColor: '#ffebee' }]} 
                  onPress={() => markAttendance(item.id, item.name, 'absent')}
                >
                  <Text style={styles.btnText}> Absent</Text>
                </TouchableOpacity>
              </View>
            </View>
          )} 
          ListEmptyComponent={<Text style={styles.empty}>No students registered in {selectedClassCode}.</Text>} 
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 20, fontWeight: 'bold', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  pickerWrap: { padding: 16, backgroundColor: '#fff', marginBottom: 8 },
  label: { fontWeight: '600', marginBottom: 6, color: '#333' },
  pickerContainer: { backgroundColor: '#f8f9fa', borderRadius: 8, borderWidth: 1, borderColor: '#ddd', overflow: 'hidden' },
  picker: { height: 50, width: '100%' },
  hint: { textAlign: 'center', marginTop: 40, color: '#666' },
  card: { backgroundColor: '#fff', padding: 14, borderRadius: 10, marginBottom: 10, elevation: 2 },
  name: { fontWeight: '600', fontSize: 15, marginBottom: 2 },
  email: { fontSize: 12, color: '#666', marginBottom: 10 },
  btnGroup: { flexDirection: 'row', gap: 10 },
  btn: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
  btnText: { fontWeight: '600', fontSize: 13, color: '#333' },
  empty: { textAlign: 'center', marginTop: 40, color: '#666' }
});