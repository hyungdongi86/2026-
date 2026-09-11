import React, { useState } from 'react';
import { StorageService } from '../services/storageService';
import { ShieldCheck, Lock, ArrowRight, X, AlertCircle } from 'lucide-react';

interface TeacherLoginProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export const TeacherLogin: React.FC<TeacherLoginProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const currentSettings = StorageService.getSettings();
    const targetPassword = currentSettings.teacherPassword || '5714';

    if (password.trim() === targetPassword.trim()) {
      setPassword('');
      onLoginSuccess();
      onClose();
    } else {
      setErrorMsg('비밀번호가 일치하지 않습니다.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="bg-gradient-to-br from-amber-600 to-amber-700 p-6 text-white text-center">
          <div className="inline-flex p-3 rounded-2xl bg-white/10 backdrop-blur-md mb-2 border border-white/20">
            <ShieldCheck className="w-8 h-8 text-amber-100" />
          </div>
          <h3 className="text-xl font-bold">교사 관리자 로그인</h3>
          <p className="text-amber-100 text-xs mt-1">
            성적 입력, 학생 인증코드 관리 및 구글 시트 연동
          </p>
        </div>

        <form onSubmit={handleLogin} className="p-6 space-y-4">
          {errorMsg && (
            <div className="bg-red-50 text-red-700 p-3 rounded-xl border border-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-amber-600" />
              <span>교사 비밀번호</span>
            </label>
            <input
              type="password"
              placeholder="비밀번호 입력"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-medium"
              autoFocus
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 text-sm"
          >
            <span>교사 대시보드 접속</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
