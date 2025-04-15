
import { FC, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Edit, Trash2 } from 'lucide-react';
import { CombinedAclRule } from '@/types/nginx';
import { validateCombinedPattern } from '@/services/nginx-service';

interface CombinedAclRuleRowProps {
  rule: CombinedAclRule;
  onEdit: (original: CombinedAclRule, updated: CombinedAclRule) => void;
  onDelete: (rule: CombinedAclRule) => void;
}

const CombinedAclRuleRow: FC<CombinedAclRuleRowProps> = ({ rule, onEdit, onDelete }) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editedRule, setEditedRule] = useState<CombinedAclRule>(rule);
  const [error, setError] = useState<string | null>(null);

  const handleEdit = () => {
    if (!validateCombinedPattern(editedRule.pattern)) {
      setError('Invalid pattern format');
      return;
    }
    onEdit(rule, editedRule);
    setIsEditDialogOpen(false);
    setError(null);
  };

  return (
    <>
      <tr>
        <td className="px-4 py-3 text-sm font-mono">
          {rule.pattern}
        </td>
        <td className="px-4 py-3 text-sm">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            rule.value === '1' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {rule.value === '1' ? 'Allow' : 'Deny'}
          </span>
        </td>
        <td className="px-4 py-3 text-sm">
          {rule.description || '-'}
        </td>
        <td className="px-4 py-3 text-right">
          <div className="flex justify-end space-x-2">
            <Button variant="ghost" size="icon" onClick={() => setIsEditDialogOpen(true)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(rule)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </td>
      </tr>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Rule</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-pattern">Pattern</Label>
              <Input
                id="edit-pattern"
                value={editedRule.pattern}
                onChange={(e) => setEditedRule({ ...editedRule, pattern: e.target.value })}
                placeholder="~*1 or 11 or .11"
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-value">Action</Label>
              <select
                id="edit-value"
                value={editedRule.value}
                onChange={(e) => setEditedRule({ ...editedRule, value: e.target.value })}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option value="1">Allow</option>
                <option value="0">Deny</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={editedRule.description}
                onChange={(e) => setEditedRule({ ...editedRule, description: e.target.value })}
                placeholder="Description for this rule"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CombinedAclRuleRow;
