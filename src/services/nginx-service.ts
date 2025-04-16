import { NginxConfig } from '@/types/nginx';
import { parseNginxConfig, generateNginxConfig } from './nginx-parser';
import { toast } from "sonner";
import { validateNginxConfig, validateAndFixNginxConfig } from './nginx-validator';

// Sample nginx.conf content for initial loading/testing with the new format
const sampleConfig = `worker_processes auto;
daemon off;

events {
    worker_connections 1024;
}

http {
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
   
    log_format denied '$remote_addr - [$time_local] "$request" '
                      '$status "$http_user_agent" "$http_referer" '
                      'Host: "$host" URI: "$request_uri" '
                      'Client: "$remote_addr" '
                      'Reason: "$deny_reason"';
	   
    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log info;
    access_log /var/log/nginx/denied.log denied if=$deny_log;


#==============================================================================
    #IP WHITELIST
    # Use geo module to determine if incoming IP is on whitelist
    # use CIDR notation and the below format, also add the server name as a reference
    geo $whitelist {
        default 0;
        # Allow Individual IPs below:
		172.24.20.12/32 1;  #MOTPERWU01 wsus
		172.24.20.16/32 1;  #motperap04 rhel repo
     		172.28.33.2/32  1;  # TestWin10-01 defender test wonmunna
		172.28.36.4/32  1;  #TestSvr2022-01 defender test wonmunna
		172.28.36.5/32  1;  #TestLinux-01 defender test wonmunna
        
        # Allow Subnets below:
	172.24.20.0/23 1;
    }
    # ------------------------------------
    # URL WHITELIST
    # url filtering for external addresses - default-deny approach. See Confluence article for more info
       
    map $host $is_allowed_url {
        default 0;  # Block by default - deny unless explicitly allowed
    
        # Allow specific domains below:"   
        "~^.*\\.microsoft\\.com$"          1;	#motperwu01
	"~^.*\\.windowsupdate\\.com$"      1;	#motperwu01
        "subscription.rhn.redhat.com"    1;	#motperap04
       "subscription.rhsm.redhat.com"    1;	#motperap04
        "cdn.redhat.com"	 	 1;	#motperap04
 	"~^.*\\.akamaiedge\\.net$"	 1;	#motperap04
	"~^.*\\.akamaitechnologies\\.com$" 1;	#motperap04
	"~^.*\\.windows\\.net$"            1;	#defender EDR

    
    }
# END OF CODE TO EDIT, DO NOT EDIT BELOW.
# ==============================================================================

    # Variables for logging denied requests
    map $status $deny_log {
        ~^4 1;  # Log all 4xx responses (including 403 denied requests)
        default 0;
    }
    
    # Map to set denial reason
    map "$whitelist:$is_allowed_url" $deny_reason {
        "0:0" "IP not whitelisted and URL not allowed";
        "0:1" "IP not whitelisted";
        "1:0" "URL not in allowed list";
        default "";
    }

    server {
        listen 8080;
		# External DNS server/s
        resolver 8.8.8.8 1.1.1.1 ipv6=off;

        # Use the geo variable for access control
        if ($whitelist != 1) {
            set $deny_reason "IP not whitelisted: $remote_addr";
	    return 403 "Access denied: Your IP is not whitelisted.";
        }

        # Block disallowed URLs
        if ($is_allowed_url != 1) {
            set $deny_reason "URL not in allowed list: $host";
	    return 403 "Access denied: This URL is not in the allowed list.";
        }

        # HTTPS CONNECT method handling
        proxy_connect;
        proxy_connect_allow all;  # Allow all ports for HTTPS connections
        proxy_connect_connect_timeout 10s;
        proxy_connect_read_timeout 60s;
        proxy_connect_send_timeout 60s;

        # Security headers
        proxy_hide_header Upgrade;
        proxy_hide_header X-Powered-By;
        add_header Content-Security-Policy "upgrade-insecure-requests";
        add_header X-Frame-Options "SAMEORIGIN";
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Cache-Control "no-transform" always;
        add_header Referrer-Policy no-referrer always;
        add_header X-Robots-Tag none;

        # HTTP forwarding
        location / {
            # Check whitelist again at location level
            if ($whitelist != 1) {
                set $deny_reason "IP not whitelisted at location level: $remote_addr";
				return 403 "Access denied: Your IP is not whitelisted.";
            }

            # Check URL filtering again at location level
            if ($is_allowed_url != 1) {
                set $deny_reason "URL not in allowed list at location level: $host";
				return 403 "Access denied: This URL is not in the allowed list.";
            }

            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header Connection "";  # Enable keepalives
            proxy_pass $scheme://$host$request_uri;  # Include $request_uri

            # Additional useful headers
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # Timeouts for better reliability
            proxy_connect_timeout 10s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
			
      } #End of Location Block
  } #End of Server Block
} #End of HTTP Block`;

export const DEFAULT_NGINX_CONF_PATH = '/usr/local/nginx/conf/nginx.conf';

// Add this new function to read the default nginx.conf
export async function loadDefaultNginxConfig(): Promise<string> {
  try {
    // Browser security doesn't allow accessing local files with file:// protocol
    // Using our fallback sample config instead
    console.log(`Using sample nginx configuration since browser can't directly access local files`);
    
    // We're running in a browser environment, use the sample config
    let configText = sampleConfig;
    
    // Fix any potential syntax errors with the "=" operator in conditions
    configText = fixNginxSyntaxErrors(configText);
    
    return configText;
  } catch (error) {
    console.error('Failed to load default nginx config:', error);
    toast.error('Failed to load default nginx configuration');
    // Fallback to sample config if we can't load the actual file
    return sampleConfig;
  }
}

// New function to fix common Nginx syntax errors
export function fixNginxSyntaxErrors(configText: string): string {
  // Replace "if ($variable = 0)" with "if ($variable != 1)"
  return configText.replace(/if\s*\(\$([a-zA-Z_]+)\s*=\s*0\)/g, 'if ($$$1 != 1)');
}

// In a production environment, this would be an API call to load the nginx.conf file
export async function loadNginxConfig(): Promise<NginxConfig> {
  try {
    // In production, this would be a fetch to an API endpoint that reads the file
    // const response = await fetch('/api/nginx/config');
    // const data = await response.text();
    // return parseNginxConfig(data);
    
    // For now, we'll use our sample config
    return parseNginxConfig(sampleConfig);
  } catch (error) {
    console.error('Failed to load NGINX configuration:', error);
    toast.error('Failed to load NGINX configuration');
    throw error;
  }
}

// In a production environment, this would be an API call to save the nginx.conf file
export async function saveNginxConfig(config: NginxConfig): Promise<boolean> {
  try {
    const generatedConfig = generateNginxConfig(config);
    console.log('Generated NGINX config:', generatedConfig);
    
    // In production, this would be a POST to an API endpoint that writes the file
    // const response = await fetch('/api/nginx/config', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'text/plain',
    //   },
    //   body: generatedConfig,
    // });
    
    // if (!response.ok) {
    //   throw new Error(`Failed to save configuration: ${response.statusText}`);
    // }
    
    toast.success('NGINX configuration saved successfully');
    return true;
  } catch (error) {
    console.error('Failed to save NGINX configuration:', error);
    toast.error('Failed to save NGINX configuration');
    return false;
  }
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
