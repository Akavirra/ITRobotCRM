'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { t } from '@/i18n/t';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'teacher';
}

interface Student {
  id: number;
  public_id: string;
  full_name: string;
  phone: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  groups_count: number;
  is_active: number;
}

interface StudentFormData {
  first_name: string;
  last_name: string;
  birth_date: string;
  school: string;
  discount: string;
  photo: string | null;
  photoFile: File | null;
  phone: string;
  parent_name: string;
  parent_relation: string;
  parent_relation_other: string;
  parent_phone: string;
  parent2_name: string;
  parent2_relation: string;
  parent2_relation_other: string;
  notes: string;
  interested_courses: string;
  source: string;
}

interface AutocompleteStudent {
  id: number;
  full_name: string;
  phone: string | null;
  parent_name: string | null;
}

const RELATION_OPTIONS = [
  { value: 'mother', label: t('forms.relationMother') },
  { value: 'father', label: t('forms.relationFather') },
  { value: 'grandmother', label: t('forms.relationGrandmother') },
  { value: 'grandfather', label: t('forms.relationGrandfather') },
  { value: 'other', label: t('forms.relationOther') },
];

const SOURCE_OPTIONS = [
  { value: 'social', label: t('forms.sourceSocial') },
  { value: 'friends', label: t('forms.sourceFriends') },
  { value: 'flyers', label: t('forms.sourceFlyers') },
  { value: 'search', label: t('forms.sourceSearch') },
  { value: 'other', label: t('forms.sourceOther') },
];

interface Course {
  id: number;
  title: string;
  public_id: string;
}

function formatPhoneNumber(value: string): string {
  // Allow user to clear the field completely
  if (value === '') {
    return '';
  }
  
  // Remove all non-digit characters
  let digits = value.replace(/\D/g, '');
  
  // If no digits, return empty
  if (digits.length === 0) {
    return '';
  }
  
  // Take only last 9 digits (without country code)
  const phoneDigits = digits.slice(-9);
  
  return phoneDigits;
}

export default function StudentsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const firstNameInputRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<User | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState<StudentFormData>({
    first_name: '',
    last_name: '',
    birth_date: '',
    school: '',
    discount: '',
    photo: null,
    photoFile: null,
    phone: '',
    parent_name: '',
    parent_relation: '',
    parent_relation_other: '',
    parent_phone: '',
    parent2_name: '',
    parent2_relation: '',
    parent2_relation_other: '',
    notes: '',
    interested_courses: '',
    source: '',
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Autocomplete state
  const [nameSuggestions, setNameSuggestions] = useState<AutocompleteStudent[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [nameSearchTimeout, setNameSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  // Last name autocomplete state
  const [lastNameSuggestions, setLastNameSuggestions] = useState<AutocompleteStudent[]>([]);
  const [showLastNameSuggestions, setShowLastNameSuggestions] = useState(false);
  const [lastNameSearchTimeout, setLastNameSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  // School autocomplete state
  const [schoolSuggestions, setSchoolSuggestions] = useState<string[]>([]);
  const [showSchoolSuggestions, setShowSchoolSuggestions] = useState(false);
  const [schoolSearchTimeout, setSchoolSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [schools, setSchools] = useState<string[]>([]);

  // Courses for dropdown
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const authRes = await fetch('/api/auth/me');
        if (!authRes.ok) {
          router.push('/login');
          return;
        }
        const authData = await authRes.json();
        setUser(authData.user);

        const studentsRes = await fetch('/api/students?withGroupCount=true');
        const studentsData = await studentsRes.json();
        setStudents(studentsData.students || []);
      } catch (error) {
        console.error('Failed to fetch students:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleSearch = async (query: string) => {
    setSearch(query);
    if (query.trim()) {
      const res = await fetch(`/api/students?search=${encodeURIComponent(query)}&withGroupCount=true`);
      const data = await res.json();
      setStudents(data.students || []);
    } else {
      const res = await fetch('/api/students?withGroupCount=true');
      const data = await res.json();
      setStudents(data.students || []);
    }
  };

  // Search for student name autocomplete
  const searchStudentNames = async (query: string) => {
    if (query.length < 2) {
      setNameSuggestions([]);
      return;
    }
    
    try {
      const res = await fetch(`/api/students?search=${encodeURIComponent(query)}&limit=10`);
      const data = await res.json();
      setNameSuggestions(data.students || []);
    } catch (error) {
      console.error('Failed to search students:', error);
    }
  };

  // Search for student last name autocomplete
  const searchStudentLastNames = async (query: string) => {
    if (query.length < 2) {
      setLastNameSuggestions([]);
      return;
    }
    
    try {
      const res = await fetch(`/api/students?search=${encodeURIComponent(query)}&limit=10`);
      const data = await res.json();
      // Extract unique last names from results
      const students = data.students || [];
      const lastNameArray: string[] = [];
      students.forEach((s: AutocompleteStudent) => {
        const parts = s.full_name.trim().split(' ');
        const lastName = parts.length > 1 ? parts.slice(1).join(' ') : '';
        if (lastName.length > 0 && !lastNameArray.includes(lastName)) {
          lastNameArray.push(lastName);
        }
      });
      setLastNameSuggestions(lastNameArray.map((name: string, index: number) => ({
        id: index,
        full_name: name,
        phone: null,
        parent_name: null
      })));
    } catch (error) {
      console.error('Failed to search last names:', error);
    }
  };

  // Get unique schools from students
  const loadSchools = async () => {
    try {
      const res = await fetch('/api/students?limit=1000');
      const data = await res.json();
      const students = data.students || [];
      const schoolArray: string[] = [];
      students.forEach((s: any) => {
        const school = s.school;
        if (school && school.length > 0 && !schoolArray.includes(school)) {
          schoolArray.push(school);
        }
      });
      setSchools(schoolArray);
    } catch (error) {
      console.error('Failed to load schools:', error);
    }
  };

  // Search schools
  const searchSchools = async (query: string) => {
    if (query.length < 2) {
      setSchoolSuggestions([]);
      return;
    }
    
    const filtered = schools.filter(s => s.toLowerCase().includes(query.toLowerCase()));
    setSchoolSuggestions(filtered.slice(0, 10));
  };

  // Load courses
  const loadCourses = async () => {
    try {
      const res = await fetch('/api/courses');
      const data = await res.json();
      setCourses(data.courses || []);
    } catch (error) {
      console.error('Failed to load courses:', error);
    }
  };

  const handleFirstNameChange = (value: string) => {
    setFormData({ ...formData, first_name: value });
    
    // Clear previous timeout
    if (nameSearchTimeout) {
      clearTimeout(nameSearchTimeout);
    }
    
    // Set new timeout for search
    const timeout = setTimeout(() => {
      searchStudentNames(value);
      setShowSuggestions(true);
    }, 300);
    
    setNameSearchTimeout(timeout);
  };

  const handleLastNameChange = (value: string) => {
    setFormData({ ...formData, last_name: value });
    
    // Clear previous timeout
    if (lastNameSearchTimeout) {
      clearTimeout(lastNameSearchTimeout);
    }
    
    // Set new timeout for search
    const timeout = setTimeout(() => {
      searchStudentLastNames(value);
      setShowLastNameSuggestions(true);
    }, 300);
    
    setLastNameSearchTimeout(timeout);
  };

  const handleSchoolChange = (value: string) => {
    setFormData({ ...formData, school: value });
    
    // Clear previous timeout
    if (schoolSearchTimeout) {
      clearTimeout(schoolSearchTimeout);
    }
    
    // Set new timeout for search
    const timeout = setTimeout(() => {
      searchSchools(value);
      setShowSchoolSuggestions(true);
    }, 300);
    
    setSchoolSearchTimeout(timeout);
  };

  const handleSelectSuggestion = (student: AutocompleteStudent) => {
    // Parse full name into first and last name
    const nameParts = student.full_name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    // Extract 9 digits from phone (remove +380 prefix if present)
    let phoneDigits = '';
    if (student.phone) {
      const digits = student.phone.replace(/\D/g, '');
      phoneDigits = digits.slice(-9);
    }
    
    setFormData({
      ...formData,
      first_name: firstName,
      last_name: lastName,
      phone: phoneDigits,
      parent_name: student.parent_name || '',
    });
    
    setShowSuggestions(false);
    setNameSuggestions([]);
  };

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      birth_date: '',
      school: '',
      discount: '',
      photo: null,
      photoFile: null,
      phone: '',
      parent_name: '',
      parent_relation: '',
      parent_relation_other: '',
      parent_phone: '',
      parent2_name: '',
      parent2_relation: '',
      parent2_relation_other: '',
      notes: '',
      interested_courses: '',
      source: '',
    });
    setErrors({});
    setNameSuggestions([]);
    setShowSuggestions(false);
    setLastNameSuggestions([]);
    setShowLastNameSuggestions(false);
    setSchoolSuggestions([]);
    setShowSchoolSuggestions(false);
  };

  const handleCreate = () => {
    setEditingStudent(null);
    resetForm();
    setShowModal(true);
    // Load courses and schools for autocomplete
    loadCourses();
    loadSchools();
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    
    // Parse full name into first and last name
    const nameParts = student.full_name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    // Extract 9 digits from phone (remove +380 prefix if present)
    let phoneDigits = '';
    if (student.phone) {
      const digits = student.phone.replace(/\D/g, '');
      phoneDigits = digits.slice(-9);
    }
    
    let parentPhoneDigits = '';
    if (student.parent_phone) {
      const digits = student.parent_phone.replace(/\D/g, '');
      parentPhoneDigits = digits.slice(-9);
    }
    
    setFormData({
      first_name: firstName,
      last_name: lastName,
      birth_date: '',
      school: '',
      discount: '',
      photo: null,
      photoFile: null,
      phone: phoneDigits,
      parent_name: student.parent_name || '',
      parent_relation: '',
      parent_relation_other: '',
      parent_phone: parentPhoneDigits,
      parent2_name: '',
      parent2_relation: '',
      parent2_relation_other: '',
      notes: '',
      interested_courses: '',
      source: '',
    });
    setShowModal(true);
    // Load courses and schools for autocomplete
    loadCourses();
    loadSchools();
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Required fields
    if (!formData.first_name.trim()) {
      newErrors.first_name = t('validation.required');
    }
    if (!formData.last_name.trim()) {
      newErrors.last_name = t('validation.required');
    }
    // Validate phone - must have exactly 9 digits
    if (!formData.phone || formData.phone.length !== 9) {
      newErrors.phone = t('validation.required');
    }
    if (!formData.parent_name.trim()) {
      newErrors.parent_name = t('validation.required');
    }
    if (!formData.parent_relation) {
      newErrors.parent_relation = t('validation.required');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    setSaving(true);
    try {
      // Combine first and last name
      const fullName = `${formData.first_name.trim()} ${formData.last_name.trim()}`.trim();
      
      const apiData = {
        full_name: fullName,
        phone: formData.phone ? `+380${formData.phone}` : null,
        parent_name: formData.parent_name,
        parent_phone: formData.parent_phone ? `+380${formData.parent_phone}` : null,
        notes: formData.notes,
        birth_date: formData.birth_date,
        school: formData.school,
        discount: formData.discount,
        parent_relation: formData.parent_relation === 'other' ? formData.parent_relation_other : formData.parent_relation,
        parent2_name: formData.parent2_name,
        parent2_relation: formData.parent2_relation === 'other' ? formData.parent2_relation_other : formData.parent2_relation,
        interested_courses: formData.interested_courses,
        source: formData.source,
      };
      
      if (editingStudent) {
        await fetch(`/api/students/${editingStudent.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(apiData),
        });
      } else {
        await fetch('/api/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(apiData),
        });
      }
      
      setShowModal(false);
      const res = await fetch('/api/students?withGroupCount=true');
      const data = await res.json();
      setStudents(data.students || []);
    } catch (error) {
      console.error('Failed to save student:', error);
    } finally {
      setSaving(false);
    }
  };

  const handlePhoneChange = (field: 'phone' | 'parent_phone', value: string) => {
    const formatted = formatPhoneNumber(value);
    setFormData({ ...formData, [field]: formatted });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ 
          ...formData, 
          photo: reader.result as string,
          photoFile: file 
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setFormData({ 
      ...formData, 
      photo: null, 
      photoFile: null 
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.autocomplete-container')) {
        setShowSuggestions(false);
        setShowLastNameSuggestions(false);
        setShowSchoolSuggestions(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>{t('common.loading')}</div>;
  }

  if (!user) return null;

  return (
    <Layout user={user}>
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
            <input
              type="text"
              className="form-input"
              placeholder={`${t('actions.search')} ${t('nav.students').toLowerCase()}...`}
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              style={{ maxWidth: '300px' }}
            />
          </div>
          {user.role === 'admin' && (
            <button className="btn btn-primary" onClick={handleCreate}>
              + {t('modals.newStudent')}
            </button>
          )}
        </div>

        <div className="table-container">
          {students.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>{t('table.id')}</th>
                  <th>{t('forms.fullName')}</th>
                  <th>{t('table.phone')}</th>
                  <th>{t('table.parent')}</th>
                  <th>{t('table.parentPhone')}</th>
                  <th style={{ textAlign: 'center' }}>{t('table.groups')}</th>
                  <th>{t('common.status')}</th>
                  {user.role === 'admin' && <th style={{ textAlign: 'right' }}>{t('common.actions')}</th>}
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: '#6b7280' }}>
                      {student.public_id}
                    </td>
                    <td>
                      <a href={`/students/${student.id}`} style={{ fontWeight: '500' }}>
                        {student.full_name}
                      </a>
                    </td>
                    <td>{student.phone || '---'}</td>
                    <td>{student.parent_name || '---'}</td>
                    <td>{student.parent_phone || '---'}</td>
                    <td style={{ textAlign: 'center' }}>{student.groups_count}</td>
                    <td>
                      <span className={`badge ${student.is_active ? 'badge-success' : 'badge-gray'}`}>
                        {student.is_active ? t('status.active') : t('status.archived')}
                      </span>
                    </td>
                    {user.role === 'admin' && (
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleEdit(student)}
                        >
                          {t('actions.edit')}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <h3 className="empty-state-title">{t('emptyStates.noStudents')}</h3>
              <p className="empty-state-text">{t('emptyStates.noStudentsHint')}</p>
              {user.role === 'admin' && (
                <button className="btn btn-primary" onClick={handleCreate}>
                  {t('emptyStates.addStudent')}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header" style={{ padding: '1rem 1.25rem' }}>
              <h3 className="modal-title" style={{ fontSize: '1rem', fontWeight: 600 }}>
                {editingStudent ? t('modals.editStudent') : t('modals.newStudent')}
              </h3>
              <button 
                className="modal-close" 
                onClick={() => setShowModal(false)}
                style={{ fontSize: '1.5rem', lineHeight: 1, padding: '0.25rem' }}
              >
                ×
              </button>
            </div>
            <div className="modal-body" style={{ padding: '1.25rem' }}>
              {/* Block 1: Основна інформація */}
              <div style={{ marginBottom: '1.75rem' }}>
                <h4 style={{ 
                  fontSize: '0.75rem', 
                  fontWeight: 600, 
                  marginBottom: '1rem', 
                  color: '#6b7280', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.05em'
                }}>
                  Основна інформація
                </h4>
                
                {/* First Name and Last Name in one row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {/* Autocomplete for first name */}
                  <div className="form-group autocomplete-container" style={{ position: 'relative' }}>
                    <label className="form-label">{t('forms.firstName')} *</label>
                    <input
                      ref={firstNameInputRef}
                      type="text"
                      className={`form-input ${errors.first_name ? 'form-input-error' : ''}`}
                      value={formData.first_name}
                      onChange={(e) => handleFirstNameChange(e.target.value)}
                      onFocus={() => formData.first_name.length >= 2 && setShowSuggestions(true)}
                      placeholder={t('forms.firstName')}
                      autoComplete="off"
                    />
                    {errors.first_name && <span className="form-error">{errors.first_name}</span>}
                    
                    {/* Autocomplete suggestions dropdown */}
                    {showSuggestions && nameSuggestions.length > 0 && (
                      <ul style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.375rem',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                        listStyle: 'none',
                        margin: '0.25rem 0 0',
                        padding: 0,
                        zIndex: 1000,
                        maxHeight: '200px',
                        overflowY: 'auto'
                      }}>
                        {nameSuggestions.map((student) => (
                          <li
                            key={student.id}
                            onClick={() => handleSelectSuggestion(student)}
                            style={{
                              padding: '0.625rem 0.75rem',
                              cursor: 'pointer',
                              borderBottom: '1px solid #f3f4f6',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              transition: 'background-color 0.15s ease'
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f9fafb')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'white')}
                          >
                            <span style={{ fontWeight: '500' }}>{student.full_name}</span>
                            {student.phone && <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>{student.phone}</span>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Autocomplete for last name */}
                  <div className="form-group autocomplete-container" style={{ position: 'relative' }}>
                    <label className="form-label">{t('forms.lastName')} *</label>
                    <input
                      type="text"
                      className={`form-input ${errors.last_name ? 'form-input-error' : ''}`}
                      value={formData.last_name}
                      onChange={(e) => handleLastNameChange(e.target.value)}
                      onFocus={() => formData.last_name.length >= 2 && setShowLastNameSuggestions(true)}
                      placeholder={t('forms.lastName')}
                      autoComplete="off"
                    />
                    {errors.last_name && <span className="form-error">{errors.last_name}</span>}
                    
                    {/* Autocomplete suggestions dropdown for last name */}
                    {showLastNameSuggestions && lastNameSuggestions.length > 0 && (
                      <ul style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.375rem',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                        listStyle: 'none',
                        margin: '0.25rem 0 0',
                        padding: 0,
                        zIndex: 1000,
                        maxHeight: '200px',
                        overflowY: 'auto'
                      }}>
                        {lastNameSuggestions.map((student) => (
                          <li
                            key={student.id}
                            onClick={() => {
                              setFormData({ ...formData, last_name: student.full_name });
                              setShowLastNameSuggestions(false);
                            }}
                            style={{
                              padding: '0.625rem 0.75rem',
                              cursor: 'pointer',
                              borderBottom: '1px solid #f3f4f6',
                              transition: 'background-color 0.15s ease'
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f9fafb')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'white')}
                          >
                            <span style={{ fontWeight: '500' }}>{student.full_name}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">{t('forms.birthDate')}</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formData.birth_date}
                      onChange={(e) => {
                        setFormData({ ...formData, birth_date: e.target.value });
                      }}
                      placeholder={t('forms.birthDatePlaceholder')}
                    />
                  </div>

                  {/* Autocomplete for school */}
                  <div className="form-group autocomplete-container" style={{ position: 'relative' }}>
                    <label className="form-label">{t('forms.school')}</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.school}
                      onChange={(e) => handleSchoolChange(e.target.value)}
                      onFocus={() => formData.school.length >= 2 && setShowSchoolSuggestions(true)}
                      placeholder={t('forms.schoolPlaceholder')}
                      autoComplete="off"
                    />
                    
                    {/* Autocomplete suggestions dropdown for school */}
                    {showSchoolSuggestions && schoolSuggestions.length > 0 && (
                      <ul style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.375rem',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                        listStyle: 'none',
                        margin: '0.25rem 0 0',
                        padding: 0,
                        zIndex: 1000,
                        maxHeight: '200px',
                        overflowY: 'auto'
                      }}>
                        {schoolSuggestions.map((school, index) => (
                          <li
                            key={index}
                            onClick={() => {
                              setFormData({ ...formData, school: school });
                              setShowSchoolSuggestions(false);
                            }}
                            style={{
                              padding: '0.625rem 0.75rem',
                              cursor: 'pointer',
                              borderBottom: '1px solid #f3f4f6',
                              transition: 'background-color 0.15s ease'
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f9fafb')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'white')}
                          >
                            <span>{school}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">{t('forms.discount')}</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.discount}
                      onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                      placeholder={t('forms.discountPlaceholder')}
                      min="0"
                      max="100"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{t('forms.photo')}</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      {formData.photo ? (
                        <>
                          <div style={{ width: '56px', height: '56px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #e5e7eb', flexShrink: 0 }}>
                            <img src={formData.photo} alt="Student" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button type="button" className="btn btn-secondary btn-sm" onClick={() => fileInputRef.current?.click()}>
                              {t('forms.changePhoto')}
                            </button>
                            <button type="button" className="btn btn-outline btn-sm" onClick={removePhoto}>
                              {t('forms.removePhoto')}
                            </button>
                          </div>
                        </>
                      ) : (
                        <button type="button" className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
                          {t('forms.uploadPhoto')}
                        </button>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        style={{ display: 'none' }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Block 2: Контактна інформація */}
              <div style={{ marginBottom: '1.75rem' }}>

                <div className="form-group">
                  <label className="form-label">{t('forms.mainPhone')} *</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1rem', color: '#374151', fontWeight: '500', minWidth: '45px' }}>+380</span>
                    <input
                      type="tel"
                      className={`form-input ${errors.phone ? 'form-input-error' : ''}`}
                      value={formData.phone}
                      onChange={(e) => handlePhoneChange('phone', e.target.value)}
                      placeholder="XXXXXXXXX"
                      maxLength={9}
                      style={{ flex: 1 }}
                    />
                  </div>
                  {errors.phone && <span className="form-error">{errors.phone}</span>}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">{t('forms.contactName')} *</label>
                    <input
                      type="text"
                      className={`form-input ${errors.parent_name ? 'form-input-error' : ''}`}
                      value={formData.parent_name}
                      onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                      placeholder={t('forms.contactNamePlaceholder')}
                    />
                    {errors.parent_name && <span className="form-error">{errors.parent_name}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">{t('forms.whoIsThis')} *</label>
                    <select
                      className={`form-input ${errors.parent_relation ? 'form-input-error' : ''}`}
                      value={formData.parent_relation}
                      onChange={(e) => setFormData({ ...formData, parent_relation: e.target.value })}
                    >
                      <option value="">{t('forms.whoIsThisPlaceholder')}</option>
                      {RELATION_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                    {errors.parent_relation && <span className="form-error">{errors.parent_relation}</span>}
                  </div>
                </div>

                {formData.parent_relation === 'other' && (
                  <div className="form-group">
                    <input
                      type="text"
                      className="form-input"
                      value={formData.parent_relation_other}
                      onChange={(e) => setFormData({ ...formData, parent_relation_other: e.target.value })}
                      placeholder={t('forms.relationOtherPlaceholder')}
                    />
                  </div>
                )}
              </div>

              {/* Additional phone - optional */}
              <div style={{ marginBottom: '1.75rem' }}>

                <div className="form-group">
                  <label className="form-label">{t('forms.additionalPhone')}</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1rem', color: '#374151', fontWeight: '500', minWidth: '45px' }}>+380</span>
                    <input
                      type="tel"
                      className="form-input"
                      value={formData.parent_phone}
                      onChange={(e) => handlePhoneChange('parent_phone', e.target.value)}
                      placeholder="XXXXXXXXX"
                      maxLength={9}
                      style={{ flex: 1 }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">{t('forms.contactName')}</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.parent2_name}
                      onChange={(e) => setFormData({ ...formData, parent2_name: e.target.value })}
                      placeholder={t('forms.contactNamePlaceholder')}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{t('forms.whoIsThis')}</label>
                    <select
                      className="form-input"
                      value={formData.parent2_relation}
                      onChange={(e) => setFormData({ ...formData, parent2_relation: e.target.value })}
                    >
                      <option value="">{t('forms.whoIsThisPlaceholder')}</option>
                      {RELATION_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {formData.parent2_relation === 'other' && (
                  <div className="form-group">
                    <input
                      type="text"
                      className="form-input"
                      value={formData.parent2_relation_other}
                      onChange={(e) => setFormData({ ...formData, parent2_relation_other: e.target.value })}
                      placeholder={t('forms.relationOtherPlaceholder')}
                    />
                  </div>
                )}
              </div>

              {/* Block 3: Додаткова інформація */}
              <div>
                <h4 style={{ 
                  fontSize: '0.75rem', 
                  fontWeight: 600, 
                  marginBottom: '1rem', 
                  color: '#6b7280', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.05em'
                }}>
                  {t('forms.additionalInfo')}
                </h4>

                <div className="form-group">
                  <textarea
                    className="form-input"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder={t('forms.notePlaceholder')}
                    rows={3}
                    style={{ resize: 'vertical', minHeight: '80px' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('forms.interestedCourses')}</label>
                  <select
                    className="form-input"
                    value={formData.interested_courses}
                    onChange={(e) => setFormData({ ...formData, interested_courses: e.target.value })}
                  >
                    <option value="">{t('forms.interestedCoursesPlaceholder')}</option>
                    {courses.map(course => (
                      <option key={course.id} value={course.title}>{course.title}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">{t('forms.source')}</label>
                  <select
                    className="form-input"
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  >
                    <option value="">{t('forms.sourcePlaceholder')}</option>
                    {SOURCE_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ padding: '1rem 1.25rem' }}>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                {t('actions.cancel')}
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? t('common.saving') : t('actions.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
