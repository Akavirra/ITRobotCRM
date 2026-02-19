'use client';

import { useState, useEffect, useCallback } from 'react';
import DraggableModal from './DraggableModal';
import { formatDateKyiv } from '@/lib/date-utils';

interface StoredModal {
  id: number;
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

interface GroupData {
  id: number;
  title: string;
  status: string;
  is_active: number;
  weekly_day: number;
  start_time: string;
  end_time: string | null;
  course_title?: string;
  room?: string;
  notes?: string;
}

interface GroupStudent {
  id: number;
  public_id: string;
  full_name: string;
  phone: string | null;
  join_date: string;
  photo: string | null;
}

const STORAGE_KEY = 'itrobot-group-modals';

function getDayName(day: number): string {
  const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
  return days[day - 1] || '';
}

function formatTime(time: string): string {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  return `${hours}:${minutes}`;
}

export default function GroupModalsManager() {
  const [modals, setModals] = useState<StoredModal[]>([]);
  const [groupData, setGroupData] = useState<Record<number, { group: GroupData; students: GroupStudent[] }>>({});
  const [loadingGroups, setLoadingGroups] = useState<Record<number, boolean>>({});
  const [isHydrated, setIsHydrated] = useState(false);

  // Load modals from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setModals(parsed);
        
        // Load data for each open modal
        parsed.forEach((modal: StoredModal) => {
          loadGroupData(modal.id);
        });
      }
    } catch (e) {
      console.error('Error loading modal state:', e);
    }
    setIsHydrated(true);
  }, []);

  // Save modals to localStorage whenever they change
  const saveModals = useCallback((newModals: StoredModal[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newModals));
    } catch (e) {
      console.error('Error saving modal state:', e);
    }
  }, []);

  const loadGroupData = async (groupId: number) => {
    if (groupData[groupId] || loadingGroups[groupId]) return;
    
    setLoadingGroups(prev => ({ ...prev, [groupId]: true }));
    
    try {
      const response = await fetch(`/api/groups/${groupId}?withStudents=true`);
      if (response.ok) {
        const data = await response.json();
        setGroupData(prev => ({ ...prev, [groupId]: data }));
      }
    } catch (error) {
      console.error('Error loading group:', error);
    } finally {
      setLoadingGroups(prev => ({ ...prev, [groupId]: false }));
    }
  };

  const handleClose = (groupId: number) => {
    const newModals = modals.filter(m => m.id !== groupId);
    setModals(newModals);
    saveModals(newModals);
  };

  const handleUpdatePosition = (groupId: number, position: { x: number; y: number }) => {
    const newModals = modals.map(m => 
      m.id === groupId ? { ...m, position } : m
    );
    setModals(newModals);
    saveModals(newModals);
  };

  const handleUpdateSize = (groupId: number, size: { width: number; height: number }) => {
    const newModals = modals.map(m => 
      m.id === groupId ? { ...m, size } : m
    );
    setModals(newModals);
    saveModals(newModals);
  };

  if (!isHydrated || modals.length === 0) return null;

  return (
    <>
      {modals.map((modal) => {
        const data = groupData[modal.id];
        const isLoading = loadingGroups[modal.id];
        const group = data?.group;

        return (
          <DraggableModal
            key={modal.id}
            id={`group-modal-${modal.id}`}
            isOpen={true}
            onClose={() => handleClose(modal.id)}
            title={modal.title}
            groupUrl={`/groups/${modal.id}`}
            initialWidth={modal.size?.width || 520}
            initialHeight={modal.size?.height || 480}
            initialPosition={modal.position}
            onPositionChange={(pos) => handleUpdatePosition(modal.id, pos)}
            onSizeChange={(size) => handleUpdateSize(modal.id, size)}
          >
            {isLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                <div style={{ color: '#6b7280' }}>Завантаження...</div>
              </div>
            ) : group ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Status Badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className={`badge ${group.is_active === 1 ? 'badge-success' : 'badge-gray'}`}>
                    {group.is_active === 1 ? 'Активна' : 'Неактивна'}
                  </span>
                  <span style={{ fontSize: '0.8125rem', color: '#6b7280' }}>
                    {group.status === 'active' ? 'Активна' : group.status === 'completed' ? 'Завершена' : 'Архівна'}
                  </span>
                </div>

                {/* Course */}
                {group.course_title && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Курс</span>
                    <span style={{ fontSize: '0.9375rem', color: '#1f2937' }}>{group.course_title}</span>
                  </div>
                )}

                {/* Schedule */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Розклад</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 0.75rem',
                      backgroundColor: '#f0f9ff',
                      borderRadius: '0.5rem',
                      border: '1px solid #bae6fd',
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#0369a1' }}>
                        {getDayName(group.weekly_day)}
                      </span>
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 0.75rem',
                      backgroundColor: '#fef3c7',
                      borderRadius: '0.5rem',
                      border: '1px solid #fde68a',
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#b45309' }}>
                        {formatTime(group.start_time)}
                        {group.end_time && ` - ${formatTime(group.end_time)}`}
                      </span>
                    </div>
                    {group.room && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 0.75rem',
                        backgroundColor: '#f3e8ff',
                        borderRadius: '0.5rem',
                        border: '1px solid #d8b4fe',
                      }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="2">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#7e22ce' }}>
                          {group.room}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Students Count */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Студенти</span>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.625rem 0.875rem',
                    backgroundColor: '#ecfdf5',
                    borderRadius: '0.5rem',
                    border: '1px solid #a7f3d0',
                  }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#047857' }}>
                      {data?.students?.length || 0} студентів
                    </span>
                  </div>
                </div>

                {/* Students List */}
                {data?.students && data.students.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', marginTop: '0.5rem' }}>
                    <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {data.students.map((student) => (
                        <div
                          key={student.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.625rem',
                            backgroundColor: 'white',
                            borderRadius: '0.5rem',
                            border: '1px solid #e5e7eb',
                            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                          }}
                        >
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            overflow: 'hidden',
                            backgroundColor: '#dbeafe',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            border: '2px solid #bfdbfe',
                          }}>
                            {student.photo ? (
                              <img 
                                src={student.photo} 
                                alt={student.full_name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              <span style={{
                                fontSize: '0.8125rem',
                                fontWeight: 600,
                                color: '#2563eb',
                              }}>
                                {student.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </span>
                            )}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: 0, fontSize: '0.9375rem', fontWeight: '500', color: '#111827' }}>{student.full_name}</p>
                            <p style={{ margin: '0.125rem 0 0 0', fontSize: '0.8125rem', color: '#6b7280' }}>{student.phone || 'Телефон не вказано'}</p>
                            {student.join_date && (
                              <p style={{ margin: '0.125rem 0 0 0', fontSize: '0.75rem', color: '#9ca3af' }}>Доданий: {formatDateKyiv(student.join_date)}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {group.notes && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Нотатки</span>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#4b5563', lineHeight: 1.5 }}>
                      {group.notes}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                <div style={{ color: '#ef4444' }}>Не вдалося завантажити дані</div>
              </div>
            )}
          </DraggableModal>
        );
      })}
    </>
  );
}
