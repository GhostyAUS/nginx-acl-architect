
import { createPageTitle } from '../components/common/page-title.js';

export function renderUrlAcls(container) {
  const urlAclsEl = document.createElement('div');
  urlAclsEl.className = 'url-acls-page';
  
  // Add page title
  const title = createPageTitle('URL ACLs', 'Manage URL-based access control lists');
  urlAclsEl.appendChild(title);
  
  // Create content placeholder
  const content = document.createElement('div');
  content.className = 'url-acls-content';
  content.innerHTML = '<p>URL ACLs management interface will be displayed here.</p>';
  
  urlAclsEl.appendChild(content);
  container.appendChild(urlAclsEl);
}
