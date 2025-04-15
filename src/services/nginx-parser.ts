
import { IpAclGroup, UrlAclGroup, NginxConfig, CombinedAcl, CombinedAclRule } from '@/types/nginx';

// Regular expressions to match different parts of the config
const geoBlockRegex = /geo\s+\$([a-zA-Z_]+)\s+\{([^}]+)\}/g;
const mapBlockRegex = /map\s+\$([^{]+)\s+\$([a-zA-Z_]+)\s+\{([^}]+)\}/g;
const geoEntryRegex = /^\s*([\d.]+\/\d+|[\d.]+)\s+(\d+);(?:\s*#\s*(.*))?$/gm;
const mapEntryRegex = /^\s*"?([^"]+)"?\s+(\d+|"[^"]+");(?:\s*#\s*(.*))?$/gm;
const combinedMapRegex = /^\s*"?([^"]+)"?\s+(\d+);(?:\s*#\s*(.*))?$/gm;
const sourceGroupsExtractRegex = /\$([a-zA-Z_]+)/g;

export function parseNginxConfig(configContent: string): NginxConfig {
  const ipAclGroups: IpAclGroup[] = [];
  const urlAclGroups: UrlAclGroup[] = [];
  const combinedAcls: CombinedAcl[] = [];

  // Extract geo blocks (IP ACLs)
  let geoMatch;
  while ((geoMatch = geoBlockRegex.exec(configContent)) !== null) {
    const groupName = geoMatch[1];
    const groupContent = geoMatch[2];
    
    // Skip non-ACL geo blocks
    if (!groupName.startsWith('acl_')) continue;
    
    const entries = [];
    let entryMatch;
    
    while ((entryMatch = geoEntryRegex.exec(groupContent)) !== null) {
      entries.push({
        cidr: entryMatch[1],
        value: entryMatch[2],
        description: entryMatch[3] || ''
      });
    }
    
    ipAclGroups.push({
      name: groupName,
      description: getGroupDescription(groupName),
      entries
    });
  }

  // Extract map blocks (URL ACLs and combined ACLs)
  let mapMatch;
  while ((mapMatch = mapBlockRegex.exec(configContent)) !== null) {
    const sourceExpression = mapMatch[1];
    const targetVarName = mapMatch[2];
    const blockContent = mapMatch[3];
    
    // Check if this is a combined ACL (source contains multiple variables)
    const containsMultipleVars = (sourceExpression.match(/\$/g) || []).length > 1;
    
    if (containsMultipleVars) {
      // This is a combined ACL
      const sourceGroups: string[] = [];
      let sourceGroupMatch;
      while ((sourceGroupMatch = sourceGroupsExtractRegex.exec(sourceExpression)) !== null) {
        sourceGroups.push(sourceGroupMatch[1]);
      }
      
      const rules: CombinedAclRule[] = [];
      let ruleMatch;
      
      while ((ruleMatch = combinedMapRegex.exec(blockContent)) !== null) {
        // Skip the "default 0" line
        if (ruleMatch[1] === "default") continue;
        
        rules.push({
          pattern: ruleMatch[1],
          value: ruleMatch[2],
          description: ruleMatch[3] || ''
        });
      }
      
      combinedAcls.push({
        name: targetVarName,
        description: getGroupDescription(targetVarName),
        sourceGroups,
        rules
      });
    } else if (targetVarName.startsWith('acl_')) {
      // This is a URL ACL group
      const entries = [];
      let entryMatch;
      
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
        name: targetVarName,
        description: getGroupDescription(targetVarName),
        entries
      });
    }
  }

  return { ipAclGroups, urlAclGroups, combinedAcls };
}

function getGroupDescription(groupName: string): string {
  const descriptionMap: Record<string, string> = {
    acl_internal_ips: 'Internal Production Network',
    acl_test_ips: 'Test Environment IPs',
    acl_microsoft_urls: 'Microsoft Services',
    acl_redhat_urls: 'Red Hat Services',
    acl_cdn_urls: 'Content Delivery Networks',
    ip_acl: 'Combined IP Access Control',
    url_acl: 'Combined URL Access Control',
    access_granted: 'Final Access Decision'
  };
  
  return descriptionMap[groupName] || groupName;
}

export function generateNginxConfig(config: NginxConfig): string {
  let result = `worker_processes auto;
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
`;

  // Add IP ACL Groups
  for (const group of config.ipAclGroups) {
    result += `    geo $${group.name} {\n`;
    result += `        default 0;\n`;
    
    for (const entry of group.entries) {
      const comment = entry.description ? `  # ${entry.description}` : '';
      result += `        ${entry.cidr} ${entry.value};${comment}\n`;
    }
    
    result += `    }\n\n`;
  }

  // Add URL ACL Groups
  result += `    # URL-based ACL Groups\n`;
  for (const group of config.urlAclGroups) {
    result += `    map $host $${group.name} {\n`;
    result += `        default 0;\n`;
    
    for (const entry of group.entries) {
      const pattern = entry.isRegex ? `"~^${entry.pattern}$"` : `"${entry.pattern}"`;
      const comment = entry.description ? `  # ${entry.description}` : '';
      result += `        ${pattern.padEnd(30)} ${entry.value};${comment}\n`;
    }
    
    result += `    }\n\n`;
  }

  // Add Combined ACL Logic
  if (config.combinedAcls && config.combinedAcls.length > 0) {
    result += `    # Combined ACL Logic\n`;
    
    for (const acl of config.combinedAcls) {
      // Create the source expression by joining all source groups with a $
      const sourceExpression = acl.sourceGroups.map(group => `$${group}`).join('');
      
      result += `    map "${sourceExpression}" $${acl.name} {\n`;
      result += `        default 0;\n`;
      
      for (const rule of acl.rules) {
        const comment = rule.description ? `  # ${rule.description}` : '';
        result += `        "${rule.pattern}" ${rule.value};${comment}\n`;
      }
      
      result += `    }\n\n`;
    }
  } else {
    // Default combined ACL logic for backward compatibility
    result += `    # Combined ACL Logic\n`;
    result += `    map "$acl_internal_ips$acl_test_ips" $ip_acl {\n`;
    result += `        default 0;\n`;
    result += `        "~*1" 1;  # Allow if either internal or test IPs match\n`;
    result += `    }\n\n`;
    
    result += `    map "$acl_microsoft_urls$acl_redhat_urls$acl_cdn_urls" $url_acl {\n`;
    result += `        default 0;\n`;
    result += `        "~*1" 1;  # Allow if any URL group matches\n`;
    result += `    }\n\n`;
    
    result += `    # Final Access Decision\n`;
    result += `    map "$ip_acl$url_acl" $access_granted {\n`;
    result += `        default 0;\n`;
    result += `        "11" 1;  # Both IP and URL must be allowed\n`;
    result += `    }\n\n`;
  }
  
  result += `    # Denial Reasons Mapping\n`;
  result += `    map "$ip_acl$url_acl" $deny_reason {\n`;
  result += `        "00" "Both IP and URL not allowed";\n`;
  result += `        "01" "IP not whitelisted";\n`;
  result += `        "10" "URL not allowed";\n`;
  result += `        default "";\n`;
  result += `    }\n\n`;

  result += `# END OF CODE TO EDIT, DO NOT EDIT BELOW.
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

  return result;
}
