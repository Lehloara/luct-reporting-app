import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet, ActivityIndicator, Keyboard, Platform, TextInput } from 'react-native'; // ✅ Added TextInput
import { Picker } from '@react-native-picker/picker';
import { collection, addDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import FormField from '../../components/FormField';

const FACULTIES = [
  { label: 'Select Faculty', value: '' }, { label: 'FICT', value: 'FICT' }, { label: 'FABE', value: 'FABE' },
  { label: 'FBMG', value: 'FBMG' }, { label: 'FCMB', value: 'FCMB' }, { label: 'FDI', value: 'FDI' }
];

export default function LecturerReportForm() {
  const [form, setForm] = useState({
    faculty: '', className: '', week: '', date: '', courseName: '', courseCode: '',
    actualStudents: '', venue: '', scheduledTime: '', topic: '', learningOutcomes: '', recommendations: ''
  });
  const [totalStudents, setTotalStudents] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (!form.courseCode || form.courseCode.length < 3) {
      setTotalStudents('');
      return;
    }

    const timeoutId = setTimeout(async () => {
      const codeToSearch = form.courseCode.toUpperCase().trim();
      setFetching(true);
      try {
        const snap = await getDoc(doc(db, 'courses', codeToSearch));
        
        if (snap.exists()) {
          const c = snap.data();
          console.log('✅ Course Found:', c);
          setTotalStudents(String(c.totalStudents || ''));
          
          setForm(prev => ({
            ...prev,
            courseName: prev.courseName || c.name || '',
            faculty: prev.faculty || c.faculty || '',
            className: prev.className || c.classCode || '',
            venue: prev.venue || c.venue || '',
            scheduledTime: prev.scheduledTime || c.scheduledTime || ''
          }));
        } else { 
          console.log(' Course Not Found');
          setTotalStudents(''); 
        }
      } catch (err) { 
        console.error('Fetch err:', err); 
      } finally { 
        setFetching(false); 
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [form.courseCode]);

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    Keyboard.dismiss();
    const required = ['faculty', 'className', 'week', 'date', 'courseCode', 'actualStudents', 'venue', 'scheduledTime', 'topic'];
    const missing = required.filter(f => !form[f].trim());
    if (missing.length > 0) return Alert.alert('Validation Error', `Missing: ${missing.join(', ')}`);
    if (isNaN(Number(form.actualStudents))) return Alert.alert('Validation Error', 'Actual students must be a number');

    setLoading(true);
    try {
      const user = auth.currentUser;
      const userSnap = await getDoc(doc(db, 'users', user.uid));
      const lecturerName = userSnap.exists() ? userSnap.data().name : user.email;

      await addDoc(collection(db, 'reports'), {
        ...form,
        courseCode: form.courseCode.toUpperCase(),
        classCode: form.className.toUpperCase(), 
        actualStudents: Number(form.actualStudents),
        totalStudents: Number(totalStudents) || 0,
        lecturerId: user.uid,
        lecturerName,
        status: 'submitted',
        createdAt: serverTimestamp()
      });
      Alert.alert('Success', 'Report submitted!');
      setForm({ faculty: '', className: '', week: '', date: '', courseName: '', courseCode: '', actualStudents: '', venue: '', scheduledTime: '', topic: '', learningOutcomes: '', recommendations: '' });
      setTotalStudents('');
    } catch (err) { 
      Alert.alert('Error', err.message); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.header}>Lecturer Reporting Form</Text>

      <View style={styles.inputGroup}><Text style={styles.label}>Faculty</Text>
        <View style={styles.pickerContainer}><Picker selectedValue={form.faculty} onValueChange={v => handleChange('faculty', v)} style={styles.picker}>{FACULTIES.map(f => <Picker.Item key={f.value} label={f.label} value={f.value} color={f.value ? '#333' : '#999'} />)}</Picker></View>
      </View>

      <FormField label="Class Name" value={form.className} onChangeText={v => handleChange('className', v)} placeholder="Auto-filled from Course" editable={!form.className} />
      <FormField label="Week" value={form.week} onChangeText={v => handleChange('week', v)} placeholder="e.g., Week 5" />
      <FormField label="Date" value={form.date} onChangeText={v => handleChange('date', v)} placeholder="YYYY-MM-DD" />
      <FormField label="Course Name" value={form.courseName} onChangeText={v => handleChange('courseName', v)} placeholder="Auto-filled" editable={!form.courseName} />
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Course Code (Triggers Auto-fill)</Text>
        <TextInput 
          style={styles.input} 
          placeholder="e.g., BIMP3210" 
          value={form.courseCode} 
          onChangeText={v => handleChange('courseCode', v.toUpperCase())} 
          autoCapitalize="characters" 
        />
        {fetching && <ActivityIndicator size="small" color="#007AFF" style={{ marginTop: 5 }} />}
      </View>

      <View style={styles.autoField}>
        <Text style={styles.label}>Total Registered Students</Text>
        <Text style={styles.autoText}>{totalStudents || 'Enter valid code to fetch'}</Text>
      </View>

      <FormField label="Students Present" value={form.actualStudents} onChangeText={v => handleChange('actualStudents', v)} type="number" placeholder="45" />
      <FormField label="Venue" value={form.venue} onChangeText={v => handleChange('venue', v)} placeholder="Auto-filled" editable={!form.venue} />
      <FormField label="Scheduled Time" value={form.scheduledTime} onChangeText={v => handleChange('scheduledTime', v)} placeholder="Auto-filled" editable={!form.scheduledTime} />
      <FormField label="Topic Taught" value={form.topic} onChangeText={v => handleChange('topic', v)} multiline placeholder="Brief topic description" />
      <FormField label="Learning Outcomes" value={form.learningOutcomes} onChangeText={v => handleChange('learningOutcomes', v)} multiline numberOfLines={3} placeholder="List outcomes" />
      <FormField label="Recommendations" value={form.recommendations} onChangeText={v => handleChange('recommendations', v)} multiline numberOfLines={3} placeholder="Feedback/suggestions" />

      <TouchableOpacity style={[styles.submitBtn, loading && styles.btnDisabled]} onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Submit Report</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#f5f7fa', paddingBottom: 40 }, 
  header: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, color: '#1a1a1a' },
  inputGroup: { marginBottom: 16 }, 
  label: { fontWeight: '600', marginBottom: 6, color: '#333', fontSize: 14 },
  input: { backgroundColor: '#fff', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#e0e0e0', fontSize: 15 },
  pickerContainer: { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#e0e0e0', overflow: 'hidden' }, 
  picker: { height: Platform.OS === 'ios' ? 50 : 55, width: '100%' },
  autoField: { backgroundColor: '#e8f5e9', padding: 12, borderRadius: 10, marginBottom: 16, borderWidth: 1, borderColor: '#4caf50' }, 
  autoText: { fontSize: 16, fontWeight: 'bold', color: '#2e7d32' },
  submitBtn: { backgroundColor: '#007AFF', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 20, shadowColor: '#007AFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 3 },
  btnDisabled: { backgroundColor: '#a0c4ff' }, 
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});