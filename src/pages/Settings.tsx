
import { FC, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PageTitle from '@/components/common/PageTitle';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { saveNginxConfig } from '@/services/nginx-service';
import { parseNginxConfig, generateNginxConfig } from '@/services/nginx-parser';
import { toast } from "sonner";
import { FolderOpen } from 'lucide-react';

const Settings: FC = () => {
  const [configText, setConfigText] = useState('');
  const [configPath, setConfigPath] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

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

    setIsUpdating(true);
    try {
      // Parse the config text to validate it
      const parsed = parseNginxConfig(configText);
      await saveNginxConfig(parsed);
      toast.success('Configuration saved successfully');
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast.error('Failed to save configuration. Check syntax and try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      setConfigText(text);
      setConfigPath(file.name);
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
            <Button onClick={handleSaveConfig} disabled={isUpdating || !configPath}>
              {isUpdating ? 'Saving...' : 'Save Configuration'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
