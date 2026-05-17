// App State
let currentUser = null;
let userPoints = 0;
let spinCount = 0;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadUserData();
    initWheel();
    checkAuthStatus();
});

// Check Authentication Status
function checkAuthStatus() {
    const user = localStorage.getItem('currentUser');
    if (user) {
        currentUser = JSON.parse(user);
        document.getElementById('authModal').style.display = 'none';
        loadUserData();
    } else {
        document.getElementById('authModal').style.display = 'flex';
    }
}

// Load User Data
function loadUserData() {
    if (currentUser) {
        userPoints = currentUser.points || 0;
        document.getElementById('userBalance').textContent = userPoints;
        document.getElementById('totalEarned').textContent = currentUser.totalEarned || 0;
        document.getElementById('referralCount').textContent = currentUser.referrals || 0;
        document.getElementById('tasksCompleted').textContent = currentUser.tasksCompleted || 0;
    }
}

// Save User Data
function saveUserData() {
    if (currentUser) {
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        loadUserData();
    }
}

// Auth Functions
function switchTab(tab) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const tabs = document.querySelectorAll('.tab-btn');
    
    if (tab === 'login') {
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
        tabs[0].classList.add('active');
        tabs[1].classList.remove('active');
    } else {
        loginForm.classList.remove('active');
        registerForm.classList.add('active');
        tabs[0].classList.remove('active');
        tabs[1].classList.add('active');
    }
}

function registerUser() {
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const referral = document.getElementById('regReferral').value;
    
    if (!name || !email || !password) {
        showToast('Please fill all fields', 'error');
        return;
    }
    
    if (password.length < 6) {
        showToast('Password must be at least 6 characters', 'error');
        return;
    }
    
    // Check if user exists
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    if (users[email]) {
        showToast('Email already registered', 'error');
        return;
    }
    
    const referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newUser = {
        name: name,
        email: email,
        password: password,
        points: 100,
        totalEarned: 0,
        referrals: 0,
        tasksCompleted: 0,
        referralCode: referralCode,
        referredBy: referral || null,
        joinDate: new Date().toISOString(),
        completedTasks: []
    };
    
    users[email] = newUser;
    localStorage.setItem('users', JSON.stringify(users));
    
    // Give referral bonus
    if (referral) {
        for (let userEmail in users) {
            if (users[userEmail].referralCode === referral) {
                users[userEmail].points += 50;
                users[userEmail].referrals += 1;
                localStorage.setItem('users', JSON.stringify(users));
                showToast('Referral bonus applied! +50 points', 'success');
                break;
            }
        }
    }
    
    currentUser = newUser;
    saveUserData();
    document.getElementById('authModal').style.display = 'none';
    showToast('Registration successful! Welcome bonus: 100 points', 'success');
}

function loginUser() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showToast('Please fill all fields', 'error');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    const user = users[email];
    
    if (!user || user.password !== password) {
        showToast('Invalid email or password', 'error');
        return;
    }
    
    currentUser = user;
    saveUserData();
    document.getElementById('authModal').style.display = 'none';
    showToast('Login successful!', 'success');
}

function logoutUser() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    location.reload();
}

// Task Functions
function startTask(taskName) {
    if (!currentUser) {
        showToast('Please login first', 'warning');
        document.getElementById('authModal').style.display = 'flex';
        return;
    }
    
    const rewards = {
        telegram: 70,
        facebook: 70,
        instagram: 50,
        youtube: 100
    };
    
    const reward = rewards[taskName];
    
    if (currentUser.completedTasks && currentUser.completedTasks.includes(taskName)) {
        showToast('You already completed this task!', 'warning');
        return;
    }
    
    // Simulate task completion
    showToast(`Opening ${taskName}...`, 'info');
    
    setTimeout(() => {
        currentUser.points += reward;
        currentUser.totalEarned += reward;
        currentUser.tasksCompleted += 1;
        if (!currentUser.completedTasks) currentUser.completedTasks = [];
        currentUser.completedTasks.push(taskName);
        saveUserData();
        showToast(`Task completed! +${reward} points`, 'success');
    }, 1500);
}

// Captcha Functions
function submitCaptcha(level, points) {
    if (!currentUser) {
        showToast('Please login first', 'warning');
        document.getElementById('authModal').style.display = 'flex';
        return;
    }
    
    let captchaValue = '';
    if (level === 'easy') captchaValue = document.getElementById('easyCaptcha').value;
    else if (level === 'medium') captchaValue = document.getElementById('mediumCaptcha').value;
    else captchaValue = document.getElementById('hardCaptcha').value;
    
    if (!captchaValue) {
        showToast('Please enter the captcha', 'warning');
        return;
    }
    
    // Simple validation (in real app, verify with backend)
    if (captchaValue.length < 3) {
        showToast('Incorrect captcha', 'error');
        return;
    }
    
    currentUser.points += points;
    currentUser.totalEarned += points;
    currentUser.tasksCompleted += 1;
    saveUserData();
    showToast(`Correct! +${points} points`, 'success');
    
    // Clear input
    if (level === 'easy') document.getElementById('easyCaptcha').value = '';
    else if (level === 'medium') document.getElementById('mediumCaptcha').value = '';
    else document.getElementById('hardCaptcha').value = '';
    
    // Generate new captcha (in real app, fetch new from server)
    generateNewCaptcha(level);
}

function generateNewCaptcha(level) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
    let captcha = '';
    for (let i = 0; i < 6; i++) {
        captcha += chars[Math.floor(Math.random() * chars.length)];
    }
    // In real app, update the captcha image
}

// Spin Wheel
function initWheel() {
    const canvas = document.getElementById('wheelCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const segments = [
        { label: '10', value: 10, color: '#ff6b6b' },
        { label: '20', value: 20, color: '#4ecdc4' },
        { label: '50', value: 50, color: '#45b7d1' },
        { label: '100', value: 100, color: '#96ceb4' },
        { label: '5', value: 5, color: '#ffeaa7' },
        { label: '150', value: 150, color: '#dfe6e9' },
        { label: '30', value: 30, color: '#fd79a8' },
        { label: '200', value: 200, color: '#fdcb6e' }
    ];
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = canvas.width / 2;
    const angleStep = (Math.PI * 2) / segments.length;
    
    segments.forEach((segment, index) => {
        const startAngle = index * angleStep;
        const endAngle = startAngle + angleStep;
        
        ctx.beginPath();
        ctx.fillStyle = segment.color;
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.fill();
        
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(startAngle + angleStep / 2);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Poppins';
        ctx.shadowBlur = 0;
        ctx.fillText(segment.label, radius - 30, 10);
        ctx.restore();
    });
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, 30, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.stroke();
}

let isSpinning = false;

function spinWheel() {
    if (!currentUser) {
        showToast('Please login first', 'warning');
        document.getElementById('authModal').style.display = 'flex';
        return;
    }
    
    if (isSpinning) return;
    
    const spinCost = 150;
    if (currentUser.points < spinCost) {
        showToast(`Need ${spinCost} points to spin!`, 'warning');
        return;
    }
    
    isSpinning = true;
    currentUser.points -= spinCost;
    saveUserData();
    
    const canvas = document.getElementById('wheelCanvas');
    const ctx = canvas.getContext('2d');
    const segments = [
        { label: '10', value: 10, color: '#ff6b6b' },
        { label: '20', value: 20, color: '#4ecdc4' },
        { label: '50', value: 50, color: '#45b7d1' },
        { label: '100', value: 100, color: '#96ceb4' },
        { label: '5', value: 5, color: '#ffeaa7' },
        { label: '150', value: 150, color: '#dfe6e9' },
        { label: '30', value: 30, color: '#fd79a8' },
        { label: '200', value: 200, color: '#fdcb6e' }
    ];
    
    const randomIndex = Math.floor(Math.random() * segments.length);
    const prize = segments[randomIndex].value;
    
    // Animate spin
    let spins = 10;
    let currentAngle = 0;
    
    function animate() {
        if (spins > 0) {
            currentAngle += 0.2;
            spins--;
            requestAnimationFrame(animate);
        } else {
            currentUser.points += prize;
            currentUser.totalEarned += prize;
            saveUserData();
            showToast(`You won ${prize} points!`, 'success');
            isSpinning = false;
        }
        drawWheel(currentAngle);
    }
    
    function drawWheel(angle) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = canvas.width / 2;
        const angleStep = (Math.PI * 2) / segments.length;
        
        segments.forEach((segment, index) => {
            const startAngle = index * angleStep + angle;
            const endAngle = startAngle + angleStep;
            
            ctx.beginPath();
            ctx.fillStyle = segment.color;
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.fill();
            
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(startAngle + angleStep / 2);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 14px Poppins';
            ctx.fillText(segment.label, radius - 30, 10);
            ctx.restore();
        });
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, 30, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
    }
    
    animate();
}

// Withdraw Functions
let withdrawType = null;

function requestWithdraw(type) {
    if (!currentUser) {
        showToast('Please login first', 'warning');
        document.getElementById('authModal').style.display = 'flex';
        return;
    }
    
    let minPoints = 0;
    let dollarValue = 0;
    
    if (type === 'easy') {
        minPoints = 5000;
        dollarValue = 5;
    } else if (type === 'medium') {
        minPoints = 10000;
        dollarValue = 10;
    } else {
        minPoints = 30000;
        dollarValue = 30;
    }
    
    if (currentUser.points < minPoints) {
        showToast(`Need ${minPoints} points to withdraw (${minPoints/1000} = $${dollarValue})`, 'warning');
        return;
    }
    
    withdrawType = type;
    document.getElementById('withdrawModal').style.display = 'flex';
}

function confirmWithdraw() {
    const method = document.querySelector('input[name="method"]:checked');
    const account = document.getElementById('withdrawAccount').value;
    const amount = document.getElementById('withdrawAmount').value;
    
    if (!method) {
        showToast('Please select a withdrawal method', 'warning');
        return;
    }
    
    if (!account) {
        showToast('Please enter payment account', 'warning');
        return;
    }
    
    if (!amount || amount < 5) {
        showToast('Minimum withdrawal is $5', 'warning');
        return;
    }
    
    let requiredPoints = 0;
    if (withdrawType === 'easy') requiredPoints = 5000;
    else if (withdrawType === 'medium') requiredPoints = 10000;
    else requiredPoints = 30000;
    
    if (currentUser.points < requiredPoints) {
        showToast('Insufficient points', 'error');
        return;
    }
    
    // Process withdrawal
    currentUser.points -= requiredPoints;
    saveUserData();
    
    // Save withdrawal request
    const withdrawals = JSON.parse(localStorage.getItem('withdrawals') || '[]');
    withdrawals.push({
        userId: currentUser.email,
        amount: amount,
        method: method.value,
        account: account,
        points: requiredPoints,
        date: new Date().toISOString(),
        status: 'pending'
    });
    localStorage.setItem('withdrawals', JSON.stringify(withdrawals));
    
    showToast(`Withdrawal request submitted for $${amount}!`, 'success');
    closeModal();
    
    // Clear form
    document.getElementById('withdrawAccount').value = '';
    document.getElementById('withdrawAmount').value = '';
}

// Referral Functions
function copyReferralLink() {
    if (!currentUser) {
        showToast('Please login first', 'warning');
        document.getElementById('authModal').style.display = 'flex';
        return;
    }
    
    const referralLink = `${window.location.origin}?ref=${currentUser.referralCode}`;
    navigator.clipboard.writeText(referralLink);
    showToast('Referral link copied!', 'success');
}

// UI Functions
function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.style.display = 'block';
    
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

// Navigation
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
        
        const page = item.dataset.page;
        if (page === 'home') {
            document.querySelector('.main-content').style.display = 'block';
        } else if (page === 'profile') {
            showProfilePage();
        }
    });
});

function showProfilePage() {
    if (!currentUser) {
        showToast('Please login first', 'warning');
        document.getElementById('authModal').style.display = 'flex';
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="this.parentElement.parentElement.remove()">&times;</span>
            <div class="auth-container">
                <div class="auth-header">
                    <i class="fas fa-user-circle" style="font-size: 4rem;"></i>
                    <h2>${currentUser.name}</h2>
                    <p>${currentUser.email}</p>
                </div>
                <div class="profile-stats">
                    <div class="stat-row">
                        <span>Points:</span>
                        <strong>${currentUser.points}</strong>
                    </div>
                    <div class="stat-row">
                        <span>Total Earned:</span>
                        <strong>${currentUser.totalEarned}</strong>
                    </div>
                    <div class="stat-row">
                        <span>Tasks Completed:</span>
                        <strong>${currentUser.tasksCompleted}</strong>
                    </div>
                    <div class="stat-row">
                        <span>Referrals:</span>
                        <strong>${currentUser.referrals}</strong>
                    </div>
                    <div class="stat-row">
                        <span>Referral Code:</span>
                        <strong>${currentUser.referralCode}</strong>
                    </div>
                </div>
                <button class="auth-submit" onclick="logoutUser(); this.parentElement.parentElement.parentElement.remove()">Logout</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Close modals when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
};

// Add profile stats styles
const style = document.createElement('style');
style.textContent = `
    .profile-stats {
        text-align: left;
        margin: 1rem 0;
    }
    .stat-row {
        display: flex;
        justify-content: space-between;
        padding: 0.5rem 0;
        border-bottom: 1px solid var(--light);
    }
`;
document.head.appendChild(style);