
export function createPageTitle(titleText, subtitleText = '') {
  const titleContainer = document.createElement('div');
  titleContainer.className = 'page-title-container';
  
  const title = document.createElement('h1');
  title.className = 'page-title';
  title.textContent = titleText;
  
  titleContainer.appendChild(title);
  
  if (subtitleText) {
    const subtitle = document.createElement('p');
    subtitle.className = 'page-subtitle';
    subtitle.textContent = subtitleText;
    titleContainer.appendChild(subtitle);
  }
  
  return titleContainer;
}
