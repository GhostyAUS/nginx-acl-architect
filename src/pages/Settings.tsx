import { FC, useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PageTitle from '@/components/common/PageTitle';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from "sonner";
import { FolderOpen, CheckCircle, Save, Upload, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { validateAndFixNginxConfig } from '@/services/nginx-validator';

const Settings: FC = () => {
  const [configText, setConfigText] = useState('');
  const [fileName, setFileName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [hasValidationErrors, setHasValidationErrors] = useState(false);
  const [availableConfigs, setAvailableConfigs] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load available config files when component mounts
    listConfigFiles().then(files => {
      setAvailableConfigs(files);
    });
  }, []);

  const handleConfigSelect = async (path: string) => {
    try {
      const content = await readConfigFile(path);
      if (content) {
        setConfigText(content);
        setFileName(path);
        toast.success(`Loaded configuration from ${path}`);
      }
    } catch (error) {
      console.error('Error loading config:', error);
      toast.error('Failed to load configuration');
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

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const fixedConfig = validateAndFixNginxConfig(text);
      setConfigText(fixedConfig);
      setFileName(file.name);
      
      toast.success(`Configuration file "${file.name}" loaded successfully`);
      setHasValidationErrors(false);
    } catch (error) {
      console.error('Error reading file:', error);
      toast.error('Failed to read configuration file');
    }
  };

  const openFileBrowser = () => {
    fileInputRef.current?.click();
  };

  const handleSaveFile = async () => {
    if (!configText.trim()) {
      toast.error('Configuration cannot be empty');
      return;
    }

    try {
      if (fileName.startsWith('/opt/proxy/') || fileName.startsWith('/etc/nginx/')) {
        await writeConfigFile(fileName, configText);
      } else {
        // Default save to file system if not a Docker volume path
        const blob = new Blob([configText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName || 'nginx.conf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      
      toast.success('Configuration saved successfully');
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Failed to save configuration');
    }
  };

  const createNewConfig = () => {
    setConfigText(`# NGINX Configuration File
# Created with NGINX ACL Architect

user  nginx;
worker_processes  auto;

error_log  /var/log/nginx/error.log notice;
pid        /var/run/nginx.pid;

events {
    worker_connections  1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # Access control settings
    # Add your ACL configurations here
    
    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

    access_log  /var/log/nginx/access.log  main;

    sendfile        on;
    keepalive_timeout  65;
    
    # Include configuration files
    include /etc/nginx/conf.d/*.conf;
}
`);
    setFileName('new-nginx.conf');
    toast.success('Created new configuration template');
  };

  return (
    <div>
      <PageTitle
        title="NGINX Configuration Editor"
        description="Edit your NGINX configuration files directly"
      />

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Configuration Editor</CardTitle>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Info className="h-4 w-4 mr-1" />
                Help
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>NGINX Configuration Help</DialogTitle>
                <DialogDescription>
                  This is a simplified editor for NGINX configuration files.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <h3 className="font-medium">Usage:</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Click "Browse" to open an existing nginx.conf file from your computer</li>
                  <li>Click "Create New" to start with a template configuration</li>
                  <li>Use "Validate" to check your configuration for syntax errors</li>
                  <li>Click "Save File" to download the configuration to your computer</li>
                  <li>After saving, you can upload the file to your server manually</li>
                </ul>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium">Available Configurations:</label>
              <div className="flex flex-wrap gap-2">
                {availableConfigs.map((path) => (
                  <Button
                    key={path}
                    variant="outline"
                    size="sm"
                    onClick={() => handleConfigSelect(path)}
                  >
                    {path.split('/').pop()}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <Input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="No file selected"
                className="flex-grow"
                readOnly
              />
              <Button 
                variant="secondary" 
                className="flex items-center gap-2" 
                onClick={openFileBrowser}
              >
                <FolderOpen className="h-4 w-4" />
                Browse
              </Button>
              <Button 
                variant="outline" 
                className="flex items-center gap-2" 
                onClick={createNewConfig}
              >
                <Upload className="h-4 w-4" />
                Create New
              </Button>
              <input
                ref={fileInputRef}
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

            <Textarea
              className="font-mono h-96 mb-4"
              value={configText}
              onChange={(e) => setConfigText(e.target.value)}
              placeholder="Load a configuration file or create a new one..."
            />

            <div className="flex justify-end gap-2">
              <Button 
                variant="default"
                className="flex items-center gap-2"
                onClick={handleSaveFile}
                disabled={isUpdating || !configText.trim()}
              >
                <Save className="h-4 w-4" />
                Save File
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
