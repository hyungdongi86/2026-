import React, { useState } from 'react';
import { CODE_GS_SOURCE } from '../data/codeGsSource';
import {
  X,
  Copy,
  Check,
  FileCode,
  ExternalLink,
  HelpCircle,
  Database,
  Globe,
  Layers,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

interface GasGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GasGuideModal: React.FC<GasGuideModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'gs' | 'guide' | 'netlify'>('gs');

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(CODE_GS_SOURCE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden relative max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <FileCode className="w-6 h-6 text-emerald-300" />
            <div>
              <h3 className="text-lg font-bold">구글 연동 & 배포 가이드</h3>
              <p className="text-xs text-emerald-200">
                구글 스프레드시트 실시간 연동 (Code.gs) 및 Netlify 배포 안내
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 pt-3 flex items-center gap-2 text-xs font-bold shrink-0">
          <button
            onClick={() => setActiveTab('gs')}
            className={`pb-3 px-4 flex items-center gap-1.5 border-b-2 transition ${
              activeTab === 'gs'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>Code.gs 백엔드 원본 코드</span>
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`pb-3 px-4 flex items-center gap-1.5 border-b-2 transition ${
              activeTab === 'guide'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>구글 앱스 스크립트 설정 방법</span>
          </button>

          <button
            onClick={() => setActiveTab('netlify')}
            className={`pb-3 px-4 flex items-center gap-1.5 border-b-2 transition ${
              activeTab === 'netlify'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>GitHub & Netlify 배포 가이드</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: CODE.GS SOURCE */}
          {activeTab === 'gs' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">
                    구글 앱스 스크립트(Code.gs) 원본 소스
                  </h4>
                  <p className="text-xs text-slate-500">
                    아래 전체 코드를 복사하여 구글 시트의 [확장 프로그램] → [Apps Script]에 붙여넣으세요.
                  </p>
                </div>
                <button
                  onClick={handleCopy}
                  className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition ${
                    copied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 hover:bg-slate-900 text-white'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-200" />
                      <span>복사 완료!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Code.gs 전체 복사</span>
                    </>
                  )}
                </button>
              </div>

              <div className="bg-slate-950 text-slate-100 rounded-2xl p-4 font-mono text-xs overflow-x-auto border border-slate-800 max-h-[50vh] leading-relaxed select-all">
                <pre>{CODE_GS_SOURCE}</pre>
              </div>
            </div>
          )}

          {/* TAB 2: GAS STEP BY STEP */}
          {activeTab === 'guide' && (
            <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
              <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200">
                <h4 className="font-bold text-emerald-900 text-sm mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>구글 연동 5단계 빠른 설정 가이드</span>
                </h4>
                <ol className="list-decimal list-inside space-y-2 text-slate-800 font-medium">
                  <li>
                    <strong className="text-emerald-800">구글 시트 준비:</strong> 구글 드라이브에서 새 구글 스프레드시트를 만듭니다. (시트 제목 예: <code>우리반 성적 DB</code>)
                  </li>
                  <li>
                    <strong className="text-emerald-800">Apps Script 열기:</strong> 상단 메뉴에서 <code>[확장 프로그램]</code> → <code>[Apps Script]</code>를 클릭합니다.
                  </li>
                  <li>
                    <strong className="text-emerald-800">코드 붙여넣기:</strong> 기존 코드를 모두 삭제하고, 위의 [Code.gs 전체 복사] 코드를 그대로 붙여넣고 저장(💾)합니다.
                  </li>
                  <li>
                    <strong className="text-emerald-800">웹 앱으로 배포 (중요!):</strong>
                    <ul className="list-disc list-inside pl-4 mt-1 space-y-1 text-slate-600 font-normal">
                      <li>우측 상단 <code>[배포]</code> → <code>[새 배포]</code> 클릭</li>
                      <li>유형: <code>웹 앱 (Web App)</code> 선택</li>
                      <li>다음 사용자 권한으로 실행: <code>나 (Me)</code></li>
                      <li>액세스 권한 있는 사용자: <strong className="text-amber-700">모든 사용자 (Anyone)</strong> (⭐ 필수 설정)</li>
                      <li><code>[배포]</code> 클릭 후 구글 계정 권한 허용 완료</li>
                    </ul>
                  </li>
                  <li>
                    <strong className="text-emerald-800">웹 앱 URL 등록:</strong> 발급된 <code>https://script.google.com/macros/s/.../exec</code> 주소를 복사하여 본 웹 앱의 <code>[교사 대시보드]</code> → <code>[구글 시트 연동 설정]</code> 메뉴에 저장하면 즉시 연동됩니다!
                  </li>
                </ol>
              </div>

              <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 space-y-2">
                <h5 className="font-bold text-amber-900 text-xs flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>자주 발생하는 404 오류(웹 앱을 찾을 수 없음) 해결 팁</span>
                </h5>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-800">
                  <li>
                    <strong>구글 시트 주소 입력 금지:</strong> <code>https://docs.google.com/spreadsheets/...</code> 주소를 입력하면 안 됩니다.
                  </li>
                  <li>
                    <strong>편집기 주소 입력 금지:</strong> 주소 끝이 <code>/edit</code>로 끝나면 안 되며, 반드시 배포 후 생성된 <code>/exec</code> 주소여야 합니다.
                  </li>
                  <li>
                    <strong>배포 권한:</strong> 액세스 권한이 '모든 사용자(Anyone)'로 설정되어 있는지 확인하세요.
                  </li>
                  <li>
                    <strong>새 배포 생성:</strong> 구글 시트에서 코드를 수정했거나 배포가 만료된 경우, <code>[배포] → [새 배포]</code>를 진행하여 새로운 웹 앱 URL을 복사해 등록하세요.
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 3: NETLIFY DEPLOYMENT */}
          {activeTab === 'netlify' && (
            <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-teal-600" />
                  <span>GitHub & Netlify 무료 배포 방법</span>
                </h4>

                <div className="space-y-2">
                  <p>
                    <strong>1. GitHub 저장소 올리기:</strong>
                  </p>
                  <p className="bg-white p-3 rounded-xl border border-slate-200 font-mono text-[11px] text-slate-800">
                    git init<br />
                    git add .<br />
                    git commit -m "Initial commit for Class Grade Manager"<br />
                    git branch -M main<br />
                    git remote add origin https://github.com/내아이디/our-class-grades.git<br />
                    git push -u origin main
                  </p>

                  <p className="pt-2">
                    <strong>2. Netlify 자동 배포 설정:</strong>
                  </p>
                  <ul className="list-disc list-inside pl-2 space-y-1 text-slate-600">
                    <li>Netlify.com 가입 후 [Add new site] → [Import an existing project] 선택</li>
                    <li>GitHub 선택 후 위 저장소 연결</li>
                    <li>Build command: <code>npm run build</code></li>
                    <li>Publish directory: <code>dist</code></li>
                    <li>[Deploy site] 클릭 후 1분 내 자동 발급 URL 생성 완료!</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
