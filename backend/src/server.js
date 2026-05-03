require('dotenv').config();
const express = require('express');
const bootstrap = require('./clickhouse/bootstrap');
const logRoutes = require('./routes/log');
const searchRoutes = require('./routes/search');
const metaRoutes = require('./routes/meta');
const statsRoutes = require('./routes/stats');

const app = express();
const PORT = process.env.PORT || 3050;

// Middleware
app.use(express.json());

// CORS - Dashboard'dan gelen istekleri kabul et
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Routes
app.use('/', logRoutes);
app.use('/', searchRoutes);
app.use('/', metaRoutes);
app.use('/', statsRoutes);

app.get("/health", (req, res) => {
  res.json({ message: "Server is running", status: "active" });
});

// Start server
async function startServer() {
  await bootstrap();
  
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

startServer();
