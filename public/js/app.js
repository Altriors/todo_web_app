// public/js/app.js - Enhanced Client-Side Application with API Integration

class TodoApp {
    constructor() {
        this.tasks = [];
        this.currentFilter = 'all';
        this.baseURL = '/api';
        this.init();
    }

    // Initialize the application
    async init() {
        this.bindEvents();
        await this.loadTasks();
        this.renderTasks();
        await this.updateStats();
    }

    // Bind event listeners
    bindEvents() {
        // Form submission
        document.getElementById('addTaskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTask();
        });

        // Navigation tabs
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const category = e.target.dataset.category;
                this.setActiveTab(category);
                this.filterTasks(category);
            });
        });

        // Search functionality (if implemented)
        const searchInput = document.getElementById('searchTasks');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTasks(e.target.value);
            });
        }
    }

    // API Methods
    async makeRequest(url, options = {}) {
        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Request failed');
            }
            
            return data;
        } catch (error) {
            console.error('API Request failed:', error);
            this.showNotification('Error: ' + error.message, 'error');
            throw error;
        }
    }

    // Load tasks from server
    async loadTasks() {
        try {
            const response = await this.makeRequest(`${this.baseURL}/tasks`);
            this.tasks = response.data || [];
        } catch (error) {
            console.error('Failed to load tasks:', error);
            this.tasks = [];
        }
    }

    // Add new task
    async addTask() {
        const titleInput = document.getElementById('taskTitle');
        const categorySelect = document.getElementById('taskCategory');
        
        const title = titleInput.value.trim();
        const category = categorySelect.value;
        
        if (!title) {
            this.showNotification('Please enter a task title', 'warning');
            return;
        }

        try {
            const response = await this.makeRequest(`${this.baseURL}/tasks`, {
                method: 'POST',
                body: JSON.stringify({ title, category })
            });

            this.tasks.unshift(response.data);
            this.renderTasks();
            await this.updateStats();
            
            // Reset form
            titleInput.value = '';
            categorySelect.value = 'personal';
            
            this.showNotification('Task added successfully!', 'success');
            this.showTaskAddedAnimation();
        } catch (error) {
            console.error('Failed to add task:', error);
        }
    }

    // Delete task
    async deleteTask(taskId) {
        if (!confirm('Are you sure you want to delete this task?')) {
            return;
        }

        try {
            await this.makeRequest(`${this.baseURL}/tasks/${taskId}`, {
                method: 'DELETE'
            });

            this.tasks = this.tasks.filter(task => task.id !== taskId);
            this.renderTasks();
            await this.updateStats();
            
            this.showNotification('Task deleted successfully!', 'success');
        } catch (error) {
            console.error('Failed to delete task:', error);
        }
    }

    // Update task (toggle completion, edit, etc.)
    async updateTask(taskId, updates) {
        try {
            const response = await this.makeRequest(`${this.baseURL}/tasks/${taskId}`, {
                method: 'PUT',
                body: JSON.stringify(updates)
            });

            const taskIndex = this.tasks.findIndex(task => task.id === taskId);
            if (taskIndex !== -1) {
                this.tasks[taskIndex] = response.data;
            }

            this.renderTasks();
            await this.updateStats();
            
            this.showNotification('Task updated successfully!', 'success');
        } catch (error) {
            console.error('Failed to update task:', error);
        }
    }

    // Toggle task completion
    async toggleTaskCompletion(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            await this.updateTask(taskId, { completed: !task.completed });
        }
    }

    // Render tasks
    renderTasks() {
        const filteredTasks = this.getFilteredTasks();
        const tasksContainer = document.getElementById('tasksContainer');
        
        if (filteredTasks.length === 0) {
            tasksContainer.innerHTML = `
                <div class="empty-state">
                    ${this.currentFilter === 'all' ? 
                        'No tasks yet. Add your first task above! 🚀' : 
                        `No ${this.currentFilter} tasks found. Try adding some! 📋`
                    }
                </div>
            `;
            return;
        }

        tasksContainer.innerHTML = filteredTasks.map(task => `
            <div class="task-card ${task.category} ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
                <div class="task-header">
                    <div class="task-title ${task.completed ? 'line-through' : ''}">${this.escapeHtml(task.title)}</div>
                    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} 
                           onchange="todoApp.toggleTaskCompletion(${task.id})">
                </div>
                <div class="task-category ${task.category}">${task.category}</div>
                <div class="task-date">Created: ${this.formatDate(task.created_at)}</div>
                ${task.updated_at !== task.created_at ? 
                    `<div class="task-date">Updated: ${this.formatDate(task.updated_at)}</div>` : ''
                }
                <div class="task-actions">
                    <button class="edit-btn" onclick="todoApp.editTask(${task.id})">
                        ✏️ Edit
                    </button>
                    <button class="delete-btn" onclick="todoApp.deleteTask(${task.id})">
                        🗑️ Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Get filtered tasks
    getFilteredTasks() {
        if (this.currentFilter === 'all') {
            return this.tasks;
        }
        return this.tasks.filter(task => task.category === this.currentFilter);
    }

    // Set active tab
    setActiveTab(category) {
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.category === category) {
                tab.classList.add('active');
            }
        });
    }

    // Filter tasks
    filterTasks(category) {
        this.currentFilter = category;
        this.renderTasks();
    }

    // Update statistics
    async updateStats() {
        try {
            const response = await this.makeRequest(`${this.baseURL}/stats`);
            const stats = response.data;
            
            document.getElementById('totalTasks').textContent = stats.total;
            document.getElementById('personalTasks').textContent = stats.personal;
            document.getElementById('workTasks').textContent = stats.work;
            
            // Add completed tasks stat if element exists
            const completedEl = document.getElementById('completedTasks');
            if (completedEl) {
                completedEl.textContent = stats.completed;
            }
        } catch (error) {
            console.error('Failed to update stats:', error);
            // Fallback to local calculation
            this.updateStatsLocally();
        }
    }

    // Fallback stats calculation
    updateStatsLocally() {
        const personalCount = this.tasks.filter(task => task.category === 'personal').length;
        const workCount = this.tasks.filter(task => task.category === 'work').length;
        const completedCount = this.tasks.filter(task => task.completed).length;
        
        document.getElementById('totalTasks').textContent = this.tasks.length;
        document.getElementById('personalTasks').textContent = personalCount;
        document.getElementById('workTasks').textContent = workCount;
        
        const completedEl = document.getElementById('completedTasks');
        if (completedEl) {
            completedEl.textContent = completedCount;
        }
    }

    // Edit task functionality
    editTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        const newTitle = prompt('Edit task title:', task.title);
        if (newTitle && newTitle.trim() !== task.title) {
            this.updateTask(taskId, { title: newTitle.trim() });
        }
    }

    // Search tasks
    searchTasks(query) {
        const searchTerm = query.toLowerCase();
        const tasksContainer = document.getElementById('tasksContainer');
        const taskCards = tasksContainer.querySelectorAll('.task-card');
        
        taskCards.forEach(card => {
            const title = card.querySelector('.task-title').textContent.toLowerCase();
            if (title.includes(searchTerm)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    // Show notification
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Add notification styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 1000;
            animation: slideInRight 0.3s ease;
            max-width: 300px;
        `;
        
        // Set background color based on type
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8'
        };
        notification.style.backgroundColor = colors[type] || colors.info;
        
        document.body.appendChild(notification);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Task added animation
    showTaskAddedAnimation() {
        const btn = document.querySelector('.add-btn');
        const originalText = btn.textContent;
        btn.textContent = '✓ Added!';
        btn.style.background = 'linear-gradient(45deg, #28a745, #34ce57)';
        
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = 'linear-gradient(45deg, #667eea, #764ba2)';
        }, 1000);
    }

    // Utility functions
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {
            hour: '2-digit', 
            minute: '2-digit'
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Export/Import functionality (bonus feature)
    exportTasks() {
        const dataStr = JSON.stringify(this.tasks, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'tasks_export.json';
        link.click();
        URL.revokeObjectURL(url);
    }

    // Refresh tasks
    async refreshTasks() {
        await this.loadTasks();
        this.renderTasks();
        await this.updateStats();
        this.showNotification('Tasks refreshed!', 'success');
    }
}

// Initialize the application
let todoApp;
document.addEventListener('DOMContentLoaded', () => {
    todoApp = new TodoApp();
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .task-card.completed {
        opacity: 0.7;
    }
    
    .task-title.line-through {
        text-decoration: line-through;
        color: #999;
    }
    
    .task-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 10px;
    }
    
    .task-checkbox {
        margin-left: 10px;
        transform: scale(1.2);
    }
    
    .edit-btn {
        padding: 8px 16px;
        background: linear-gradient(45deg, #17a2b8, #20c997);
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 600;
        transition: all 0.3s ease;
        margin-right: 10px;
    }
    
    .edit-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 5px 15px rgba(23, 162, 184, 0.4);
    }
`;
document.head.appendChild(style);// public/js/app.js - Enhanced Client-Side Application with API Integration

class TodoApp {
    constructor() {
        this.tasks = [];
        this.currentFilter = 'all';
        this.baseURL = '/api';
        this.init();
    }

    // Initialize the application
    async init() {
        this.bindEvents();
        await this.loadTasks();
        this.renderTasks();
        await this.updateStats();
    }

    // Bind event listeners
    bindEvents() {
        // Form submission
        document.getElementById('addTaskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTask();
        });

        // Navigation tabs
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const category = e.target.dataset.category;
                this.setActiveTab(category);
                this.filterTasks(category);
            });
        });

        // Search functionality (if implemented)
        const searchInput = document.getElementById('searchTasks');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTasks(e.target.value);
            });
        }
    }

    // API Methods
    async makeRequest(url, options = {}) {
        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Request failed');
            }
            
            return data;
        } catch (error) {
            console.error('API Request failed:', error);
            this.showNotification('Error: ' + error.message, 'error');
            throw error;
        }
    }

    // Load tasks from server
    async loadTasks() {
        try {
            const response = await this.makeRequest(`${this.baseURL}/tasks`);
            this.tasks = response.data || [];
        } catch (error) {
            console.error('Failed to load tasks:', error);
            this.tasks = [];
        }
    }

    // Add new task
    async addTask() {
        const titleInput = document.getElementById('taskTitle');
        const categorySelect = document.getElementById('taskCategory');
        
        const title = titleInput.value.trim();
        const category = categorySelect.value;
        
        if (!title) {
            this.showNotification('Please enter a task title', 'warning');
            return;
        }

        try {
            const response = await this.makeRequest(`${this.baseURL}/tasks`, {
                method: 'POST',
                body: JSON.stringify({ title, category })
            });

            this.tasks.unshift(response.data);
            this.renderTasks();
            await this.updateStats();
            
            // Reset form
            titleInput.value = '';
            categorySelect.value = 'personal';
            
            this.showNotification('Task added successfully!', 'success');
            this.showTaskAddedAnimation();
        } catch (error) {
            console.error('Failed to add task:', error);
        }
    }

    // Delete task
    async deleteTask(taskId) {
        if (!confirm('Are you sure you want to delete this task?')) {
            return;
        }

        try {
            await this.makeRequest(`${this.baseURL}/tasks/${taskId}`, {
                method: 'DELETE'
            });

            this.tasks = this.tasks.filter(task => task.id !== taskId);
            this.renderTasks();
            await this.updateStats();
            
            this.showNotification('Task deleted successfully!', 'success');
        } catch (error) {
            console.error('Failed to delete task:', error);
        }
    }

    // Update task (toggle completion, edit, etc.)
    async updateTask(taskId, updates) {
        try {
            const response = await this.makeRequest(`${this.baseURL}/tasks/${taskId}`, {
                method: 'PUT',
                body: JSON.stringify(updates)
            });

            const taskIndex = this.tasks.findIndex(task => task.id === taskId);
            if (taskIndex !== -1) {
                this.tasks[taskIndex] = response.data;
            }

            this.renderTasks();
            await this.updateStats();
            
            this.showNotification('Task updated successfully!', 'success');
        } catch (error) {
            console.error('Failed to update task:', error);
        }
    }

    // Toggle task completion
    async toggleTaskCompletion(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            await this.updateTask(taskId, { completed: !task.completed });
        }
    }

    // Render tasks
    renderTasks() {
        const filteredTasks = this.getFilteredTasks();
        const tasksContainer = document.getElementById('tasksContainer');
        
        if (filteredTasks.length === 0) {
            tasksContainer.innerHTML = `
                <div class="empty-state">
                    ${this.currentFilter === 'all' ? 
                        'No tasks yet. Add your first task above! 🚀' : 
                        `No ${this.currentFilter} tasks found. Try adding some! 📋`
                    }
                </div>
            `;
            return;
        }

        tasksContainer.innerHTML = filteredTasks.map(task => `
            <div class="task-card ${task.category} ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
                <div class="task-header">
                    <div class="task-title ${task.completed ? 'line-through' : ''}">${this.escapeHtml(task.title)}</div>
                    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} 
                           onchange="todoApp.toggleTaskCompletion(${task.id})">
                </div>
                <div class="task-category ${task.category}">${task.category}</div>
                <div class="task-date">Created: ${this.formatDate(task.created_at)}</div>
                ${task.updated_at !== task.created_at ? 
                    `<div class="task-date">Updated: ${this.formatDate(task.updated_at)}</div>` : ''
                }
                <div class="task-actions">
                    <button class="edit-btn" onclick="todoApp.editTask(${task.id})">
                        ✏️ Edit
                    </button>
                    <button class="delete-btn" onclick="todoApp.deleteTask(${task.id})">
                        🗑️ Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Get filtered tasks
    getFilteredTasks() {
        if (this.currentFilter === 'all') {
            return this.tasks;
        }
        return this.tasks.filter(task => task.category === this.currentFilter);
    }

    // Set active tab
    setActiveTab(category) {
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.category === category) {
                tab.classList.add('active');
            }
        });
    }

    // Filter tasks
    filterTasks(category) {
        this.currentFilter = category;
        this.renderTasks();
    }

    // Update statistics
    async updateStats() {
        try {
            const response = await this.makeRequest(`${this.baseURL}/stats`);
            const stats = response.data;
            
            document.getElementById('totalTasks').textContent = stats.total;
            document.getElementById('personalTasks').textContent = stats.personal;
            document.getElementById('workTasks').textContent = stats.work;
            
            // Add completed tasks stat if element exists
            const completedEl = document.getElementById('completedTasks');
            if (completedEl) {
                completedEl.textContent = stats.completed;
            }
        } catch (error) {
            console.error('Failed to update stats:', error);
            // Fallback to local calculation
            this.updateStatsLocally();
        }
    }

    // Fallback stats calculation
    updateStatsLocally() {
        const personalCount = this.tasks.filter(task => task.category === 'personal').length;
        const workCount = this.tasks.filter(task => task.category === 'work').length;
        const completedCount = this.tasks.filter(task => task.completed).length;
        
        document.getElementById('totalTasks').textContent = this.tasks.length;
        document.getElementById('personalTasks').textContent = personalCount;
        document.getElementById('workTasks').textContent = workCount;
        
        const completedEl = document.getElementById('completedTasks');
        if (completedEl) {
            completedEl.textContent = completedCount;
        }
    }

    // Edit task functionality
    editTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        const newTitle = prompt('Edit task title:', task.title);
        if (newTitle && newTitle.trim() !== task.title) {
            this.updateTask(taskId, { title: newTitle.trim() });
        }
    }

    // Search tasks
    searchTasks(query) {
        const searchTerm = query.toLowerCase();
        const tasksContainer = document.getElementById('tasksContainer');
        const taskCards = tasksContainer.querySelectorAll('.task-card');
        
        taskCards.forEach(card => {
            const title = card.querySelector('.task-title').textContent.toLowerCase();
            if (title.includes(searchTerm)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    // Show notification
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Add notification styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 1000;
            animation: slideInRight 0.3s ease;
            max-width: 300px;
        `;
        
        // Set background color based on type
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8'
        };
        notification.style.backgroundColor = colors[type] || colors.info;
        
        document.body.appendChild(notification);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Task added animation
    showTaskAddedAnimation() {
        const btn = document.querySelector('.add-btn');
        const originalText = btn.textContent;
        btn.textContent = '✓ Added!';
        btn.style.background = 'linear-gradient(45deg, #28a745, #34ce57)';
        
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = 'linear-gradient(45deg, #667eea, #764ba2)';
        }, 1000);
    }

    // Utility functions
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {
            hour: '2-digit', 
            minute: '2-digit'
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Export/Import functionality (bonus feature)
    exportTasks() {
        const dataStr = JSON.stringify(this.tasks, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'tasks_export.json';
        link.click();
        URL.revokeObjectURL(url);
    }

    // Refresh tasks
    async refreshTasks() {
        await this.loadTasks();
        this.renderTasks();
        await this.updateStats();
        this.showNotification('Tasks refreshed!', 'success');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    todoApp = new TodoApp();
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .task-card.completed {
        opacity: 0.7;
    }
    
    .task-title.line-through {
        text-decoration: line-through;
        color: #999;
    }
    
    .task-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 10px;
    }
    
    .task-checkbox {
        margin-left: 10px;
        transform: scale(1.2);
    }
    
    .edit-btn {
        padding: 8px 16px;
        background: linear-gradient(45deg, #17a2b8, #20c997);
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 600;
        transition: all 0.3s ease;
        margin-right: 10px;
    }
    
    .edit-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 5px 15px rgba(23, 162, 184, 0.4);
    }
`;
document.head.appendChild(style);