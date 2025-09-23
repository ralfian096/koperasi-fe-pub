
import React, { useState } from 'react';
import { User } from '../types';
import { LogoIcon, EyeIcon, EyeSlashIcon } from './icons/Icons';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
        const credentials = btoa(`${username}:${password}`);
        const response = await fetch('https://api.majukoperasiku.my.id/auth/account', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Accept': 'application/json',
            },
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || `Login gagal dengan status ${response.status}`);
        }
        
        const token = result.data?.token;
        if (!token) {
            throw new Error('Token tidak ditemukan pada respons login.');
        }

        // Store the token in sessionStorage
        sessionStorage.setItem('authToken', token);

        // Parse the token to get user info
        let userPayload;
        try {
            userPayload = JSON.parse(atob(token.split('.')[1]));
        } catch (e) {
            console.error("Gagal mem-parsing token", e);
            throw new Error('Token yang diterima tidak valid.');
        }

        const userId = userPayload.uid_b64 ? atob(userPayload.uid_b64) : `user-${Date.now()}`;
        
        // This is an assumption as the API does not provide the role directly.
        // A full implementation would typically involve another API call to fetch the user's profile.
        const userRole = userPayload.username === 'admin' ? 'Admin' : 'Staf';

        const userToLogin: User = {
            id: userId,
            username: userPayload.username,
            password: password, // Satisfy the local type, not stored long-term
            role: userRole as 'Admin' | 'Manajer' | 'Staf',
        };

        onLoginSuccess(userToLogin);

    } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan yang tidak terduga.');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-lg">
        <div className="flex flex-col items-center">
          <LogoIcon className="w-12 h-12 text-red-600" />
          <h2 className="mt-4 text-3xl font-bold text-center text-slate-900">
            Login ke Panel Admin
          </h2>
          <p className="mt-2 text-sm text-center text-slate-600">
            Silakan masukkan kredensial Anda.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="username" className="sr-only">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className="relative block w-full px-3 py-2 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="relative">
              <label htmlFor="password-address" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                className="relative block w-full px-3 py-2 pr-10 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 z-20 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showPassword ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-100 rounded-md">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="relative flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md group hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-red-400 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
