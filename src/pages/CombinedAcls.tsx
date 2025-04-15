
import { FC, useState, useEffect } from 'react';
import { CombinedAcl } from '@/types/nginx';
import PageTitle from '@/components/common/PageTitle';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw } from 'lucide-react';
import { loadNginxConfig, saveNginxConfig, getAvailableGroups } from '@/services/nginx-service';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import CombinedAclCard from '@/components/combined-acls/CombinedAclCard';

const CombinedAcls: FC = () => {
  const [combinedAcls, setCombinedAcls] = useState<CombinedAcl[]>([]);
  const [availableGroups, setAvailableGroups] = useState<{ name: string; description: string }[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [newAcl, setNewAcl] = useState<CombinedAcl>({
    name: '',
    description: '',
    sourceGroups: [],
    rules: [],
  });

  const loadConfig = async () => {
    setIsLoading(true);
    try {
      const config = await loadNginxConfig();
      setCombinedAcls(config.combinedAcls || []);
      setAvailableGroups(getAvailableGroups(config));
    } catch (error) {
      console.error('Failed to load configuration:', error);
      toast.error('Failed to load configuration');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleAddAcl = () => {
    if (!newAcl.name) {
      toast.error('Name is required');
      return;
    }
    
    if (newAcl.name.indexOf(' ') >= 0) {
      toast.error('Name cannot contain spaces');
      return;
    }
    
    if (combinedAcls.some(acl => acl.name === newAcl.name)) {
      toast.error('A combined ACL with this name already exists');
      return;
    }
    
    setCombinedAcls([...combinedAcls, newAcl]);
    setIsAddDialogOpen(false);
    setNewAcl({
      name: '',
      description: '',
      sourceGroups: [],
      rules: [],
    });
    
    toast.success('Combined ACL added successfully');
  };

  const handleUpdateAcl = (updatedAcl: CombinedAcl) => {
    const updatedAcls = combinedAcls.map(acl => 
      acl.name === updatedAcl.name ? updatedAcl : acl
    );
    setCombinedAcls(updatedAcls);
  };

  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      const config = await loadNginxConfig();
      const updatedConfig = {
        ...config,
        combinedAcls,
      };
      
      await saveNginxConfig(updatedConfig);
      toast.success('Configuration saved successfully');
    } catch (error) {
      console.error('Failed to save configuration:', error);
      toast.error('Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <PageTitle
          title="Combined ACL Rules"
          description="Manage combined access control logic for complex access patterns"
        />
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadConfig} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleSaveConfig} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Combined ACL
          </Button>
        </div>
      </div>

      {combinedAcls.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            No combined ACL groups defined. Click "Add Combined ACL" to create one.
          </p>
        </div>
      ) : (
        combinedAcls.map((acl) => (
          <CombinedAclCard
            key={acl.name}
            acl={acl}
            availableGroups={availableGroups}
            onUpdateAcl={handleUpdateAcl}
          />
        ))
      )}

      {/* Add New Combined ACL Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Combined ACL</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="new-name">Name</Label>
              <Input
                id="new-name"
                value={newAcl.name}
                onChange={(e) => setNewAcl({ ...newAcl, name: e.target.value })}
                placeholder="combined_access"
              />
              <p className="text-xs text-gray-500">
                Only letters, numbers, and underscores (no spaces)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-description">Description</Label>
              <Input
                id="new-description"
                value={newAcl.description}
                onChange={(e) => setNewAcl({ ...newAcl, description: e.target.value })}
                placeholder="Description for this combined ACL"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddAcl}>Add Combined ACL</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CombinedAcls;
