
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.static(path.join(__dirname, 'dist')));
app.use(express.json());
app.use(express.text());

// Serve static files with special handling for PHP
app.use(express.static(path.join(__dirname, 'html'), { 
  setHeaders: (res, path) => {
    // Prevent PHP files from being served as static content
    if (path.endsWith('.php')) {
      res.status(403).send('Access Denied');
    }
  }
}));

// API endpoints for NGINX configuration handling
app.get('/api/nginx/config', (req, res) => {
  const configPath = req.query.path || '/opt/proxy/nginx.conf';
  
  try {
    if (fs.existsSync(configPath)) {
      const configContent = fs.readFileSync(configPath, 'utf8');
      res.json({
        success: true,
        data: configContent
      });
    } else {
      // For development, return a sample config if file doesn't exist
      res.json({
        success: true,
        data: `# Sample NGINX configuration
# This is a placeholder since the actual config at ${configPath} couldn't be found
http {
  server {
    listen 80;
    server_name example.com;
    
    location / {
      root /usr/share/nginx/html;
      index index.html;
    }
  }
}
`
      });
    }
  } catch (error) {
    console.error(`Error reading config from ${configPath}:`, error);
    res.status(500).json({
      success: false,
      message: `Failed to read configuration: ${error.message}`
    });
  }
});

app.post('/api/nginx/config', (req, res) => {
  const configPath = req.query.path || '/opt/proxy/nginx.conf';
  const configContent = req.body;
  
  if (!configContent) {
    return res.status(400).json({
      success: false,
      message: 'No configuration content provided'
    });
  }
  
  try {
    // Create backup if file exists
    if (fs.existsSync(configPath)) {
      const backupPath = `${configPath}.bak.${Date.now()}`;
      fs.copyFileSync(configPath, backupPath);
    }
    
    // Ensure directory exists
    const dirPath = path.dirname(configPath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    // Write new config
    fs.writeFileSync(configPath, configContent);
    
    res.json({
      success: true,
      message: 'Configuration saved successfully'
    });
  } catch (error) {
    console.error(`Error writing config to ${configPath}:`, error);
    res.status(500).json({
      success: false,
      message: `Failed to save configuration: ${error.message}`
    });
  }
});

// List available config files
app.get('/api/nginx/files', (req, res) => {
  const configLocations = [
    '/opt/proxy/nginx.conf',
    '/opt/proxy/conf.d',
    '/etc/nginx/conf.d',
    '/usr/local/nginx/conf/nginx.conf'
  ];
  
  res.json({
    success: true,
    data: configLocations
  });
});

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
