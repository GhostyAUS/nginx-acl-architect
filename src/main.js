
// Import CSS
import './index.css';

// Initialize the application once DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Get the app container
  const appElement = document.getElementById('app');
  
  // Initialize layout
  initLayout(appElement);
  
  // Set up router
  setupRouter();
});

// Create the main app layout
function initLayout(container) {
  // Create the header
  const header = document.createElement('header');
  header.className = 'app-header';
  
  const logo = document.createElement('div');
  logo.className = 'logo';
  logo.textContent = 'NGINX ACL Architect';
  header.appendChild(logo);
  
  // Create main container
  const mainContainer = document.createElement('div');
  mainContainer.className = 'main-container';
  
  // Create sidebar
  const navbar = document.createElement('nav');
  navbar.className = 'app-navbar';
  
  const navList = document.createElement('ul');
  navList.className = 'nav-list';
  
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'ip-acls', label: 'IP ACLs', icon: 'shield' },
    { id: 'url-acls', label: 'URL ACLs', icon: 'link' },
    { id: 'combined-acls', label: 'Combined ACLs', icon: 'layers' },
    { id: 'settings', label: 'Settings', icon: 'settings' }
  ];
  
  navItems.forEach(item => {
    const li = document.createElement('li');
    li.className = 'nav-item';
    li.setAttribute('data-route', item.id);
    
    const a = document.createElement('a');
    a.href = `#${item.id}`;
    
    const icon = document.createElement('span');
    icon.className = `icon icon-${item.icon}`;
    
    const label = document.createElement('span');
    label.className = 'nav-label';
    label.textContent = item.label;
    
    a.appendChild(icon);
    a.appendChild(label);
    li.appendChild(a);
    navList.appendChild(li);
  });
  
  navbar.appendChild(navList);
  
  // Create content area
  const content = document.createElement('div');
  content.id = 'content';
  content.className = 'main-content';
  
  // Assemble layout
  mainContainer.appendChild(navbar);
  mainContainer.appendChild(content);
  
  container.appendChild(header);
  container.appendChild(mainContainer);
  
  // Create toaster container
  const toasterContainer = document.createElement('div');
  toasterContainer.id = 'toaster-container';
  toasterContainer.className = 'toaster-container';
  document.body.appendChild(toasterContainer);
}

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
  pageContainer.className = `${route}-page`;
  
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
  content.className = `${route}-content`;
  
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
  
  // Define stats
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
    icon.className = `stat-icon icon-${stat.icon}`;
    
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
}

// Render IP ACLs page
function renderIpAcls(container) {
  const placeholder = document.createElement('p');
  placeholder.textContent = 'IP ACLs management interface will be displayed here.';
  container.appendChild(placeholder);
}

// Render URL ACLs page
function renderUrlAcls(container) {
  const placeholder = document.createElement('p');
  placeholder.textContent = 'URL ACLs management interface will be displayed here.';
  container.appendChild(placeholder);
}

// Render Combined ACLs page
function renderCombinedAcls(container) {
  const placeholder = document.createElement('p');
  placeholder.textContent = 'Combined ACLs management interface will be displayed here.';
  container.appendChild(placeholder);
}

// Render Settings page
function renderSettings(container) {
  // Create settings container
  const settingsContainer = document.createElement('div');
  settingsContainer.className = 'settings-form';
  
  // Create NGINX config section
  const configSection = document.createElement('div');
  configSection.className = 'settings-section';
  
  const configLabel = document.createElement('label');
  configLabel.htmlFor = 'nginx-config';
  configLabel.textContent = 'NGINX Configuration';
  
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
  saveButton.className = 'button button-primary';
  saveButton.textContent = 'Save Configuration';
  saveButton.addEventListener('click', () => {
    saveNginxConfig(configTextarea.value);
  });
  
  // Reset button
  const resetButton = document.createElement('button');
  resetButton.className = 'button button-secondary';
  resetButton.textContent = 'Reset';
  resetButton.addEventListener('click', () => {
    loadNginxConfig(configTextarea);
  });
  
  // Assemble elements
  configSection.appendChild(configLabel);
  configSection.appendChild(configTextarea);
  
  buttonsContainer.appendChild(resetButton);
  buttonsContainer.appendChild(saveButton);
  
  settingsContainer.appendChild(configSection);
  settingsContainer.appendChild(buttonsContainer);
  
  container.appendChild(settingsContainer);
  
  // Load the initial NGINX config
  loadNginxConfig(configTextarea);
}

// Load NGINX configuration
function loadNginxConfig(textarea) {
  fetch('/api/nginx/config')
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to load NGINX configuration');
      }
      return response.text();
    })
    .then(data => {
      textarea.value = data;
    })
    .catch(error => {
      showToast(error.message, 'error');
      textarea.value = '# Error loading configuration. Please try again.';
    });
}

// Save NGINX configuration
function saveNginxConfig(config) {
  fetch('/api/nginx/config', {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain'
    },
    body: config
  })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        showToast(data.message, 'success');
      } else {
        showToast(data.message, 'error');
      }
    })
    .catch(error => {
      showToast('Failed to save configuration: ' + error.message, 'error');
    });
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
  
  notFoundContent.appendChild(title);
  notFoundContent.appendChild(message);
  notFoundContent.appendChild(link);
  
  container.appendChild(notFoundContent);
}

// Show toast notification
function showToast(message, type = 'info', duration = 3000) {
  const toasterContainer = document.getElementById('toaster-container');
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
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
