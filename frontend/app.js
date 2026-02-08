// Configuration
const API_BASE_URL = 'http://localhost:5000/api/v1';

// State Management
const AppState = {
    currentUser: null,
    currentPage: 'onboarding',
    roadmap: null,
    progressData: null,
    profileData: null
};

// Utility Functions
function showLoading() {
    document.getElementById('loading-overlay').classList.add('active');
}

function hideLoading() {
    document.getElementById('loading-overlay').classList.remove('active');
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    // Emojis removed
    toast.innerHTML = `
        <span>${type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Info'}</span>
        <span style="margin-left: 8px;">${message}</span>
    `;
    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 5000);
}

function showStatusMessage(elementId, message, type = 'success') {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.className = `status-message active ${type}`;

    setTimeout(() => {
        element.classList.remove('active');
    }, 5000);
}

// Navigation
function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const pages = document.querySelectorAll('.page');

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            const targetPage = link.dataset.page;

            // Update active nav link
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // Show target page
            pages.forEach(page => page.classList.remove('active'));
            document.getElementById(`${targetPage}-page`).classList.add('active');

            AppState.currentPage = targetPage;

            // Load page data
            loadPageData(targetPage);
        });
    });
}

function loadPageData(page) {
    if (!AppState.currentUser) return;

    switch (page) {
        case 'roadmap':
            loadRoadmap();
            break;
        case 'progress':
            loadProgress();
            break;
        case 'profile':
            loadProfile();
            break;
    }
}

// Onboarding
function initOnboarding() {
    const form = document.getElementById('onboarding-form');
    // Ensure we start at step 1
    let currentStep = 1;
    const totalSteps = 4;

    const nextBtn = document.getElementById('next-btn');
    const prevBtn = document.getElementById('prev-btn');
    const submitBtn = document.getElementById('submit-btn');

    // Multi-step visibility logic
    function updateStepVisibility() {
        // Safe check for elements
        const steps = document.querySelectorAll('.form-step');
        if (!steps.length) return;

        steps.forEach(step => step.classList.remove('active'));

        const currentStepEl = document.querySelector(`.form-step[data-step="${currentStep}"]`);
        if (currentStepEl) currentStepEl.classList.add('active');

        document.querySelectorAll('.step-dot').forEach(dot => {
            const step = parseInt(dot.dataset.step);
            if (step <= currentStep) dot.classList.add('active');
            else dot.classList.remove('active');
        });

        if (prevBtn) prevBtn.style.display = currentStep > 1 ? 'inline-flex' : 'none';

        if (currentStep === totalSteps) {
            if (nextBtn) nextBtn.style.display = 'none';
            if (submitBtn) submitBtn.style.display = 'inline-flex';
        } else {
            if (nextBtn) nextBtn.style.display = 'inline-flex';
            if (submitBtn) submitBtn.style.display = 'none';
        }
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            // Debug: console.log('Next button clicked');
            const currentStepEl = document.querySelector(`.form-step[data-step="${currentStep}"]`);
            if (!currentStepEl) return;

            const inputs = currentStepEl.querySelectorAll('input, select, textarea');
            let isValid = true;
            let firstInvalid = null;

            inputs.forEach(input => {
                // Ignore hidden inputs (like photo base64) unless explicitly required
                if (input.type === 'hidden') return;

                // Reset error state
                input.classList.remove('error');

                if (!input.checkValidity()) {
                    input.reportValidity();
                    input.classList.add('error');
                    isValid = false;
                    if (!firstInvalid) firstInvalid = input;
                }
            });

            if (isValid) {
                if (currentStep < totalSteps) {
                    currentStep++;
                    updateStepVisibility();
                }
            } else {
                // Focus the first invalid field
                if (firstInvalid) firstInvalid.focus();
                showToast('Please fill in all required fields.', 'error');
            }
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentStep > 1) {
                currentStep--;
                updateStepVisibility();
            }
        });
    }

    // --- Interaction Logic (Moved inside to ensure elements exist) ---

    // Photo Upload
    const photoInput = document.getElementById('profile-photo-input');
    const photoPreview = document.getElementById('profile-preview');
    const photoBase64 = document.getElementById('profile-photo-base64');

    if (photoInput && photoPreview && photoBase64) {
        photoInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                // Validate file type
                if (!file.type.startsWith('image/')) {
                    showToast('Please upload a valid image file', 'error');
                    return;
                }

                // Validate file size (e.g., < 2MB)
                if (file.size > 2 * 1024 * 1024) {
                    showToast('Image is too large (max 2MB)', 'error');
                    return;
                }

                const reader = new FileReader();
                reader.onload = function (e) {
                    // Update DOM explicitly
                    photoPreview.innerHTML = ''; // Clear text
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    img.alt = "Profile Preview";
                    // Apply inline styles to be absolutely sure
                    img.style.width = '100%';
                    img.style.height = '100%';
                    img.style.objectFit = 'cover';
                    img.style.borderRadius = '50%';

                    photoPreview.appendChild(img);

                    photoBase64.value = e.target.result;
                };
                reader.onerror = function () {
                    showToast('Error reading file', 'error');
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Relocation Toggle
    const relocationToggle = document.getElementById('relocation-toggle');
    const relocationInputGroup = document.getElementById('relocation-input-group');
    const relocationStatus = document.getElementById('relocation-status');
    const relocationGoal = document.getElementById('relocation-goal');

    if (relocationToggle && relocationInputGroup && relocationStatus) {
        relocationToggle.addEventListener('change', () => {
            if (relocationToggle.checked) {
                relocationInputGroup.style.display = 'block';
                relocationStatus.textContent = 'Yes';
                if (relocationGoal) relocationGoal.required = true;
            } else {
                relocationInputGroup.style.display = 'none';
                relocationStatus.textContent = 'No';
                if (relocationGoal) relocationGoal.required = false;
            }
        });
    }

    // Planning Horizon Slider
    const horizonSlider = document.getElementById('planning-horizon');
    const horizonValue = document.getElementById('horizon-value');

    if (horizonSlider && horizonValue) {
        horizonSlider.addEventListener('input', () => {
            const val = horizonSlider.value;
            horizonValue.textContent = `${val} Year${val > 1 ? 's' : ''}`;
        });
    }
    // --- End Interaction Logic ---

    // Helper function to get user ID by email
    async function getUserIdByEmail(email) {
        try {
            const response = await fetch(`${API_BASE_URL}/users/by-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            if (response.ok) {
                const data = await response.json();
                return data.user?.id;
            }
            return null;
        } catch (error) {
            console.error('Error fetching user by email:', error);
            return null;
        }
    }

    // Initialize
    updateStepVisibility();

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        showLoading();

        try {
            const formData = new FormData(form);
            const data = {
                name: formData.get('name'),
                email: formData.get('email'),
                major: formData.get('major'),
                university: formData.get('university'),
                gpa: parseFloat(formData.get('gpa')) || null,
                career_aspirations: formData.get('career_aspirations'),
                target_industries: formData.get('target_industries').split(',').map(s => s.trim()),
                current_skills: formData.get('current_skills').split(',').map(s => s.trim()),
                experience_level: formData.get('experience_level'),
                preferred_learning: formData.get('preferred_learning'),
                preferred_content_types: formData.get('preferred_content_types') ? formData.get('preferred_content_types').split(',').map(s => s.trim()) : [],
                time_commitment: formData.get('time_commitment'),

                // New Fields
                profile_photo: document.getElementById('profile-photo-base64').value || null,
                relocation_goal: relocationToggle.checked ? formData.get('relocation_goal') : null,
                extracurricular_interests: formData.get('extracurricular_interests') ? formData.get('extracurricular_interests').split(',').map(s => s.trim()) : [],
                planning_horizon_years: parseInt(horizonSlider.value)
            };

            // Using years directly, no specific timeline conversion needed for API beyond this
            const timeline = parseInt(horizonSlider.value) * 12; // Convert years to months for internal consistency if needed

            console.log('Starting onboarding process...');
            console.log('Data:', data);

            // Register user
            console.log('Registering user...');
            const registerResponse = await fetch(`${API_BASE_URL}/users/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: data.email,
                    name: data.name
                })
            });

            console.log('Register response status:', registerResponse.status);

            if (!registerResponse.ok && registerResponse.status !== 409) {
                throw new Error('Failed to register user');
            }

            const registerData = await registerResponse.json();
            console.log('Register data:', registerData);
            const userId = registerData.user?.id || (await getUserIdByEmail(data.email));
            console.log('User ID:', userId);

            // Complete onboarding
            console.log('Completing onboarding...');
            const onboardResponse = await fetch(`${API_BASE_URL}/users/onboard`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    ...data
                })
            });

            console.log('Onboard response status:', onboardResponse.status);

            if (!onboardResponse.ok) {
                const errorText = await onboardResponse.text();
                console.error('Onboarding error:', errorText);
                throw new Error('Failed to complete onboarding');
            }

            const onboardData = await onboardResponse.json();
            console.log('Onboard data:', onboardData);
            AppState.currentUser = { id: userId, ...data };

            // Generate growth path
            console.log('Generating growth path...');
            const roadmapResponse = await fetch(`${API_BASE_URL}/growth-path/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    timeline_months: timeline
                })
            });

            console.log('Roadmap response status:', roadmapResponse.status);

            if (!roadmapResponse.ok) {
                const errorText = await roadmapResponse.text();
                console.error('Roadmap generation error:', errorText);
                throw new Error('Failed to generate growth path');
            }

            console.log('Growth path generated successfully!');

            hideLoading();
            showToast('Growth path generated successfully!', 'success');
            showStatusMessage('onboarding-status', 'Success! Navigate to "My Roadmap" to see your personalized path.', 'success');

            // Switch to roadmap view
            setTimeout(() => {
                document.querySelector('[data-page="roadmap"]').click();
            }, 2000);

        } catch (error) {
            hideLoading();
            console.error('Onboarding error:', error);
            showToast('Error during onboarding. Please try again.', 'error');
            showStatusMessage('onboarding-status', error.message, 'error');
        }
    });
}

async function getUserIdByEmail(email) {
    // Helper to get user ID when already registered
    return 1; // Simplified for demo
}

// Interactive Roadmap Functions
async function loadRoadmap() {
    if (!AppState.currentUser) {
        document.getElementById('roadmap-content').innerHTML =
            '<p class="empty-state">Please complete onboarding first</p>';
        return;
    }

    // Load current month view
    await loadCurrentMonth();

    // Also load full roadmap in background for "View All Months"
    try {
        const roadmapResponse = await fetch(`${API_BASE_URL}/growth-path/${AppState.currentUser.id}`);
        if (roadmapResponse.ok) {
            const roadmapData = await roadmapResponse.json();
            AppState.roadmap = roadmapData.enriched_roadmap;
            displayRoadmap(AppState.roadmap);
        }
    } catch (error) {
        console.error('Error loading full roadmap:', error);
    }
}

async function loadCurrentMonth() {
    if (!AppState.currentUser) return;

    showLoading();

    try {
        const response = await fetch(`${API_BASE_URL}/roadmap/current-month/${AppState.currentUser.id}`);

        if (!response.ok) {
            // If no tasks, try generating them
            await generateCurrentMonthTasks();
            return;
        }

        const data = await response.json();
        AppState.currentMonth = data.current_month; // Save current month to state
        displayCurrentMonth(data);
        hideLoading();

    } catch (error) {
        console.error('Error loading current month:', error);
        hideLoading();
        showToast('Error loading current month', 'error');
    }
}

async function generateCurrentMonthTasks() {
    try {
        const response = await fetch(`${API_BASE_URL}/roadmap/generate-month`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: AppState.currentUser.id })
        });

        if (response.ok) {
            const data = await response.json();
            displayCurrentMonth({
                current_month: data.month,
                month_info: data.month_data,
                tasks: data.tasks,
                preferences: {},
                total_tasks: data.tasks.length,
                completed: 0
            });
            showToast('Month tasks generated!', 'success');
        }
        hideLoading();
    } catch (error) {
        console.error('Error generating month:', error);
        hideLoading();
    }
}

function displayCurrentMonth(data) {
    // Update month header
    document.getElementById('month-title').textContent =
        data.month_info?.title || `Month ${data.current_month}`;
    document.getElementById('month-focus').textContent =
        data.month_info?.focus || 'Focus on building your skills';

    // Motivation banner
    const motivationEl = document.getElementById('month-motivation');
    if (data.month_info?.motivation) {
        motivationEl.textContent = `Tip: ${data.month_info.motivation}`;
    } else {
        motivationEl.textContent = '';
    }

    // Tasks
    const tasksContainer = document.getElementById('current-tasks-list');
    if (!data.tasks || data.tasks.length === 0) {
        tasksContainer.innerHTML = '<p class="empty-state">No tasks for this month yet.</p>';
    } else {
        tasksContainer.innerHTML = data.tasks.map(task => `
            <div class="current-task-item ${task.status === 'completed' ? 'completed' : ''}">
                <div class="task-item-info">
                    <span class="task-item-type">${task.item_type}</span>
                    <span class="task-item-name">${task.item_name}</span>
                </div>
                <div class="task-item-actions">
                    ${task.status !== 'completed' ? `
                        <button class="btn btn-sm btn-success" onclick="updateTaskStatus('${task.item_id}', 'completed')">
                            Complete
                        </button>
                    ` : '<span style="color: white;">Done</span>'}
                </div>
            </div>
        `).join('');
    }

    // Progress
    document.getElementById('tasks-completed').textContent = data.completed || 0;
    document.getElementById('tasks-total').textContent = data.total_tasks || 0;
    const progressPercent = data.total_tasks > 0 ? (data.completed / data.total_tasks) * 100 : 0;
    document.getElementById('month-progress-fill').style.width = `${progressPercent}%`;

    // Preferences
    if (data.preferences) {
        document.getElementById('pref-projects').textContent = `${data.preferences.project_ratio || 50}%`;
        document.getElementById('pref-pace').textContent = data.preferences.pace || 'moderate';
    }
}

async function sendAssistantMessage(message) {
    if (!AppState.currentUser || !message.trim()) return;

    const messagesContainer = document.getElementById('assistant-messages');

    // Add user message to UI
    messagesContainer.innerHTML += `
        <div class="user-message">
            <div class="message-avatar" style="font-size: 0.8rem; display: flex; align-items: center; justify-content: center; background: #e2e8f0; border-radius: 50%; width: 24px; height: 24px;">U</div>
            <div class="message-content">${message}</div>
        </div>
    `;

    // Clear input
    document.getElementById('assistant-input').value = '';

    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    try {
        console.log('Sending message to assistant:', message);
        const response = await fetch(`${API_BASE_URL}/roadmap/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: AppState.currentUser.id,
                message: message
            })
        });

        console.log('Assistant response status:', response.status);
        if (!response.ok) throw new Error('Chat failed');

        const data = await response.json();

        // Add assistant response
        messagesContainer.innerHTML += `
            <div class="assistant-message">
                <div class="message-avatar" style="font-size: 0.8rem; display: flex; align-items: center; justify-content: center; background: var(--primary-color); color: white; border-radius: 50%; width: 24px; height: 24px;">AI</div>
                <div class="message-content">${data.response}</div>
            </div>
        `;

        // Update preferences display
        if (data.preferences) {
            document.getElementById('pref-projects').textContent = `${data.preferences.project_ratio || 50}%`;
            document.getElementById('pref-pace').textContent = data.preferences.pace || 'moderate';
        }

        // If action was taken, reload tasks
        if (data.action !== 'none') {
            showToast('Preferences updated! Regenerating tasks...', 'info');
            setTimeout(() => generateCurrentMonthTasks(), 1000);
        }

        messagesContainer.scrollTop = messagesContainer.scrollHeight;

    } catch (error) {
        console.error('Error sending message:', error);
        messagesContainer.innerHTML += `
            <div class="assistant-message">
                <div class="message-avatar">🤖</div>
                <div class="message-content">Sorry, I had trouble understanding that. Could you try again?</div>
            </div>
        `;
    }
}

// Initialize interactive roadmap
function initInteractiveRoadmap() {
    // Send message button
    document.getElementById('send-message')?.addEventListener('click', () => {
        const input = document.getElementById('assistant-input');
        sendAssistantMessage(input.value);
    });

    // Enter key to send
    document.getElementById('assistant-input')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendAssistantMessage(e.target.value);
        }
    });

    // Quick action buttons
    document.querySelectorAll('.quick-action-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.dataset.action;
            const messages = {
                'more-projects': 'I want to focus more on hands-on projects this month',
                'more-courses': 'I prefer more structured courses over projects',
                'slower-pace': 'The current pace is too fast, I need fewer tasks',
                'faster-pace': 'I can handle more tasks, speed things up!'
            };
            sendAssistantMessage(messages[action] || action);
        });
    });

    // Regenerate month button
    document.getElementById('regenerate-month')?.addEventListener('click', async () => {
        showLoading();
        await generateCurrentMonthTasks();
    });

    // Toggle full roadmap view
    document.getElementById('toggle-full-roadmap')?.addEventListener('click', () => {
        const roadmapContent = document.getElementById('roadmap-content');
        if (roadmapContent.style.display === 'none') {
            roadmapContent.style.display = 'block';
            document.getElementById('toggle-full-roadmap').textContent = 'Hide All Months';
        } else {
            roadmapContent.style.display = 'none';
            document.getElementById('toggle-full-roadmap').textContent = 'View All Months';
        }
    });
}

function displayAnalysis(analysis) {
    const container = document.getElementById('profile-analysis');

    const html = `
        <h2>Your Profile Analysis</h2>
        <div class="analysis-grid">
            <div class="analysis-card">
                <h3>Strengths</h3>
                <ul>
                    ${analysis.strengths.map(s => `<li>${s}</li>`).join('')}
                </ul>
            </div>
            <div class="analysis-card">
                <h3>Areas to Develop</h3>
                <ul>
                    ${analysis.gaps.map(g => `<li>${g}</li>`).join('')}
                </ul>
            </div>
            <div class="analysis-card">
                <h3>Career Paths</h3>
                <ul>
                    ${analysis.career_paths.map(c => `<li>${c}</li>`).join('')}
                </ul>
            </div>
            <div class="analysis-card">
                <h3>Learning Tips</h3>
                <ul>
                    ${analysis.learning_tips.map(t => `<li>${t}</li>`).join('')}
                </ul>
            </div>
        </div>
    `;

    container.innerHTML = html;
}

function displayRoadmap(roadmap) {
    const container = document.getElementById('roadmap-content');
    const currentMonth = AppState.currentMonth || 1;

    if (!roadmap || !roadmap.phases) {
        container.innerHTML = '<p class="empty-state">No roadmap data available</p>';
        return;
    }

    const html = roadmap.phases.map(phase => {
        const isLocked = phase.phase > currentMonth;
        const isCurrent = phase.phase === currentMonth;

        return `
        <div class="phase-card ${isLocked ? 'locked' : ''} ${isCurrent ? 'current' : ''}">
            <div class="phase-header">
                <div>
                    <h2>${phase.title} ${isLocked ? '(Locked)' : ''}</h2>
                    <span class="phase-badge">Month ${phase.phase}</span>
                    ${isCurrent ? '<span class="status-badge status-in_progress" style="margin-left: 10px;">Current Focus</span>' : ''}
                </div>
            </div>
            <p class="phase-focus">Focus: ${phase.focus}</p>
            
            ${isLocked ? '<div class="locked-overlay"><p>Complete 75% of previous months to unlock</p></div>' : ''}

            <div class="phase-content ${isLocked ? 'blurred' : ''}">
                ${renderPhaseItems('Courses', phase.courses, 'course', isLocked)}
                ${renderPhaseItems('Projects', phase.projects, 'project', isLocked)}
                ${renderPhaseItems('Certificates', phase.certificates, 'certificate', isLocked)}
                ${renderPhaseItems('Internships', phase.internships, 'internship', isLocked)}
                ${renderPhaseItems('Tests', phase.tests, 'test', isLocked)}
            </div>
        </div>
    `}).join('');

    container.innerHTML = html;
}

function renderPhaseItems(title, items, type, isLocked) {
    if (!items || items.length === 0) return '';

    return `
        <h3>${title}</h3>
        <div class="items-grid">
            ${items.map(item => renderItem(item, type, isLocked)).join('')}
        </div>
    `;
}

function renderItem(item, type, isLocked = false) {
    const progress = item.progress || { status: 'not_started' };

    // Ensure ID exists and is treated as string
    const itemId = item.id || item.item_id;

    let details = '';
    if (type === 'course') {
        details = `
            <div class="item-details">
                Platform: ${item.platform} | Duration: ${item.duration || 'Self-paced'}
            </div>
        `;
    } else if (type === 'test') {
        details = `
            <div class="item-details">
                Target: ${item.target_score} | Date: ${item.timing}
            </div>
        `;
    } else if (type === 'internship') {
        details = `
            <div class="item-details">
                When: ${item.when} | Company: ${item.companies?.join(', ') || 'Various companies'}
            </div>
        `;
    } else if (type === 'certificate') {
        details = `
            <div class="item-details">
                Provider: ${item.provider} | Date: ${item.timing}
            </div>
        `;
    } else if (type === 'project') {
        details = `
            <div class="item-details">
                Skills: ${item.skills_demonstrated?.join(', ') || 'Multiple skills'}
            </div>
        `;
    }

    return `
        <div class="item-card task-card-mini" data-item-id="${itemId}">
            <div class="item-header">
                <div class="item-type">${type}</div>
                ${progress.status === 'completed' ? '<span class="status-icon">Completed</span>' : ''}
            </div>
            <div class="item-name">${item.name || item.type}</div>
            ${details}
            ${item.description ? `<div class="item-details">${item.description}</div>` : ''}
            <div class="item-rationale">
                Rationale: ${item.rationale}
            </div>
            
            <div class="item-actions-footer">
                <div class="item-progress">
                    <span class="status-badge status-${progress.status}">
                        ${progress.status.replace('_', ' ')}
                    </span>
                </div>
                
                ${!isLocked && progress.status !== 'completed' ? `
                    <button class="btn btn-sm btn-primary" onclick="updateTaskStatus('${itemId}', 'completed')">
                        Complete
                    </button>
                ` : ''}
            </div>
            
            ${progress.status === 'completed' && progress.encouragement_message ?
            `<div class="encouragement-message">${progress.encouragement_message}</div>` : ''}
        </div>
    `;
}

// Progress Tracking
async function loadProgress() {
    if (!AppState.currentUser) {
        document.getElementById('progress-tasks').innerHTML =
            '<p class="empty-state">Please complete onboarding first</p>';
        return;
    }

    showLoading();

    try {
        // Load summary
        const summaryResponse = await fetch(`${API_BASE_URL}/progress/${AppState.currentUser.id}/summary`);
        const summary = await summaryResponse.json();
        displayProgressSummary(summary);

        // Load tasks
        const tasksResponse = await fetch(`${API_BASE_URL}/progress/${AppState.currentUser.id}/tasks`);
        const tasksData = await tasksResponse.json();
        AppState.progressData = tasksData.tasks;

        displayTasks(AppState.progressData);
        hideLoading();

    } catch (error) {
        console.error('Error loading progress:', error);
        showToast('Error loading progress', 'error');
        hideLoading();
    }
}

function displayProgressSummary(summary) {
    const container = document.getElementById('progress-summary');

    // Update current month in app state for filtering
    if (summary.current_month) {
        AppState.currentMonth = summary.current_month;
    }

    const percentage = summary.total > 0
        ? Math.round((summary.completed / summary.total) * 100)
        : 0;

    const notStarted = summary.not_started || 0;
    const inProgress = summary.in_progress || 0;
    const completed = summary.completed || 0;
    const total = summary.total || 0;

    // Calculate pie chart segments
    const completedAngle = total > 0 ? (completed / total) * 360 : 0;
    const inProgressAngle = total > 0 ? (inProgress / total) * 360 : 0;
    const notStartedAngle = total > 0 ? (notStarted / total) * 360 : 0;

    const html = `
        <div class="progress-chart-container">
            <div class="pie-chart">
                <svg width="200" height="200" viewBox="0 0 200 200">
                    <circle cx="100" cy="100" r="90" fill="none" stroke="#e5e5e5" stroke-width="20"/>
                    ${completed > 0 ? `
                        <circle cx="100" cy="100" r="90" fill="none" 
                                stroke="#b8d1ba" stroke-width="20"
                                stroke-dasharray="${completedAngle * (Math.PI * 90) / 180} ${2 * Math.PI * 90}"
                                stroke-dashoffset="0"/>
                    ` : ''}
                    ${inProgress > 0 ? `
                        <circle cx="100" cy="100" r="90" fill="none" 
                                stroke="#FEEFDC" stroke-width="20"
                                stroke-dasharray="${inProgressAngle * (Math.PI * 90) / 180} ${2 * Math.PI * 90}"
                                stroke-dashoffset="${-completedAngle * (Math.PI * 90) / 180}"/>
                    ` : ''}
                </svg>
                <div class="pie-chart-label">
                    <div class="pie-chart-percentage">${percentage}%</div>
                    <div class="pie-chart-text">Complete</div>
                </div>
            </div>
            <div class="chart-legend">
                <div class="legend-item">
                    <div class="legend-color" style="background: #b8d1ba;"></div>
                    <div class="legend-label">Completed</div>
                    <div class="legend-value">${completed}</div>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background: #FEEFDC;"></div>
                    <div class="legend-label">In Progress</div>
                    <div class="legend-value">${inProgress}</div>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background: #e5e5e5;"></div>
                    <div class="legend-label">Not Started</div>
                    <div class="legend-value">${notStarted}</div>
                </div>
                <div class="legend-item" style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e5e5e5;">
                    <div class="legend-label" style="font-weight: 500;">Total Tasks</div>
                    <div class="legend-value" style="font-size: 1.25rem;">${total}</div>
                </div>
            </div>
        </div>
    `;

    container.innerHTML = html;
}

function displayTasks(tasks, filter = 'all') {
    const container = document.getElementById('progress-tasks');

    let filteredTasks = tasks;
    if (filter !== 'all') {
        filteredTasks = tasks.filter(t => t.item_type === filter);
    }

    // Filter out future tasks (unlocked logic)
    // Only show tasks that are in current month or exceeded if explicitly requested, but default is "Available"
    // Actually, user requested "progress section where its still showing me all month's course" is a problem.
    // We should show tasks up to current month.
    const currentMonth = AppState.currentMonth || 1; // default to Month 1 if unknown

    // Add a toggle for "Show All / Show Current" ?
    // For now, let's filter by phase <= currentMonth
    filteredTasks = filteredTasks.filter(t => (t.phase || 1) <= currentMonth);

    if (filteredTasks.length === 0) {
        container.innerHTML = '<p class="empty-state">No tasks found for your current progress level.</p>';
        return;
    }

    const html = filteredTasks.map(task => `
        <div class="task-card">
            <div class="task-info">
                <div class="task-name">${task.item_name}</div>
                <div class="task-meta">
                    <span class="item-type">${task.item_type}</span>
                    <span class="status-badge status-${task.status}">${task.status.replace('_', ' ')}</span>
                    <span class="phase-badge">Month ${task.phase || 1}</span>
                    ${task.completion_date ? `<span>Completed: ${new Date(task.completion_date).toLocaleDateString()}</span>` : ''}
                </div>
                ${task.encouragement_message ?
            `<div class="encouragement-message">${task.encouragement_message}</div>` : ''}
            </div>
            <div class="task-actions">
                ${task.status === 'completed' ? `
                    <label class="resume-toggle" title="Include in Resume">
                        <input type="checkbox" ${task.include_in_resume ? 'checked' : ''} 
                               onchange="toggleResumeItem('${task.item_id}', this.checked)">
                         Resume
                    </label>
                    <button class="btn btn-secondary" onclick="generateLinkedInPost('${task.item_id}')" title="Generate LinkedIn Post">
                         LinkedIn
                    </button>
                    <span style="color: var(--success-color); font-weight: bold;">Completed</span>
                ` : `
                    <button class="btn btn-secondary" onclick="updateTaskStatus('${task.item_id}', 'in_progress')">
                        ▶ Start
                    </button>
                    <button class="btn btn-success" onclick="updateTaskStatus('${task.item_id}', 'completed')">
                        Complete
                    </button>
                `}
            </div>
        </div>
    `).join('');

    container.innerHTML = html;
}

async function updateTaskStatus(itemId, status) {
    if (!AppState.currentUser) return;

    showLoading();

    try {
        const response = await fetch(`${API_BASE_URL}/progress/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: AppState.currentUser.id,
                item_id: itemId,
                status: status
            })
        });

        if (!response.ok) {
            throw new Error('Failed to update progress');
        }

        const data = await response.json();
        hideLoading();


        if (status === 'completed') {
            showToast('Great job! Task completed!', 'success');
            if (data.progress.encouragement_message) {
                setTimeout(() => {
                    showToast(data.progress.encouragement_message, 'info');
                }, 1000);
            }
            // Check if next month was unlocked
            if (data.next_month_unlocked) {
                setTimeout(() => {
                    showToast('Amazing progress! You have unlocked the next month\'s tasks!', 'success');
                }, 2000);
            }
        } else {
            showToast('Task status updated', 'success');
        }

        // Reload progress
        await loadProgress();

    } catch (error) {
        console.error('Error updating task:', error);
        showToast('Error updating task', 'error');
        hideLoading();
    }
}

// Generate LinkedIn Post for a specific task
async function generateLinkedInPost(itemId) {
    if (!AppState.currentUser) return;

    showLoading();

    try {
        const response = await fetch(`${API_BASE_URL}/linkedin/generate-post`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: AppState.currentUser.id,
                item_id: itemId
            })
        });

        if (!response.ok) {
            throw new Error('Failed to generate LinkedIn post');
        }

        const postData = await response.json();
        hideLoading();

        // Show post in a modal or alert
        const postContent = postData.post_content + '\n\n' + postData.hashtags.map(t => '#' + t).join(' ');

        // Create a simple modal to display the post
        const modal = document.createElement('div');
        modal.className = 'linkedin-modal';
        modal.innerHTML = `
            <div class="linkedin-modal-content">
                <h3>Your LinkedIn Post</h3>
                <textarea readonly style="width:100%; height:200px; padding:1rem; margin:1rem 0; border-radius:0.5rem; border:1px solid var(--border-color);">${postContent}</textarea>
                <p style="color:var(--text-secondary); font-size:0.9rem;">Suggested image: ${postData.suggested_image}</p>
                <div style="display:flex; gap:1rem; margin-top:1rem;">
                    <button class="btn btn-primary" onclick="navigator.clipboard.writeText(this.parentElement.previousElementSibling.previousElementSibling.value); showToast('Copied to clipboard!', 'success');">Copy</button>
                    <button class="btn btn-secondary" onclick="this.closest('.linkedin-modal').remove();">Close</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

    } catch (error) {
        console.error('Error generating LinkedIn post:', error);
        showToast('Error generating LinkedIn post', 'error');
        hideLoading();
    }
}

// Toggle resume inclusion for a task
async function toggleResumeItem(itemId, include) {
    if (!AppState.currentUser) return;

    try {
        const response = await fetch(`${API_BASE_URL}/progress/resume-toggle`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: AppState.currentUser.id,
                item_id: itemId,
                include_in_resume: include
            })
        });

        if (!response.ok) {
            throw new Error('Failed to update resume setting');
        }

        showToast(include ? 'Added to resume' : 'Removed from resume', 'success');

    } catch (error) {
        console.error('Error toggling resume item:', error);
        showToast('Error updating resume setting', 'error');
    }
}

// Progress Filters
function initProgressFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filter = btn.dataset.filter;
            if (AppState.progressData) {
                displayTasks(AppState.progressData, filter);
            }
        });
    });
}

// Profile Builder
async function loadProfile() {
    if (!AppState.currentUser) {
        return;
    }

    showLoading();

    try {
        // Load resume
        const resumeResponse = await fetch(`${API_BASE_URL}/profile/${AppState.currentUser.id}/resume`);
        const resumeData = await resumeResponse.json();

        // Populate editor fields
        if (resumeData.resume && resumeData.resume.header) {
            const h = resumeData.resume.header;
            if (document.getElementById('res-phone')) document.getElementById('res-phone').value = h.phone || '';
            if (document.getElementById('res-linkedin')) document.getElementById('res-linkedin').value = h.linkedin || '';
            if (document.getElementById('res-github')) document.getElementById('res-github').value = h.github || '';
            if (document.getElementById('res-portfolio')) document.getElementById('res-portfolio').value = h.portfolio || '';
        }

        displayResume(resumeData.resume);

        // Load LinkedIn
        const linkedinResponse = await fetch(`${API_BASE_URL}/profile/${AppState.currentUser.id}/linkedin`);
        const linkedinData = await linkedinResponse.json();
        displayLinkedIn(linkedinData);

        hideLoading();

    } catch (error) {
        console.error('Error loading profile:', error);
        showToast('Error loading profile', 'error');
        hideLoading();
    }
}

function displayResume(resume) {
    const container = document.getElementById('resume-content');

    if (!resume || !resume.header) {
        container.innerHTML = '<p class="empty-state">Loading resume data...</p>';
        return;
    }

    const h = resume.header;
    const contactParts = [];
    if (h.email) contactParts.push(h.email);
    if (h.phone) contactParts.push(h.phone);
    if (h.location) contactParts.push(h.location);
    if (h.linkedin) contactParts.push(`<a href="${h.linkedin}" target="_blank">LinkedIn</a>`);
    if (h.github) contactParts.push(`<a href="${h.github}" target="_blank">GitHub</a>`);
    if (h.portfolio) contactParts.push(`<a href="${h.portfolio}" target="_blank">Portfolio</a>`);

    let html = `
        <div class="resume-header">
            <div class="resume-name">${h.name}</div>
            <div class="resume-contact">
                ${contactParts.join(' | ')}
            </div>
        </div>
    `;

    // Education
    if (resume.education) {
        html += `
            <div class="resume-section-title">Education</div>
            <div class="resume-entry">
                <div class="resume-entry-header">
                    <span>${resume.education.university}</span>
                    <span>${resume.education.graduation_year}</span>
                </div>
                <div class="resume-entry-subheader">
                    <span>${resume.education.major}</span>
                </div>
                ${resume.education.gpa ? `<div>GPA: ${resume.education.gpa}</div>` : ''}
            </div>
        `;
    }

    // Skills
    if (resume.skills && resume.skills.length > 0) {
        html += `
            <div class="resume-section-title">Skills</div>
            <div>${resume.skills.join(', ')}</div>
        `;
    }

    // Experience
    if (resume.experience && resume.experience.length > 0) {
        html += `<div class="resume-section-title">Experience</div>`;
        resume.experience.forEach(exp => {
            html += `
                <div class="resume-entry">
                    <div class="resume-entry-header">
                        <span>${exp.title}</span>
                        <span>${exp.date}</span>
                    </div>
                     <ul class="resume-list">
                        ${exp.bullets.map(b => `<li>${b}</li>`).join('')}
                    </ul>
                </div>
            `;
        });
    }

    // Projects
    if (resume.projects && resume.projects.length > 0) {
        html += `<div class="resume-section-title">Projects</div>`;
        resume.projects.forEach(proj => {
            html += `
                <div class="resume-entry">
                    <div class="resume-entry-header">
                        <span>${proj.name}</span>
                        <span>${proj.date}</span>
                    </div>
                     <ul class="resume-list">
                        ${proj.bullets.map(b => `<li>${b}</li>`).join('')}
                    </ul>
                </div>
            `;
        });
    }

    // Certifications
    if (resume.certifications && resume.certifications.length > 0) {
        html += `<div class="resume-section-title">Certifications</div>`;
        resume.certifications.forEach(cert => {
            html += `
                <div class="resume-entry">
                    <div class="resume-entry-header">
                        <span>${cert.name}</span>
                        <span>${cert.date}</span>
                    </div>
                </div>
            `;
        });
    }

    container.innerHTML = html;
}

function displayLinkedIn(data) {
    const container = document.getElementById('linkedin-content');

    if (!data || (!data.post_ideas && !data.profile_summary && !data.skills_to_add)) {
        container.innerHTML = '<p class="empty-state">No LinkedIn suggestions available yet</p>';
        return;
    }

    let html = '';

    // Profile Summary
    if (data.profile_summary) {
        html += `
            <div class="linkedin-section">
                <h3>Profile Summary</h3>
                <div style="background: white; padding: 1.5rem; border-radius: 0.75rem; border-left: 4px solid #0077b5;">
                    ${data.profile_summary}
                </div>
            </div>
        `;
    }

    // Post Ideas
    if (data.post_ideas && data.post_ideas.length > 0) {
        html += `
            <div class="linkedin-section">
                <h3>Post Ideas</h3>
                ${data.post_ideas.map(post => `
                    <div class="post-idea-card">
                        <div class="post-idea-topic">${post.topic}</div>
                        <div class="post-idea-draft">${post.draft}</div>
                        <div class="post-hashtags">
                            ${post.hashtags.map(tag => `#${tag}`).join(' ')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Skills to Add
    if (data.skills_to_add && data.skills_to_add.length > 0) {
        html += `
            <div class="linkedin-section">
                <h3>Skills to Add to Profile</h3>
                <div class="skills-list">
                    ${data.skills_to_add.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                </div>
            </div>
        `;
    }

    container.innerHTML = html;
}

// Profile Tabs
function initProfileTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;

            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(`${targetTab}-tab`).classList.add('active');
        });
    });

    // Resume Details Form
    const resumeForm = document.getElementById('resume-details-form');
    if (resumeForm) {
        resumeForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!AppState.currentUser) return;

            showLoading();
            try {
                const response = await fetch(`${API_BASE_URL}/profile/details`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user_id: AppState.currentUser.id,
                        phone_number: document.getElementById('res-phone').value,
                        linkedin_url: document.getElementById('res-linkedin').value,
                        github_url: document.getElementById('res-github').value,
                        portfolio_url: document.getElementById('res-portfolio').value
                    })
                });

                if (response.ok) {
                    showToast('Contact details saved!', 'success');
                    loadProfile(); // Reload to update resume
                }
            } catch (err) {
                console.error(err);
                showToast('Failed to save details', 'error');
            } finally {
                hideLoading();
            }
        });
    }
}

// Profile Actions
function initProfileActions() {
    document.getElementById('refresh-profile').addEventListener('click', async () => {
        if (!AppState.currentUser) return;

        showLoading();

        try {
            const response = await fetch(`${API_BASE_URL}/profile/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: AppState.currentUser.id })
            });

            if (!response.ok) {
                throw new Error('Failed to refresh profile');
            }

            hideLoading();
            showToast('Profile refreshed successfully!', 'success');
            await loadProfile();

        } catch (error) {
            console.error('Error refreshing profile:', error);
            showToast('Error refreshing profile', 'error');
            hideLoading();
        }
    });

    document.getElementById('download-resume').addEventListener('click', async () => {
        if (!AppState.currentUser) return;

        try {
            const response = await fetch(`${API_BASE_URL}/profile/${AppState.currentUser.id}/resume`);
            const data = await response.json();

            const blob = new Blob([JSON.stringify(data.resume, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'resume.json';
            a.click();
            URL.revokeObjectURL(url);

            showToast('Resume downloaded!', 'success');

        } catch (error) {
            console.error('Error downloading resume:', error);
            showToast('Error downloading resume', 'error');
        }
    });
}

// Roadmap Actions
function initRoadmapActions() {
    const refreshBtn = document.getElementById('refresh-roadmap');
    if (!refreshBtn) return;

    refreshBtn.addEventListener('click', async () => {
        if (!AppState.currentUser) return;

        const confirmed = confirm('This will regenerate your growth path. Continue?');
        if (!confirmed) return;

        showLoading();

        try {
            const response = await fetch(`${API_BASE_URL}/growth-path/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: AppState.currentUser.id,
                    timeline_months: 12
                })
            });

            if (!response.ok) {
                throw new Error('Failed to regenerate roadmap');
            }

            hideLoading();
            showToast('Roadmap regenerated successfully!', 'success');
            await loadRoadmap();

        } catch (error) {
            console.error('Error regenerating roadmap:', error);
            showToast('Error regenerating roadmap', 'error');
            hideLoading();
        }
    });
}

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initOnboarding();
    initProgressFilters();
    initProfileTabs();
    initProfileActions();
    initRoadmapActions();

    console.log('Delta AI initialized!');
});

// Make functions available globally
window.updateTaskStatus = updateTaskStatus;
window.generateLinkedInPost = generateLinkedInPost;
window.toggleResumeItem = toggleResumeItem;
window.sendAssistantMessage = sendAssistantMessage;
window.loadCurrentMonth = loadCurrentMonth;
window.generateCurrentMonthTasks = generateCurrentMonthTasks;

// Initialize interactive roadmap when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initInteractiveRoadmap();
});