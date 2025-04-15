import { FC, useState } from 'react';
import { CombinedAcl, CombinedAclRule } from '@/types/nginx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import CombinedAclRuleRow from './CombinedAclRuleRow';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { validateCombinedPattern } from '@/services/nginx-service';
import { Checkbox } from '@/components/ui/checkbox';

interface CombinedAclCardProps {
  acl: CombinedAcl;
  availableGroups: { name: string; description: string }[];
  onUpdateAcl: (updatedAcl: CombinedAcl) => void;
}

const CombinedAclCard: FC<CombinedAclCardProps> = ({ acl, availableGroups, onUpdateAcl }) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newRule, setNewRule] = useState<CombinedAclRule>({
    pattern: '',
    value: '1',
    description: '',
  });
  const [error, setError] = useState<string | null>(null);

  const handleAddRule = () => {
    if (!validateCombinedPattern(newRule.pattern)) {
      setError('Invalid pattern format');
      return;
    }
    
    const updatedAcl: CombinedAcl = {
      ...acl,
      rules: [...acl.rules, newRule],
    };
    
    onUpdateAcl(updatedAcl);
    setIsAddDialogOpen(false);
    setNewRule({ pattern: '', value: '1', description: '' });
    setError(null);
  };

  const handleEditRule = (original: CombinedAclRule, updated: CombinedAclRule) => {
    const updatedRules = acl.rules.map((rule) =>
      rule.pattern === original.pattern ? updated : rule
    );
    
    onUpdateAcl({
      ...acl,
      rules: updatedRules,
    });
  };

  const handleDeleteRule = (ruleToDelete: CombinedAclRule) => {
    const updatedRules = acl.rules.filter(
      (rule) => rule.pattern !== ruleToDelete.pattern
    );
    
    onUpdateAcl({
      ...acl,
      rules: updatedRules,
    });
  };

  const [isManageGroupsOpen, setIsManageGroupsOpen] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<string[]>(acl.sourceGroups);

  const handleUpdateGroups = () => {
    if (selectedGroups.length < 2) {
      setError('At least two source groups are required');
      return;
    }
    
    onUpdateAcl({
      ...acl,
      sourceGroups: selectedGroups,
    });
    
    setIsManageGroupsOpen(false);
    setError(null);
  };

  return (
    <>
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-xl">{acl.description}</CardTitle>
            <div className="flex flex-wrap gap-1 mt-2">
              {acl.sourceGroups.map((group) => (
                <Badge key={group} variant="outline">
                  {group}
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setIsManageGroupsOpen(true)}>
              Manage Groups
            </Button>
            <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Rule
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Pattern
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {acl.rules.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-center text-sm text-gray-500 dark:text-gray-400">
                      No rules defined in this group
                    </td>
                  </tr>
                ) : (
                  acl.rules.map((rule, index) => (
                    <CombinedAclRuleRow
                      key={`${rule.pattern}-${index}`}
                      rule={rule}
                      onEdit={handleEditRule}
                      onDelete={handleDeleteRule}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Rule</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="new-pattern">Pattern</Label>
              <Input
                id="new-pattern"
                value={newRule.pattern}
                onChange={(e) => setNewRule({ ...newRule, pattern: e.target.value })}
                placeholder="~*1 or 11 or .11"
              />
              <p className="text-xs text-gray-500">
                Use "1" for match, "0" for no match, "." for any value
              </p>
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-value">Action</Label>
              <select
                id="new-value"
                value={newRule.value}
                onChange={(e) => setNewRule({ ...newRule, value: e.target.value })}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option value="1">Allow</option>
                <option value="0">Deny</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-description">Description</Label>
              <Input
                id="new-description"
                value={newRule.description}
                onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                placeholder="Description for this rule"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddRule}>Add Rule</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isManageGroupsOpen} onOpenChange={setIsManageGroupsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Source Groups</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-gray-500">
              Select the groups that will be combined in this ACL. The order is important as it affects the pattern matching.
            </p>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {availableGroups.map((group) => (
                <div key={group.name} className="flex items-center space-x-2">
                  <Checkbox
                    id={`group-${group.name}`}
                    checked={selectedGroups.includes(group.name)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedGroups([...selectedGroups, group.name]);
                      } else {
                        setSelectedGroups(selectedGroups.filter(g => g !== group.name));
                      }
                    }}
                  />
                  <Label htmlFor={`group-${group.name}`} className="flex-1">
                    {group.description} <span className="text-gray-500">({group.name})</span>
                  </Label>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsManageGroupsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateGroups}>Update Groups</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CombinedAclCard;
