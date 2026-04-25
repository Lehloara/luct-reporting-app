const admin = require('firebase-admin');
require('dotenv').config();

let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  } catch (error) {
    console.error("❌ Error parsing Firebase Key:", error);
    throw new Error("Invalid Firebase Service Account Key format");
  }
} else {
  
  const path = require('path');
  serviceAccount = require(path.join(__dirname, '../../serviceAccountKey.json'));
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'luct-reporting' 
  });
  console.log("✅ Firebase Admin Initialized");
}

module.exports = { admin };