const inputBox = document.getElementById("input-box");
const listContainer = document.getElementById("list-container");
const addTaskBtn = document.getElementById("add-task-btn");

// Fetch tasks from backend on load
async function fetchTasks() {
    try {
        const response = await fetch('/tasks');
        if (response.ok) {
            const tasks = await response.json();
            listContainer.innerHTML = '';
            tasks.forEach(task => addTaskToUI(task.task, task.id));
        } else {
            console.error('Failed to fetch tasks');
        }
    } catch (err) {
        console.error('Error fetching tasks:', err);
    }
}

// Navigate to the main dashboard page
function goToDashboard() {
    window.location.href = "/protected/index.html";
}


// Add task to UI
function addTaskToUI(taskText, taskId = null) {
    let newTask = document.createElement("li");
    newTask.innerHTML = taskText;
    listContainer.appendChild(newTask);

    let span = document.createElement("span");
    span.innerHTML = "\u00d7";
    newTask.appendChild(span);
    span.setAttribute("data-id", taskId); 

    saveData();
}

// Add new task (local + backend)
addTaskBtn.addEventListener("click", async () => {
    if (inputBox.value === "") {
        alert("You must write something!");
    } else {
        let task = inputBox.value;
        try {
            const response = await fetch('/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ task })
            });

            if (response.ok) {
                fetchTasks();
                inputBox.value = "";
            } else {
                console.error('Failed to add task');
            }
        } catch (err) {
            console.error('Error adding task:', err);
        }
    }
});

// Delete task
listContainer.addEventListener("click", async (e) => {
    if (e.target.tagName === "SPAN") {
        const taskId = e.target.getAttribute("data-id");

        try {
            const response = await fetch(`/tasks/${taskId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                fetchTasks();
            } else {
                console.error('Failed to delete task');
            }
        } catch (err) {
            console.error('Error deleting task:', err);
        }
    }
});

// Save tasks in local storage
function saveData() {
    localStorage.setItem("data", listContainer.innerHTML);
}

// Load stored tasks
function showTask() {
    listContainer.innerHTML = localStorage.getItem("data") || "";
}

// Load tasks from storage and backend
showTask();
fetchTasks();
