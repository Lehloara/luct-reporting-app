const express = require('express');
const { admin } = require('../config/firebase');
const ExcelJS = require('exceljs');
const router = express.Router();

router.get('/excel', async (req, res) => {
  try {
    console.log(' Excel export requested...');
    const snapshot = await admin.firestore().collection('reports').orderBy('createdAt', 'desc').get();
    
    if (snapshot.empty) {
      return res.status(404).json({ success: false, error: 'No reports found' });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('LUCT Reports');

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 20 },
      { header: 'Faculty', key: 'faculty', width: 10 },
      { header: 'Course', key: 'courseCode', width: 12 },
      { header: 'Lecturer', key: 'lecturerName', width: 20 },
      { header: 'Date', key: 'date', width: 12 },
      { header: 'Week', key: 'week', width: 8 },
      { header: 'Venue', key: 'venue', width: 8 },
      { header: 'Topic', key: 'topic', width: 30 },
      { header: 'Present', key: 'actualStudents', width: 8 },
      { header: 'Total', key: 'totalStudents', width: 6 },
      { header: 'Feedback', key: 'prlFeedback', width: 25 }
    ];

    snapshot.forEach(doc => {
      const d = doc.data();
      worksheet.addRow({
        id: doc.id,
        faculty: d.faculty || '',
        courseCode: d.courseCode || '',
        lecturerName: d.lecturerName || '',
        date: d.date || '',
        week: d.week || '',
        venue: d.venue || '',
        topic: d.topic || '',
        actualStudents: d.actualStudents || 0,
        totalStudents: d.totalStudents || 0,
        prlFeedback: d.prlFeedback || ''
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader('Content-Disposition', 'attachment; filename=luct_reports.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    console.error(' Export Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;