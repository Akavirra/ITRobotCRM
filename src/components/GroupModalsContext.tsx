'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface GroupModalState {
  [groupId: number]: {
    isOpen: boolean;
    title: string;
    position?: { x: number; y: number };
    size?: { width: number; height: number };
  };
}

interface GroupModalsContextType {
  openModals: GroupModalState;
  openGroupModal: (groupId: number, title: string) => void;
  closeGroupModal: (groupId: number) => void;
  updateModalState: (groupId: number, state: Partial<GroupModalState[number]>) => void;
}

const GroupModalsContext = createContext<GroupModalsContextType | undefined>(undefined);

const STORAGE_KEY = 'itrobot-group-modals';

export function GroupModalsProvider({ children }: { children: ReactNode }) {
  const [openModals, setOpenModals] = useState<GroupModalState>({});
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Filter to only keep open modals
        const openOnly: GroupModalState = {};
        Object.entries(parsed).forEach(([key, value]: [string, any]) => {
          if (value.isOpen) {
            openOnly[parseInt(key)] = value;
          }
        });
        setOpenModals(openOnly);
      }
    } catch (e) {
      console.error('Error loading modal state:', e);
    }
    setIsHydrated(true);
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(openModals));
      } catch (e) {
        console.error('Error saving modal state:', e);
      }
    }
  }, [openModals, isHydrated]);

  const openGroupModal = (groupId: number, title: string) => {
    setOpenModals(prev => ({
      ...prev,
      [groupId]: {
        isOpen: true,
        title,
        position: prev[groupId]?.position,
        size: prev[groupId]?.size,
      },
    }));
  };

  const closeGroupModal = (groupId: number) => {
    setOpenModals(prev => {
      const newState = { ...prev };
      delete newState[groupId];
      return newState;
    });
  };

  const updateModalState = (groupId: number, state: Partial<GroupModalState[number]>) => {
    setOpenModals(prev => ({
      ...prev,
      [groupId]: {
        ...prev[groupId],
        ...state,
      },
    }));
  };

  return (
    <GroupModalsContext.Provider value={{ openModals, openGroupModal, closeGroupModal, updateModalState }}>
      {children}
    </GroupModalsContext.Provider>
  );
}

export function useGroupModals() {
  const context = useContext(GroupModalsContext);
  if (!context) {
    throw new Error('useGroupModals must be used within GroupModalsProvider');
  }
  return context;
}
