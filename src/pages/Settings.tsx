
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
  generateNginxFile,
  loadNginxConfig,
  saveNginxConfig
} from '@/services/nginx-service';

const Settings: FC = () => {
  const [configText, setConfigText] = useState('');
  const [fileName, setFileName] = useState('');
  const [availableConfigs, setAvailableConfigs] = useState<string[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listConfigFiles().then(files => {
      setAvailableConfigs(files);
    });
  }, []);

  const handleLoadConfig = async (path: string) => {
    try {
      // Clear previous errors
      setParseError(null);
      
      const content = await readConfigFile(path);
      if (content) {
        setConfigText(content);
        setFileName(path);
        
        // Parse the config text to update the application state
        try {
          const parsedConfig = parseNginxFile(content);
          await saveNginxConfig(parsedConfig);
          toast.success(`Loaded and parsed configuration from ${path}`);
        } catch (parseError) {
          console.error('Error parsing config:', parseError);
          setParseError(`The configuration was loaded but could not be parsed properly. You can still edit it manually.`);
          toast.error('Configuration loaded but could not be parsed. The file may have an invalid format.');
        }
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
      // Clear previous errors
      setParseError(null);
      
      const text = await file.text();
      setConfigText(text);
      setFileName(file.name);
      
      // Try to parse the config
      try {
        // Attempt to parse the config to validate it
        const parsedConfig = parseNginxFile(text);
        
        // Update the application state with the parsed config
        await saveNginxConfig(parsedConfig);
        toast.success(`Configuration file "${file.name}" uploaded and parsed successfully`);
      } catch (parseError) {
        console.error('Error parsing uploaded file:', parseError);
        setParseError(`The uploaded file could not be parsed properly. You can still edit it manually.`);
        toast.warning('Configuration was uploaded but has format issues');
      }
      
      // Reset the input to allow uploading the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error reading file:', error);
      toast.error('Failed to read uploaded file');
    }
  };

  const handleSaveConfig = async () => {
    if (!configText.trim()) {
      toast.error('Configuration cannot be empty');
      return;
    }

    try {
      // Try to parse before saving, but allow saving even if parsing fails
      let parsedConfig;
      try {
        parsedConfig = parseNginxFile(configText);
        await saveNginxConfig(parsedConfig);
        setParseError(null);
      } catch (parseError) {
        console.warn('Config saved but parsing had issues:', parseError);
        setParseError(`The configuration was saved but has syntax issues that prevent proper parsing.`);
      }

      // Save the file content regardless of parsing success
      await writeConfigFile(fileName, configText);
      toast.success('Configuration saved successfully');
      
      // Refresh available configs list
      const files = await listConfigFiles();
      setAvailableConfigs(files);
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
                onChange={(e) => setFileName(e.target.value)}
                placeholder="Enter filename or path"
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
                    {path.includes('/') ? path.split('/').pop() : path}
                  </Button>
                ))}
              </div>
            </div>

            {parseError && (
              <div className="bg-amber-100 border-l-4 border-amber-500 text-amber-700 p-4 mb-4">
                <div className="flex items-center">
                  <Info className="h-5 w-5 mr-2" />
                  <p>{parseError}</p>
                </div>
              </div>
            )}

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
