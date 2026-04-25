import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ReportCard({ report }) {
  const attendanceRate = report.totalStudents > 0 
    ? Math.round((report.actualStudents / report.totalStudents) * 100) 
    : 0;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.code}>{report.courseCode || 'N/A'}</Text>
        <Text style={styles.date}>{report.date || 'N/A'}</Text>
      </View>
      <Text style={styles.topic} numberOfLines={2}>{report.topic || 'No topic provided'}</Text>
      <View style={styles.details}>
        <Text style={styles.detail}>👤 {report.lecturerName || 'Unknown'}</Text>
        <Text style={styles.detail}>📍 {report.venue || 'N/A'}</Text>
        <Text style={[styles.detail, attendanceRate >= 80 ? styles.good : styles.warn]}>
          📊 {report.actualStudents}/{report.totalStudents} ({attendanceRate}%)
        </Text>
      </View>
      {report.prlFeedback && (
        <View style={styles.feedback}>
          <Text style={styles.feedbackLabel}>PRL Feedback:</Text>
          <Text style={styles.feedbackText}>{report.prlFeedback}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginHorizontal: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  code: { fontWeight: 'bold', fontSize: 16, color: '#007AFF' },
  date: { color: '#666', fontSize: 14 },
  topic: { fontSize: 14, color: '#333', marginBottom: 10, lineHeight: 20 },
  details: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  detail: { fontSize: 13, color: '#555', fontWeight: '500' },
  good: { color: '#2e7d32' },
  warn: { color: '#c62828' },
  feedback: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  feedbackLabel: { fontWeight: '600', fontSize: 12, color: '#666', marginBottom: 4 },
  feedbackText: { fontSize: 13, color: '#333', fontStyle: 'italic' }
});