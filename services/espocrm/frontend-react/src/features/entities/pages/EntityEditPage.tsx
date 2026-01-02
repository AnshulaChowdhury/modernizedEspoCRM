import React from 'react';
import { useParams } from 'react-router-dom';
import { useMetadata } from '@/lib/metadata/useMetadata';
import { useAcl } from '@/lib/acl';
import { RecordEdit } from '../components';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export default function EntityEditPage(): React.ReactElement {
  const { entityType = '', id = '' } = useParams<{ entityType: string; id: string }>();
  const { isLoading: metadataLoading, isEntityEnabled } = useMetadata();
  const { checkScope } = useAcl();

  // Show loading while metadata is being fetched
  if (metadataLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const enabled = isEntityEnabled(entityType);
  const canEdit = checkScope(entityType, 'edit');

  if (!enabled) {
    return (
      <div className="bg-card rounded-lg shadow p-8 text-center">
        <h1 className="text-xl font-bold text-foreground mb-2">Entity Not Available</h1>
        <p className="text-muted-foreground">
          The entity type "{entityType}" is not enabled or does not exist.
        </p>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="bg-card rounded-lg shadow p-8 text-center">
        <h1 className="text-xl font-bold text-foreground mb-2">Access Denied</h1>
        <p className="text-muted-foreground">
          You do not have permission to edit {entityType} records.
        </p>
      </div>
    );
  }

  return <RecordEdit entityType={entityType} recordId={id} />;
}
