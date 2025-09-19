// Get DOM elements
const taskInput = document.getElementById('task');
const dateInput = document.getElementById('date');
const timeInput = document.getElementById('time');
const categoryInput = document.getElementById('category');
const priorityInput = document.getElementById('priority');
const addTaskBtn = document.getElementById('addTask');
const calendar = document.getElementById('calendar');
const progressBar = document.getElementById('progress');
const upcomingList = document.getElementById('upcomingList');
const openModalBtn = document.getElementById('openModal');
const modal = document.getElementById('taskModal');
const closeModalBtn = document.querySelector('.close');
const deleteAllBtn = document.getElementById('deleteAll');
const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Modal events
openModalBtn.onclick = () => modal.style.display = 'block';
closeModalBtn.onclick = () => modal.style.display = 'none';
window.onclick = e => { if(e.target === modal) modal.style.display = 'none'; };

// Load tasks on page load
window.onload = function() { renderAll(); };

// Add task
addTaskBtn.addEventListener('click', () => {
    const task = taskInput.value.trim();
    const date = dateInput.value;
    const time = timeInput.value;
    const category = categoryInput.value;
    const priority = priorityInput.value;

    if(!task || !date || !time) { alert('Please fill all fields'); return; }

    const taskObj = { task, date, time, category, priority, completed: false };
    saveTask(taskObj);
    renderAll();

    // Clear inputs
    taskInput.value = '';
    dateInput.value = '';
    timeInput.value = '';
    categoryInput.value = 'Study';
    priorityInput.value = 'Medium';

    modal.style.display = 'none';

    // Reminder
    const taskDateTime = new Date(taskObj.date + 'T' + taskObj.time);
    const diff = taskDateTime - new Date();
    if(diff > 0) setTimeout(()=> alert(`Reminder: "${taskObj.task}" is due now!`), diff);
});

// Save task
function saveTask(taskObj){
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    tasks.push(taskObj);
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Load tasks
function loadTasks(){ return JSON.parse(localStorage.getItem('tasks')) || []; }

// Render everything
function renderAll(){
    renderCalendar();
    renderUpcomingTasks();
    updateProgress();
}

// Render calendar
function renderCalendar(){
    calendar.innerHTML = '';
    const tasks = loadTasks();
    const today = new Date();
    const month = today.getMonth();
    const year = today.getFullYear();

    // Day headers
    for(let i=0;i<7;i++){
        const dayHeader = document.createElement('div');
        dayHeader.classList.add('day-header');
        dayHeader.textContent = daysOfWeek[i];
        calendar.appendChild(dayHeader);
    }

    const firstDay = new Date(year, month,1).getDay();
    const totalDays = new Date(year, month+1,0).getDate();

    // Empty blocks before first day
    for(let i=0;i<firstDay;i++){
        const emptyDiv = document.createElement('div');
        emptyDiv.classList.add('day');
        calendar.appendChild(emptyDiv);
    }

    // Render days
    for(let day=1; day<=totalDays; day++){
        const dayDiv = document.createElement('div');
        dayDiv.classList.add('day');
        const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
        dayDiv.dataset.date = dateStr;

        // Highlight today
        if(dateStr === today.toISOString().split('T')[0]){
            dayDiv.classList.add('today');
        }

        const dayHeader = document.createElement('div');
        dayHeader.classList.add('day-header');
        dayHeader.textContent = day;
        dayDiv.appendChild(dayHeader);

        // Drag & drop events
        dayDiv.addEventListener('dragover', e => { e.preventDefault(); dayDiv.classList.add('drag-over'); });
        dayDiv.addEventListener('dragleave', e => dayDiv.classList.remove('drag-over'));
        dayDiv.addEventListener('drop', e => {
            e.preventDefault();
            dayDiv.classList.remove('drag-over');
            const taskData = JSON.parse(e.dataTransfer.getData('task'));
            moveTaskToDate(taskData, dayDiv.dataset.date);
        });

        // Add tasks
        tasks.filter(t => t.date === dateStr).forEach(task => {
            const taskDiv = document.createElement('div');
            taskDiv.classList.add('task-item', task.category);
            taskDiv.draggable = true;
            taskDiv.dataset.priority = task.priority;
            if(task.completed) taskDiv.style.textDecoration = 'line-through';
            taskDiv.textContent = `${task.task} (${task.time})`;

            // Drag start/end
            taskDiv.addEventListener('dragstart', e => {
                e.dataTransfer.setData('task', JSON.stringify(task));
                taskDiv.classList.add('dragging');
            });
            taskDiv.addEventListener('dragend', e => taskDiv.classList.remove('dragging'));

            // Click to toggle completion
            taskDiv.addEventListener('click', () => toggleTaskCompletion(task));

            // Right-click to delete
            taskDiv.addEventListener('contextmenu', e => {
                e.preventDefault();
                deleteTask(task);
            });

            dayDiv.appendChild(taskDiv);
        });

        calendar.appendChild(dayDiv);
    }
}

// Toggle task completion
function toggleTaskCompletion(taskObj){
    let tasks = loadTasks();
    tasks.forEach(t => {
        if(t.task===taskObj.task && t.date===taskObj.date && t.time===taskObj.time){
            t.completed = !t.completed;
        }
    });
    localStorage.setItem('tasks', JSON.stringify(tasks));
    renderAll();
}

// Delete task with confirmation
function deleteTask(taskObj){
    const confirmDelete = confirm(`Are you sure you want to delete "${taskObj.task}" on ${taskObj.date} ${taskObj.time}?`);
    if(!confirmDelete) return;

    let tasks = loadTasks();
    tasks = tasks.filter(t => !(t.task===taskObj.task && t.date===taskObj.date && t.time===taskObj.time));
    localStorage.setItem('tasks', JSON.stringify(tasks));
    renderAll();
}

// Move task (drag & drop)
function moveTaskToDate(taskObj, newDate){
    let tasks = loadTasks();
    tasks.forEach(t => {
        if(t.task===taskObj.task && t.date===taskObj.date && t.time===taskObj.time){
            t.date = newDate;
        }
    });
    localStorage.setItem('tasks', JSON.stringify(tasks));
    renderAll();
}

// Update progress bar
function updateProgress(){
    const tasks = loadTasks();
    if(tasks.length===0){ progressBar.style.width='0%'; return; }
    const completed = tasks.filter(t => t.completed).length;
    const percent = (completed / tasks.length) * 100;
    progressBar.style.width = percent + '%';
}

// Render upcoming tasks
function renderUpcomingTasks(){
    upcomingList.innerHTML = '';
    const tasks = loadTasks();
    const today = new Date();
    const next7Days = new Date(); next7Days.setDate(today.getDate() + 7);

    const upcoming = tasks.filter(t => {
        const taskDate = new Date(t.date);
        return taskDate >= today && taskDate <= next7Days;
    }).sort((a,b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time));

    upcoming.forEach(task => {
        const li = document.createElement('li');
        li.classList.add(task.category);
        if(task.completed) li.classList.add('completed');
        li.textContent = `${task.task} (${task.date} ${task.time})`;

        li.addEventListener('click', () => toggleTaskCompletion(task));
        li.addEventListener('contextmenu', e => { e.preventDefault(); deleteTask(task); });

        upcomingList.appendChild(li);
    });
}

// Delete All Tasks button
deleteAllBtn.addEventListener('click', () => {
    if(confirm('Are you sure you want to delete ALL tasks?')){
        localStorage.removeItem('tasks');
        renderAll();
    }
});
