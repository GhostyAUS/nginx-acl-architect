
import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;
const NGINX_CONF_PATH = '/opt/proxy/nginx.conf';

// Middleware
app.use(express.text());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));
app.use(express.static(path.join(__dirname, 'html'), { 
  setHeaders: (res, path) => {
    // Prevent PHP files from being served as static content
    if (path.endsWith('.php')) {
      res.set('Content-Type', 'text/plain');
    }
  }
}));

// API endpoint to get the nginx configuration
app.get('/api/nginx/config', async (req, res) => {
  try {
    const configPath = req.query.path || NGINX_CONF_PATH;
    console.log(`Reading configuration from: ${configPath}`);
    
    const data = await fs.readFile(configPath, 'utf8');
    res.set('Content-Type', 'text/plain');
    res.send(data);
  } catch (error) {
    console.error('Error reading nginx config:', error);
    res.status(500).send(`Error reading nginx configuration file: ${error.message}`);
  }
});

// API endpoint to save the nginx configuration
app.post('/api/nginx/config', async (req, res) => {
  try {
    const configData = req.body;
    const configPath = req.query.path || NGINX_CONF_PATH;
    console.log(`Saving configuration to: ${configPath}`);
    
    // First, create a backup of the current configuration
    const backupPath = `${configPath}.bak.${Date.now()}`;
    await fs.copyFile(configPath, backupPath);
    console.log(`Created backup at: ${backupPath}`);
    
    // Save the new configuration
    await fs.writeFile(configPath, configData);
    console.log('Configuration saved successfully');
    
    // Test if the new configuration is valid
    exec('docker exec nginx-forward-proxy nginx -t', (error, stdout, stderr) => {
      if (error) {
        console.error('Nginx configuration test failed:', stderr);
        
        // If test fails, revert to backup
        fs.copyFile(backupPath, configPath).then(() => {
          console.log('Reverted to backup configuration');
        });
        
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid nginx configuration. Changes were reverted.' 
        });
      }
      
      // If test passes, reload nginx
      exec('docker exec nginx-forward-proxy nginx -s reload', (reloadError) => {
        if (reloadError) {
          console.error('Failed to reload nginx:', reloadError);
          return res.status(500).json({ 
            success: false, 
            message: 'Configuration saved but failed to reload nginx' 
          });
        }
        
        res.json({ success: true, message: 'Configuration saved and nginx reloaded' });
      });
    });
  } catch (error) {
    console.error('Error saving nginx config:', error);
    res.status(500).json({ 
      success: false, 
      message: `Error saving configuration: ${error.message}` 
    });
  }
});

// Block direct access to PHP files
app.get('*.php', (req, res) => {
  res.status(403).send('Direct access to PHP files is not allowed');
});

// Serve index.html for all non-API routes
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api/')) {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`NGINX configuration file path: ${NGINX_CONF_PATH}`);
});
