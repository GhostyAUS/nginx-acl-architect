
import { FC, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, Save } from 'lucide-react';
import PageTitle from '@/components/common/PageTitle';
import IpAclGroupCard from '@/components/ip-acls/IpAclGroupCard';
import { NginxConfig, IpAclGroup } from '@/types/nginx';
import { loadNginxConfig, saveNginxConfig } from '@/services/nginx-service';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

const IpAcls: FC = () => {
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

  const handleUpdateGroup = (index: number, updatedGroup: IpAclGroup) => {
    if (!config) return;

    const newConfig = { ...config };
    newConfig.ipAclGroups[index] = updatedGroup;
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
        title="IP-based ACL Management"
        description="Control access to the proxy based on client IP addresses"
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

      {config?.ipAclGroups.map((group, index) => (
        <IpAclGroupCard
          key={group.name}
          group={group}
          onUpdateGroup={(updatedGroup) => handleUpdateGroup(index, updatedGroup)}
        />
      ))}
    </div>
  );
};

export default IpAcls;
