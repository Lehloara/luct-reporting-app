require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const errorHandler = require('./middleware/errorHandler');
const exportRoutes = require('./routes/export'); 

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));


app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'LUCT Reporting Backend is running' });
});


app.use('/api/reports', exportRoutes);


app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});