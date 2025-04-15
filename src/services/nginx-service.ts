import { NginxConfig, CombinedAclRule } from '@/types/nginx';
import { parseNginxConfig, generateNginxConfig } from './nginx-parser';
import { toast } from "sonner";

// Sample nginx.conf content for initial loading/testing
const sampleConfig = `worker_processes auto;
daemon off;
events {
    worker_connections 1024;
}

http {
    # Log formats remain unchanged
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
    # Structured ACL Definitions
    # IP-based ACL Groups
    geo $acl_internal_ips {
        default 0;
        # Production network
        172.24.20.0/23 1;  # Main production subnet
        
        # Individual production hosts
        172.24.20.12/32 1;  # MOTPERWU01 wsus
        172.24.20.16/32 1;  # motperap04 rhel repo
    }

    geo $acl_test_ips {
        default 0;
        # Test environment IPs
        172.28.33.2/32  1;  # TestWin10-01 defender test wonmunna
        172.28.36.4/32  1;  # TestSvr2022-01 defender test wonmunna
        172.28.36.5/32  1;  # TestLinux-01 defender test wonmunna
    }

    # URL-based ACL Groups
    map $host $acl_microsoft_urls {
        default 0;
        "~^.*\\.microsoft\\.com$"          1;  # Microsoft domains
        "~^.*\\.windowsupdate\\.com$"      1;
        "~^.*\\.windows\\.net$"            1;  # Defender EDR
    }

    map $host $acl_redhat_urls {
        default 0;
        "subscription.rhn.redhat.com"    1;
        "subscription.rhsm.redhat.com"   1;
        "cdn.redhat.com"                 1;
    }

    map $host $acl_cdn_urls {
        default 0;
        "~^.*\\.akamaiedge\\.net$"         1;
        "~^.*\\.akamaitechnologies\\.com$" 1;
    }

    # Combined ACL Logic
    map "$acl_internal_ips$acl_test_ips" $ip_acl {
        default 0;
        "~*1" 1;  # Allow if either internal or test IPs match
    }

    map "$acl_microsoft_urls$acl_redhat_urls$acl_cdn_urls" $url_acl {
        default 0;
        "~*1" 1;  # Allow if any URL group matches
    }

    # Final Access Decision
    map "$ip_acl$url_acl" $access_granted {
        default 0;
        "11" 1;  # Both IP and URL must be allowed
    }

    # Denial Reasons Mapping
    map "$ip_acl$url_acl" $deny_reason {
        "00" "Both IP and URL not allowed";
        "01" "IP not whitelisted";
        "10" "URL not allowed";
        default "";
    }

# END OF CODE TO EDIT, DO NOT EDIT BELOW.
# ==============================================================================
    server {
        listen 8080;
        resolver 8.8.8.8 1.1.1.1 ipv6=off;

        # Centralized ACL Check
        if ($access_granted = 0) {
            return 403 "Access Denied: $deny_reason";
        }

        # Security headers and proxy settings remain unchanged
        proxy_connect;
        proxy_connect_allow all;
        proxy_connect_connect_timeout 10s;
        proxy_connect_read_timeout 60s;
        proxy_connect_send_timeout 60s;

        proxy_hide_header Upgrade;
        proxy_hide_header X-Powered-By;
        add_header Content-Security-Policy "upgrade-insecure-requests";
        add_header X-Frame-Options "SAMEORIGIN";
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Cache-Control "no-transform" always;
        add_header Referrer-Policy no-referrer always;
        add_header X-Robots-Tag none;

        location / {
            # Single ACL check instead of duplicate validations
            if ($access_granted = 0) {
                set $deny_reason "$deny_reason (location level)";
                return 403 "Access Denied: $deny_reason";
            }

            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header Connection "";
            proxy_pass $scheme://$host$request_uri;

            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            proxy_connect_timeout 10s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }
    }
}`;

export const DEFAULT_NGINX_CONF_PATH = '/usr/local/nginx/conf/nginx.conf';

// Add this new function to read the default nginx.conf
export async function loadDefaultNginxConfig(): Promise<string> {
  try {
    const response = await fetch(`file://${DEFAULT_NGINX_CONF_PATH}`);
    if (!response.ok) {
      throw new Error(`Failed to load nginx config: ${response.statusText}`);
    }
    return await response.text();
  } catch (error) {
    console.error('Failed to load default nginx config:', error);
    toast.error('Failed to load default nginx configuration');
    throw error;
  }
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

// Validate a combined ACL pattern
export function validateCombinedPattern(pattern: string): boolean {
  if (!pattern.trim()) {
    return false;
  }
  
  // For combined patterns, allow:
  // - "~*1" (regex that matches any 1)
  // - "11" (exact match for specific positions)
  // - ".11" (wildcard for first position, then 1s)
  // - etc.
  
  // Simplified validation: each character should be a 1, 0, or . (wildcard)
  return /^(~\*\d|\d|\.)+$/.test(pattern);
}

// Get available groups for combined ACLs
export function getAvailableGroups(config: NginxConfig): { name: string, description: string }[] {
  const ipGroups = config.ipAclGroups.map(group => ({
    name: group.name,
    description: group.description
  }));
  
  const urlGroups = config.urlAclGroups.map(group => ({
    name: group.name,
    description: group.description
  }));
  
  return [...ipGroups, ...urlGroups];
}
