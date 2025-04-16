
import { FC } from 'react';
import { Button } from '@/components/ui/button';
import { Trash } from 'lucide-react';

interface UrlAclRuleRowProps {
  rule: string;
  onRemove: () => void;
}

const UrlAclRuleRow: FC<UrlAclRuleRowProps> = ({ rule, onRemove }) => {
  return (
    <div className="flex items-center justify-between p-2 border rounded-md">
      <span className="font-mono text-sm">{rule}</span>
      <Button variant="ghost" size="sm" onClick={onRemove} className="text-red-500">
        <Trash className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default UrlAclRuleRow;
