import { Student, GradeRecord, AppSettings, SyncResult } from '../types';
import { INITIAL_STUDENTS, INITIAL_GRADES, INITIAL_SETTINGS } from '../data/initialData';

const KEYS = {
  STUDENTS: 'our_class_students_v4',
  GRADES: 'our_class_grades_v4',
  SETTINGS: 'our_class_settings_v4',
};

export class StorageService {
  // --- Local Storage Accessors ---
  static getSettings(): AppSettings {
    try {
      const data = localStorage.getItem(KEYS.SETTINGS);
      if (data) {
        const parsed = { ...INITIAL_SETTINGS, ...JSON.parse(data) };
        if (parsed.teacherPassword === 'teacher1234') {
          parsed.teacherPassword = '5714';
          this.saveSettings(parsed);
        }
        return parsed;
      }
      // Migrate v3 settings if present
      const oldSettings = localStorage.getItem('our_class_settings_v3');
      if (oldSettings) {
        const parsed = { ...INITIAL_SETTINGS, ...JSON.parse(oldSettings) };
        if (parsed.teacherPassword === 'teacher1234') {
          parsed.teacherPassword = '5714';
        }
        this.saveSettings(parsed);
        return parsed;
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
    return INITIAL_SETTINGS;
  }

  static saveSettings(settings: AppSettings): void {
    try {
      localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  }

  static getStudents(): Student[] {
    try {
      const data = localStorage.getItem(KEYS.STUDENTS);
      if (data) {
        const list: Student[] = JSON.parse(data);
        // Clean out any demo student and ensure DS prefix
        const sanitized = list
          .filter((s) => !s.id.startsWith('stu_demo') && !s.name.includes('체험학생'))
          .map((s) => {
            if (!s.authCode || !s.authCode.toUpperCase().startsWith('DS')) {
              const matchedInitial = INITIAL_STUDENTS.find((init) => init.name === s.name || init.id === s.id);
              const fallbackCode = matchedInitial ? matchedInitial.authCode : `DS${Math.floor(1000 + Math.random() * 9000)}`;
              return { ...s, authCode: fallbackCode };
            }
            return s;
          });

        if (sanitized.length > 0) {
          return sanitized;
        }
      }
    } catch (e) {
      console.error('Failed to load students:', e);
    }
    // 기본 실제 23명 데이터 저장 후 반환
    this.saveStudents(INITIAL_STUDENTS);
    return INITIAL_STUDENTS;
  }

  static restoreInitialStudents(): Student[] {
    this.saveStudents(INITIAL_STUDENTS);
    return INITIAL_STUDENTS;
  }

  static saveStudents(students: Student[]): void {
    try {
      // Always exclude any demo student
      const realStudents = students.filter(
        (s) => !s.id.startsWith('stu_demo') && !s.name.includes('체험학생')
      );
      localStorage.setItem(KEYS.STUDENTS, JSON.stringify(realStudents));
    } catch (e) {
      console.error('Failed to save students:', e);
    }
  }

  static getGrades(): GradeRecord[] {
    try {
      const data = localStorage.getItem(KEYS.GRADES);
      if (data) {
        const list: GradeRecord[] = JSON.parse(data);
        // Exclude any demo student grades
        const sanitized = list.filter(
          (g) => !g.studentId.startsWith('stu_demo') && !g.studentName.includes('체험학생')
        );
        return sanitized;
      }
    } catch (e) {
      console.error('Failed to load grades:', e);
    }
    // 기본 샘플 데이터 저장 후 반환
    this.saveGrades(INITIAL_GRADES);
    return INITIAL_GRADES;
  }

  static saveGrades(grades: GradeRecord[]): void {
    try {
      const realGrades = grades.filter(
        (g) => !g.studentId.startsWith('stu_demo') && !g.studentName.includes('체험학생')
      );
      localStorage.setItem(KEYS.GRADES, JSON.stringify(realGrades));
    } catch (e) {
      console.error('Failed to save grades:', e);
    }
  }

  static resetToSampleData(): { students: Student[]; grades: GradeRecord[]; settings: AppSettings } {
    this.saveStudents(INITIAL_STUDENTS);
    this.saveGrades(INITIAL_GRADES);
    const settings = { ...INITIAL_SETTINGS, gasUrl: this.getSettings().gasUrl };
    this.saveSettings(settings);
    return {
      students: INITIAL_STUDENTS,
      grades: INITIAL_GRADES,
      settings,
    };
  }

  // --- Student Verification ---
  static verifyStudent(name: string, authCode: string): Student | null {
    const students = this.getStudents();
    const cleanedName = name.trim();
    const cleanedCode = authCode.trim().toUpperCase();

    const matched = students.find(
      (s) => s.name.trim() === cleanedName && s.authCode.trim().toUpperCase() === cleanedCode
    );

    return matched || null;
  }

  // --- Google Apps Script (GAS) API Sync ---
  static validateGasUrl(gasUrl: string): { isValid: boolean; warning?: string; normalizedUrl?: string } {
    if (!gasUrl || !gasUrl.trim()) {
      return { isValid: false, warning: '구글 앱스 스크립트 배포 URL을 입력해 주세요.' };
    }
    let clean = gasUrl.trim();

    // 스프레드시트 문서 주소를 잘못 입력한 경우
    if (clean.includes('docs.google.com/spreadsheets')) {
      return {
        isValid: false,
        warning:
          '구글 스프레드시트 문서 주소가 입력되었습니다. 시트 상단 [확장 프로그램] -> [Apps Script] -> [배포] -> [새 배포] -> [웹 앱]에서 발급된 Web App URL(/exec)을 입력해야 합니다.',
      };
    }

    // Apps Script 편집기 주소(/edit)인 경우 /exec로 교정
    if (clean.includes('script.google.com') && clean.endsWith('/edit')) {
      clean = clean.replace(/\/edit$/, '/exec');
      return {
        isValid: true,
        normalizedUrl: clean,
        warning: '편집기 주소(/edit)가 배포 주소(/exec)로 자동 보정되었습니다.',
      };
    }

    if (!clean.includes('script.google.com/macros/s/')) {
      return {
        isValid: false,
        warning:
          '올바른 웹 앱 배포 URL 형식이 아닙니다. (예: https://script.google.com/macros/s/.../exec)',
      };
    }

    return { isValid: true, normalizedUrl: clean };
  }

  static async testGasUrl(gasUrl: string): Promise<SyncResult> {
    if (!gasUrl || !gasUrl.trim()) {
      return { success: false, message: 'Google Apps Script URL을 입력해주세요.' };
    }

    const validation = this.validateGasUrl(gasUrl);
    if (!validation.isValid) {
      return { success: false, message: validation.warning || '유효하지 않은 URL입니다.' };
    }

    const cleanUrl = validation.normalizedUrl || gasUrl.trim();

    try {
      const testUrl = `${cleanUrl}${cleanUrl.includes('?') ? '&' : '?'}action=test&t=${Date.now()}`;

      const response = await fetch(testUrl, { method: 'GET', mode: 'cors' });
      if (!response.ok) {
        const errorMsg =
          response.status === 404
            ? '구글 앱스 스크립트 웹 앱을 찾을 수 없습니다 (404 에러). URL 끝이 /exec 로 끝나는지 및 배포가 완료되었는지 확인하세요.'
            : `구글 시트 연결 실패 (HTTP 상태: ${response.status})`;
        console.warn(`[GAS Test] ${errorMsg}`);
        return { success: false, message: errorMsg };
      }

      const data = await response.json();
      if (data.status === 'success') {
        return { success: true, message: '구글 시트 연동 성공! ' + (data.message || '') };
      } else {
        return { success: false, message: data.message || '구글 시트 연결 실패' };
      }
    } catch (err: any) {
      console.warn('[GAS Connection warning]', err?.message || err);
      return {
        success: false,
        message: '구글 앱스 스크립트 연결 실패: URL 및 배포 권한("모든 사용자")을 확인하세요.',
      };
    }
  }

  // 구글 시트에서 데이터 불러오기 (Pull)
  static async pullFromGas(gasUrl: string): Promise<{
    success: boolean;
    message: string;
    students?: Student[];
    grades?: GradeRecord[];
  }> {
    const currentLocalStudents = this.getStudents();
    const currentLocalGrades = this.getGrades();

    if (!gasUrl || !gasUrl.trim()) {
      return {
        success: false,
        message: '연동된 구글 앱스 스크립트 URL이 없습니다.',
        students: currentLocalStudents,
        grades: currentLocalGrades,
      };
    }

    const validation = this.validateGasUrl(gasUrl);
    if (!validation.isValid) {
      return {
        success: false,
        message: validation.warning || '유효한 구글 웹 앱 URL이 아닙니다.',
        students: currentLocalStudents,
        grades: currentLocalGrades,
      };
    }

    const cleanUrl = validation.normalizedUrl || gasUrl.trim();

    try {
      const fetchUrl = `${cleanUrl}${cleanUrl.includes('?') ? '&' : '?'}action=fetch&t=${Date.now()}`;

      const response = await fetch(fetchUrl, { method: 'GET', cache: 'no-cache' });
      if (!response.ok) {
        const errorMsg =
          response.status === 404
            ? '구글 앱스 스크립트 웹 앱을 찾을 수 없습니다(404 에러). 구글 시트 [Apps Script]에서 [배포] -> [새 배포]를 통해 웹 앱 URL(/exec)을 새로 발급받아 입력해주세요.'
            : `구글 시트 데이터 수신 응답 오류 (HTTP ${response.status})`;

        console.warn(`[GAS Pull] ${errorMsg}`);
        return {
          success: false,
          message: errorMsg,
          students: currentLocalStudents,
          grades: currentLocalGrades,
        };
      }

      const data = await response.json();
      if (data.status === 'success') {
        const fetchedStudents: Student[] = Array.isArray(data.students) ? data.students : [];
        const fetchedGrades: GradeRecord[] = Array.isArray(data.grades) ? data.grades : [];

        // 시트에서 가져온 학생 명단이 비어있는 경우, 기존 학생 명단을 보존
        const effectiveStudents =
          fetchedStudents.length > 0
            ? fetchedStudents
            : (currentLocalStudents.length > 0 ? currentLocalStudents : INITIAL_STUDENTS);

        if (fetchedStudents.length > 0) {
          this.saveStudents(fetchedStudents);
        } else {
          // 구글 시트가 비어있을 경우, 기존 23명 학생 명단을 구글 시트에 자동 푸시하여 시트 초기화 지원
          this.saveStudents(effectiveStudents);
          this.pushToGas(cleanUrl, effectiveStudents, fetchedGrades.length > 0 ? fetchedGrades : this.getGrades()).catch(
            (e) => console.warn('Auto seed Google Sheet with students failed:', e)
          );
        }

        if (fetchedGrades.length > 0) {
          this.saveGrades(fetchedGrades);
        }

        // 업데이트 시간 기록
        const currentSettings = this.getSettings();
        currentSettings.lastSyncTime = new Date().toLocaleString('ko-KR');
        this.saveSettings(currentSettings);

        const returnMessage =
          fetchedStudents.length > 0
            ? `구글 시트에서 학생 ${fetchedStudents.length}명, 성적 ${fetchedGrades.length}건을 성공적으로 불러왔습니다.`
            : `구글 시트에 학생 데이터가 비어있어, 기존 ${effectiveStudents.length}명 학생 명단을 유지하고 구글 시트로 자동 저장했습니다.`;

        return {
          success: true,
          message: returnMessage,
          students: effectiveStudents,
          grades: fetchedGrades.length > 0 ? fetchedGrades : this.getGrades(),
        };
      } else {
        return {
          success: false,
          message: data.message || '데이터 불러오기 실패',
          students: currentLocalStudents,
          grades: currentLocalGrades,
        };
      }
    } catch (err: any) {
      console.warn('[GAS Pull warning]', err?.message || err);
      return {
        success: false,
        message: '구글 시트 데이터 수신 실패: 웹 앱 URL 및 배포 권한("모든 사용자")을 확인하세요.',
        students: currentLocalStudents,
        grades: currentLocalGrades,
      };
    }
  }

  // 구글 시트로 데이터 내보내기 (Push)
  static async pushToGas(
    gasUrl: string,
    students: Student[],
    grades: GradeRecord[]
  ): Promise<SyncResult> {
    if (!gasUrl || !gasUrl.trim()) {
      return { success: false, message: '연동된 구글 앱스 스크립트 URL이 없습니다.' };
    }

    const validation = this.validateGasUrl(gasUrl);
    if (!validation.isValid) {
      return { success: false, message: validation.warning || '유효하지 않은 URL입니다.' };
    }

    const cleanUrl = validation.normalizedUrl || gasUrl.trim();

    try {
      const payload = {
        action: 'sync',
        students,
        grades,
        settings: {
          schoolName: this.getSettings().schoolName,
          className: this.getSettings().className,
          lastSync: new Date().toISOString(),
        },
      };

      // CORS 우회를 위해 text/plain 또는 URL encoded 페이로드 호환성 확보
      const response = await fetch(cleanUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorMsg =
          response.status === 404
            ? '구글 앱스 스크립트 웹 앱을 찾을 수 없습니다(404 에러). 배포 URL을 확인하세요.'
            : `구글 시트 전송 실패 (HTTP ${response.status})`;
        console.warn(`[GAS Push] ${errorMsg}`);
        return { success: false, message: errorMsg };
      }

      const data = await response.json();
      if (data.status === 'success') {
        const currentSettings = this.getSettings();
        currentSettings.lastSyncTime = new Date().toLocaleString('ko-KR');
        this.saveSettings(currentSettings);

        return {
          success: true,
          message: data.message || '구글 시트에 성공적으로 동기화되었습니다.',
          studentsCount: students.length,
          gradesCount: grades.length,
        };
      } else {
        return { success: false, message: data.message || '구글 시트 저장 실패' };
      }
    } catch (err: any) {
      console.warn('[GAS Push warning]', err?.message || err);
      return {
        success: false,
        message: '구글 시트 데이터 동기화 중 오류가 발생했습니다.',
      };
    }
  }
}
