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


app.get("/", (req, res) => {
  res.json({ status: "ok", message: "API is live" });
});

app.use('/api/reports', exportRoutes);


app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Backend running on port ${PORT}`);
});