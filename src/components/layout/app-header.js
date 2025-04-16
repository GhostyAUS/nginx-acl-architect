
export function createAppHeader() {
  const header = document.createElement('header');
  header.className = 'app-header';
  
  const logo = document.createElement('div');
  logo.className = 'logo';
  logo.textContent = 'NGINX ACL Architect';
  
  header.appendChild(logo);
  
  return header;
}
