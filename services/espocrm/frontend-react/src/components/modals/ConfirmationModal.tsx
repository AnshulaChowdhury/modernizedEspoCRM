import { BaseModal } from './BaseModal';
import { Button } from '@/components/ui/button';
import type { ConfirmationModalConfig } from './types';

interface ConfirmationModalProps {
  config: ConfirmationModalConfig;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationModal({ config, onConfirm, onCancel }: ConfirmationModalProps) {
  const {
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'default',
  } = config;

  return (
    <BaseModal
      open={true}
      onOpenChange={(open) => !open && onCancel()}
      title={title}
      size="sm"
      footer={
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <p className="text-sm text-gray-600">{message}</p>
    </BaseModal>
  );
}
