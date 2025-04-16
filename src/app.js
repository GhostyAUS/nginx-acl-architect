
import { renderDashboard } from './pages/dashboard.js';
import { renderIpAcls } from './pages/ip-acls.js';
import { renderUrlAcls } from './pages/url-acls.js';
import { renderCombinedAcls } from './pages/combined-acls.js';
import { renderSettings } from './pages/settings.js';
import { renderNotFound } from './pages/not-found.js';
import { createAppLayout } from './components/layout/app-layout.js';
import { setupToaster } from './components/ui/toaster.js';

// Main application initialization
export function initApp() {
  // Initialize the app container
  const appElement = document.getElementById('app');
  if (!appElement) {
    console.error('App container not found');
    return;
  }
  
  // Set up the toaster notification system
  setupToaster();
  
  // Set up the main app layout
  const appLayout = createAppLayout();
  appElement.appendChild(appLayout);
  
  // Set up content container where page content will be rendered
  const contentContainer = document.createElement('div');
  contentContainer.id = 'content';
  contentContainer.className = 'content-container';
  appLayout.querySelector('.main-content').appendChild(contentContainer);
  
  // Handle routing based on hash changes
  function handleRouteChange() {
    const hash = window.location.hash.replace('#', '') || 'dashboard';
    updateActiveNavItem(hash);
    renderPage(hash);
  }
  
  // Initialize the first page
  handleRouteChange();
  
  // Listen for hash changes
  window.addEventListener('hashchange', handleRouteChange);
  
  // Update active nav item in sidebar
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
  
  // Render the appropriate page based on the route
  function renderPage(route) {
    const contentEl = document.getElementById('content');
    contentEl.innerHTML = ''; // Clear current content
    
    switch (route) {
      case 'dashboard':
        renderDashboard(contentEl);
        break;
      case 'ip-acls':
        renderIpAcls(contentEl);
        break;
      case 'url-acls':
        renderUrlAcls(contentEl);
        break;
      case 'combined-acls':
        renderCombinedAcls(contentEl);
        break;
      case 'settings':
        renderSettings(contentEl);
        break;
      default:
        renderNotFound(contentEl);
    }
  }
}
