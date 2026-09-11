import React from 'react';
import { UserMode, AppSettings } from '../types';
import { GraduationCap, ShieldCheck, UserCheck, BookOpen, FileCode, LogOut, RefreshCw, Layers } from 'lucide-react';

interface HeaderProps {
  mode: UserMode;
  studentName?: string;
  settings: AppSettings;
  onLogout: () => void;
  onSwitchToTeacher: () => void;
  onOpenGasGuide: () => void;
  onSyncGas?: () => void;
  isSyncing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  mode,
  studentName,
  settings,
  onLogout,
  onSwitchToTeacher,
  onOpenGasGuide,
  onSyncGas,
  isSyncing = false,
}) => {
  return (
    <header className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white shadow-lg sticky top-0 z-30 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Left: Branding & Class info */}
        <div className="flex items-center space-x-3 text-center sm:text-left">
          <div className="bg-emerald-600/60 p-2.5 rounded-2xl border border-emerald-400/30 shadow-inner flex items-center justify-center shrink-0">
            <GraduationCap className="w-7 h-7 text-emerald-100" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-700/80 text-emerald-200 border border-emerald-500/30">
                {settings.schoolName || '우리학교'}
              </span>
              <span className="text-xs text-emerald-200 font-medium">
                {settings.className || '우리반'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              우리반 성적 관리 시스템
            </h1>
          </div>
        </div>

        {/* Right: Actions & Current Status */}
        <div className="flex items-center flex-wrap justify-center sm:justify-end gap-2 text-sm">
          {/* Sync indicator */}
          {settings.gasUrl ? (
            <div className="hidden lg:flex items-center text-xs bg-emerald-950/50 text-emerald-200 px-3 py-1.5 rounded-xl border border-emerald-600/40 gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>구글 시트 연동 중</span>
              {onSyncGas && (
                <button
                  onClick={onSyncGas}
                  disabled={isSyncing}
                  className="ml-1 text-emerald-300 hover:text-white transition p-0.5 rounded-lg hover:bg-emerald-700/50"
                  title="지금 구글 시트에서 최신 데이터 불러오기"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                </button>
              )}
            </div>
          ) : (
            <div className="hidden lg:flex items-center text-xs bg-amber-950/40 text-amber-200 px-3 py-1.5 rounded-xl border border-amber-500/30 gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>브라우저 저장소 사용 중</span>
            </div>
          )}

          {/* Guide Modal trigger */}
          <button
            onClick={onOpenGasGuide}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700/60 hover:bg-emerald-600/80 text-emerald-100 border border-emerald-500/30 transition text-xs font-medium"
          >
            <FileCode className="w-4 h-4 text-emerald-300" />
            <span>연동 가이드 & Code.gs</span>
          </button>

          {mode === 'student' && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-500/30 text-emerald-100 font-medium text-xs">
                <UserCheck className="w-4 h-4 text-emerald-300" />
                <span>{studentName} 학생</span>
              </div>
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-800/60 hover:bg-red-700 text-white transition text-xs font-medium"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>로그아웃</span>
              </button>
            </div>
          )}

          {mode === 'teacher' && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-amber-900/60 text-amber-200 px-3 py-1.5 rounded-xl border border-amber-500/30 text-xs font-semibold">
                <ShieldCheck className="w-4 h-4 text-amber-300" />
                <span>교사 대시보드</span>
              </div>
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-900 hover:bg-emerald-950 text-white transition text-xs font-medium"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>선생님 로그아웃</span>
              </button>
            </div>
          )}

          {mode === 'guest' && (
            <button
              onClick={onSwitchToTeacher}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-sm transition text-xs"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>교사 로그인</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
