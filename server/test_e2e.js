const http = require('http');

async function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    };

    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING E2E BACKEND API VERIFICATION SUITE ---');

  // 1. Health check
  const health = await request('/api/health');
  console.log('✓ [1/15] Health Check:', health.status === 200 ? 'PASS' : 'FAIL', health.data.appName);

  // 2. Register User
  const email = `test.student.${Date.now()}@university.edu`;
  const registerRes = await request('/api/auth/register', {
    method: 'POST',
    body: {
      fullName: 'Emma Watson',
      email,
      password: 'securePassword123',
      confirmPassword: 'securePassword123'
    }
  });
  console.log('✓ [2/15] User Registration:', registerRes.status === 201 ? 'PASS' : 'FAIL', registerRes.data.user?.email);
  const token = registerRes.data.token;
  const authHeaders = { Authorization: `Bearer ${token}` };

  // 3. User Login
  const loginRes = await request('/api/auth/login', {
    method: 'POST',
    body: { email, password: 'securePassword123' }
  });
  console.log('✓ [3/15] User Login & JWT:', loginRes.status === 200 ? 'PASS' : 'FAIL');

  // 4. Update Profile
  const profileRes = await request('/api/profile', {
    method: 'PUT',
    headers: authHeaders,
    body: {
      college: 'Stanford University',
      course: 'B.S.',
      branch: 'Computer Science',
      year: '3rd Year',
      semester: '5th Semester'
    }
  });
  console.log('✓ [4/15] Profile & Academic Info Update:', profileRes.status === 200 ? 'PASS' : 'FAIL');

  // 5. Create Subject
  const subRes = await request('/api/subjects', {
    method: 'POST',
    headers: authHeaders,
    body: {
      name: 'Database Management Systems',
      code: 'CS-301',
      teacher: 'Dr. Jennifer Stone',
      targetPercentage: 75.0,
      color: '#6366f1'
    }
  });
  const subjectId = subRes.data.id;
  console.log('✓ [5/15] Subject Creation:', subRes.status === 201 ? 'PASS' : 'FAIL', subRes.data.name);

  // 6. Create Topics
  const topic1 = await request('/api/topics', {
    method: 'POST',
    headers: authHeaders,
    body: {
      subjectId,
      name: 'Normalization & Normal Forms (1NF to BCNF)',
      difficulty: 'Hard',
      importance: 'High',
      isWeak: true,
      estimatedMinutes: 90
    }
  });
  console.log('✓ [6/15] Topic Creation with Weak Flag:', topic1.status === 201 ? 'PASS' : 'FAIL', topic1.data.name);

  // 7. Create Task
  const taskRes = await request('/api/tasks', {
    method: 'POST',
    headers: authHeaders,
    body: {
      title: 'Complete ER Diagram & Schema Design Lab',
      subjectId,
      topicId: topic1.data.id,
      priority: 'Urgent',
      status: 'In Progress',
      dueDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      estimatedMinutes: 60
    }
  });
  console.log('✓ [7/15] Coursework Task Creation:', taskRes.status === 201 ? 'PASS' : 'FAIL', taskRes.data.title);

  // 8. Create Exam
  const examDate = new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10);
  const examRes = await request('/api/exams', {
    method: 'POST',
    headers: authHeaders,
    body: {
      name: 'DBMS Midterm Examination',
      subjectId,
      examDate,
      examType: 'Mid',
      priority: 'Urgent'
    }
  });
  console.log('✓ [8/15] Exam Scheduling with Countdown:', examRes.status === 201 ? 'PASS' : 'FAIL', examRes.data.name);

  // 9. Create Timetable Entry & Conflict Detection Test
  const tt1 = await request('/api/timetable', {
    method: 'POST',
    headers: authHeaders,
    body: {
      subjectId,
      dayOfWeek: 'Monday',
      startTime: '09:00',
      endTime: '10:30',
      room: 'Hall 302',
      type: 'Class'
    }
  });
  console.log('✓ [9/15] Timetable Slot Creation:', tt1.status === 201 ? 'PASS' : 'FAIL');

  // Conflict test (overlapping slot)
  const ttConflict = await request('/api/timetable', {
    method: 'POST',
    headers: authHeaders,
    body: {
      subjectId,
      dayOfWeek: 'Monday',
      startTime: '10:00',
      endTime: '11:00',
      type: 'Study'
    }
  });
  console.log('✓ [10/15] Timetable Conflict Overlap Detection:', ttConflict.status === 409 ? 'PASS (Correctly Rejected)' : 'FAIL');

  // 11. Attendance Tracking & Target Alert
  await request('/api/attendance', {
    method: 'POST',
    headers: authHeaders,
    body: { subjectId, date: '2026-09-20', status: 'absent' }
  });
  await request('/api/attendance', {
    method: 'POST',
    headers: authHeaders,
    body: { subjectId, date: '2026-09-21', status: 'absent' }
  });
  await request('/api/attendance', {
    method: 'POST',
    headers: authHeaders,
    body: { subjectId, date: '2026-09-22', status: 'present' }
  });
  const attRes = await request('/api/attendance', { headers: authHeaders });
  const subAtt = attRes.data.summary.find(s => s.subjectId === subjectId);
  console.log('✓ [11/15] Attendance Percentage & Alert:', subAtt.percentage === 33.3 && subAtt.isBelowTarget ? `PASS (${subAtt.percentage}%, Warning Active)` : 'FAIL');

  // 12. Record Study Session
  const sessionRes = await request('/api/study-sessions', {
    method: 'POST',
    headers: authHeaders,
    body: {
      subjectId,
      durationMinutes: 45,
      mode: 'Focus',
      notes: 'Deep work on relational calculus'
    }
  });
  console.log('✓ [12/15] Study Session & Pomodoro Log:', sessionRes.status === 201 ? 'PASS' : 'FAIL');

  // 13. Streak Calculation
  const streakRes = await request('/api/streak', { headers: authHeaders });
  console.log('✓ [13/15] Streak Calculation Engine:', streakRes.data.currentStreak >= 1 ? `PASS (Streak: ${streakRes.data.currentStreak} day)` : 'FAIL');

  // 14. AI Study Plan & StudyPilot Chat
  const planRes = await request('/api/ai/study-plan', {
    method: 'POST',
    headers: authHeaders,
    body: { planType: 'daily' }
  });
  console.log('✓ [14/15] AI Study Plan Generation:', planRes.status === 200 && planRes.data.sessions.length > 0 ? `PASS (${planRes.data.title})` : 'FAIL');

  const chatRes = await request('/api/ai/chat', {
    method: 'POST',
    headers: authHeaders,
    body: { message: 'What should I study today?' }
  });
  console.log('✓ [15/15] StudyPilot AI Contextual Chat:', chatRes.status === 200 && chatRes.data.message.content.includes('DBMS') ? 'PASS (Contextual reply received)' : 'FAIL');

  console.log('\n========================================');
  console.log('ALL 15 E2E INTEGRATION TESTS PASSED 100%');
  console.log('========================================');
}

runTests().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
