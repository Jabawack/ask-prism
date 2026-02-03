'use client';

import { useState, useCallback, createContext, useContext, ReactNode } from 'react';
import { Modal, ModalHeader, ModalBody, Button } from 'flowbite-react';
import { AlertTriangleIcon, InfoIcon, Trash2Icon } from 'lucide-react';

interface DeleteImpact {
  label: string;
  count: number;
  description?: string;
}

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  impacts?: DeleteImpact[];
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within ConfirmProvider');
  }
  return context.confirm;
}

interface ConfirmProviderProps {
  children: ReactNode;
}

export function ConfirmProvider({ children }: ConfirmProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolveRef, setResolveRef] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setOptions(opts);
      setResolveRef(() => resolve);
      setIsOpen(true);
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setIsOpen(false);
    resolveRef?.(true);
    setResolveRef(null);
    setOptions(null);
  }, [resolveRef]);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
    resolveRef?.(false);
    setResolveRef(null);
    setOptions(null);
  }, [resolveRef]);

  const variantConfig = {
    danger: {
      iconBg: 'bg-[var(--color-error)]/10',
      iconColor: 'text-[var(--color-error)]',
      Icon: Trash2Icon,
      buttonColor: 'failure' as const,
    },
    warning: {
      iconBg: 'bg-[var(--color-warning)]/10',
      iconColor: 'text-[var(--color-warning)]',
      Icon: AlertTriangleIcon,
      buttonColor: 'warning' as const,
    },
    info: {
      iconBg: 'bg-[var(--color-primary)]/10',
      iconColor: 'text-[var(--color-primary)]',
      Icon: InfoIcon,
      buttonColor: 'info' as const,
    },
  };

  const variant = options?.variant || 'danger';
  const config = variantConfig[variant];

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      <Modal show={isOpen} onClose={handleCancel} size="md" popup>
        <ModalHeader />
        <ModalBody>
          {options && (
            <div className="text-center">
              {/* Icon */}
              <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${config.iconBg}`}>
                <config.Icon className={`h-6 w-6 ${config.iconColor}`} />
              </div>

              {/* Title & Message */}
              <h3 className="mb-2 text-lg font-semibold text-[var(--color-text-primary)]">
                {options.title}
              </h3>
              <p className="mb-4 text-sm text-[var(--color-text-secondary)]">
                {options.message}
              </p>

              {/* Impact List */}
              {options.impacts && options.impacts.length > 0 && (
                <div className="mb-5 rounded-lg bg-[var(--color-bg-secondary)] p-4 text-left border border-[var(--color-border)]">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                    This will also delete:
                  </p>
                  <ul className="space-y-2">
                    {options.impacts.map((impact, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-[var(--color-text-primary)]">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-bg-tertiary)] text-xs font-medium">
                          {impact.count}
                        </span>
                        <span>{impact.label}</span>
                        {impact.description && (
                          <span className="text-[var(--color-text-muted)]">({impact.description})</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-center gap-3">
                <Button color="gray" onClick={handleCancel}>
                  {options.cancelLabel || 'Cancel'}
                </Button>
                <Button color={config.buttonColor} onClick={handleConfirm}>
                  {options.confirmLabel || 'Confirm'}
                </Button>
              </div>
            </div>
          )}
        </ModalBody>
      </Modal>
    </ConfirmContext.Provider>
  );
}
