import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type {
  ModalState,
  ConfirmationModalConfig,
  RecordSelectModalConfig,
  QuickCreateModalConfig,
  SelectedRecord,
} from './types';
import { ConfirmationModal } from './ConfirmationModal';
import { RecordSelectModal } from './RecordSelectModal';
import { QuickCreateModal } from './QuickCreateModal';

interface ModalContextValue {
  confirm: (config: ConfirmationModalConfig) => Promise<boolean>;
  selectRecord: (config: RecordSelectModalConfig) => Promise<SelectedRecord | SelectedRecord[] | null>;
  quickCreate: (config: QuickCreateModalConfig) => Promise<SelectedRecord | null>;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextValue | null>(null);

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}

interface ModalProviderProps {
  children: ReactNode;
}

export function ModalProvider({ children }: ModalProviderProps) {
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    type: null,
    config: null,
    resolve: null,
    reject: null,
  });

  const closeModal = useCallback(() => {
    setModalState((prev) => {
      if (prev.reject) {
        prev.reject(new Error('Modal closed'));
      }
      return {
        isOpen: false,
        type: null,
        config: null,
        resolve: null,
        reject: null,
      };
    });
  }, []);

  const confirm = useCallback((config: ConfirmationModalConfig): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      setModalState({
        isOpen: true,
        type: 'confirmation',
        config,
        resolve: resolve as (value: unknown) => void,
        reject,
      });
    });
  }, []);

  const selectRecord = useCallback(
    (config: RecordSelectModalConfig): Promise<SelectedRecord | SelectedRecord[] | null> => {
      return new Promise((resolve, reject) => {
        setModalState({
          isOpen: true,
          type: 'recordSelect',
          config,
          resolve: resolve as (value: unknown) => void,
          reject,
        });
      });
    },
    []
  );

  const quickCreate = useCallback(
    (config: QuickCreateModalConfig): Promise<SelectedRecord | null> => {
      return new Promise((resolve, reject) => {
        setModalState({
          isOpen: true,
          type: 'quickCreate',
          config,
          resolve: resolve as (value: unknown) => void,
          reject,
        });
      });
    },
    []
  );

  const handleConfirm = useCallback((confirmed: boolean) => {
    setModalState((prev) => {
      if (prev.resolve) {
        prev.resolve(confirmed);
      }
      return {
        isOpen: false,
        type: null,
        config: null,
        resolve: null,
        reject: null,
      };
    });
  }, []);

  const handleRecordSelect = useCallback((record: SelectedRecord | SelectedRecord[] | null) => {
    setModalState((prev) => {
      if (prev.resolve) {
        prev.resolve(record);
      }
      return {
        isOpen: false,
        type: null,
        config: null,
        resolve: null,
        reject: null,
      };
    });
  }, []);

  const handleQuickCreate = useCallback((record: SelectedRecord | null) => {
    setModalState((prev) => {
      if (prev.resolve) {
        prev.resolve(record);
      }
      return {
        isOpen: false,
        type: null,
        config: null,
        resolve: null,
        reject: null,
      };
    });
  }, []);

  return (
    <ModalContext.Provider value={{ confirm, selectRecord, quickCreate, closeModal }}>
      {children}

      {modalState.isOpen && modalState.type === 'confirmation' && (
        <ConfirmationModal
          config={modalState.config as ConfirmationModalConfig}
          onConfirm={() => handleConfirm(true)}
          onCancel={() => handleConfirm(false)}
        />
      )}

      {modalState.isOpen && modalState.type === 'recordSelect' && (
        <RecordSelectModal
          config={modalState.config as RecordSelectModalConfig}
          onSelect={handleRecordSelect}
          onCancel={() => handleRecordSelect(null)}
        />
      )}

      {modalState.isOpen && modalState.type === 'quickCreate' && (
        <QuickCreateModal
          config={modalState.config as QuickCreateModalConfig}
          onCreate={handleQuickCreate}
          onCancel={() => handleQuickCreate(null)}
        />
      )}
    </ModalContext.Provider>
  );
}
