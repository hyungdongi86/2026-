export const CODE_GS_SOURCE = `/**
 * ==============================================================================
 * [우리반 성적 관리 앱 - Google Apps Script (Code.gs)]
 * 
 * [설치 및 배포 방법]
 * 1. 구글 스프레드시트를 생성하거나 기존 시트를 엽니다.
 * 2. 상단 메뉴 [확장 프로그램] -> [Apps Script] 클릭
 * 3. 기존 코드(myFunction 등)를 모두 지우고 본 파일 전체 코드를 복사하여 붙여넣습니다.
 * 4. 상단 [저장 (💾)] 클릭 후, 우측 상단 [배포] -> [새 배포] 클릭
 * 5. 유형 선택: [웹 앱 (Web App)]
 * 6. 설정 항목:
 *    - 설명: 우리반 성적 관리 API
 *    - 다음 사용자 권한으로 실행: 나 (Me)
 *    - 액세스 권한 있는 사용자: **모든 사용자 (Anyone)**  <- [중요!]
 * 7. [배포] 버튼 클릭 -> [권한 검토] -> 내 구글 계정 선택 -> [Advanced (고급)] -> [Go to App (안전하지 않음으로 이동)] -> [허용]
 * 8. 발급된 **웹 앱 URL (https://script.google.com/macros/s/.../exec)**을 복사하여 
 *    성적 관리 웹 앱의 [교사 설정] -> [구글 시트 연동 URL]에 붙여넣고 저장하세요!
 * ==============================================================================
 */

function doGet(e) {
  var action = e && e.parameter && e.parameter.action ? e.parameter.action : 'fetch';
  
  if (action === 'test') {
    return createJsonResponse({ status: 'success', message: '구글 앱스 스크립트 연결 성공!' });
  }
  
  // 전체 데이터 가져오기 (fetch)
  var data = getAllDataFromSheets();
  return createJsonResponse({
    status: 'success',
    students: data.students,
    grades: data.grades,
    settings: data.settings
  });
}

function doPost(e) {
  try {
    var rawData = e.postData ? e.postData.contents : '';
    if (!rawData) {
      return createJsonResponse({ status: 'error', message: '전송된 데이터가 없습니다.' });
    }
    
    var payload = JSON.parse(rawData);
    var action = payload.action || 'sync';
    
    if (action === 'sync') {
      saveAllDataToSheets(payload.students || [], payload.grades || [], payload.settings || {});
      return createJsonResponse({
        status: 'success',
        message: '구글 스프레드시트에 성공적으로 저장되었습니다.',
        studentsCount: (payload.students || []).length,
        gradesCount: (payload.grades || []).length,
        timestamp: new Date().toLocaleString('ko-KR')
      });
    }
    
    return createJsonResponse({ status: 'error', message: '알 수 없는 요청입니다.' });
  } catch (error) {
    return createJsonResponse({ status: 'error', message: '저장 중 오류 발생: ' + error.toString() });
  }
}

// 응답 헬퍼 함수
function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// 시트 초기화 및 생성 헬퍼
function getOrCreateSheet(sheetName, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    if (headers && headers.length > 0) {
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#E8F5E9');
      sheet.setFrozenRows(1);
    }
  }
  return sheet;
}

// 모든 데이터 시트에서 읽기
function getAllDataFromSheets() {
  var studentsSheet = getOrCreateSheet('학생목록', ['ID', '이름', '인증코드', '학번', '학년', '반', '메모']);
  var gradesSheet = getOrCreateSheet('성적기록', ['ID', '학생ID', '학생이름', '과목', '평가영역', '평가요소', '성취수준', '점수', '만점', '학기', '교사한줄평']);
  var settingsSheet = getOrCreateSheet('설정', ['키', '값']);
  
  // 학생 데이터 읽기
  var studentsData = studentsSheet.getDataRange().getValues();
  var students = [];
  if (studentsData.length > 1) {
    for (var i = 1; i < studentsData.length; i++) {
      var row = studentsData[i];
      if (row[0]) {
        students.push({
          id: String(row[0]),
          name: String(row[1] || ''),
          authCode: String(row[2] || ''),
          studentNumber: String(row[3] || ''),
          gradeLevel: String(row[4] || ''),
          classNumber: String(row[5] || ''),
          note: String(row[6] || '')
        });
      }
    }
  }
  
  // 성적 데이터 읽기
  var gradesData = gradesSheet.getDataRange().getValues();
  var grades = [];
  if (gradesData.length > 1) {
    for (var j = 1; j < gradesData.length; j++) {
      var gRow = gradesData[j];
      if (gRow[0]) {
        grades.push({
          id: String(gRow[0]),
          studentId: String(gRow[1] || ''),
          studentName: String(gRow[2] || ''),
          subject: String(gRow[3] || ''),
          evalArea: String(gRow[4] || ''),
          evalElement: String(gRow[5] || ''),
          performanceRating: String(gRow[6] || '잘함'),
          score: Number(gRow[7]) || 0,
          maxScore: Number(gRow[8]) || 100,
          semester: String(gRow[9] || '2026학년도 2학기'),
          teacherComment: String(gRow[10] || '')
        });
      }
    }
  }
  
  // 설정 데이터 읽기
  var settingsData = settingsSheet.getDataRange().getValues();
  var settings = {};
  if (settingsData.length > 1) {
    for (var k = 1; k < settingsData.length; k++) {
      if (settingsData[k][0]) {
        settings[String(settingsData[k][0])] = String(settingsData[k][1] || '');
      }
    }
  }
  
  return {
    students: students,
    grades: grades,
    settings: settings
  };
}

// 모든 데이터 시트에 저장 (전체 덮어쓰기 Sync 방식)
function saveAllDataToSheets(students, grades, settings) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. 학생목록 갱신
  var studentsSheet = getOrCreateSheet('학생목록', ['ID', '이름', '인증코드', '학번', '학년', '반', '메모']);
  studentsSheet.clear();
  studentsSheet.appendRow(['ID', '이름', '인증코드', '학번', '학년', '반', '메모']);
  studentsSheet.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#E8F5E9');
  studentsSheet.setFrozenRows(1);
  
  if (students && students.length > 0) {
    var studentRows = students.map(function(s) {
      return [
        s.id || '',
        s.name || '',
        s.authCode || '',
        s.studentNumber || '',
        s.gradeLevel || '',
        s.classNumber || '',
        s.note || ''
      ];
    });
    studentsSheet.getRange(2, 1, studentRows.length, 7).setValues(studentRows);
  }
  
  // 2. 성적기록 갱신
  var gradesSheet = getOrCreateSheet('성적기록', ['ID', '학생ID', '학생이름', '과목', '평가영역', '평가요소', '성취수준', '점수', '만점', '학기', '교사한줄평']);
  gradesSheet.clear();
  gradesSheet.appendRow(['ID', '학생ID', '학생이름', '과목', '평가영역', '평가요소', '성취수준', '점수', '만점', '학기', '교사한줄평']);
  gradesSheet.getRange(1, 1, 1, 11).setFontWeight('bold').setBackground('#E3F2FD');
  gradesSheet.setFrozenRows(1);
  
  if (grades && grades.length > 0) {
    var gradeRows = grades.map(function(g) {
      return [
        g.id || '',
        g.studentId || '',
        g.studentName || '',
        g.subject || '',
        g.evalArea || '',
        g.evalElement || '',
        g.performanceRating || '잘함',
        g.score !== undefined ? g.score : 0,
        g.maxScore || 100,
        g.semester || '2026학년도 2학기',
        g.teacherComment || ''
      ];
    });
    gradesSheet.getRange(2, 1, gradeRows.length, 11).setValues(gradeRows);
  }
  
  // 3. 설정 갱신
  var settingsSheet = getOrCreateSheet('설정', ['키', '값']);
  settingsSheet.clear();
  settingsSheet.appendRow(['키', '값']);
  settingsSheet.getRange(1, 1, 1, 2).setFontWeight('bold').setBackground('#FFF3E0');
  settingsSheet.setFrozenRows(1);
  
  var settingKeys = Object.keys(settings || {});
  if (settingKeys.length > 0) {
    var settingRows = settingKeys.map(function(key) {
      return [key, String(settings[key])];
    });
    settingsSheet.getRange(2, 1, settingRows.length, 2).setValues(settingRows);
  }
}

function formatDate(dateObj) {
  var year = dateObj.getFullYear();
  var month = ('0' + (dateObj.getMonth() + 1)).slice(-2);
  var day = ('0' + dateObj.getDate()).slice(-2);
  return year + '-' + month + '-' + day;
}
`;
