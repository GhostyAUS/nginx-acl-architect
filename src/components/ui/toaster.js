
export function setupToaster() {
  // Create toaster container if it doesn't exist
  if (!document.getElementById('toaster-container')) {
    const toasterContainer = document.createElement('div');
    toasterContainer.id = 'toaster-container';
    toasterContainer.className = 'toaster-container';
    document.body.appendChild(toasterContainer);
  }
}

// Function to show toast notifications
export function showToast(message, type = 'info', duration = 3000) {
  const toasterContainer = document.getElementById('toaster-container');
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  
  toasterContainer.appendChild(toast);
  
  // Animation to slide in
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  
  // Remove the toast after duration
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
    }, 300); // Wait for fade out animation
  }, duration);
}
