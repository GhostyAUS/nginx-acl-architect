
import { createAppHeader } from './app-header.js';
import { createAppNavbar } from './app-navbar.js';

export function createAppLayout() {
  const layout = document.createElement('div');
  layout.className = 'app-layout';
  
  // Create header
  const header = createAppHeader();
  layout.appendChild(header);
  
  // Create main container with sidebar and content area
  const main = document.createElement('div');
  main.className = 'main-container';
  
  // Create sidebar/navbar
  const navbar = createAppNavbar();
  main.appendChild(navbar);
  
  // Create main content area
  const mainContent = document.createElement('div');
  mainContent.className = 'main-content';
  main.appendChild(mainContent);
  
  layout.appendChild(main);
  
  return layout;
}
