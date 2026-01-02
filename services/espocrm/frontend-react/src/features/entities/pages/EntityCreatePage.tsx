import React from 'react';
import { useParams } from 'react-router-dom';
import { useMetadata } from '@/lib/metadata/useMetadata';
import { useAcl } from '@/lib/acl';
import { RecordCreate } from '../components';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export default function EntityCreatePage(): React.ReactElement {
  const { entityType = '' } = useParams<{ entityType: string }>();
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
  const canCreate = checkScope(entityType, 'create');

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

  if (!canCreate) {
    return (
      <div className="bg-card rounded-lg shadow p-8 text-center">
        <h1 className="text-xl font-bold text-foreground mb-2">Access Denied</h1>
        <p className="text-muted-foreground">
          You do not have permission to create {entityType} records.
        </p>
      </div>
    );
  }

  return <RecordCreate entityType={entityType} />;
}
