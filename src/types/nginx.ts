
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

export interface NginxConfig {
  ipAclGroups: IpAclGroup[];
  urlAclGroups: UrlAclGroup[];
}
