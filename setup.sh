
#!/bin/bash

# Create base directory
mkdir -p /opt/proxy
cd /opt/proxy

# Create necessary directories
mkdir -p logs
mkdir -p conf.d
mkdir -p ssl
mkdir -p ../html

# Set proper permissions
chmod 755 logs conf.d ssl

# Create initial nginx.conf if it doesn't exist
if [ ! -f nginx.conf ]; then
  cat > nginx.conf <<'EOF'
worker_processes auto;
daemon off;

events {
    worker_connections 1024;
}

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


#==============================================================================
    #IP WHITELIST
    # Use geo module to determine if incoming IP is on whitelist
    # use CIDR notation and the below format, also add the server name as a reference
    geo $whitelist {
        default 0;
        # Allow Individual IPs below:
		172.24.20.12/32 1;  #MOTPERWU01 wsus
		172.24.20.16/32 1;  #motperap04 rhel repo
     		172.28.33.2/32  1;  # TestWin10-01 defender test wonmunna
		172.28.36.4/32  1;  #TestSvr2022-01 defender test wonmunna
		172.28.36.5/32  1;  #TestLinux-01 defender test wonmunna
        
        # Allow Subnets below:
	172.24.20.0/23 1;
    }
    # ------------------------------------
    # URL WHITELIST
    # url filtering for external addresses - default-deny approach. See Confluence article for more info
       
    map $host $is_allowed_url {
        default 0;  # Block by default - deny unless explicitly allowed
    
        # Allow specific domains below:"   
        "~^.*\.microsoft\.com$"          1;	#motperwu01
	"~^.*\.windowsupdate\.com$"      1;	#motperwu01
        "subscription.rhn.redhat.com"    1;	#motperap04
       "subscription.rhsm.redhat.com"    1;	#motperap04
        "cdn.redhat.com"	 	 1;	#motperap04
 	"~^.*\.akamaiedge\.net$"	 1;	#motperap04
	"~^.*\.akamaitechnologies\.com$" 1;	#motperap04
	"~^.*\.windows\.net$"            1;	#defender EDR

    
    }
# END OF CODE TO EDIT, DO NOT EDIT BELOW.
# ==============================================================================

    # Variables for logging denied requests
    map $status $deny_log {
        ~^4 1;  # Log all 4xx responses (including 403 denied requests)
        default 0;
    }
    
    # Map to set denial reason
    map "$whitelist:$is_allowed_url" $deny_reason {
        "0:0" "IP not whitelisted and URL not allowed";
        "0:1" "IP not whitelisted";
        "1:0" "URL not in allowed list";
        default "";
    }

    server {
        listen 8080;
		# External DNS server/s
        resolver 8.8.8.8 1.1.1.1 ipv6=off;

        # Use the geo variable for access control
        if ($whitelist = 0) {
            set $deny_reason "IP not whitelisted: $remote_addr";
	    return 403 "Access denied: Your IP is not whitelisted.";
        }

        # Block disallowed URLs
        if ($is_allowed_url = 0) {
            set $deny_reason "URL not in allowed list: $host";
	    return 403 "Access denied: This URL is not in the allowed list.";
        }

        # HTTPS CONNECT method handling
        proxy_connect;
        proxy_connect_allow all;  # Allow all ports for HTTPS connections
        proxy_connect_connect_timeout 10s;
        proxy_connect_read_timeout 60s;
        proxy_connect_send_timeout 60s;

        # Security headers
        proxy_hide_header Upgrade;
        proxy_hide_header X-Powered-By;
        add_header Content-Security-Policy "upgrade-insecure-requests";
        add_header X-Frame-Options "SAMEORIGIN";
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Cache-Control "no-transform" always;
        add_header Referrer-Policy no-referrer always;
        add_header X-Robots-Tag none;

        # HTTP forwarding
        location / {
            # Check whitelist again at location level
            if ($whitelist = 0) {
                set $deny_reason "IP not whitelisted at location level: $remote_addr";
				return 403 "Access denied: Your IP is not whitelisted.";
            }

            # Check URL filtering again at location level
            if ($is_allowed_url = 0) {
                set $deny_reason "URL not in allowed list at location level: $host";
				return 403 "Access denied: This URL is not in the allowed list.";
            }

            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header Connection "";  # Enable keepalives
            proxy_pass $scheme://$host$request_uri;  # Include $request_uri

            # Additional useful headers
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # Timeouts for better reliability
            proxy_connect_timeout 10s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
			
      } #End of Location Block
  } #End of Server Block
} #End of HTTP Block
EOF
  echo "Created initial nginx.conf in /opt/proxy"
fi

# Create simple nginx.conf file for our web application
cat > ../html/nginx.conf <<EOF
server {
    listen 80;
    server_name localhost;
    
    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }
    
    location /api {
        if (\$request_method = 'GET') {
            add_header 'Access-Control-Allow-Origin' '*';
            add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range';
            add_header 'Access-Control-Expose-Headers' 'Content-Length,Content-Range';
        }
        
        if (\$request_method = 'POST') {
            add_header 'Access-Control-Allow-Origin' '*';
            add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range';
            add_header 'Access-Control-Expose-Headers' 'Content-Length,Content-Range';
        }
        
        try_files \$uri \$uri/ /api/\$uri;
    }
    
    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
EOF

# Copy basic html app files
mkdir -p ../html
cat > ../html/index.html <<EOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NGINX ACL Architect</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="app-container">
        <header class="app-header">
            <div class="logo">
                <svg viewBox="0 0 24 24" width="24" height="24" class="icon icon-shield">
                    <path fill="currentColor" d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 4c1.86 0 3.41 1.28 3.86 3H8.14c.45-1.72 2-3 3.86-3zm0 14c-3.75 0-6.92-2.23-8.33-5.43.27.28.56.54.87.78C6.32 16.1 9.06 17 12 17s5.68-.9 7.46-2.65c.31-.24.6-.5.87-.78C18.92 16.77 15.75 19 12 19z"/>
                </svg>
                <h1>NGINX ACL Architect</h1>
            </div>
            <div class="header-actions">
                <button class="button button-outline">Documentation</button>
            </div>
        </header>
        
        <div class="main-container">
            <nav class="app-navbar">
                <ul class="nav-list">
                    <li class="nav-item active" data-route="dashboard">
                        <a href="#dashboard">
                            <svg viewBox="0 0 24 24" width="24" height="24" class="icon">
                                <path fill="currentColor" d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                            </svg>
                            <span class="nav-label">Dashboard</span>
                        </a>
                    </li>
                    <li class="nav-item" data-route="ip-acls">
                        <a href="#ip-acls">
                            <svg viewBox="0 0 24 24" width="24" height="24" class="icon">
                                <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                            </svg>
                            <span class="nav-label">IP ACLs</span>
                        </a>
                    </li>
                    <li class="nav-item" data-route="url-acls">
                        <a href="#url-acls">
                            <svg viewBox="0 0 24 24" width="24" height="24" class="icon">
                                <path fill="currentColor" d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
                            </svg>
                            <span class="nav-label">URL ACLs</span>
                        </a>
                    </li>
                    <li class="nav-item" data-route="combined-acls">
                        <a href="#combined-acls">
                            <svg viewBox="0 0 24 24" width="24" height="24" class="icon">
                                <path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10H7v-2h10v2zm0-4H7V7h10v2z"/>
                            </svg>
                            <span class="nav-label">Combined ACLs</span>
                        </a>
                    </li>
                    <li class="nav-item" data-route="settings">
                        <a href="#settings">
                            <svg viewBox="0 0 24 24" width="24" height="24" class="icon">
                                <path fill="currentColor" d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
                            </svg>
                            <span class="nav-label">Settings</span>
                        </a>
                    </li>
                </ul>
            </nav>
            
            <div id="content" class="main-content">
                <!-- Content will be loaded here by JavaScript -->
            </div>
        </div>
    </div>
    
    <div id="toaster-container" class="toaster-container"></div>
    
    <script src="app.js"></script>
</body>
</html>
EOF

# Create CSS file
cat > ../html/styles.css <<EOF
:root {
  --primary-color: #3b82f6;
  --primary-hover: #2563eb;
  --secondary-color: #64748b;
  --light-bg: #f8fafc;
  --dark-text: #1e293b;
  --medium-text: #475569;
  --light-text: #94a3b8;
  --border-color: #e2e8f0;
  --error-color: #ef4444;
  --success-color: #10b981;
  --warning-color: #f59e0b;
  --card-bg: #ffffff;
  --hover-bg: #f1f5f9;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  font-size: 16px;
  line-height: 1.5;
  color: var(--dark-text);
  background-color: var(--light-bg);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.5rem;
  background-color: var(--card-bg);
  border-bottom: 1px solid var(--border-color);
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo h1 {
  font-size: 1.25rem;
  font-weight: 600;
}

.icon {
  color: var(--primary-color);
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.main-container {
  display: flex;
  flex: 1;
}

.app-navbar {
  width: 250px;
  background-color: var(--card-bg);
  border-right: 1px solid var(--border-color);
  height: calc(100vh - 57px);
}

.nav-list {
  list-style: none;
  padding: 1rem 0;
}

.nav-item a {
  display: flex;
  align-items: center;
  padding: 0.75rem 1.25rem;
  color: var(--medium-text);
  text-decoration: none;
  transition: all 0.2s ease;
}

.nav-item a:hover {
  background-color: var(--hover-bg);
  color: var(--primary-color);
}

.nav-item.active a {
  background-color: var(--hover-bg);
  color: var(--primary-color);
  font-weight: 500;
}

.nav-item .icon {
  margin-right: 0.75rem;
}

.main-content {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
}

.page-title-container {
  margin-bottom: 1.5rem;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--dark-text);
}

.page-subtitle {
  color: var(--medium-text);
  margin-top: 0.25rem;
}

.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.5;
  color: #fff;
  background-color: var(--primary-color);
  border: 1px solid transparent;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.15s ease-in-out;
}

.button:hover {
  background-color: var(--primary-hover);
}

.button-outline {
  color: var(--primary-color);
  background-color: transparent;
  border-color: var(--primary-color);
}

.button-outline:hover {
  color: #fff;
  background-color: var(--primary-color);
}

.button-secondary {
  background-color: var(--secondary-color);
}

.button-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}

.button .icon {
  margin-right: 0.5rem;
}

.card {
  background-color: var(--card-bg);
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.25rem;
  margin-bottom: 1.5rem;
}

.card-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.input, .textarea, .select {
  width: 100%;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--dark-text);
  background-color: #fff;
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  transition: border-color 0.15s ease-in-out;
}

.input:focus, .textarea:focus, .select:focus {
  outline: none;
  border-color: var(--primary-color);
}

.textarea {
  min-height: 100px;
  resize: vertical;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.config-editor {
  font-family: monospace;
  width: 100%;
  min-height: 400px;
  padding: 0.75rem;
  font-size: 0.875rem;
  line-height: 1.6;
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  background-color: #f8f9fa;
}

.stats-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background-color: var(--card-bg);
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.stat-icon {
  font-size: 2rem;
  color: var(--primary-color);
  margin-bottom: 1rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--dark-text);
  line-height: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--medium-text);
  margin-top: 0.5rem;
}

.acl-rule, .acl-entry {
  background-color: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.acl-rule-text {
  font-family: monospace;
  font-size: 0.875rem;
}

.toaster-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 9999;
}

.toast {
  padding: 0.75rem 1.25rem;
  margin-bottom: 0.75rem;
  border-radius: 0.375rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  color: white;
  transform: translateX(110%);
  transition: transform 0.3s ease;
}

.toast.show {
  transform: translateX(0);
}

.toast-success {
  background-color: var(--success-color);
}

.toast-error {
  background-color: var(--error-color);
}

.toast-warning {
  background-color: var(--warning-color);
}

.toast-info {
  background-color: var(--primary-color);
}

.settings-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}

.not-found-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.not-found-content h1 {
  font-size: 6rem;
  font-weight: 700;
  color: var(--light-text);
  line-height: 1;
}

.not-found-content p {
  font-size: 1.25rem;
  color: var(--medium-text);
  margin: 1.5rem 0;
}

@media (max-width: 768px) {
  .app-navbar {
    width: 60px;
  }
  
  .nav-label {
    display: none;
  }
  
  .nav-item a {
    justify-content: center;
    padding: 0.75rem;
  }
  
  .nav-item .icon {
    margin-right: 0;
  }
  
  .stats-container {
    grid-template-columns: 1fr;
  }
}
EOF

# Create JS file
cat > ../html/app.js <<EOF
// Initialize the application once DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Set up router
  setupRouter();

  // Set up event listeners for API actions
  setupEventListeners();
});

// Set up router
function setupRouter() {
  // Handle initial route
  handleRouteChange();
  
  // Set up event listener for hash changes
  window.addEventListener('hashchange', handleRouteChange);
}

// Handle route changes
function handleRouteChange() {
  // Get route from hash or default to dashboard
  const hash = window.location.hash.replace('#', '') || 'dashboard';
  
  // Update active nav item
  updateActiveNavItem(hash);
  
  // Render page content
  renderPage(hash);
}

// Update active nav item
function updateActiveNavItem(route) {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    const itemRoute = item.getAttribute('data-route');
    if (itemRoute === route) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
}

// Render page content based on route
function renderPage(route) {
  const contentEl = document.getElementById('content');
  contentEl.innerHTML = ''; // Clear content
  
  // Create page container
  const pageContainer = document.createElement('div');
  pageContainer.className = \`\${route}-page\`;
  
  // Create page title
  const titleContainer = document.createElement('div');
  titleContainer.className = 'page-title-container';
  
  const title = document.createElement('h1');
  title.className = 'page-title';
  
  const subtitle = document.createElement('p');
  subtitle.className = 'page-subtitle';
  
  // Set title and subtitle based on route
  switch (route) {
    case 'dashboard':
      title.textContent = 'Dashboard';
      subtitle.textContent = 'Overview of your NGINX configurations';
      break;
    case 'ip-acls':
      title.textContent = 'IP ACLs';
      subtitle.textContent = 'Manage IP-based access control lists';
      break;
    case 'url-acls':
      title.textContent = 'URL ACLs';
      subtitle.textContent = 'Manage URL-based access control lists';
      break;
    case 'combined-acls':
      title.textContent = 'Combined ACLs';
      subtitle.textContent = 'Manage combined IP and URL access control lists';
      break;
    case 'settings':
      title.textContent = 'Settings';
      subtitle.textContent = 'Configure NGINX and application settings';
      break;
    default:
      title.textContent = 'Not Found';
      subtitle.textContent = 'The page you are looking for does not exist';
  }
  
  titleContainer.appendChild(title);
  titleContainer.appendChild(subtitle);
  pageContainer.appendChild(titleContainer);
  
  // Create page content based on route
  const content = document.createElement('div');
  content.className = \`\${route}-content\`;
  
  // Add page-specific content
  switch (route) {
    case 'dashboard':
      renderDashboard(content);
      break;
    case 'ip-acls':
      renderIpAcls(content);
      break;
    case 'url-acls':
      renderUrlAcls(content);
      break;
    case 'combined-acls':
      renderCombinedAcls(content);
      break;
    case 'settings':
      renderSettings(content);
      break;
    default:
      renderNotFound(content);
  }
  
  pageContainer.appendChild(content);
  contentEl.appendChild(pageContainer);
}

// Render dashboard page
function renderDashboard(container) {
  // Create stats container
  const statsContainer = document.createElement('div');
  statsContainer.className = 'stats-container';
  
  // Define stats (these would be dynamically generated in a real app)
  const stats = [
    { label: 'IP ACL Rules', value: '24', icon: 'shield' },
    { label: 'URL ACL Rules', value: '18', icon: 'link' },
    { label: 'Combined Rules', value: '6', icon: 'layers' },
    { label: 'Config Status', value: 'Active', icon: 'check-circle' }
  ];
  
  // Create stat cards
  stats.forEach(stat => {
    const card = document.createElement('div');
    card.className = 'stat-card';
    
    const icon = document.createElement('div');
    icon.className = 'stat-icon';
    icon.innerHTML = getIconSvg(stat.icon);
    
    const value = document.createElement('div');
    value.className = 'stat-value';
    value.textContent = stat.value;
    
    const label = document.createElement('div');
    label.className = 'stat-label';
    label.textContent = stat.label;
    
    card.appendChild(icon);
    card.appendChild(value);
    card.appendChild(label);
    
    statsContainer.appendChild(card);
  });
  
  container.appendChild(statsContainer);
  
  // Add a summary card
  const summaryCard = document.createElement('div');
  summaryCard.className = 'card';
  
  const summaryTitle = document.createElement('h2');
  summaryTitle.className = 'card-title';
  summaryTitle.textContent = 'Configuration Summary';
  
  const summaryContent = document.createElement('p');
  summaryContent.textContent = 'This dashboard provides an overview of your NGINX ACL configuration. Use the navigation menu to manage different types of access control lists.';
  
  summaryCard.appendChild(summaryTitle);
  summaryCard.appendChild(summaryContent);
  
  container.appendChild(summaryCard);
}

// Render IP ACLs page
function renderIpAcls(container) {
  // Create an explanatory card
  const infoCard = document.createElement('div');
  infoCard.className = 'card';
  
  const infoTitle = document.createElement('h2');
  infoTitle.className = 'card-title';
  infoTitle.textContent = 'IP Access Control Lists';
  
  const infoContent = document.createElement('p');
  infoContent.textContent = 'Manage your IP-based access control lists. Add or remove IP addresses and subnets to control access to your proxy.';
  
  infoCard.appendChild(infoTitle);
  infoCard.appendChild(infoContent);
  
  container.appendChild(infoCard);
  
  // Sample IP ACL entries
  const ipEntries = [
    { ip: '172.24.20.12/32', description: 'MOTPERWU01 wsus' },
    { ip: '172.24.20.16/32', description: 'motperap04 rhel repo' },
    { ip: '172.28.33.2/32', description: 'TestWin10-01 defender test wonmunna' },
    { ip: '172.24.20.0/23', description: 'Subnet' }
  ];
  
  // Create IP ACL list
  const aclCard = document.createElement('div');
  aclCard.className = 'card';
  
  const aclTitle = document.createElement('h3');
  aclTitle.className = 'card-title';
  aclTitle.textContent = 'Allowed IP Addresses';
  
  const aclList = document.createElement('div');
  aclList.className = 'acl-list';
  
  ipEntries.forEach(entry => {
    const aclEntry = document.createElement('div');
    aclEntry.className = 'acl-entry';
    
    const entryText = document.createElement('div');
    entryText.className = 'acl-rule-text';
    entryText.textContent = \`\${entry.ip} (\${entry.description})\`;
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'button button-sm';
    removeBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>';
    
    aclEntry.appendChild(entryText);
    aclEntry.appendChild(removeBtn);
    
    aclList.appendChild(aclEntry);
  });
  
  // Add form to add new IP
  const addForm = document.createElement('div');
  addForm.className = 'form-group mt-4';
  
  const formRow = document.createElement('div');
  formRow.style.display = 'flex';
  formRow.style.gap = '0.5rem';
  
  const ipInput = document.createElement('input');
  ipInput.className = 'input';
  ipInput.placeholder = 'Enter IP address or subnet (e.g. 192.168.1.1/32)';
  
  const descInput = document.createElement('input');
  descInput.className = 'input';
  descInput.placeholder = 'Description';
  
  const addBtn = document.createElement('button');
  addBtn.className = 'button';
  addBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" class="mr-1"><path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg> Add';
  
  formRow.appendChild(ipInput);
  formRow.appendChild(descInput);
  formRow.appendChild(addBtn);
  
  addForm.appendChild(formRow);
  
  aclCard.appendChild(aclTitle);
  aclCard.appendChild(aclList);
  aclCard.appendChild(addForm);
  
  container.appendChild(aclCard);
}

// Render URL ACLs page
function renderUrlAcls(container) {
  // Create an explanatory card
  const infoCard = document.createElement('div');
  infoCard.className = 'card';
  
  const infoTitle = document.createElement('h2');
  infoTitle.className = 'card-title';
  infoTitle.textContent = 'URL Access Control Lists';
  
  const infoContent = document.createElement('p');
  infoContent.textContent = 'Manage your URL-based access control lists. Add or remove domain patterns to control which URLs can be accessed through your proxy.';
  
  infoCard.appendChild(infoTitle);
  infoCard.appendChild(infoContent);
  
  container.appendChild(infoCard);
  
  // Sample URL ACL entries
  const urlEntries = [
    { pattern: '~^.*\\.microsoft\\.com$', description: 'motperwu01' },
    { pattern: '~^.*\\.windowsupdate\\.com$', description: 'motperwu01' },
    { pattern: 'subscription.rhn.redhat.com', description: 'motperap04' },
    { pattern: 'cdn.redhat.com', description: 'motperap04' }
  ];
  
  // Create URL ACL list
  const aclCard = document.createElement('div');
  aclCard.className = 'card';
  
  const aclTitle = document.createElement('h3');
  aclTitle.className = 'card-title';
  aclTitle.textContent = 'Allowed URL Patterns';
  
  const aclList = document.createElement('div');
  aclList.className = 'acl-list';
  
  urlEntries.forEach(entry => {
    const aclEntry = document.createElement('div');
    aclEntry.className = 'acl-entry';
    
    const entryText = document.createElement('div');
    entryText.className = 'acl-rule-text';
    entryText.textContent = \`\${entry.pattern} (\${entry.description})\`;
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'button button-sm';
    removeBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>';
    
    aclEntry.appendChild(entryText);
    aclEntry.appendChild(removeBtn);
    
    aclList.appendChild(aclEntry);
  });
  
  // Add form to add new URL pattern
  const addForm = document.createElement('div');
  addForm.className = 'form-group mt-4';
  
  const formRow = document.createElement('div');
  formRow.style.display = 'flex';
  formRow.style.gap = '0.5rem';
  
  const patternInput = document.createElement('input');
  patternInput.className = 'input';
  patternInput.placeholder = 'Enter URL pattern (e.g. *.example.com)';
  
  const descInput = document.createElement('input');
  descInput.className = 'input';
  descInput.placeholder = 'Description';
  
  const addBtn = document.createElement('button');
  addBtn.className = 'button';
  addBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" class="mr-1"><path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg> Add';
  
  formRow.appendChild(patternInput);
  formRow.appendChild(descInput);
  formRow.appendChild(addBtn);
  
  addForm.appendChild(formRow);
  
  aclCard.appendChild(aclTitle);
  aclCard.appendChild(aclList);
  aclCard.appendChild(addForm);
  
  container.appendChild(aclCard);
}

// Render Combined ACLs page
function renderCombinedAcls(container) {
  // Create a placeholder message
  const placeholderCard = document.createElement('div');
  placeholderCard.className = 'card';
  
  const cardTitle = document.createElement('h2');
  cardTitle.className = 'card-title';
  cardTitle.textContent = 'Combined ACL Management';
  
  const cardContent = document.createElement('p');
  cardContent.textContent = 'This page allows you to manage combined IP and URL access control lists. You can create rules that combine both IP and URL restrictions.';
  
  placeholderCard.appendChild(cardTitle);
  placeholderCard.appendChild(cardContent);
  
  container.appendChild(placeholderCard);
}

// Render Settings page
function renderSettings(container) {
  // Create settings container
  const settingsContainer = document.createElement('div');
  settingsContainer.className = 'settings-form';
  
  // Create NGINX config section
  const configSection = document.createElement('div');
  configSection.className = 'card';
  
  const configTitle = document.createElement('h2');
  configTitle.className = 'card-title';
  configTitle.textContent = 'NGINX Configuration';
  
  const configLabel = document.createElement('label');
  configLabel.htmlFor = 'nginx-config';
  configLabel.textContent = 'Edit your NGINX configuration file:';
  
  const configTextarea = document.createElement('textarea');
  configTextarea.id = 'nginx-config';
  configTextarea.className = 'config-editor';
  configTextarea.rows = 20;
  configTextarea.placeholder = 'Loading NGINX configuration...';
  
  // Buttons container
  const buttonsContainer = document.createElement('div');
  buttonsContainer.className = 'settings-buttons';
  
  // Save button
  const saveButton = document.createElement('button');
  saveButton.id = 'save-config';
  saveButton.className = 'button';
  saveButton.textContent = 'Save Configuration';
  
  // Reset button
  const resetButton = document.createElement('button');
  resetButton.id = 'reset-config';
  resetButton.className = 'button button-secondary';
  resetButton.textContent = 'Reset';
  
  // Assemble elements
  configSection.appendChild(configTitle);
  configSection.appendChild(configLabel);
  configSection.appendChild(configTextarea);
  
  buttonsContainer.appendChild(resetButton);
  buttonsContainer.appendChild(saveButton);
  
  configSection.appendChild(buttonsContainer);
  
  settingsContainer.appendChild(configSection);
  
  container.appendChild(settingsContainer);
  
  // Load the initial NGINX config
  fetchNginxConfig();
}

// Render 404 page
function renderNotFound(container) {
  const notFoundContent = document.createElement('div');
  notFoundContent.className = 'not-found-content';
  
  const title = document.createElement('h1');
  title.textContent = '404';
  
  const message = document.createElement('p');
  message.textContent = 'The page you are looking for does not exist.';
  
  const link = document.createElement('a');
  link.href = '#dashboard';
  link.textContent = 'Go back to Dashboard';
  link.className = 'button';
  
  notFoundContent.appendChild(title);
  notFoundContent.appendChild(message);
  notFoundContent.appendChild(link);
  
  container.appendChild(notFoundContent);
}

// Fetch NGINX configuration
function fetchNginxConfig() {
  const configTextarea = document.getElementById('nginx-config');
  
  if (!configTextarea) return;
  
  // Simulate fetching the NGINX config
  // In a real app, this would be an actual fetch request to an API
  setTimeout(() => {
    // This is a mock of the actual NGINX config
    configTextarea.value = \`worker_processes auto;
daemon off;

events {
    worker_connections 1024;
}

http {
    log_format main '\$remote_addr - \$remote_user [\$time_local] "\$request" '
                    '\$status \$body_bytes_sent "\$http_referer" '
                    '"\$http_user_agent" "\$http_x_forwarded_for"';
   
    log_format denied '\$remote_addr - [\$time_local] "\$request" '
                      '\$status "\$http_user_agent" "\$http_referer" '
                      'Host: "\$host" URI: "\$request_uri" '
                      'Client: "\$remote_addr" '
                      'Reason: "\$deny_reason"';
	   
    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log info;
    access_log /var/log/nginx/denied.log denied if=\$deny_log;


#==============================================================================
    #IP WHITELIST
    # Use geo module to determine if incoming IP is on whitelist
    # use CIDR notation and the below format, also add the server name as a reference
    geo \$whitelist {
        default 0;
        # Allow Individual IPs below:
		172.24.20.12/32 1;  #MOTPERWU01 wsus
		172.24.20.16/32 1;  #motperap04 rhel repo
     		172.28.33.2/32  1;  # TestWin10-01 defender test wonmunna
		172.28.36.4/32  1;  #TestSvr2022-01 defender test wonmunna
		172.28.36.5/32  1;  #TestLinux-01 defender test wonmunna
        
        # Allow Subnets below:
	172.24.20.0/23 1;
    }
    # ------------------------------------
    # URL WHITELIST
    # url filtering for external addresses - default-deny approach. See Confluence article for more info
       
    map \$host \$is_allowed_url {
        default 0;  # Block by default - deny unless explicitly allowed
    
        # Allow specific domains below:"   
        "~^.*\\.microsoft\\.com\$"          1;	#motperwu01
	"~^.*\\.windowsupdate\\.com\$"      1;	#motperwu01
        "subscription.rhn.redhat.com"    1;	#motperap04
       "subscription.rhsm.redhat.com"    1;	#motperap04
        "cdn.redhat.com"	 	 1;	#motperap04
 	"~^.*\\.akamaiedge\\.net\$"	 1;	#motperap04
	"~^.*\\.akamaitechnologies\\.com\$" 1;	#motperap04
	"~^.*\\.windows\\.net\$"            1;	#defender EDR

    
    }
# END OF CODE TO EDIT, DO NOT EDIT BELOW.
# ==============================================================================

    # Variables for logging denied requests
    map \$status \$deny_log {
        ~^4 1;  # Log all 4xx responses (including 403 denied requests)
        default 0;
    }
    
    # Map to set denial reason
    map "\$whitelist:\$is_allowed_url" \$deny_reason {
        "0:0" "IP not whitelisted and URL not allowed";
        "0:1" "IP not whitelisted";
        "1:0" "URL not in allowed list";
        default "";
    }

    server {
        listen 8080;
		# External DNS server/s
        resolver 8.8.8.8 1.1.1.1 ipv6=off;

        # Use the geo variable for access control
        if (\$whitelist = 0) {
            set \$deny_reason "IP not whitelisted: \$remote_addr";
	    return 403 "Access denied: Your IP is not whitelisted.";
        }

        # Block disallowed URLs
        if (\$is_allowed_url = 0) {
            set \$deny_reason "URL not in allowed list: \$host";
	    return 403 "Access denied: This URL is not in the allowed list.";
        }

        # HTTPS CONNECT method handling
        proxy_connect;
        proxy_connect_allow all;  # Allow all ports for HTTPS connections
        proxy_connect_connect_timeout 10s;
        proxy_connect_read_timeout 60s;
        proxy_connect_send_timeout 60s;

        # Security headers
        proxy_hide_header Upgrade;
        proxy_hide_header X-Powered-By;
        add_header Content-Security-Policy "upgrade-insecure-requests";
        add_header X-Frame-Options "SAMEORIGIN";
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Cache-Control "no-transform" always;
        add_header Referrer-Policy no-referrer always;
        add_header X-Robots-Tag none;

        # HTTP forwarding
        location / {
            # Check whitelist again at location level
            if (\$whitelist = 0) {
                set \$deny_reason "IP not whitelisted at location level: \$remote_addr";
				return 403 "Access denied: Your IP is not whitelisted.";
            }

            # Check URL filtering again at location level
            if (\$is_allowed_url = 0) {
                set \$deny_reason "URL not in allowed list at location level: \$host";
				return 403 "Access denied: This URL is not in the allowed list.";
            }

            proxy_http_version 1.1;
            proxy_set_header Host \$host;
            proxy_set_header Connection "";  # Enable keepalives
            proxy_pass \$scheme://\$host\$request_uri;  # Include \$request_uri

            # Additional useful headers
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;

            # Timeouts for better reliability
            proxy_connect_timeout 10s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
			
      } #End of Location Block
  } #End of Server Block
} #End of HTTP Block\`;
  }, 500);
}

// Set up event listeners for interactive elements
function setupEventListeners() {
  // We use event delegation to handle clicks on dynamically created elements
  document.addEventListener('click', function(event) {
    // Handle save config button
    if (event.target && event.target.id === 'save-config') {
      const configTextarea = document.getElementById('nginx-config');
      if (configTextarea) {
        saveNginxConfig(configTextarea.value);
      }
    }
    
    // Handle reset config button
    if (event.target && event.target.id === 'reset-config') {
      fetchNginxConfig();
    }
  });
}

// Save NGINX configuration
function saveNginxConfig(config) {
  // In a real app, this would send the config to an API endpoint
  // Here we'll just simulate a successful save
  setTimeout(() => {
    showToast('Configuration saved successfully!', 'success');
  }, 1000);
}

// Show toast notification
function showToast(message, type = 'info', duration = 3000) {
  const toasterContainer = document.getElementById('toaster-container');
  
  const toast = document.createElement('div');
  toast.className = \`toast toast-\${type}\`;
  toast.textContent = message;
  
  toasterContainer.appendChild(toast);
  
  // Animation to slide in
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  
  // Remove the toast after duration
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
    }, 300); // Wait for fade out animation
  }, duration);
}

// Helper function to get SVG icons
function getIconSvg(iconName) {
  const icons = {
    'dashboard': '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg>',
    'shield': '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>',
    'link': '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>',
    'layers': '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M11.99 18.54l-7.37-5.73L3 14.07l9 7 9-7-1.63-1.27-7.38 5.74zM12 16l7.36-5.73L21 9l-9-7-9 7 1.63 1.27L12 16z"/></svg>',
    'check-circle': '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>',
    'settings': '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>'
  };
  
  return icons[iconName] || '';
}
EOF

# Make the script executable
chmod +x setup.sh

echo "Setup completed. You can now run: docker-compose up -d"
