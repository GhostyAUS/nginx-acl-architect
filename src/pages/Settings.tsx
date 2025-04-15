
import { FC, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PageTitle from '@/components/common/PageTitle';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { saveNginxConfig, loadDefaultNginxConfig, DEFAULT_NGINX_CONF_PATH, fixNginxSyntaxErrors } from '@/services/nginx-service';
import { parseNginxConfig, generateNginxConfig } from '@/services/nginx-parser';
import { validateAndFixNginxConfig } from '@/services/nginx-validator';
import { toast } from "sonner";
import { FolderOpen, ShieldX, CheckCircle } from 'lucide-react';

const GLOBAL_DENY_ACL = `
    # Global Deny ACL - DO NOT REMOVE OR MODIFY
    map $host $global_deny {
        default 1;  # Deny by default
        "~*" 0;    # Allow if any other ACL permits
    }

    # Final access decision with global deny
    map "$access_granted$global_deny" $final_access {
        default 0;
        "10" 1;    # Only allow if access_granted=1 and global_deny=0
    }`;

const Settings: FC = () => {
  const [configText, setConfigText] = useState('');
  const [configPath, setConfigPath] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [hasGlobalDeny, setHasGlobalDeny] = useState(false);
  const [hasValidationErrors, setHasValidationErrors] = useState(false);

  useEffect(() => {
    // Load the default nginx.conf on component mount
    const loadConfig = async () => {
      try {
        const config = await loadDefaultNginxConfig();
        // Validate and fix any syntax issues automatically on load
        const fixedConfig = validateAndFixNginxConfig(config);
        setConfigText(fixedConfig);
        setConfigPath(DEFAULT_NGINX_CONF_PATH);
        checkGlobalDeny(fixedConfig);
      } catch (error) {
        console.error('Error loading default config:', error);
        toast.error('Failed to load default nginx configuration');
      }
    };

    loadConfig();
  }, []);

  const checkGlobalDeny = (config: string) => {
    const hasGlobalDenyAcl = config.includes('map $host $global_deny') && 
                            config.includes('map "$access_granted$global_deny" $final_access');
    setHasGlobalDeny(hasGlobalDenyAcl);
    return hasGlobalDenyAcl;
  };

  const handleAddGlobalDeny = () => {
    if (hasGlobalDeny) {
      toast.error('Global deny ACL already exists');
      return;
    }

    try {
      // Find the position before the "END OF CODE TO EDIT" comment
      const endMarker = '# END OF CODE TO EDIT';
      const endPosition = configText.indexOf(endMarker);
      
      if (endPosition === -1) {
        setConfigText(configText + '\n' + GLOBAL_DENY_ACL);
      } else {
        const newConfig = configText.slice(0, endPosition) + 
                         GLOBAL_DENY_ACL + '\n\n' + 
                         configText.slice(endPosition);
        setConfigText(newConfig);
      }

      setHasGlobalDeny(true);
      toast.success('Global deny ACL added successfully');
    } catch (error) {
      console.error('Error adding global deny ACL:', error);
      toast.error('Failed to add global deny ACL');
    }
  };

  const handleValidateConfig = () => {
    try {
      const fixedConfig = validateAndFixNginxConfig(configText);
      if (fixedConfig !== configText) {
        setConfigText(fixedConfig);
        toast.success('Configuration validated and fixed');
        setHasValidationErrors(false);
      } else {
        toast.success('Configuration is valid');
        setHasValidationErrors(false);
      }
    } catch (error) {
      console.error('Error validating configuration:', error);
      toast.error('Failed to validate configuration');
      setHasValidationErrors(true);
    }
  };

  const handleFormatConfig = () => {
    try {
      // Parse and regenerate to format
      const parsed = parseNginxConfig(configText);
      const formatted = generateNginxConfig(parsed);
      setConfigText(formatted);
      toast.success('Configuration formatted successfully');
    } catch (error) {
      console.error('Error formatting configuration:', error);
      toast.error('Failed to format configuration. Check syntax and try again.');
    }
  };

  const handleSaveConfig = async () => {
    if (!configPath) {
      toast.error('Please select a configuration file first');
      return;
    }

    if (!hasGlobalDeny) {
      toast.error('Global deny ACL is required for security. Please add it before saving.');
      return;
    }

    setIsUpdating(true);
    try {
      // Fix any syntax errors before parsing
      const fixedConfig = validateAndFixNginxConfig(configText);
      if (fixedConfig !== configText) {
        setConfigText(fixedConfig);
        toast.success('Fixed syntax errors in configuration');
      }
      
      // Parse the config text to validate it
      const parsed = parseNginxConfig(fixedConfig);
      await saveNginxConfig(parsed);
      toast.success('Configuration saved successfully');
      setHasValidationErrors(false);
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast.error('Failed to save configuration. Check syntax and try again.');
      setHasValidationErrors(true);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const fixedConfig = validateAndFixNginxConfig(text);
      setConfigText(fixedConfig);
      setConfigPath(file.name);
      
      // Check for global deny ACL when loading file
      if (!checkGlobalDeny(fixedConfig)) {
        toast.warning('Global deny ACL not found in configuration. Please add it for security.');
      }
      
      toast.success('Configuration file loaded successfully');
    } catch (error) {
      console.error('Error reading file:', error);
      toast.error('Failed to read configuration file');
    }
  };

  return (
    <div>
      <PageTitle
        title="NGINX Configuration"
        description="Advanced configuration settings for NGINX proxy ACLs"
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Raw Configuration Editor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <Input
              type="text"
              value={configPath}
              placeholder="No file selected"
              readOnly
              className="flex-grow"
            />
            <Button variant="outline" className="flex items-center gap-2" onClick={() => document.getElementById('file-input')?.click()}>
              <FolderOpen className="h-4 w-4" />
              Browse
            </Button>
            <input
              id="file-input"
              type="file"
              accept=".conf"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
          
          <div className="flex items-center gap-2 mb-4">
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={handleAddGlobalDeny}
              disabled={hasGlobalDeny}
            >
              <ShieldX className="h-4 w-4" />
              Add Global Deny ACL
            </Button>
            {hasGlobalDeny && (
              <span className="text-sm text-green-600 dark:text-green-400">
                Global deny ACL is present
              </span>
            )}
            
            <Button
              variant="outline"
              className="flex items-center gap-2 ml-4"
              onClick={handleValidateConfig}
            >
              <CheckCircle className="h-4 w-4" />
              Validate Configuration
            </Button>
            
            {hasValidationErrors && (
              <span className="text-sm text-red-600 dark:text-red-400">
                Configuration has syntax errors
              </span>
            )}
          </div>

          <p className="mb-4 text-gray-600 dark:text-gray-400">
            Edit the raw NGINX configuration file. Be careful with syntax as incorrect configurations
            may cause the proxy to malfunction.
          </p>

          <Textarea
            className="font-mono h-96 mb-4"
            value={configText}
            onChange={(e) => setConfigText(e.target.value)}
            placeholder="Paste your nginx.conf content here..."
          />

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleFormatConfig}>
              Format
            </Button>
            <Button 
              onClick={handleSaveConfig} 
              disabled={isUpdating || !configPath || !hasGlobalDeny || hasValidationErrors}
            >
              {isUpdating ? 'Saving...' : 'Save Configuration'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
