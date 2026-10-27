/**
 * ShouldISkipClass.ai — App Logic v2.0
 */

document.addEventListener('DOMContentLoaded', function () {

    const form = document.getElementById('skipForm');
    const submitBtn = document.getElementById('submitBtn');
    const submitText = submitBtn.querySelector('.submit-text');
    const submitLoading = submitBtn.querySelector('.submit-loading');

    const emptyVerdict = document.getElementById('emptyVerdict');
    const resultSection = document.getElementById('resultSection');

    // Status Bar
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');

    // Attendance inputs
    const attendanceInput = document.getElementById('attendance');
    const minAttendanceInput = document.getElementById('minAttendance');
    const attendanceFill = document.getElementById('attendanceFill');
    const attendanceThreshold = document.getElementById('attendanceThreshold');
    const attendanceHint = document.getElementById('attendanceHint');

    // Sliders
    const strictnessSlider = document.getElementById('teacherStrictness');
    const strictnessValue = document.getElementById('strictnessValue');
    const difficultySlider = document.getElementById('difficulty');
    const difficultyValue = document.getElementById('difficultyValue');

    // Dark / Light Theme Toggle
    const themeToggle = document.getElementById('themeToggle');
    const storedTheme = localStorage.getItem('theme-preference');
    const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;

    if (storedTheme === 'light' || (!storedTheme && prefersLight)) {
        document.body.classList.add('light-mode');
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', function () {
            const isLight = document.body.classList.toggle('light-mode');
            localStorage.setItem('theme-preference', isLight ? 'light' : 'dark');
        });
    }

    // Health check
    checkOllamaHealth();

    async function checkOllamaHealth() {
        try {
            const response = await fetch('/api/health');
            const data = await response.json();

            if (data.ollama_running && data.gemma_available) {
                statusDot.className = 'status-dot connected';
                statusText.textContent = '🟢 Ollama + Gemma Ready';
            } else if (data.ollama_running) {
                statusDot.className = 'status-dot error';
                statusText.textContent = '⚠️ Gemma model missing — run: ollama pull gemma3:4b';
            } else {
                statusDot.className = 'status-dot error';
                statusText.textContent = '🔴 Ollama disconnected — run: ollama serve';
            }
        } catch (e) {
            statusDot.className = 'status-dot error';
            statusText.textContent = '🔴 Backend unreachable';
        }
    }

    // Attendance gauge calculation
    function updateAttendanceBar() {
        const attendance = parseInt(attendanceInput.value) || 0;
        const minAtt = parseInt(minAttendanceInput.value) || 75;
        const diff = attendance - minAtt;

        attendanceFill.style.width = attendance + '%';
        attendanceThreshold.style.left = minAtt + '%';

        attendanceFill.classList.remove('danger', 'warning');
        if (diff < 0) {
            attendanceFill.classList.add('danger');
            attendanceHint.textContent = `${attendance}% (Shortage by ${Math.abs(diff)}%)`;
            attendanceHint.style.color = '#f43f5e';
        } else if (diff <= 3) {
            attendanceFill.classList.add('warning');
            attendanceHint.textContent = `${attendance}% (Danger +${diff}%)`;
            attendanceHint.style.color = '#f59e0b';
        } else {
            attendanceHint.textContent = `${attendance}% (Safe +${diff}%)`;
            attendanceHint.style.color = '#10b981';
        }
    }

    attendanceInput.addEventListener('input', updateAttendanceBar);
    minAttendanceInput.addEventListener('input', updateAttendanceBar);
    updateAttendanceBar();

    // Sliders
    strictnessSlider.addEventListener('input', function () {
        strictnessValue.textContent = this.value;
    });

    difficultySlider.addEventListener('input', function () {
        difficultyValue.textContent = this.value;
    });

    // Pill selectors
    document.querySelectorAll('.pill').forEach(function (btn) {
        btn.addEventListener('click', function () {
            const target = this.getAttribute('data-target');
            const value = this.getAttribute('data-value');

            this.parentElement.querySelectorAll('.pill').forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            document.getElementById(target).value = value;

            if (target === 'hasTest') {
                const testGroup = document.getElementById('testDetailsGroup');
                if (testGroup) testGroup.style.display = (value === 'true') ? 'block' : 'none';
            }
            saveFormToStorage();
        });
    });

    // Presets
    window.applyPreset = function (type) {
        if (type === 'safe') {
            attendanceInput.value = 88;
            minAttendanceInput.value = 75;
            strictnessSlider.value = 4;
            strictnessValue.textContent = '4';
            setPill('proxyStatus', 'Friend got me (100% Proxy)');
            setPill('hasTest', 'false');
            document.getElementById('daySchedule').value = '10:00 AM - English\n\n(Only class today)';
            document.getElementById('classTime').value = '10:00 AM - English';
        } else if (type === 'morning') {
            attendanceInput.value = 79;
            minAttendanceInput.value = 75;
            strictnessSlider.value = 6;
            strictnessValue.textContent = '6';
            document.getElementById('daySchedule').value = '8:00 AM - OS\n9:00 AM - Networks\n10:00 AM - DB';
            document.getElementById('classTime').value = '8:00 AM - OS';
            setPill('proxyStatus', 'Risky proxy (Teacher calls names)');
            setPill('hasTest', 'false');
        } else if (type === 'gap') {
            attendanceInput.value = 82;
            minAttendanceInput.value = 75;
            document.getElementById('daySchedule').value = '9:00 AM - Math\n\n... (3 hour gap) ...\n\n1:00 PM - Chemistry';
            document.getElementById('classTime').value = '1:00 PM - Chemistry';
            setPill('proxyStatus', 'Friend got me (100% Proxy)');
            setPill('hasTest', 'false');
        } else if (type === 'quiz') {
            attendanceInput.value = 80;
            minAttendanceInput.value = 75;
            strictnessSlider.value = 8;
            strictnessValue.textContent = '8';
            document.getElementById('daySchedule').value = '11:00 AM - Algorithms';
            document.getElementById('classTime').value = '11:00 AM - Algorithms';
            setPill('hasTest', 'true');
        }
        updateAttendanceBar();
        saveFormToStorage();
    };

    function setPill(targetId, value) {
        const input = document.getElementById(targetId);
        if (!input) return;
        input.value = value;
        const container = input.previousElementSibling;
        if (container && container.classList.contains('pill-selector')) {
            container.querySelectorAll('.pill').forEach(b => {
                b.classList.toggle('active', b.getAttribute('data-value') === value);
            });
        }
        if (targetId === 'hasTest') {
            const testGroup = document.getElementById('testDetailsGroup');
            if (testGroup) testGroup.style.display = (value === 'true') ? 'block' : 'none';
        }
    }

    // LocalStorage Form Persistence
    const FORM_STORAGE_KEY = 'should_i_skip_form_data';

    function saveFormToStorage() {
        const classesRemainingInput = document.getElementById('classesRemaining');
        const dayScheduleInput = document.getElementById('daySchedule');
        const classTimeInput = document.getElementById('classTime');
        const proxyStatusInput = document.getElementById('proxyStatus');
        const courseCreditsInput = document.getElementById('courseCredits');
        const hasTestInput = document.getElementById('hasTest');
        const testDetailsInput = document.getElementById('testDetails');
        const classTypeInput = document.getElementById('classType');
        const gradeSituationInput = document.getElementById('gradeSituation');

        const data = {
            attendance: attendanceInput.value,
            min_attendance: minAttendanceInput.value,
            classes_remaining: classesRemainingInput ? classesRemainingInput.value : '',
            teacher_strictness: strictnessSlider.value,
            class_time: classTimeInput ? classTimeInput.value : '',
            day_schedule: dayScheduleInput ? dayScheduleInput.value : '',
            proxy_status: proxyStatusInput ? proxyStatusInput.value : '',
            course_credits: courseCreditsInput ? courseCreditsInput.value : '',
            has_test: hasTestInput ? hasTestInput.value : 'false',
            test_details: testDetailsInput ? testDetailsInput.value : '',
            class_type: classTypeInput ? classTypeInput.value : '',
            difficulty: difficultySlider.value,
            grade_situation: gradeSituationInput ? gradeSituationInput.value : ''
        };

        try {
            localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.warn('Unable to save to localStorage', e);
        }
    }

    function loadFormFromStorage() {
        try {
            const saved = localStorage.getItem(FORM_STORAGE_KEY);
            if (!saved) return;
            const data = JSON.parse(saved);
            if (!data || typeof data !== 'object') return;

            if (data.attendance !== undefined && data.attendance !== '') {
                attendanceInput.value = data.attendance;
            }
            if (data.min_attendance !== undefined && data.min_attendance !== '') {
                minAttendanceInput.value = data.min_attendance;
            }
            if (data.classes_remaining !== undefined && data.classes_remaining !== '') {
                const el = document.getElementById('classesRemaining');
                if (el) el.value = data.classes_remaining;
            }
            if (data.teacher_strictness !== undefined && data.teacher_strictness !== '') {
                strictnessSlider.value = data.teacher_strictness;
                strictnessValue.textContent = data.teacher_strictness;
            }
            if (data.difficulty !== undefined && data.difficulty !== '') {
                difficultySlider.value = data.difficulty;
                difficultyValue.textContent = data.difficulty;
            }
            if (data.day_schedule !== undefined) {
                const el = document.getElementById('daySchedule');
                if (el) el.value = data.day_schedule;
            }
            if (data.class_time !== undefined) {
                const el = document.getElementById('classTime');
                if (el) el.value = data.class_time;
            }
            if (data.test_details !== undefined) {
                const el = document.getElementById('testDetails');
                if (el) el.value = data.test_details;
            }

            if (data.proxy_status) setPill('proxyStatus', data.proxy_status);
            if (data.course_credits) setPill('courseCredits', data.course_credits);
            if (data.class_type) setPill('classType', data.class_type);
            if (data.has_test !== undefined) setPill('hasTest', String(data.has_test));
            if (data.grade_situation) setPill('gradeSituation', data.grade_situation);

            updateAttendanceBar();
        } catch (e) {
            console.warn('Unable to load from localStorage', e);
        }
    }

    // Auto-save form inputs on changes
    form.addEventListener('input', saveFormToStorage);
    form.addEventListener('change', saveFormToStorage);

    // Load any previously persisted schedule & attendance inputs
    loadFormFromStorage();

    // Submit
    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const formData = {
            attendance: parseInt(attendanceInput.value),
            min_attendance: parseInt(minAttendanceInput.value),
            classes_remaining: parseInt(document.getElementById('classesRemaining').value),
            teacher_strictness: parseInt(strictnessSlider.value),
            class_time: document.getElementById('classTime').value,
            day_schedule: document.getElementById('daySchedule').value,
            proxy_status: document.getElementById('proxyStatus').value,
            course_credits: document.getElementById('courseCredits').value,
            has_test: document.getElementById('hasTest').value === 'true',
            test_details: document.getElementById('testDetails')?.value || '',
            class_type: document.getElementById('classType').value,
            difficulty: parseInt(difficultySlider.value),
            grade_situation: document.getElementById('gradeSituation').value
        };

        submitBtn.disabled = true;
        submitText.style.display = 'none';
        submitLoading.style.display = 'inline-flex';

        try {
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.error) {
                alert('Error: ' + data.error + (data.help ? '\n\n' + data.help : ''));
                return;
            }

            if (data.success) {
                displayResult(data.analysis);
            }
        } catch (err) {
            alert('Failed to connect to backend server.');
            console.error(err);
        } finally {
            submitBtn.disabled = false;
            submitText.style.display = 'inline';
            submitLoading.style.display = 'none';
        }
    });

    function displayResult(analysis) {
        emptyVerdict.style.display = 'none';
        resultSection.style.display = 'flex';

        const verdictHeader = document.getElementById('verdictHeader');
        const verdictEmoji = document.getElementById('verdictEmoji');
        const verdictText = document.getElementById('verdictText');
        const verdictTagline = document.getElementById('verdictTagline');
        const riskFill = document.getElementById('riskFill');
        const riskValue = document.getElementById('riskValue');
        const detailedAnalysis = document.getElementById('detailedAnalysis');
        const consequencesList = document.getElementById('consequencesList');
        const tipsList = document.getElementById('tipsList');

        const verdict = (analysis.verdict || 'RISKY SKIP').toUpperCase();

        verdictHeader.className = 'verdict-banner';
        if (verdict.includes('SKIP') && !verdict.includes('RISKY')) {
            verdictHeader.classList.add('skip');
            verdictEmoji.textContent = '🎉';
            verdictText.textContent = 'SAFE TO SKIP!';
        } else if (verdict.includes('ATTEND') || verdict.includes('DON')) {
            verdictHeader.classList.add('attend');
            verdictEmoji.textContent = '🚨';
            verdictText.textContent = 'GO TO CLASS!';
        } else {
            verdictHeader.classList.add('risky');
            verdictEmoji.textContent = '⚠️';
            verdictText.textContent = 'RISKY SKIP';
        }

        verdictTagline.textContent = analysis.short_reason || '';

        const riskScore = parseInt(analysis.risk_score) || 5;
        riskFill.style.width = (riskScore * 10) + '%';
        riskFill.className = 'risk-bar-fill';
        if (riskScore >= 7) riskFill.classList.add('high');
        else if (riskScore >= 4) riskFill.classList.add('medium');
        riskValue.textContent = riskScore + '/10';

        detailedAnalysis.textContent = analysis.detailed_analysis || '';

        consequencesList.innerHTML = '';
        (analysis.consequences || []).forEach(c => {
            const li = document.createElement('li');
            li.textContent = c;
            consequencesList.appendChild(li);
        });

        tipsList.innerHTML = '';
        (analysis.tips || []).forEach(t => {
            const li = document.createElement('li');
            li.textContent = t;
            tipsList.appendChild(li);
        });

        // Smooth scroll result into view on mobile
        if (window.innerWidth <= 860) {
            resultSection.scrollIntoView({ behavior: 'smooth' });
        }
    }

});
