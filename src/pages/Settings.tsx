
import React, { FC, useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PageTitle from '@/components/common/PageTitle';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from "sonner";
import { 
  FolderOpen, 
  CheckCircle, 
  Save, 
  Upload, 
  Info, 
  FileUp 
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  listConfigFiles, 
  readConfigFile, 
  writeConfigFile, 
  parseNginxFile, 
  generateNginxFile 
} from '@/services/nginx-service';

const Settings: FC = () => {
  const [configText, setConfigText] = useState('');
  const [fileName, setFileName] = useState('');
  const [availableConfigs, setAvailableConfigs] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listConfigFiles().then(files => {
      setAvailableConfigs(files);
    });
  }, []);

  const handleLoadConfig = async (path: string) => {
    try {
      const content = await readConfigFile(path);
      if (content) {
        setConfigText(content);
        setFileName(path.split('/').pop() || path);
        toast.success(`Loaded configuration from ${path}`);
      }
    } catch (error) {
      console.error('Error loading config:', error);
      toast.error('Failed to load configuration');
    }
  };

  const handleUploadConfig = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      // Attempt to parse the config to validate it
      parseNginxFile(text);
      
      setConfigText(text);
      setFileName(file.name);
      toast.success(`Configuration file "${file.name}" uploaded successfully`);
    } catch (error) {
      console.error('Error reading file:', error);
      toast.error('Invalid NGINX configuration file');
    }
  };

  const handleSaveConfig = async () => {
    if (!configText.trim()) {
      toast.error('Configuration cannot be empty');
      return;
    }

    try {
      // Validate the config before saving
      parseNginxFile(configText);

      if (fileName.startsWith('/opt/proxy/') || fileName.startsWith('/etc/nginx/')) {
        await writeConfigFile(fileName, configText);
        toast.success('Configuration saved to Docker volume');
      } else {
        // Download the file if not a Docker volume path
        const blob = new Blob([configText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName || 'nginx.conf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('Configuration downloaded');
      }
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Failed to save configuration');
    }
  };

  return (
    <div>
      <PageTitle
        title="NGINX Configuration Editor"
        description="Edit your NGINX configuration files directly"
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Configuration Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Input
                type="text"
                value={fileName}
                placeholder="No file selected"
                readOnly
                className="flex-grow"
              />
              
              <Button 
                variant="outline" 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2"
              >
                <FileUp className="h-4 w-4" />
                Upload
              </Button>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".conf"
                className="hidden"
                onChange={handleUploadConfig}
              />
            </div>

            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium">Available Configurations:</label>
              <div className="flex flex-wrap gap-2">
                {availableConfigs.map((path) => (
                  <Button
                    key={path}
                    variant="outline"
                    size="sm"
                    onClick={() => handleLoadConfig(path)}
                  >
                    {path.split('/').pop()}
                  </Button>
                ))}
              </div>
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
                onClick={handleSaveConfig}
                disabled={!configText.trim()}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Save Configuration
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
