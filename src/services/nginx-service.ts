
import { NginxConfig } from '@/types/nginx';
import { parseNginxConfig, generateNginxConfig } from './nginx-parser';
import { toast } from "sonner";
import { validateNginxConfig, validateAndFixNginxConfig } from './nginx-validator';

// Global state to track the loaded configuration
let globalConfig: NginxConfig | null = null;

// Function to parse a file string into NginxConfig object
export function parseNginxFile(fileContent: string): NginxConfig {
  try {
    const config = parseNginxConfig(fileContent);
    console.log('Successfully parsed nginx configuration', config);
    
    // Update global state
    globalConfig = config;
    
    // Also save to localStorage for persistence
    try {
      localStorage.setItem('nginxConfig', JSON.stringify(config));
    } catch (storageError) {
      console.warn('Failed to save config to localStorage:', storageError);
    }
    
    return config;
  } catch (error) {
    console.error('Failed to parse nginx config:', error);
    toast.error('Failed to parse nginx configuration. Check syntax and try again.');
    throw error;
  }
}

// Function to generate config file string from NginxConfig object
export function generateNginxFile(config: NginxConfig): string {
  try {
    return generateNginxConfig(config);
  } catch (error) {
    console.error('Failed to generate nginx config:', error);
    toast.error('Failed to generate nginx configuration text.');
    throw error;
  }
}

// Function to load Nginx config from local storage or global state
export async function loadNginxConfig(): Promise<NginxConfig> {
  try {
    // First check if we have a global config
    if (globalConfig) {
      return globalConfig;
    }
    
    // Then try localStorage
    const savedConfig = localStorage.getItem('nginxConfig');
    
    if (savedConfig) {
      const parsedConfig = JSON.parse(savedConfig);
      globalConfig = parsedConfig; // Update global state
      return parsedConfig;
    }
    
    // If no config is found, return a default and try to load from server
    const defaultConfig = {
      ipAclGroups: [],
      urlAclGroups: [],
      combinedAcls: []
    };
    
    // Try to load the default config file from server
    try {
      const configContent = await readConfigFile('/opt/proxy/nginx.conf');
      if (configContent) {
        return parseNginxFile(configContent);
      }
    } catch (loadError) {
      console.warn('Could not load default config from server:', loadError);
    }
    
    return defaultConfig;
  } catch (error) {
    console.error('Failed to load nginx config:', error);
    toast.error('Failed to load nginx configuration');
    
    // Return a default config that matches NginxConfig type
    return {
      ipAclGroups: [],
      urlAclGroups: [],
      combinedAcls: []
    };
  }
}

// Function to save Nginx config to local storage and update global state
export async function saveNginxConfig(config: NginxConfig): Promise<void> {
  try {
    // Update global state
    globalConfig = config;
    
    // Save to local storage
    localStorage.setItem('nginxConfig', JSON.stringify(config));
    toast.success('Configuration saved successfully');
  } catch (error) {
    console.error('Failed to save nginx config:', error);
    toast.error('Failed to save nginx configuration');
    throw error;
  }
}

// List available config files from Docker volumes
export async function listConfigFiles(): Promise<string[]> {
  try {
    // Call the API to get the list of config files
    const response = await fetch('/api/nginx/files');
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error('Failed to list config files:', error);
    toast.error('Failed to list configuration files');
    
    // Return a default list of common paths when the API fails
    return [
      '/opt/proxy/nginx.conf',
      '/opt/proxy/conf.d',
      '/etc/nginx/conf.d',
      '/usr/local/nginx/conf/nginx.conf'
    ];
  }
}

// Function to read config file from Docker volume
export async function readConfigFile(path: string): Promise<string> {
  try {
    console.log(`Reading config from: ${path}`);
    
    // Handle null or undefined path
    if (!path) {
      path = '/opt/proxy/nginx.conf';
    }
    
    // Ensure the path is a string
    if (typeof path !== 'string') {
      console.warn(`Invalid path type: ${typeof path}, using default path`);
      path = '/opt/proxy/nginx.conf';
    }
    
    const response = await fetch(`/api/nginx/config?path=${encodeURIComponent(path)}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    if (data.success) {
      toast.success(`Successfully loaded configuration from ${path}`);
      return data.data;
    } else {
      throw new Error(data.message || 'Failed to read configuration');
    }
  } catch (error) {
    console.error('Failed to read config file:', error);
    toast.error(`Failed to read configuration file: ${error.message}`);
    throw error;
  }
}

// Function to write config file to Docker volume
export async function writeConfigFile(path: string, content: string): Promise<void> {
  try {
    console.log(`Writing config to: ${path}`);
    
    // Handle null or undefined path
    if (!path) {
      path = '/opt/proxy/nginx.conf';
    }
    
    // Ensure the path is a string
    if (typeof path !== 'string') {
      console.warn(`Invalid path type: ${typeof path}, using default path`);
      path = '/opt/proxy/nginx.conf';
    }
    
    const response = await fetch(`/api/nginx/config?path=${encodeURIComponent(path)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain'
      },
      body: content
    });
    
    const data = await response.json();
    if (data.success) {
      toast.success('Configuration saved successfully');
    } else {
      throw new Error(data.message || 'Failed to write configuration');
    }
  } catch (error) {
    console.error('Failed to write config file:', error);
    toast.error(`Failed to write configuration file: ${error.message}`);
    throw error;
  }
}

// Fix common Nginx syntax errors
export function fixNginxSyntaxErrors(configText: string): string {
  // Replace "if ($variable = 0)" with "if ($variable != 1)"
  return configText.replace(/if\s*\(\$([a-zA-Z_]+)\s*=\s*0\)/g, 'if ($$$1 != 1)');
}

// Validate CIDR notation for IP addresses
export function validateCidr(cidr: string): boolean {
  // Basic regex for IP address with optional CIDR notation
  const cidrRegex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
  if (!cidrRegex.test(cidr)) {
    return false;
  }
  
  // Check IP address values
  const ipPart = cidr.split('/')[0];
  const ipSegments = ipPart.split('.');
  
  for (const segment of ipSegments) {
    const num = parseInt(segment, 10);
    if (num < 0 || num > 255) {
      return false;
    }
  }
  
  // Check CIDR prefix if present
  if (cidr.includes('/')) {
    const prefix = parseInt(cidr.split('/')[1], 10);
    if (prefix < 0 || prefix > 32) {
      return false;
    }
  }
  
  return true;
}

// Validate URL pattern (either exact or regex)
export function validateUrlPattern(pattern: string, isRegex: boolean): boolean {
  if (!pattern.trim()) {
    return false;
  }
  
  if (isRegex) {
    try {
      // Test if the pattern is a valid regex
      new RegExp(pattern);
      return true;
    } catch {
      return false;
    }
  }
  
  // For non-regex, just ensure it's a reasonable domain format
  // This is a simplified check
  return /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/.test(pattern);
}

// This is the missing function for validating combined patterns
export function validateCombinedPattern(pattern: string): boolean {
  if (!pattern.trim()) {
    return false;
  }
  
  // Combined pattern should be a combination of 0, 1, or . characters
  // It can also use regex-like syntax with ~* prefix
  if (pattern.startsWith('~*')) {
    try {
      // Just check if it's a valid regex
      new RegExp(pattern.substring(2));
      return true;
    } catch {
      return false;
    }
  }
  
  // For non-regex patterns, just check if it's a valid combination
  return /^[01.]+$/.test(pattern);
}

// Update settings to handle the new configuration format
export function getAvailableGroups(): { name: string, description: string }[] {
  // For the new format, we have fixed groups
  return [
    { name: 'whitelist', description: 'IP Whitelist' },
    { name: 'is_allowed_url', description: 'URL Whitelist' }
  ];
}
