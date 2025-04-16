
export function renderNotFound(container) {
  const notFoundEl = document.createElement('div');
  notFoundEl.className = 'not-found-page';
  
  const content = document.createElement('div');
  content.className = 'not-found-content';
  
  const title = document.createElement('h1');
  title.textContent = '404';
  
  const message = document.createElement('p');
  message.textContent = 'Oops! Page not found';
  
  const link = document.createElement('a');
  link.href = '#dashboard';
  link.textContent = 'Return to Home';
  
  content.appendChild(title);
  content.appendChild(message);
  content.appendChild(link);
  
  notFoundEl.appendChild(content);
  container.appendChild(notFoundEl);
}
