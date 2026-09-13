import React, { useState, useEffect } from 'react';
import { User, Lock, Mail, CheckCircle2 } from 'lucide-react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { updateAdminProfile, updateAdminPassword } from '../../api/admin';
import useAuth from '../../hooks/useAuth';

const ProfileForm = ({ id = 'admin-profile-form' }) => {
  const { user, refreshUser } = useAuth();

  // Profile info state
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Password state
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      setProfileLoading(true);
      setProfileError(null);
      setProfileSuccess(false);

      await updateAdminProfile(profileData);
      setProfileSuccess(true);
      if (refreshUser) {
        await refreshUser();
      }
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update profile:', err);
      setProfileError(err?.response?.data?.message || 'Gagal memperbarui profil admin.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.password !== passwordData.password_confirmation) {
      setPasswordError('Konfirmasi password tidak cocok');
      return;
    }

    try {
      setPasswordLoading(true);
      setPasswordError(null);
      setPasswordSuccess(false);

      await updateAdminPassword(passwordData);
      setPasswordSuccess(true);
      setPasswordData({
        current_password: '',
        password: '',
        password_confirmation: '',
      });
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update password:', err);
      setPasswordError(err?.response?.data?.message || 'Gagal memperbarui password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div id={id} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Profile Form Card */}
      <div className="bg-[#191C1E] rounded-2xl border border-[#444652] p-6 shadow-md flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2.5 pb-4 border-b border-[#343844] mb-5">
            <div className="p-2.5 rounded-xl bg-[#202a4d] text-[#8ca0eb]">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#e4e1e6]">Informasi Pribadi</h3>
              <p className="text-xs text-[#c5c5d4]">Perbarui data diri dan kontak akun administrator Anda.</p>
            </div>
          </div>

          {profileError && (
            <div className="mb-4 p-3 bg-rose-950/40 border border-rose-500/40 rounded-xl text-xs text-rose-300 font-medium">
              {profileError}
            </div>
          )}

          {profileSuccess && (
            <div className="mb-4 p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Profil berhasil diperbarui!</span>
            </div>
          )}

          <form id={`${id}-personal`} onSubmit={handleProfileSubmit} className="space-y-4">
            <Input
              id={`${id}-name`}
              name="name"
              label="Nama Lengkap"
              placeholder="Administrator Utama"
              value={profileData.name}
              onChange={handleProfileChange}
              required
              disabled={profileLoading}
            />

            <Input
              id={`${id}-email`}
              name="email"
              type="email"
              label="Alamat Email"
              icon={Mail}
              placeholder="admin@infracheck.id"
              value={profileData.email}
              onChange={handleProfileChange}
              required
              disabled={profileLoading}
            />

            <Input
              id={`${id}-phone`}
              name="phone"
              type="tel"
              label="Nomor Telepon / WhatsApp"
              placeholder="08123456789"
              value={profileData.phone}
              onChange={handleProfileChange}
              disabled={profileLoading}
            />

            <div className="pt-2 flex justify-end">
              <Button
                id={`${id}-profile-submit-btn`}
                type="submit"
                variant="primary"
                size="sm"
                isLoading={profileLoading}
              >
                Simpan Profil
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Password Security Card */}
      <div className="bg-[#191C1E] rounded-2xl border border-[#444652] p-6 shadow-md flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2.5 pb-4 border-b border-[#343844] mb-5">
            <div className="p-2.5 rounded-xl bg-[#472a00] text-[#ffb95a]">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#e4e1e6]">Keamanan & Password</h3>
              <p className="text-xs text-[#c5c5d4]">Gunakan kombinasi kata sandi yang kuat untuk melindungi sistem.</p>
            </div>
          </div>

          {passwordError && (
            <div className="mb-4 p-3 bg-rose-950/40 border border-rose-500/40 rounded-xl text-xs text-rose-300 font-medium">
              {passwordError}
            </div>
          )}

          {passwordSuccess && (
            <div className="mb-4 p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Password berhasil diubah!</span>
            </div>
          )}

          <form id={`${id}-security`} onSubmit={handlePasswordSubmit} className="space-y-4">
            <Input
              id={`${id}-current-pass`}
              name="current_password"
              type="password"
              label="Password Saat Ini"
              placeholder="••••••••"
              value={passwordData.current_password}
              onChange={handlePasswordChange}
              required
              disabled={passwordLoading}
            />

            <Input
              id={`${id}-new-pass`}
              name="password"
              type="password"
              label="Password Baru"
              placeholder="Minimal 8 karakter"
              value={passwordData.password}
              onChange={handlePasswordChange}
              required
              disabled={passwordLoading}
            />

            <Input
              id={`${id}-confirm-pass`}
              name="password_confirmation"
              type="password"
              label="Konfirmasi Password Baru"
              placeholder="Ulangi password baru"
              value={passwordData.password_confirmation}
              onChange={handlePasswordChange}
              required
              disabled={passwordLoading}
            />

            <div className="pt-2 flex justify-end">
              <Button
                id={`${id}-password-submit-btn`}
                type="submit"
                variant="secondary"
                size="sm"
                isLoading={passwordLoading}
              >
                Ganti Password
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileForm;
