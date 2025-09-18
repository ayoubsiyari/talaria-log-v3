import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

const TabsContext = createContext();

const Tabs = ({ defaultValue, value, onValueChange, className, children, ...props }) => {
  const [internalState, setInternalState] = useState(defaultValue);
  const isControlled = value !== undefined;
  const selectedValue = isControlled ? value : internalState;
  const triggerRefs = useRef(new Map());

  const handleValueChange = (newValue) => {
    if (!isControlled) {
      setInternalState(newValue);
    }
    onValueChange?.(newValue);
  };

  const registerTrigger = useCallback((value, ref) => {
    triggerRefs.current.set(value, ref);
  }, []);

  const unregisterTrigger = useCallback((value) => {
    triggerRefs.current.delete(value);
  }, []);

  const getTriggerValues = useCallback(() => {
    return Array.from(triggerRefs.current.keys());
  }, []);

  const focusTrigger = useCallback((value) => {
    const ref = triggerRefs.current.get(value);
    if (ref?.current) {
      ref.current.focus();
    }
  }, []);

  return (
    <TabsContext.Provider value={{ 
      selectedValue, 
      onValueChange: handleValueChange,
      registerTrigger,
      unregisterTrigger,
      getTriggerValues,
      focusTrigger
    }}>
      <div className={cn('w-full', className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

const TabsList = ({ className, children, ...props }) => {
  const { getTriggerValues, onValueChange, focusTrigger } = useContext(TabsContext);

  const handleKeyDown = (event) => {
    const triggerValues = getTriggerValues();
    if (triggerValues.length === 0) return;

    const currentIndex = triggerValues.findIndex(value => 
      document.activeElement?.getAttribute('data-tab-value') === value
    );

    let newIndex = currentIndex;

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        newIndex = currentIndex > 0 ? currentIndex - 1 : triggerValues.length - 1;
        break;
      case 'ArrowRight':
        event.preventDefault();
        newIndex = currentIndex < triggerValues.length - 1 ? currentIndex + 1 : 0;
        break;
      case 'Home':
        event.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        newIndex = triggerValues.length - 1;
        break;
      default:
        return;
    }

    const newValue = triggerValues[newIndex];
    onValueChange(newValue);
    focusTrigger(newValue);
  };

  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground',
        className
      )}
      onKeyDown={handleKeyDown}
      {...props}
    >
      {children}
    </div>
  );
};

const TabsTrigger = ({ value, className, children, ...props }) => {
  const { selectedValue, onValueChange, registerTrigger, unregisterTrigger } = useContext(TabsContext);
  const triggerRef = useRef(null);
  const isSelected = selectedValue === value;
  const tabId = `tab-${value}`;
  const panelId = `tabpanel-${value}`;

  React.useEffect(() => {
    registerTrigger(value, triggerRef);
    return () => unregisterTrigger(value);
  }, [value, registerTrigger, unregisterTrigger]);

  return (
    <button
      ref={triggerRef}
      type="button"
      role="tab"
      id={tabId}
      aria-selected={isSelected}
      aria-controls={panelId}
      data-tab-value={value}
      tabIndex={isSelected ? 0 : -1}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        isSelected
          ? 'bg-background text-foreground shadow-sm'
          : 'hover:bg-background/50',
        className
      )}
      onClick={() => onValueChange(value)}
      {...props}
    >
      {children}
    </button>
  );
};

const TabsContent = ({ value, className, children, ...props }) => {
  const { selectedValue } = useContext(TabsContext);
  const isSelected = selectedValue === value;
  const tabId = `tab-${value}`;
  const panelId = `tabpanel-${value}`;

  if (!isSelected) {
    return null;
  }

  return (
    <div
      role="tabpanel"
      id={panelId}
      aria-labelledby={tabId}
      className={cn(
        'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export { Tabs, TabsList, TabsTrigger, TabsContent };