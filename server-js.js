
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const uri="mongodb+srv://hsainiamariem:azerty1234@cluster1.4gxin.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1";
const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.static('public'));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Database Connection
mongoose.connect(uri)
.then(() => console.log('MongoDB Connected'))
.catch(err => console.error('MongoDB Connection Error:', err));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/auth', require('./src/routes/auth-routes.js'));
app.use('/files', require('./src/routes/file-routes.js'));

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
