
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Create temporary directory for uploaded files
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

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

// Explicitly serve the favicon from public directory
app.get('/favicon.ico', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'favicon.ico'));
});

// Serve uploaded files
app.use('/uploads', express.static(uploadDir));

// API endpoints for NGINX configuration handling
app.get('/api/nginx/config', (req, res) => {
  let configPath = req.query.path || '/opt/proxy/nginx.conf';
  
  // Handle the case where the path is [object PointerEvent] or invalid
  if (configPath === '[object PointerEvent]' || typeof configPath !== 'string') {
    configPath = '/opt/proxy/nginx.conf';
  }
  
  console.log(`Server: Reading config from: ${configPath}`);
  
  try {
    // First check if it's an uploaded file (no absolute path)
    if (!configPath.startsWith('/')) {
      const uploadedFilePath = path.join(uploadDir, configPath);
      if (fs.existsSync(uploadedFilePath)) {
        const configContent = fs.readFileSync(uploadedFilePath, 'utf8');
        res.json({
          success: true,
          data: configContent
        });
        return;
      }
    }
    
    // Then check system paths
    if (fs.existsSync(configPath)) {
      const configContent = fs.readFileSync(configPath, 'utf8');
      res.json({
        success: true,
        data: configContent
      });
    } else {
      // For development, return a sample config if file doesn't exist
      console.log(`Server: File not found, returning sample config for: ${configPath}`);
      res.json({
        success: true,
        data: `# Sample NGINX configuration
# This is a placeholder since the actual config at ${configPath} couldn't be found
http {
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
   
    log_format denied '$remote_addr - [$time_local] "$request" '
                      '$status "$http_user_agent" "$http_referer" '
                      'Host: "$host" URI: "$request_uri" '
                      'Client: "$remote_addr" '
                      'Reason: "$deny_reason"';
	   
    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log info;
    access_log /var/log/nginx/denied.log denied if=$deny_log;

    # IP WHITELIST
    geo $whitelist {
        default 0;
        192.168.1.0/24 1;  # Internal network
        172.24.20.0/23 1;  # Example subnet
    }
    
    # URL WHITELIST
    map $host $is_allowed_url {
        default 0;
        "*.example.com" 1;
        "api.microsoft.com" 1;
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
  let configPath = req.query.path || '/opt/proxy/nginx.conf';
  
  // Handle the case where the path is [object PointerEvent] or invalid
  if (configPath === '[object PointerEvent]' || typeof configPath !== 'string') {
    configPath = '/opt/proxy/nginx.conf';
  }
  
  const configContent = req.body;
  
  if (!configContent) {
    return res.status(400).json({
      success: false,
      message: 'No configuration content provided'
    });
  }
  
  console.log(`Server: Writing config to: ${configPath}`);
  
  try {
    // Handle uploaded files (no absolute path)
    if (!configPath.startsWith('/')) {
      const uploadedFilePath = path.join(uploadDir, configPath);
      
      // Create backup if file exists
      if (fs.existsSync(uploadedFilePath)) {
        const backupPath = `${uploadedFilePath}.bak.${Date.now()}`;
        fs.copyFileSync(uploadedFilePath, backupPath);
      }
      
      // Write new config to uploads directory
      fs.writeFileSync(uploadedFilePath, configContent);
      
      res.json({
        success: true,
        message: 'Configuration saved successfully'
      });
      return;
    }
    
    // Handle system paths
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
  
  // Add any uploaded files
  try {
    const uploadedFiles = fs.readdirSync(uploadDir);
    const uploadedFilePaths = uploadedFiles.filter(file => 
      !file.endsWith('.bak') && !file.startsWith('.')
    );
    
    configLocations.push(...uploadedFilePaths);
  } catch (error) {
    console.error('Error reading upload directory:', error);
  }
  
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

// Configure server to listen on all interfaces
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port} and listening on all interfaces`);
});
