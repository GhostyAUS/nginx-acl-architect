
import { createPageTitle } from '../components/common/page-title.js';

export function renderCombinedAcls(container) {
  const combinedAclsEl = document.createElement('div');
  combinedAclsEl.className = 'combined-acls-page';
  
  // Add page title
  const title = createPageTitle('Combined ACLs', 'Manage combined IP and URL access control lists');
  combinedAclsEl.appendChild(title);
  
  // Create content placeholder
  const content = document.createElement('div');
  content.className = 'combined-acls-content';
  content.innerHTML = '<p>Combined ACLs management interface will be displayed here.</p>';
  
  combinedAclsEl.appendChild(content);
  container.appendChild(combinedAclsEl);
}
