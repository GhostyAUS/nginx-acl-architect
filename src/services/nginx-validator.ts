
import { toast } from "sonner";

/**
 * Checks an Nginx configuration string for common syntax errors
 * @param configText The Nginx configuration to validate
 * @returns An object with validation result and any error messages
 */
export function validateNginxConfig(configText: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check for invalid "if" condition syntax with "="
  const equalCheckRegex = /if=\$([a-zA-Z_]+)\s*=\s*(\d+)/g;
  let match;
  while ((match = equalCheckRegex.exec(configText)) !== null) {
    errors.push(`Line contains invalid "=" in condition: if=$${match[1]} = ${match[2]}`);
  }
  
  // Check for invalid "if" condition syntax with "=" inside parentheses
  const equalCheckParensRegex = /if\s*\(\$([a-zA-Z_]+)\s*=\s*(\d+)\)/g;
  while ((match = equalCheckParensRegex.exec(configText)) !== null) {
    errors.push(`Line contains invalid "=" in condition: if ($${match[1]} = ${match[2]})`);
  }
  
  // Check for unclosed blocks
  const openBraces = (configText.match(/\{/g) || []).length;
  const closeBraces = (configText.match(/\}/g) || []).length;
  if (openBraces !== closeBraces) {
    errors.push(`Unbalanced braces: ${openBraces} opening vs ${closeBraces} closing`);
  }
  
  // Check for missing semicolons in directives
  const lines = configText.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // Skip comments, blocks, and empty lines
    if (line.startsWith('#') || line === '' || line === '{' || line === '}') {
      continue;
    }
    
    // Check if line needs a semicolon and doesn't have one
    if (!line.endsWith(';') && 
        !line.endsWith('{') && 
        !line.includes(' {') && 
        !line.startsWith('if')) {
      errors.push(`Line ${i + 1} might be missing a semicolon: ${line}`);
    }
  }
  
  return { 
    isValid: errors.length === 0,
    errors 
  };
}

/**
 * Attempts to fix common Nginx syntax errors in a configuration
 * @param configText The Nginx configuration to fix
 * @returns The fixed configuration text
 */
export function fixNginxConfig(configText: string): string {
  let fixedConfig = configText;
  
  // Replace "if=$variable = 0" with "if=$variable != 1"
  fixedConfig = fixedConfig.replace(/if=\$([a-zA-Z_]+)\s*=\s*0/g, 'if=$$$1 != 1');
  
  // Replace "if ($variable = 0)" with "if ($variable != 1)"
  fixedConfig = fixedConfig.replace(/if\s*\(\$([a-zA-Z_]+)\s*=\s*0\)/g, 'if ($$$1 != 1)');
  
  // Replace all other equality operators in if statements
  fixedConfig = fixedConfig.replace(/access_log.*if=\$([a-zA-Z_]+)\s*=\s*(\d+)/g, 'access_log /var/log/nginx/denied.log denied if=$$$1 != 1');
  
  return fixedConfig;
}

/**
 * Validates and fixes an Nginx configuration
 * @param configText The Nginx configuration to validate and fix
 * @returns The validated and fixed configuration
 */
export function validateAndFixNginxConfig(configText: string): string {
  const validation = validateNginxConfig(configText);
  
  if (!validation.isValid) {
    console.warn('Nginx configuration has issues:', validation.errors);
    toast.warning(`Fixed ${validation.errors.length} issues in Nginx configuration`);
    return fixNginxConfig(configText);
  }
  
  return configText;
}
