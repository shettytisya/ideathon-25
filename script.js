/**
 * Enhanced Mood Tracker Application
 * No external dependencies - Pure Vanilla JavaScript
 * Features: Tags, Search, Export/Import, Theme Toggle, Calendar View
 */

// ===== GLOBAL VARIABLES =====
let moodEntries = [];
let currentFilter = 'All';
let currentSort = 'newest';
let currentView = 'week';
let selectedTags = [];
const STORAGE_KEY = 'moodTrackerData';
const THEME_KEY = 'moodTrackerTheme';

// ===== UTILITY FUNCTIONS =====

/**
 * Loads data from localStorage
 */
function loadData() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            moodEntries = JSON.parse(stored);
            moodEntries = moodEntries.map(entry => ({
                ...entry,
                timestamp: new Date(entry.timestamp),
                tags: entry.tags || []
            }));
        }
    } catch (error) {
        console.error("Error loading data:", error);
        showModal("Load Error", "Could not load saved data. Starting fresh.");
    }
}

/**
 * Saves data to localStorage
 */
function saveData() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(moodEntries));
    } catch (error) {
        console.error("Error saving data:", error);
        showModal("Storage Error", "Could not save data.");
    }
}

/**
 * Shows modal dialog
 */
function showModal(title, message) {
    const modal = document.getElementById('app-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    
    if (modal && modalTitle && modalMessage) {
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        modal.classList.remove('hidden-modal');
    }
}

/**
 * Closes modal
 */
function closeModal() {
    const modal = document.getElementById('app-modal');
    if (modal) {
        modal.classList.add('hidden-modal');
    }
}

/**
 * Shows toast notification
 */
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'success-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'fadeIn 0.3s ease-out reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/**
 * Returns CSS class for mood
 */
function getMoodColorClass(mood) {
    const moodMap = {
        'Amazing': 'mood-amazing',
        'Good': 'mood-good',
        'Neutral': 'mood-neutral',
        'Stressed': 'mood-stressed',
        'Terrible': 'mood-terrible'
    };
    return moodMap[mood] || 'mood-neutral';
}

/**
 * Formats timestamp
 */
function formatTimestamp(timestamp) {
    if (timestamp instanceof Date) {
        return timestamp.toLocaleString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }
    return 'Date unknown';
}

/**
 * Escapes HTML to prevent XSS
 */
function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Gets mood emoji
 */
function getMoodEmoji(mood) {
    const emojiMap = {
        'Amazing': '🥳',
        'Good': '😊',
        'Neutral': '😐',
        'Stressed': '😟',
        'Terrible': '😩'
    };
    return emojiMap[mood] || '😐';
}

// ===== THEME MANAGEMENT =====

/**
 * Toggles between light and dark theme
 */
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
    
    const themeBtn = document.getElementById('toggle-theme-btn');
    if (themeBtn) {
        themeBtn.textContent = newTheme === 'light' ? '☀️' : '🌙';
    }
    
    showToast(`Switched to ${newTheme} theme`);
}

/**
 * Loads saved theme
 */
function loadTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    const themeBtn = document.getElementById('toggle-theme-btn');
    if (themeBtn) {
        themeBtn.textContent = savedTheme === 'light' ? '☀️' : '🌙';
    }
}

// ===== TAGS MANAGEMENT =====

/**
 * Adds a tag to current selection
 */
function addTag(tagName) {
    const trimmedTag = tagName.trim().toLowerCase();
    if (trimmedTag && !selectedTags.includes(trimmedTag) && selectedTags.length < 5) {
        selectedTags.push(trimmedTag);
        renderSelectedTags();
    }
}

/**
 * Removes tag from selection
 */
function removeTag(tagName) {
    selectedTags = selectedTags.filter(tag => tag !== tagName);
    renderSelectedTags();
}

/**
 * Renders selected tags
 */
function renderSelectedTags() {
    const container = document.getElementById('selected-tags');
    if (!container) return;
    
    container.innerHTML = '';
    selectedTags.forEach(tag => {
        const chip = document.createElement('span');
        chip.className = 'tag-chip';
        chip.innerHTML = `
            ${escapeHtml(tag)}
            <span class="tag-remove" onclick="removeTag('${escapeHtml(tag)}')">×</span>
        `;
        container.appendChild(chip);
    });
}

// ===== CORE BUSINESS LOGIC =====

/**
 * Logs a new mood entry
 */
function logMood(e) {
    e.preventDefault();

    const moodElement = document.querySelector('input[name="mood"]:checked');
    const noteElement = document.getElementById('note');

    if (!moodElement) {
        showModal("Error", "Please select a mood.");
        return;
    }

    if (!noteElement) {
        showModal("Error", "Note field not found.");
        return;
    }

    const newEntry = {
        id: Date.now(),
        mood: moodElement.value,
        note: noteElement.value.trim().substring(0, 500), 
        tags: selectedTags.slice(),
        timestamp: new Date(),
    };

    moodEntries.unshift(newEntry);
    saveData();
    
    showToast(`✨ Your ${newEntry.mood} mood has been logged!`);
    document.getElementById('mood-form').reset();
    selectedTags = [];
    renderSelectedTags();
    updateCharCount();
    
    renderAll();
}

/**
 * Deletes entry by ID
 */
function deleteEntry(id) {
    if (confirm('Are you sure you want to delete this entry?')) {
        moodEntries = moodEntries.filter(entry => entry.id !== id);
        saveData();
        renderAll();
        showToast('Entry deleted successfully');
    }
}

/**
 * Clears all data
 */
function clearAllData() {
    if (confirm('Are you sure you want to delete ALL entries? This cannot be undone!')) {
        moodEntries = [];
        saveData();
        renderAll();
        showToast('All data cleared');
    }
}

/**
 * Filters moods
 */
function filterMoods(mood) {
    currentFilter = mood;
    
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.mood === mood) {
            btn.classList.add('active');
        }
    });
    
    renderHistory();
}

/**
 * Sorts entries
 */
function sortEntries(entries) {
    const moodRank = {
        'Amazing': 5,
        'Good': 4,
        'Neutral': 3,
        'Stressed': 2,
        'Terrible': 1
    };

    const sorted = entries.slice();
    
    switch (currentSort) {
        case 'newest':
            return sorted.sort((a, b) => b.timestamp - a.timestamp);
        case 'oldest':
            return sorted.sort((a, b) => a.timestamp - b.timestamp);
        case 'mood-best':
            return sorted.sort((a, b) => moodRank[b.mood] - moodRank[a.mood]);
        case 'mood-worst':
            return sorted.sort((a, b) => moodRank[a.mood] - moodRank[b.mood]);
        default:
            return sorted;
    }
}

// ===== STATISTICS & ANALYTICS =====

/**
 * Updates statistics dashboard
 */
function updateStats() {
    const totalEl = document.getElementById('total-entries');
    const streakEl = document.getElementById('current-streak');
    const moodEl = document.getElementById('most-common-mood');
    const weekEl = document.getElementById('this-week-entries');

    if (totalEl) totalEl.textContent = moodEntries.length;

    // Calculate streak
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const sortedEntries = moodEntries.slice().sort((a, b) => b.timestamp - a.timestamp);
    let checkDate = new Date(today);
    
    for (const entry of sortedEntries) {
        const entryDate = new Date(entry.timestamp);
        entryDate.setHours(0, 0, 0, 0);
        
        if (entryDate.getTime() === checkDate.getTime()) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else if (entryDate.getTime() < checkDate.getTime()) {
            break;
        }
    }
    
    if (streakEl) streakEl.textContent = streak;

    // Most common mood
    if (moodEntries.length === 0) {
        if (moodEl) moodEl.textContent = '-';
        if (weekEl) weekEl.textContent = '0';
        return;
    }

    const moodCounts = {};
    moodEntries.forEach(entry => {
        moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
    });
    
    const mostCommon = Object.keys(moodCounts).reduce((a, b) => 
        moodCounts[a] > moodCounts[b] ? a : b, '-');
    
    if (moodEl) {
        moodEl.textContent = getMoodEmoji(mostCommon);
    }

    // This week's entries
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const thisWeekEntries = moodEntries.filter(entry => entry.timestamp >= weekAgo);
    if (weekEl) weekEl.textContent = thisWeekEntries.length;
}

/**
 * Updates mood distribution chart
 */
function updateMoodDistribution() {
    const moods = ['amazing', 'good', 'neutral', 'stressed', 'terrible'];
    const moodNames = {
        'amazing': 'Amazing',
        'good': 'Good',
        'neutral': 'Neutral',
        'stressed': 'Stressed',
        'terrible': 'Terrible'
    };
    
    const total = moodEntries.length || 1;
    
    moods.forEach(mood => {
        const count = moodEntries.filter(entry => 
            entry.mood === moodNames[mood]
        ).length;
        
        const percentage = (count / total) * 100;
        
        const barEl = document.getElementById(`dist-${mood}`);
        const countEl = document.getElementById(`count-${mood}`);
        
        if (barEl) {
            barEl.style.width = `${percentage}%`;
        }
        if (countEl) {
            countEl.textContent = count;
        }
    });
}

/**
 * Renders calendar view
 */
function renderCalendar() {
    const container = document.getElementById('calendar-view');
    if (!container) return;
    
    container.innerHTML = '';
    
    const days = currentView === 'week' ? 7 : 30;
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const dayEntries = moodEntries.filter(entry => {
            const entryDate = new Date(entry.timestamp);
            entryDate.setHours(0, 0, 0, 0);
            return entryDate.getTime() === date.getTime();
        });
        
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day';
        
        if (dayEntries.length > 0) {
            dayEl.classList.add('has-entry');
            const avgMood = dayEntries[0].mood;
            const emoji = getMoodEmoji(avgMood);
            dayEl.innerHTML = `
                <div class="calendar-day-label">${date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                <div class="calendar-day-number">${date.getDate()}</div>
                <div class="calendar-day-emoji">${emoji}</div>
            `;
        } else {
            dayEl.innerHTML = `
                <div class="calendar-day-label">${date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                <div class="calendar-day-number">${date.getDate()}</div>
            `;
        }
        
        if (date.toDateString() === today.toDateString()) {
            dayEl.classList.add('today');
        }
        
        dayEl.title = date.toDateString();
        container.appendChild(dayEl);
    }
}

// ===== UI RENDERING =====

/**
 * Renders history with filters and search
 */
function renderHistory() {
    const historyList = document.getElementById('mood-history-list');
    const noEntriesMessage = document.getElementById('no-entries-message');
    const searchInput = document.getElementById('search-input');
    
    if (!historyList) return;

    historyList.innerHTML = '';

    let filteredEntries = currentFilter === 'All' 
        ? moodEntries 
        : moodEntries.filter(entry => entry.mood === currentFilter);

    // Apply search filter
    if (searchInput && searchInput.value.trim()) {
        const searchTerm = searchInput.value.trim().toLowerCase();
        filteredEntries = filteredEntries.filter(entry => 
            entry.note.toLowerCase().includes(searchTerm) ||
            entry.mood.toLowerCase().includes(searchTerm) ||
            (entry.tags && entry.tags.some(tag => tag.includes(searchTerm)))
        );
    }

    // Sort entries
    filteredEntries = sortEntries(filteredEntries);

    if (filteredEntries.length === 0) {
        if (noEntriesMessage) {
            noEntriesMessage.textContent = searchInput && searchInput.value.trim()
                ? "No entries match your search."
                : currentFilter === 'All' 
                    ? "No entries yet. Log your first mood above!"
                    : `No ${currentFilter} entries found.`;
            noEntriesMessage.style.display = 'block';
        }
        return;
    }

    if (noEntriesMessage) {
        noEntriesMessage.style.display = 'none';
    }

    filteredEntries.forEach((entry, index) => {
        const colorClass = getMoodColorClass(entry.mood);
        const formattedDate = formatTimestamp(entry.timestamp);
        const emoji = getMoodEmoji(entry.mood);

        const item = document.createElement('div');
        item.className = `mood-history-item ${colorClass}`;
        item.style.animationDelay = `${index * 0.05}s`;
        
        const noteContent = entry.note && entry.note.length > 0 
            ? `<p class="note-content">${escapeHtml(entry.note)}</p>`
            : `<p class="note-content" style="font-style:italic;opacity:0.7;">(No note recorded)</p>`;

        const tagsHTML = entry.tags && entry.tags.length > 0
            ? `<div class="entry-tags">
                ${entry.tags.map(tag => `<span class="entry-tag">${escapeHtml(tag)}</span>`).join('')}
               </div>`
            : '';

        item.innerHTML = `
            <div class="history-emoji-box">
                ${emoji}
            </div>
            <div class="history-text-content">
                <div class="history-header-row">
                    <h4>${escapeHtml(entry.mood)}</h4>
                    <span class="date-time-stamp">${formattedDate}</span>
                </div>
                ${noteContent}
                ${tagsHTML}
                <button class="delete-button" onclick="deleteEntry(${entry.id})">Delete</button>
            </div>
        `;
        historyList.appendChild(item);
    });
}

/**
 * Renders chart
 */
function renderChart() {
    const chart = document.getElementById('mood-chart');
    const labels = document.getElementById('chart-labels');
    
    if (!chart || !labels) return;

    chart.innerHTML = '';
    labels.innerHTML = '';

    const moodMap = {
        'Terrible': 20, 
        'Stressed': 40, 
        'Neutral': 60,  
        'Good': 80,     
        'Amazing': 100  
    };

    const moodColors    = {
        'Amazing': '#10b981',
        'Good': '#3b82f6',
        'Neutral': '#f59e0b',
        'Stressed': '#ef4444',
        'Terrible': '#991b1b'
    };

    const total = moodEntries.length || 1;

    Object.keys(moodMap).forEach((mood, index) => {
        const count = moodEntries.filter(entry => entry.mood === mood).length;
        const bar = document.createElement('div');
        bar.className = 'chart-bar';
        bar.style.height = `${(count / total) * 100}%`;
        bar.style.backgroundColor = moodColors[mood];
        bar.title = `${mood}: ${count}`;
        chart.appendChild(bar);

        const label = document.createElement('span');
        label.className = 'chart-label';
        label.textContent = mood;
        labels.appendChild(label);
    });
}

// ===== SEARCH & FILTER EVENTS =====
function setupSearchAndFilter() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', () => renderHistory());
    }

    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => filterMoods(btn.dataset.mood));
    });
}

// ===== CHARACTER COUNT FOR NOTES =====
function updateCharCount() {
    const noteEl = document.getElementById('note');
    const countEl = document.getElementById('char-count');
    if (!noteEl || !countEl) return;

    const maxChars = 500;
    noteEl.addEventListener('input', () => {
        const remaining = maxChars - noteEl.value.length;
        countEl.textContent = `${remaining} characters remaining`;
    });
}

// ===== EXPORT / IMPORT DATA =====
function exportData() {
    const dataStr = JSON.stringify(moodEntries, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mood_entries.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Data exported successfully');
}

function importData(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            if (Array.isArray(imported)) {
                imported.forEach(entry => {
                    entry.timestamp = new Date(entry.timestamp);
                });
                moodEntries = imported.concat(moodEntries);
                saveData();
                renderAll();
                showToast('Data imported successfully');
            } else {
                showModal('Import Error', 'Invalid data format.');
            }
        } catch (err) {
            showModal('Import Error', 'Could not parse JSON.');
        }
    };
    reader.readAsText(file);
}

// ===== MAIN RENDER FUNCTION =====
function renderAll() {
    updateStats();
    updateMoodDistribution();
    renderCalendar();
    renderHistory();
    renderChart();
}

// ===== INITIALIZATION =====
function initializeApp() {
    loadTheme();
    loadData();
    renderAll();
    setupSearchAndFilter();
    updateCharCount();

    const themeBtn = document.getElementById('toggle-theme-btn');
    if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

    const form = document.getElementById('mood-form');
    if (form) form.addEventListener('submit', logMood);

    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) exportBtn.addEventListener('click', exportData);

    const importInput = document.getElementById('import-input');
    if (importInput) importInput.addEventListener('change', (e) => importData(e.target.files[0]));

    const clearBtn = document.getElementById('clear-btn');
    if (clearBtn) clearBtn.addEventListener('click', clearAllData);

    const modalClose = document.getElementById('modal-close-btn');
    if (modalClose) modalClose.addEventListener('click', closeModal);
}

// Start the app
document.addEventListener('DOMContentLoaded', initializeApp);
