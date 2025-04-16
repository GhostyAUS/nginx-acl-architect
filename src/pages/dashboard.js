
import { createPageTitle } from '../components/common/page-title.js';

export function renderDashboard(container) {
  const dashboardEl = document.createElement('div');
  dashboardEl.className = 'dashboard-page';
  
  // Add page title
  const title = createPageTitle('Dashboard', 'Overview of your NGINX configurations');
  dashboardEl.appendChild(title);
  
  // Create dashboard content
  const content = document.createElement('div');
  content.className = 'dashboard-content';
  
  // Add some stat cards
  const statsContainer = document.createElement('div');
  statsContainer.className = 'stats-container';
  
  const stats = [
    { label: 'IP ACL Rules', value: '24', icon: 'shield' },
    { label: 'URL ACL Rules', value: '18', icon: 'link' },
    { label: 'Combined Rules', value: '6', icon: 'layers' },
    { label: 'Config Status', value: 'Active', icon: 'check-circle' }
  ];
  
  stats.forEach(stat => {
    const card = document.createElement('div');
    card.className = 'stat-card';
    
    const icon = document.createElement('div');
    icon.className = `stat-icon icon-${stat.icon}`;
    
    const valueEl = document.createElement('div');
    valueEl.className = 'stat-value';
    valueEl.textContent = stat.value;
    
    const labelEl = document.createElement('div');
    labelEl.className = 'stat-label';
    labelEl.textContent = stat.label;
    
    card.appendChild(icon);
    card.appendChild(valueEl);
    card.appendChild(labelEl);
    
    statsContainer.appendChild(card);
  });
  
  content.appendChild(statsContainer);
  dashboardEl.appendChild(content);
  
  container.appendChild(dashboardEl);
}
