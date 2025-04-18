
// App state
const state = {
  currentRoute: 'dashboard',
  toast: {
    id: null,
    timeoutId: null
  },
  config: {
    loaded: false,
    content: '',
    path: '/opt/proxy/nginx.conf' // Default path
  }
};

// DOM elements
const contentElement = document.getElementById('content');
const toasterContainer = document.getElementById('toaster-container');
const navItems = document.querySelectorAll('.nav-item');

// Initialize the app
function initApp() {
  // Set up routing
  window.addEventListener('hashchange', handleRouteChange);
  
  // Set up initial route
  const hash = window.location.hash.substring(1) || 'dashboard';
  navigateToRoute(hash);
  
  // Add event listeners to nav items
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const route = item.dataset.route;
      window.location.hash = route;
    });
  });
}

// Handle route changes
function handleRouteChange() {
  const hash = window.location.hash.substring(1) || 'dashboard';
  navigateToRoute(hash);
}

// Navigate to a specific route
function navigateToRoute(route) {
  // Update active state in navbar
  navItems.forEach(item => {
    if (item.dataset.route === route) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
  
  state.currentRoute = route;
  
  // Render the correct page
  switch (route) {
    case 'dashboard':
      renderDashboard();
      break;
    case 'ip-acls':
      renderIpAcls();
      break;
    case 'url-acls':
      renderUrlAcls();
      break;
    case 'combined-acls':
      renderCombinedAcls();
      break;
    case 'settings':
      renderSettings();
      break;
    default:
      renderNotFound();
  }
}

// Render Dashboard Page
function renderDashboard() {
  contentElement.innerHTML = `
    <div class="page-title-container">
      <h2 class="page-title">Dashboard</h2>
      <p class="page-subtitle">Overview of your NGINX ACL configuration</p>
    </div>
    
    <div class="stats-container">
      <div class="card">
        <div class="card-content">
          <div class="stat-label">IP ACLs</div>
          <div class="stat-value">2</div>
          <div>IP-based access control lists</div>
        </div>
      </div>
      
      <div class="card">
        <div class="card-content">
          <div class="stat-label">URL ACLs</div>
          <div class="stat-value">3</div>
          <div>URL pattern access control lists</div>
        </div>
      </div>
      
      <div class="card">
        <div class="card-content">
          <div class="stat-label">Combined ACLs</div>
          <div class="stat-value">1</div>
          <div>Combined IP + URL access rules</div>
        </div>
      </div>
      
      <div class="card">
        <div class="card-content">
          <div class="stat-label">Status</div>
          <div class="stat-value" style="color: var(--success-color);">Active</div>
          <div>NGINX is running with current ACLs</div>
        </div>
      </div>
    </div>
    
    <div class="card">
      <div class="card-header">
        <div class="card-title">Recent Activity</div>
      </div>
      <div class="card-content">
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Event</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>2025-04-16 10:23</td>
              <td>Configuration Updated</td>
              <td>Added new IP allow rule for 192.168.1.0/24</td>
            </tr>
            <tr>
              <td>2025-04-16 09:45</td>
              <td>NGINX Restarted</td>
              <td>Configuration reload after changes</td>
            </tr>
            <tr>
              <td>2025-04-15 16:30</td>
              <td>URL ACL Modified</td>
              <td>Updated blocked URLs pattern</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// Render IP ACLs Page
function renderIpAcls() {
  contentElement.innerHTML = `
    <div class="page-title-container">
      <h2 class="page-title">IP Access Control Lists</h2>
      <p class="page-subtitle">Manage IP-based access control rules</p>
    </div>
    
    <div class="card">
      <div class="card-header">
        <div class="card-title">Allowed IPs</div>
        <button class="button button-primary">Add IP</button>
      </div>
      <div class="card-content">
        <table>
          <thead>
            <tr>
              <th>IP/CIDR</th>
              <th>Status</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>192.168.1.0/24</td>
              <td><span class="badge badge-success">Allowed</span></td>
              <td>Internal network</td>
              <td>
                <button class="button button-outline">Edit</button>
                <button class="button button-outline">Delete</button>
              </td>
            </tr>
            <tr>
              <td>10.0.0.0/8</td>
              <td><span class="badge badge-success">Allowed</span></td>
              <td>Corporate network</td>
              <td>
                <button class="button button-outline">Edit</button>
                <button class="button button-outline">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <div class="card">
      <div class="card-header">
        <div class="card-title">Blocked IPs</div>
        <button class="button button-primary">Add IP</button>
      </div>
      <div class="card-content">
        <table>
          <thead>
            <tr>
              <th>IP/CIDR</th>
              <th>Status</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1.2.3.4</td>
              <td><span class="badge badge-error">Blocked</span></td>
              <td>Suspicious activity</td>
              <td>
                <button class="button button-outline">Edit</button>
                <button class="button button-outline">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// Render URL ACLs Page
function renderUrlAcls() {
  contentElement.innerHTML = `
    <div class="page-title-container">
      <h2 class="page-title">URL Access Control Lists</h2>
      <p class="page-subtitle">Manage URL pattern-based access control rules</p>
    </div>
    
    <div class="card">
      <div class="card-header">
        <div class="card-title">Allowed URL Patterns</div>
        <button class="button button-primary">Add Pattern</button>
      </div>
      <div class="card-content">
        <table>
          <thead>
            <tr>
              <th>Pattern</th>
              <th>Status</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>^/api/public/.*$</code></td>
              <td><span class="badge badge-success">Allowed</span></td>
              <td>Public API endpoints</td>
              <td>
                <button class="button button-outline">Edit</button>
                <button class="button button-outline">Delete</button>
              </td>
            </tr>
            <tr>
              <td><code>^/docs/.*$</code></td>
              <td><span class="badge badge-success">Allowed</span></td>
              <td>Documentation pages</td>
              <td>
                <button class="button button-outline">Edit</button>
                <button class="button button-outline">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <div class="card">
      <div class="card-header">
        <div class="card-title">Blocked URL Patterns</div>
        <button class="button button-primary">Add Pattern</button>
      </div>
      <div class="card-content">
        <table>
          <thead>
            <tr>
              <th>Pattern</th>
              <th>Status</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>^/admin/.*$</code></td>
              <td><span class="badge badge-error">Blocked</span></td>
              <td>Admin area - restricted access</td>
              <td>
                <button class="button button-outline">Edit</button>
                <button class="button button-outline">Delete</button>
              </td>
            </tr>
            <tr>
              <td><code>^/api/internal/.*$</code></td>
              <td><span class="badge badge-error">Blocked</span></td>
              <td>Internal API - restricted access</td>
              <td>
                <button class="button button-outline">Edit</button>
                <button class="button button-outline">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// Render Combined ACLs Page
function renderCombinedAcls() {
  contentElement.innerHTML = `
    <div class="page-title-container">
      <h2 class="page-title">Combined Access Control Lists</h2>
      <p class="page-subtitle">Manage combined IP and URL access control rules</p>
    </div>
    
    <div class="card">
      <div class="card-header">
        <div class="card-title">Admin Access Rules</div>
        <button class="button button-primary">Add Rule</button>
      </div>
      <div class="card-content">
        <table>
          <thead>
            <tr>
              <th>IP Source</th>
              <th>URL Pattern</th>
              <th>Action</th>
              <th>Description</th>
              <th>Options</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>192.168.1.0/24</td>
              <td><code>^/admin/.*$</code></td>
              <td><span class="badge badge-success">Allow</span></td>
              <td>Internal network admin access</td>
              <td>
                <button class="button button-outline">Edit</button>
                <button class="button button-outline">Delete</button>
              </td>
            </tr>
            <tr>
              <td>10.0.0.0/8</td>
              <td><code>^/api/internal/.*$</code></td>
              <td><span class="badge badge-success">Allow</span></td>
              <td>Corporate network internal API access</td>
              <td>
                <button class="button button-outline">Edit</button>
                <button class="button button-outline">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// Render Settings Page
function renderSettings() {
  contentElement.innerHTML = `
    <div class="page-title-container">
      <h2 class="page-title">Settings</h2>
      <p class="page-subtitle">Configure NGINX and ACL settings</p>
    </div>
    
    <div class="card">
      <div class="card-header">
        <div class="card-title">NGINX Configuration</div>
      </div>
      <div class="card-content">
        <div class="form-group">
          <label for="config-path">Configuration File Path</label>
          <div class="input-group">
            <input type="text" id="config-path" value="${state.config.path}" placeholder="Path to nginx.conf">
            <button id="load-path" class="button button-secondary">Load</button>
            <button id="browse-config" class="button button-outline">Browse...</button>
          </div>
          <input type="file" id="config-file-input" style="display: none;">
        </div>
        <div class="form-group">
          <label for="config-editor">Configuration File</label>
          <textarea id="config-editor" class="config-editor" rows="12" placeholder="Loading configuration..."></textarea>
        </div>
        <div class="form-actions">
          <button id="load-config" class="button button-outline">Reload</button>
          <button id="save-config" class="button button-primary">Save Changes</button>
        </div>
      </div>
    </div>
    
    <div class="card">
      <div class="card-header">
        <div class="card-title">Application Settings</div>
      </div>
      <div class="card-content">
        <div class="form-group">
          <label for="backup-enabled">
            <input type="checkbox" id="backup-enabled" checked> 
            Enable automatic backups
          </label>
        </div>
        <div class="form-group">
          <label for="backup-count">Backup Versions to Keep</label>
          <input type="number" id="backup-count" value="10" min="1" max="100">
        </div>
        <div class="form-actions">
          <button class="button button-primary">Save Settings</button>
        </div>
      </div>
    </div>
  `;
  
  // Add event listeners for this page
  document.getElementById('load-config').addEventListener('click', loadConfig);
  document.getElementById('load-path').addEventListener('click', () => {
    const path = document.getElementById('config-path').value;
    loadConfig(path);
  });
  document.getElementById('save-config').addEventListener('click', saveConfig);
  document.getElementById('browse-config').addEventListener('click', () => {
    document.getElementById('config-file-input').click();
  });
  
  // File input change handler
  document.getElementById('config-file-input').addEventListener('change', handleFileSelect);
  
  // Config path input enter key handler
  document.getElementById('config-path').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const path = document.getElementById('config-path').value;
      loadConfig(path);
    }
  });
  
  // Load config when settings page is shown
  loadConfig();
}

// Handle file selection
function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    const contents = e.target.result;
    document.getElementById('config-editor').value = contents;
    document.getElementById('config-path').value = file.name;
    state.config.path = file.name;
    state.config.content = contents;
    showToast(`Loaded file: ${file.name}`, 'success');
  };
  reader.readAsText(file);
}

// Render 404 Page
function renderNotFound() {
  contentElement.innerHTML = `
    <div class="not-found-page">
      <div class="not-found-content">
        <h1>404</h1>
        <p>The page you're looking for doesn't exist.</p>
        <a href="#dashboard" class="button button-primary">Go to Dashboard</a>
      </div>
    </div>
  `;
}

// Load NGINX configuration
function loadConfig(path) {
  const configEditor = document.getElementById('config-editor');
  
  // Fix the path parameter if it's a PointerEvent (from button click)
  let configPath;
  if (path && typeof path === 'object' && path.type === 'click') {
    // It's a click event object, use the default path
    configPath = document.getElementById('config-path').value || '/opt/proxy/nginx.conf';
  } else {
    configPath = path || document.getElementById('config-path').value || '/opt/proxy/nginx.conf';
  }
  
  configEditor.placeholder = 'Loading configuration...';
  state.config.path = configPath;
  
  // Use a timestamp to prevent caching
  const timestamp = new Date().getTime();
  const url = `/api/nginx/config?path=${encodeURIComponent(configPath)}&t=${timestamp}`;
  console.log(`Loading config from: ${url}`);
  
  fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      if (data.success && data.data) {
        configEditor.value = data.data;
        state.config.loaded = true;
        state.config.content = data.data;
        showToast('Configuration loaded successfully', 'success');
      } else {
        throw new Error(data.message || 'Failed to load configuration');
      }
    })
    .catch(error => {
      console.error('Error loading config:', error);
      showToast('Failed to load configuration: ' + error.message, 'error');
      configEditor.placeholder = 'Error loading configuration';
    });
}

// Save NGINX configuration
function saveConfig() {
  const configEditor = document.getElementById('config-editor');
  const configPath = document.getElementById('config-path').value;
  const configContent = configEditor.value;
  
  if (!configContent.trim()) {
    showToast('Configuration cannot be empty', 'error');
    return;
  }
  
  const url = `/api/nginx/config?path=${encodeURIComponent(configPath)}`;
  console.log(`Saving config to: ${url}`);
  
  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain'
    },
    body: configContent
  })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        showToast(data.message, 'success');
        state.config.content = configContent;
      } else {
        showToast(data.message, 'error');
      }
    })
    .catch(error => {
      console.error('Error saving config:', error);
      showToast('Failed to save configuration: ' + error.message, 'error');
    });
}

// Toast message system
function showToast(message, type = 'info', duration = 3000) {
  // Clear previous toast if exists
  if (state.toast.id) {
    document.getElementById(state.toast.id).remove();
    clearTimeout(state.toast.timeoutId);
  }
  
  // Create new toast ID
  const toastId = 'toast-' + Date.now();
  state.toast.id = toastId;
  
  // Create toast element
  const toast = document.createElement('div');
  toast.id = toastId;
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  
  // Add to container
  toasterContainer.appendChild(toast);
  
  // Show toast (needs a small delay to trigger animation)
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  
  // Auto remove after duration
  state.toast.timeoutId = setTimeout(() => {
    toast.classList.remove('show');
    
    // Remove from DOM after animation
    setTimeout(() => {
      if (document.getElementById(toastId)) {
        document.getElementById(toastId).remove();
      }
      if (state.toast.id === toastId) {
        state.toast.id = null;
      }
    }, 300);
  }, duration);
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);
