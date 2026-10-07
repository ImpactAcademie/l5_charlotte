const tasksApi = 'http://localhost:3000/todos';
let tasks = [];
let currentFilter = 'all';
let catJumpAnimation;
const pendingTaskIds = new Set();

const taskList = document.querySelector('#task-list');
const taskForm = document.querySelector('#task-form');
const taskInput = document.querySelector('#task-input');
const nyanArt = document.querySelector('.nyan-art');
const weatherIcon = document.querySelector('#weather-icon');
const weatherSummary = document.querySelector('#weather-summary');
const weatherTemperature = document.querySelector('#weather-temperature');
const remainingCount = document.querySelector('#remaining-count');
const progressNumber = document.querySelector('#progress-number');
const emptyState = document.querySelector('#empty-state');
const emptyMessage = document.querySelector('#empty-message');
const clearCompletedButton = document.querySelector('#clear-completed');
const footerMessage = document.querySelector('#footer-message');

const dateLabel = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});
document.querySelector('#today-date').textContent = dateLabel.format(new Date());

const weatherConditions = {
  0: ['Ciel dégagé', '☀'],
  1: ['Peu nuageux', '🌤'],
  2: ['Partiellement nuageux', '⛅'],
  3: ['Couvert', '☁'],
  45: ['Brouillard', '≋'],
  48: ['Brouillard givrant', '≋'],
  51: ['Bruine légère', '☂'],
  53: ['Bruine', '☂'],
  55: ['Bruine dense', '☂'],
  56: ['Bruine verglaçante', '☂'],
  57: ['Bruine verglaçante', '☂'],
  61: ['Pluie légère', '☂'],
  63: ['Pluie', '☂'],
  65: ['Forte pluie', '☂'],
  66: ['Pluie verglaçante', '☂'],
  67: ['Pluie verglaçante', '☂'],
  71: ['Neige légère', '❄'],
  73: ['Neige', '❄'],
  75: ['Forte neige', '❄'],
  77: ['Neige en grains', '❄'],
  80: ['Averses légères', '☂'],
  81: ['Averses', '☂'],
  82: ['Fortes averses', '☂'],
  85: ['Averses de neige', '❄'],
  86: ['Fortes averses de neige', '❄'],
  95: ['Orage', '⚡'],
  96: ['Orage et grêle', '⚡'],
  99: ['Orage et grêle', '⚡'],
};

async function refreshWeather() {
  const endpoint = 'https://api.open-meteo.com/v1/forecast?latitude=50.6333&longitude=5.5667&current=temperature_2m,weather_code&timezone=Europe%2FBrussels';

  try {
    const response = await fetch(endpoint);
    if (!response.ok) throw new Error('Weather request failed');

    const data = await response.json();
    const current = data.current;
    const [condition, icon] = weatherConditions[current.weather_code] ?? ['Conditions variables', '☁'];
    const updateTime = current.time.split('T')[1].slice(0, 5);

    weatherIcon.textContent = icon;
    weatherSummary.textContent = `${condition} · ${updateTime}`;
    weatherTemperature.textContent = `${Math.round(current.temperature_2m)}°`;
    document.querySelector('.weather-widget').title = `${condition} à Liège, observé à ${updateTime}`;
  } catch {
    weatherIcon.textContent = '…';
    weatherSummary.textContent = 'Météo indisponible';
    weatherTemperature.textContent = '--°';
  }
}

refreshWeather();
window.setInterval(refreshWeather, 10 * 60 * 1000);

function renderTasks() {
  const visibleTasks = tasks.filter((task) => {
    if (currentFilter === 'active') return !task.completed;
    if (currentFilter === 'completed') return task.completed;
    return true;
  });
  const remaining = tasks.filter((task) => !task.completed).length;
  const completed = tasks.length - remaining;
  const progress = tasks.length === 0 ? 0 : Math.round((completed / tasks.length) * 100);

  taskList.replaceChildren();
  for (const task of visibleTasks) {
    const item = document.createElement('li');
    item.className = `task-item${task.completed ? ' is-completed' : ''}`;
    item.dataset.id = task.id;

    const checkButton = document.createElement('button');
    checkButton.className = 'task-check';
    checkButton.type = 'button';
    checkButton.dataset.action = 'toggle';
    checkButton.disabled = pendingTaskIds.has(String(task.id));
    checkButton.setAttribute('aria-label', `${task.completed ? 'Marquer comme à faire' : 'Terminer'} : ${task.text}`);
    checkButton.setAttribute('aria-pressed', String(task.completed));
    if (task.completed) {
      const checkmark = document.createElement('span');
      checkmark.setAttribute('aria-hidden', 'true');
      checkmark.textContent = '✓';
      checkButton.append(checkmark);
    }

    const text = document.createElement('span');
    text.className = 'task-text';
    text.textContent = task.text;

    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-button';
    deleteButton.type = 'button';
    deleteButton.dataset.action = 'delete';
    deleteButton.disabled = pendingTaskIds.has(String(task.id));
    deleteButton.setAttribute('aria-label', `Supprimer : ${task.text}`);
    deleteButton.textContent = '×';

    item.append(checkButton, text, deleteButton);
    taskList.append(item);
  }

  remainingCount.textContent = String(remaining);
  progressNumber.textContent = `${progress}%`;
  clearCompletedButton.hidden = completed === 0;
  footerMessage.textContent = tasks.length === 0
    ? 'Une page blanche, tout est possible.'
    : remaining === 0
      ? 'Bravo, ta liste est terminée !'
      : 'Chaque tâche cochée, c’est ça de fait.';

  emptyState.hidden = visibleTasks.length > 0;
  if (visibleTasks.length === 0) {
    emptyMessage.textContent = tasks.length === 0
      ? 'Rien ici pour le moment.'
      : currentFilter === 'active'
        ? 'Tout est fait, profite du moment.'
        : 'Aucune tâche terminée pour le moment.';
  }
}

async function loadTasks() {
  try {
    const response = await fetch(tasksApi);
    if (!response.ok) throw new Error('Tasks request failed');

    tasks = await response.json();
    renderTasks();
  } catch {
    tasks = [];
    renderTasks();
    footerMessage.textContent = 'Serveur indisponible. Lance « npm run server » puis recharge la page.';
  }
}

function animateCatJump() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  catJumpAnimation?.cancel();
  catJumpAnimation = nyanArt.animate([
    { transform: 'translateY(0)' },
    { transform: 'translateY(-24px)', offset: 0.38 },
    { transform: 'translateY(-17px)', offset: 0.62 },
    { transform: 'translateY(0)' },
  ], {
    duration: 520,
    easing: 'cubic-bezier(0.3, 0, 0.2, 1)',
  });
}

function animateAddConfetti() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const addButton = taskForm.querySelector('.add-button');
  const palette = ['--pink', '--violet', '--navy'].map((name) =>
    getComputedStyle(document.documentElement).getPropertyValue(name).trim(),
  );
  const particleCount = 12;

  for (let index = 0; index < particleCount; index += 1) {
    const particle = document.createElement('span');
    const angle = (2 * Math.PI * index) / particleCount;
    const distance = 36 + Math.random() * 26;
    const offsetX = Math.cos(angle) * distance;
    const offsetY = Math.sin(angle) * distance;
    const rotation = Math.random() * 360 - 180;

    particle.className = 'confetti-particle';
    particle.setAttribute('aria-hidden', 'true');
    particle.style.backgroundColor = palette[index % palette.length];
    addButton.append(particle);

    const animation = particle.animate([
      { transform: 'translate(-50%, -50%) scale(0.4) rotate(0deg)', opacity: 1 },
      {
        transform: `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px)) scale(1) rotate(${rotation}deg)`,
        opacity: 0,
      },
    ], {
      duration: 650,
      easing: 'cubic-bezier(0.15, 0.7, 0.2, 1)',
    });
    animation.onfinish = () => particle.remove();
  }
}

taskForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const text = taskInput.value.trim();
  if (!text) return;

  const temporaryId = `pending-${Date.now()}-${Math.random()}`;
  const optimisticTask = { id: temporaryId, text, completed: false };
  pendingTaskIds.add(temporaryId);
  tasks.unshift(optimisticTask);
  animateCatJump();
  animateAddConfetti();
  currentFilter = 'all';
  document.querySelectorAll('.filter-button').forEach((button) => {
    const isActive = button.dataset.filter === currentFilter;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });
  taskInput.value = '';
  renderTasks();
  taskInput.focus();

  try {
    const response = await fetch(tasksApi, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, completed: false }),
    });
    if (!response.ok) throw new Error('Task creation failed');

    const savedTask = await response.json();
    const taskIndex = tasks.findIndex((task) => task.id === temporaryId);
    if (taskIndex !== -1) tasks[taskIndex] = savedTask;
    pendingTaskIds.delete(temporaryId);
    renderTasks();
  } catch {
    tasks = tasks.filter((task) => task.id !== temporaryId);
    pendingTaskIds.delete(temporaryId);
    renderTasks();
    footerMessage.textContent = 'Impossible d’ajouter la tâche. Vérifie que le serveur est lancé.';
  }
});

taskList.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const item = button.closest('.task-item');
  const taskIndex = tasks.findIndex((task) => String(task.id) === item.dataset.id);
  if (taskIndex === -1) return;

  const task = tasks[taskIndex];
  const taskId = String(task.id);
  if (pendingTaskIds.has(taskId)) return;

  pendingTaskIds.add(taskId);
  if (button.dataset.action === 'toggle') {
    tasks[taskIndex] = { ...task, completed: !task.completed };
    renderTasks();

    fetch(`${tasksApi}/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !task.completed }),
      })
      .then((response) => {
        if (!response.ok) throw new Error('Task update failed');
        return response.json();
      })
      .then((savedTask) => {
        const currentIndex = tasks.findIndex((entry) => String(entry.id) === taskId);
        if (currentIndex !== -1) tasks[currentIndex] = savedTask;
      })
      .catch(() => {
        const currentIndex = tasks.findIndex((entry) => String(entry.id) === taskId);
        if (currentIndex !== -1) tasks[currentIndex] = task;
        footerMessage.textContent = 'Modification impossible. Vérifie que le serveur est lancé.';
      })
      .finally(() => {
        pendingTaskIds.delete(taskId);
        renderTasks();
      });
  } else {
    tasks.splice(taskIndex, 1);
    renderTasks();

    fetch(`${tasksApi}/${task.id}`, { method: 'DELETE' })
      .then((response) => {
        if (!response.ok) throw new Error('Task deletion failed');
      })
      .catch(() => {
        tasks.splice(Math.min(taskIndex, tasks.length), 0, task);
        footerMessage.textContent = 'Suppression impossible. Vérifie que le serveur est lancé.';
      })
      .finally(() => {
        pendingTaskIds.delete(taskId);
        renderTasks();
      });
  }
});

document.querySelectorAll('.filter-button').forEach((button) => {
  button.addEventListener('click', () => {
    currentFilter = button.dataset.filter;
    document.querySelectorAll('.filter-button').forEach((filterButton) => {
      const isActive = filterButton === button;
      filterButton.classList.toggle('is-active', isActive);
      filterButton.setAttribute('aria-pressed', String(isActive));
    });
    renderTasks();
  });
});

clearCompletedButton.addEventListener('click', () => {
  const completedTasks = tasks.filter((task) =>
    task.completed && !pendingTaskIds.has(String(task.id)),
  );
  if (completedTasks.length === 0) return;

  const completedIds = new Set(completedTasks.map((task) => String(task.id)));
  tasks = tasks.filter((task) => !completedIds.has(String(task.id)));
  renderTasks();

  Promise.all(completedTasks.map((task) =>
    fetch(`${tasksApi}/${task.id}`, { method: 'DELETE' }),
  ))
    .then((responses) => {
      if (responses.some((response) => !response.ok)) throw new Error('Completed task deletion failed');
    })
    .catch(async () => {
      await loadTasks();
      footerMessage.textContent = 'Nettoyage impossible. La liste a été rechargée depuis le serveur.';
    });
});

footerMessage.textContent = 'Chargement de tes tâches…';
loadTasks();