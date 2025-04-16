
import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;
const NGINX_CONF_PATH = '/opt/proxy/nginx.conf';  // Consistent path across all components

// Middleware to parse text
app.use(express.text());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// API endpoint to get the nginx configuration
app.get('/api/nginx/config', async (req, res) => {
  try {
    const data = await fs.readFile(NGINX_CONF_PATH, 'utf8');
    res.send(data);
  } catch (error) {
    console.error('Error reading nginx config:', error);
    res.status(500).send('Error reading nginx configuration file');
  }
});

// API endpoint to save the nginx configuration
app.post('/api/nginx/config', async (req, res) => {
  try {
    const configData = req.body;
    
    // First, create a backup of the current configuration
    const backupPath = `${NGINX_CONF_PATH}.bak.${Date.now()}`;
    await fs.copyFile(NGINX_CONF_PATH, backupPath);
    
    // Save the new configuration
    await fs.writeFile(NGINX_CONF_PATH, configData);
    
    // Test if the new configuration is valid
    exec('docker exec nginx-forward-proxy nginx -t', (error, stdout, stderr) => {
      if (error) {
        console.error('Nginx configuration test failed:', stderr);
        
        // If test fails, revert to backup
        fs.copyFile(backupPath, NGINX_CONF_PATH).then(() => {
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

// Simplified route handling - serve index.html for all non-API routes
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api/')) {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
