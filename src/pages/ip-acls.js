
import { createPageTitle } from '../components/common/page-title.js';

export function renderIpAcls(container) {
  const ipAclsEl = document.createElement('div');
  ipAclsEl.className = 'ip-acls-page';
  
  // Add page title
  const title = createPageTitle('IP ACLs', 'Manage IP-based access control lists');
  ipAclsEl.appendChild(title);
  
  // Create content placeholder
  const content = document.createElement('div');
  content.className = 'ip-acls-content';
  content.innerHTML = '<p>IP ACLs management interface will be displayed here.</p>';
  
  ipAclsEl.appendChild(content);
  container.appendChild(ipAclsEl);
}
