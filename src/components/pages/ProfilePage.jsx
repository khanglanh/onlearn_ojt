import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client.js';
import parseApiError from '../../api/parseApiError.js';
import mapError from '../../api/errorMap.js';
import Message from '../Message';
import { logout, isTokenExpired } from '../../api/auth.js';
import { getUserRole } from '../../utils/authUtils';
import '../AuthShared.css';
import StudentLayout from '../layout/StudentLayout';
import AdminLayout from '../layout/AdminLayout';
import TeacherLayout from '../layout/TeacherLayout';

export default function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    userId: '',
    email: '',
    name: null,
    phoneNumber: '',
    gender: null,
    dateOfBirth: null,
    avatarUrl: null,
    address: null,
    role: '',
    createdBy: '',
    updatedBy: null,
    active: true,
    createdAt: '',
    updatedAt: null
  });
  const [avatarPreview, setAvatarPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setFetchLoading(true);
    try {
      const response = await api.get('/identity/profile');
      const data = response.data.data; // API returns {data: profile, success: true}
      // Format dates
      if (data.createdAt) {
        data.createdAt = new Date(data.createdAt * 1000).toLocaleString();
      }
      if (data.updatedAt) {
        data.updatedAt = new Date(data.updatedAt * 1000).toLocaleString();
      }
      setProfile(data);
      setAvatarPreview(data.avatarUrl || '');
      console.log('Profile data:', data);
    } catch (err) {
      console.error('[Profile] fetch error', err);
      const parsed = parseApiError(err);
      setError(parsed.message || 'Unable to fetch profile');
    } finally {
      setFetchLoading(false);
    }
  };

  const validate = () => {
    const errs = {};
    if (!profile.name) errs.name = 'Name is required';
    // Add other validations if needed
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setInfo('');

    const errs = validate();
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }

    setLoading(true);
    try {
      await api.put(`/identity/profile/${profile.userId}`, {
        name: profile.name,
        gender: profile.gender,
        dateOfBirth: profile.dateOfBirth,
        address: profile.address
      });
      setInfo('Profile updated successfully');
    } catch (err) {
      console.error('[Profile] update error', err);
      const parsed = parseApiError(err);
      const mapped = mapError(parsed.message || parsed || '');
      if (mapped) setError(mapped.message);
      else setError(parsed.message || 'Unable to update profile');
    } finally { setLoading(false); }
  };

  const handleChange = (field, value) => {
    setProfile({ ...profile, [field]: value });
    setFormErrors({ ...formErrors, [field]: null });
    setError('');
    if (field === 'avatarUrl') {
      setAvatarPreview(value);
    }
  };

  const userRole = getUserRole();
  const Layout = userRole === 'ADMIN' || userRole === 'MANAGER' 
    ? AdminLayout 
    : userRole === 'TEACHER' 
    ? TeacherLayout 
    : StudentLayout;

  if (fetchLoading) {
    return (
      <Layout>
        <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f9ff' }}>
          <div>Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f9ff' }}>
        <div className="login-box" style={{ maxWidth: 900, width: '100%', padding: '16px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <h2 style={{ color: '#05386D', marginBottom: 4 }}>Hồ sơ cá nhân</h2>
          </div>

          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <img src={avatarPreview || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} alt="Avatar" style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', border: '3px solid #05386D', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
          </div>

          {error && <Message type="error">{error}</Message>}
          {info && <Message type="success">{info}</Message>}

          <div style={{ marginBottom: 24 }}>
            <h3 style={{ color: '#05386D', marginBottom: 12, borderBottom: '2px solid #05386D', paddingBottom: 4, fontSize: '18px' }}>Thông tin tài khoản</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: 2, color: '#05386D', fontWeight: 'bold', fontSize: '14px' }}>Email</label>
                <input type="email" value={profile.email} disabled style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#f9f9f9', fontSize: '14px' }} />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 2, color: '#05386D', fontWeight: 'bold', fontSize: '14px' }}>Số điện thoại</label>
                <input type="tel" value={profile.phoneNumber || ''} disabled style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#f9f9f9', fontSize: '14px' }} />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 2, color: '#05386D', fontWeight: 'bold', fontSize: '14px' }}>Vai trò</label>
                <input type="text" value={profile.role} disabled style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#f9f9f9', fontSize: '14px' }} />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 2, color: '#05386D', fontWeight: 'bold', fontSize: '14px' }}>Đã kích hoạt</label>
                <div style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#f9f9f9', fontSize: '14px' }}>
                  {profile.active ? 'Yes' : 'No'}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 2, color: '#05386D', fontWeight: 'bold', fontSize: '14px' }}>Ngày tạo</label>
                <input type="text" value={profile.createdAt} disabled style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#f9f9f9', fontSize: '14px' }} />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 2, color: '#05386D', fontWeight: 'bold', fontSize: '14px' }}>Ngày cập nhật</label>
                <input type="text" value={profile.updatedAt || ''} disabled style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#f9f9f9', fontSize: '14px' }} />
              </div>
            </div>
          </div>

          <div>
            <h3 style={{ color: '#05386D', marginBottom: 12, borderBottom: '2px solid #05386D', paddingBottom: 4, fontSize: '18px' }}>Thông tin cá nhân</h3>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', alignItems: 'end' }}>
              <div>
                <label style={{ display: 'block', marginBottom: 2, color: '#05386D', fontWeight: 'bold', fontSize: '14px' }}>Tên</label>
                <input type="text" value={profile.name || ''} onChange={(e) => handleChange('name', e.target.value)} aria-invalid={!!formErrors.name} aria-describedby={formErrors.name ? 'name-error' : undefined} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }} />
                {formErrors.name && <div id="name-error" className="field-error" role="alert">{formErrors.name}</div>}
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 2, color: '#05386D', fontWeight: 'bold', fontSize: '14px' }}>Giới tính</label>
                <select value={profile.gender || ''} onChange={(e) => handleChange('gender', e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}>
                  <option value="">Chọn giới tính</option>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 2, color: '#05386D', fontWeight: 'bold', fontSize: '14px' }}>Ngày sinh</label>
                <input type="date" value={profile.dateOfBirth || ''} onChange={(e) => handleChange('dateOfBirth', e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }} />
              </div>

              <div style={{ gridColumn: 'span 3' }}>
                <label style={{ display: 'block', marginBottom: 2, color: '#05386D', fontWeight: 'bold', fontSize: '14px' }}>Địa chỉ</label>
                <input type="text" value={profile.address || ''} onChange={(e) => handleChange('address', e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }} />
              </div>

              <div style={{ gridColumn: 'span 3', textAlign: 'center' }}>
                <button type="submit" style={{ padding: '10px 24px', backgroundColor: '#05386D', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }} disabled={loading}>
                  {loading ? 'Đang cập nhật...' : 'Cập nhật'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}