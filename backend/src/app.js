'use strict';
const express = require('express');
const cors = require('cors');
const path = require('path');
const errorHandler = require('./middlewares/errorHandler');
const routes = require('./routes');

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  'https://missoes-semad.vercel.app',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin)) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Interceptor: convert Prisma Decimal to Number
const originalJson = express.response.json;
express.response.json = function (obj) {
  const converted = JSON.parse(
    JSON.stringify(obj, (key, value) => {
      if (value !== null && typeof value === 'object' && value.constructor && value.constructor.name === 'Decimal') {
        return parseFloat(value.toString());
      }
      return value;
    })
  );
  return originalJson.call(this, converted);
};

app.use('/api', routes);

app.use(errorHandler);

module.exports = app;
