import { NginxConfig } from '@/types/nginx';
import { parseNginxConfig, generateNginxConfig } from './nginx-parser';
import { toast } from "sonner";
import { validateNginxConfig, validateAndFixNginxConfig } from './nginx-validator';

// Function to parse a file string into NginxConfig object
export function parseNginxFile(fileContent: string): NginxConfig {
  try {
    const config = parseNginxConfig(fileContent);
    console.log('Successfully parsed nginx configuration', config);
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

// Function to load Nginx config from local storage or file
export async function loadNginxConfig(): Promise<NginxConfig> {
  try {
    const savedConfig = localStorage.getItem('nginxConfig');
    
    if (savedConfig) {
      return JSON.parse(savedConfig);
    }
    
    // Return a default config that matches NginxConfig type
    return {
      serverName: 'default',
      port: 80,
      ipAclGroups: [],
      urlAclGroups: [],
      combinedAcls: []
    };
  } catch (error) {
    console.error('Failed to load nginx config:', error);
    toast.error('Failed to load nginx configuration');
    
    // Return a default config that matches NginxConfig type
    return {
      serverName: 'default',
      port: 80,
      ipAclGroups: [],
      urlAclGroups: [],
      combinedAcls: []
    };
  }
}

// Function to save Nginx config to local storage
export async function saveNginxConfig(config: NginxConfig): Promise<void> {
  try {
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
    const locations = [
      '/opt/proxy/nginx.conf',
      '/opt/proxy/conf.d',
      '/etc/nginx/conf.d'
    ];
    
    // In a real implementation, this would scan the Docker volumes
    // For now, return predefined locations as they're mounted in docker-compose
    return locations;
  } catch (error) {
    console.error('Failed to list config files:', error);
    toast.error('Failed to list configuration files');
    return [];
  }
}

// Function to read config file from Docker volume
export async function readConfigFile(path: string): Promise<string> {
  try {
    // This is where you'd implement actual file reading from Docker volumes
    // For now, we'll show a toast explaining this needs to be implemented
    toast.info('This feature requires server-side implementation to read from Docker volumes');
    return '';
  } catch (error) {
    console.error('Failed to read config file:', error);
    toast.error('Failed to read configuration file');
    throw error;
  }
}

// Function to write config file to Docker volume
export async function writeConfigFile(path: string, content: string): Promise<void> {
  try {
    // This is where you'd implement actual file writing to Docker volumes
    // For now, we'll show a toast explaining this needs to be implemented
    toast.info('This feature requires server-side implementation to write to Docker volumes');
  } catch (error) {
    console.error('Failed to write config file:', error);
    toast.error('Failed to write configuration file');
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
