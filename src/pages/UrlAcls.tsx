
import { FC, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, Save } from 'lucide-react';
import PageTitle from '@/components/common/PageTitle';
import UrlAclGroupCard from '@/components/url-acls/UrlAclGroupCard';
import { NginxConfig, UrlAclGroup } from '@/types/nginx';
import { loadNginxConfig, saveNginxConfig } from '@/services/nginx-service';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

const UrlAcls: FC = () => {
  const [config, setConfig] = useState<NginxConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    async function fetchConfig() {
      try {
        const data = await loadNginxConfig();
        setConfig(data);
        setError(null);
      } catch (err) {
        setError('Failed to load NGINX configuration');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchConfig();
  }, []);

  const handleUpdateGroup = (index: number, updatedGroup: UrlAclGroup) => {
    if (!config) return;

    const newConfig = { ...config };
    newConfig.urlAclGroups[index] = updatedGroup;
    setConfig(newConfig);
    setHasChanges(true);
  };

  const handleSaveChanges = async () => {
    if (!config) return;

    try {
      await saveNginxConfig(config);
      setHasChanges(false);
    } catch (err) {
      console.error('Failed to save changes:', err);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading NGINX configuration...</div>;
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div>
      <PageTitle
        title="URL-based ACL Management"
        description="Control access to destination domains and URLs"
        actions={
          <Button
            onClick={handleSaveChanges}
            disabled={!hasChanges}
            title={hasChanges ? 'Save changes to nginx.conf' : 'No changes to save'}
          >
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        }
      />

      {config?.urlAclGroups.map((group, index) => (
        <UrlAclGroupCard
          key={group.name}
          group={group}
          onUpdateGroup={(updatedGroup) => handleUpdateGroup(index, updatedGroup)}
        />
      ))}
    </div>
  );
};

export default UrlAcls;
