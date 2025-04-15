
// Types for our NGINX configuration data

export interface IpAclGroup {
  name: string;
  description: string; 
  entries: IpAclEntry[];
}

export interface IpAclEntry {
  cidr: string;
  value: string;
  description: string;
}

export interface UrlAclGroup {
  name: string;
  description: string;
  entries: UrlAclEntry[];
}

export interface UrlAclEntry {
  pattern: string;
  value: string;
  description: string;
  isRegex: boolean;
}

export interface CombinedAcl {
  name: string;
  description: string;
  sourceGroups: string[];
  rules: CombinedAclRule[];
}

export interface CombinedAclRule {
  pattern: string;
  value: string;
  description: string;
}

export interface NginxConfig {
  ipAclGroups: IpAclGroup[];
  urlAclGroups: UrlAclGroup[];
  combinedAcls: CombinedAcl[];
}
