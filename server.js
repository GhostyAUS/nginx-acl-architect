
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.static(path.join(__dirname, 'dist')));
app.use(express.static(path.join(__dirname, 'html'), { 
  setHeaders: (res, path) => {
    // Prevent PHP files from being served as static content
    if (path.endsWith('.php')) {
      res.status(403).send('Access Denied');
    }
  }
}));

// Block direct access to PHP files
app.get('*.php', (req, res) => {
  res.status(403).send('Direct access to PHP files is not allowed');
});

// Serve index.html for all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
