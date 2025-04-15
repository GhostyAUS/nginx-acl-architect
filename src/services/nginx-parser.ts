
import { IpAclGroup, UrlAclGroup, NginxConfig, CombinedAcl, CombinedAclRule } from '@/types/nginx';

// Regular expressions to match different parts of the config
const geoBlockRegex = /geo\s+\$([a-zA-Z_]+)\s+\{([^}]+)\}/g;
const mapBlockRegex = /map\s+\$([^{]+)\s+\$([a-zA-Z_]+)\s+\{([^}]+)\}/g;
const geoEntryRegex = /^\s*([\d.]+\/\d+|[\d.]+)\s+(\d+);(?:\s*#\s*(.*))?$/gm;
const mapEntryRegex = /^\s*"?([^"]+)"?\s+(\d+|"[^"]+");(?:\s*#\s*(.*))?$/gm;
const combinedMapRegex = /^\s*"?([^"]+)"?\s+(\d+|"[^"]+");(?:\s*#\s*(.*))?$/gm;

export function parseNginxConfig(configContent: string): NginxConfig {
  const ipAclGroups: IpAclGroup[] = [];
  const urlAclGroups: UrlAclGroup[] = [];
  const combinedAcls: CombinedAcl[] = [];

  // Extract geo blocks (IP ACLs)
  let geoMatch;
  // Reset regex index
  geoBlockRegex.lastIndex = 0;
  while ((geoMatch = geoBlockRegex.exec(configContent)) !== null) {
    const groupName = geoMatch[1];
    const groupContent = geoMatch[2];
    
    // For the new format, we specifically look for the whitelist variable
    if (groupName === 'whitelist') {
      const entries = [];
      let entryMatch;
      
      // Reset regex index
      geoEntryRegex.lastIndex = 0;
      while ((entryMatch = geoEntryRegex.exec(groupContent)) !== null) {
        entries.push({
          cidr: entryMatch[1],
          value: entryMatch[2],
          description: entryMatch[3] || ''
        });
      }
      
      ipAclGroups.push({
        name: 'whitelist',
        description: 'IP Whitelist',
        entries
      });
    }
  }

  // Extract map blocks (URL ACLs and combined ACLs)
  let mapMatch;
  // Reset regex index
  mapBlockRegex.lastIndex = 0;
  while ((mapMatch = mapBlockRegex.exec(configContent)) !== null) {
    const sourceExpression = mapMatch[1];
    const targetVarName = mapMatch[2];
    const blockContent = mapMatch[3];
    
    // For the new format, we specifically look for is_allowed_url
    if (targetVarName === 'is_allowed_url') {
      const entries = [];
      let entryMatch;
      
      // Reset regex index
      mapEntryRegex.lastIndex = 0;
      while ((entryMatch = mapEntryRegex.exec(blockContent)) !== null) {
        // Skip the "default 0" line
        if (entryMatch[1] === "default") continue;
        
        // Check if the pattern is a regex
        const isRegex = entryMatch[1].startsWith("~");
        
        entries.push({
          pattern: isRegex ? entryMatch[1].substring(1) : entryMatch[1],
          value: entryMatch[2],
          description: entryMatch[3] || '',
          isRegex
        });
      }
      
      urlAclGroups.push({
        name: 'is_allowed_url',
        description: 'URL Whitelist',
        entries
      });
    } else if (targetVarName === 'deny_reason' && sourceExpression.includes('whitelist:$is_allowed_url')) {
      // This is our combined ACL for denial reasons
      const rules: CombinedAclRule[] = [];
      let ruleMatch;
      
      // Reset regex index
      combinedMapRegex.lastIndex = 0;
      while ((ruleMatch = combinedMapRegex.exec(blockContent)) !== null) {
        // Skip the "default" line
        if (ruleMatch[1] === "default") continue;
        
        rules.push({
          pattern: ruleMatch[1],
          value: ruleMatch[2].replace(/"/g, ''),
          description: ruleMatch[3] || ''
        });
      }
      
      combinedAcls.push({
        name: 'deny_reason',
        description: 'Denial Reasons',
        sourceGroups: ['whitelist', 'is_allowed_url'],
        rules
      });
    }
  }

  return { ipAclGroups, urlAclGroups, combinedAcls };
}

export function generateNginxConfig(config: NginxConfig): string {
  let result = `worker_processes auto;
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
        # Allow Individual IPs below:`;

  // Add IP ACL entries
  const ipGroup = config.ipAclGroups.find(g => g.name === 'whitelist');
  if (ipGroup) {
    for (const entry of ipGroup.entries) {
      const comment = entry.description ? `  #${entry.description}` : '';
      result += `\n		${entry.cidr} ${entry.value};${comment}`;
    }
  }

  result += `
        
        # Allow Subnets below:
	172.24.20.0/23 1;
    }
    # ------------------------------------
    # URL WHITELIST
    # url filtering for external addresses - default-deny approach. See Confluence article for more info
       
    map $host $is_allowed_url {
        default 0;  # Block by default - deny unless explicitly allowed
    
        # Allow specific domains below:"   `;

  // Add URL ACL entries
  const urlGroup = config.urlAclGroups.find(g => g.name === 'is_allowed_url');
  if (urlGroup) {
    for (const entry of urlGroup.entries) {
      const pattern = entry.isRegex ? `"~${entry.pattern}"` : `"${entry.pattern}"`;
      const comment = entry.description ? `	#${entry.description}` : '';
      result += `\n        ${pattern.padEnd(30)} ${entry.value};${comment}`;
    }
  }

  result += `

    
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
        if ($whitelist = 0) {
            set $deny_reason "IP not whitelisted: $remote_addr";
	    return 403 "Access denied: Your IP is not whitelisted.";
        }

        # Block disallowed URLs
        if ($is_allowed_url = 0) {
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
            if ($whitelist = 0) {
                set $deny_reason "IP not whitelisted at location level: $remote_addr";
				return 403 "Access denied: Your IP is not whitelisted.";
            }

            # Check URL filtering again at location level
            if ($is_allowed_url = 0) {
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

  return result;
}
