
import { createPageTitle } from '../components/common/page-title.js';
import { showToast } from '../components/ui/toaster.js';

export function renderSettings(container) {
  const settingsEl = document.createElement('div');
  settingsEl.className = 'settings-page';
  
  // Add page title
  const title = createPageTitle('Settings', 'Configure application settings');
  settingsEl.appendChild(title);
  
  // Create settings form
  const form = document.createElement('form');
  form.className = 'settings-form';
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    showToast('Settings saved successfully!', 'success');
  });
  
  // Config editor
  const configSection = document.createElement('div');
  configSection.className = 'settings-section';
  
  const configLabel = document.createElement('label');
  configLabel.htmlFor = 'nginx-config';
  configLabel.textContent = 'NGINX Configuration';
  
  const configTextarea = document.createElement('textarea');
  configTextarea.id = 'nginx-config';
  configTextarea.className = 'config-editor';
  configTextarea.rows = 15;
  configTextarea.placeholder = '# Paste your NGINX configuration here';
  
  configSection.appendChild(configLabel);
  configSection.appendChild(configTextarea);
  
  // Buttons
  const buttonsContainer = document.createElement('div');
  buttonsContainer.className = 'settings-buttons';
  
  const saveButton = document.createElement('button');
  saveButton.type = 'submit';
  saveButton.className = 'button button-primary';
  saveButton.textContent = 'Save Configuration';
  
  const testButton = document.createElement('button');
  testButton.type = 'button';
  testButton.className = 'button button-secondary';
  testButton.textContent = 'Test Configuration';
  testButton.addEventListener('click', () => {
    showToast('Configuration test successful!', 'info');
  });
  
  buttonsContainer.appendChild(saveButton);
  buttonsContainer.appendChild(testButton);
  
  // Assemble form
  form.appendChild(configSection);
  form.appendChild(buttonsContainer);
  
  settingsEl.appendChild(form);
  container.appendChild(settingsEl);
}
