
export function createAppNavbar() {
  const navbar = document.createElement('nav');
  navbar.className = 'app-navbar';
  
  const navItems = [
    { route: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { route: 'ip-acls', label: 'IP ACLs', icon: 'shield' },
    { route: 'url-acls', label: 'URL ACLs', icon: 'link' },
    { route: 'combined-acls', label: 'Combined ACLs', icon: 'layers' },
    { route: 'settings', label: 'Settings', icon: 'settings' }
  ];
  
  const navList = document.createElement('ul');
  navList.className = 'nav-list';
  
  navItems.forEach(item => {
    const li = document.createElement('li');
    li.className = 'nav-item';
    li.setAttribute('data-route', item.route);
    
    const a = document.createElement('a');
    a.href = `#${item.route}`;
    
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
  
  return navbar;
}
