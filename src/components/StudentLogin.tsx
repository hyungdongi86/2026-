import React, { useState } from 'react';
import { StorageService } from '../services/storageService';
import { Student } from '../types';
import { User, KeyRound, ShieldCheck, HelpCircle, ArrowRight, BookOpen, AlertCircle } from 'lucide-react';

interface StudentLoginProps {
  onLoginSuccess: (student: Student) => void;
  onOpenTeacherLogin: () => void;
  onOpenGasGuide: () => void;
}

export const StudentLogin: React.FC<StudentLoginProps> = ({
  onLoginSuccess,
  onOpenTeacherLogin,
  onOpenGasGuide,
}) => {
  const [name, setName] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('학생 이름을 입력해 주세요.');
      return;
    }
    if (!authCode.trim()) {
      setErrorMsg('개인 인증코드를 입력해 주세요.');
      return;
    }

    const matched = StorageService.verifyStudent(name, authCode);
    if (matched) {
      onLoginSuccess(matched);
    } else {
      setErrorMsg('이름 또는 개인 인증코드가 일치하지 않습니다. 선생님께 확인해 주세요.');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-emerald-100 overflow-hidden">
        {/* Top Banner */}
        <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 p-8 text-white text-center relative">
          <div className="inline-flex p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 mb-3 shadow-inner">
            <BookOpen className="w-8 h-8 text-emerald-100" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">학생 성적 조회</h2>
          <p className="text-emerald-100 text-xs mt-1">
            개인 인증코드로 나만의 누적 성적과 선생님 한줄평을 확인하세요.
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {errorMsg && (
            <div className="bg-red-50 text-red-700 p-3.5 rounded-2xl border border-red-200 text-xs flex items-center gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <User className="w-4 h-4 text-emerald-600" />
                <span>학생 이름</span>
              </label>
              <input
                type="text"
                placeholder="예: 황형동"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-medium transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-emerald-600" />
                  <span>개인 인증코드</span>
                </span>
                <span className="text-[11px] text-slate-400 font-normal">선생님 발급 코드 (DS+4자리)</span>
              </label>
              <input
                type="text"
                placeholder="예: DS0000"
                value={authCode}
                onChange={(e) => setAuthCode(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-semibold tracking-wider text-slate-800 transition uppercase"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 hover:shadow-lg transition flex items-center justify-center gap-2 text-sm mt-2 cursor-pointer"
            >
              <span>성적 리포트 조회하기</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Footer Links */}
          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
            <button
              onClick={onOpenTeacherLogin}
              className="font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1 transition cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>선생님이신가요? 교사 로그인</span>
            </button>

            <button
              onClick={onOpenGasGuide}
              className="text-slate-500 hover:text-emerald-700 flex items-center gap-1 transition cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>구글 시트 연동 가이드</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
