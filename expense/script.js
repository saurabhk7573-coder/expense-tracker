let transactions = [];
let currentType = 'income';
let historyOpen = false;

function loadTransactions() {
  const raw = localStorage.getItem('et_transactions');
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) transactions = parsed;
  } catch (err) {
    transactions = [];
    localStorage.removeItem('et_transactions');
  }
}

function save() {
  localStorage.setItem('et_transactions', JSON.stringify(transactions));
}

function toggleHistory(event) {
  if (event) event.preventDefault();
  historyOpen = !historyOpen;
  const card = document.getElementById('history-card');
  if (card) card.classList.toggle('open', historyOpen);
  updateHistoryAction();
}

function updateHistoryAction() {
  const action = document.getElementById('history-action');
  if (!action) return;
  action.textContent = historyOpen ? 'Hide' : 'View';
}

function fmt(n) {
  return '₹' + Math.abs(n).toFixed(2);
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function setType(type) {
  currentType = type;
  document.getElementById('btn-income').className =
    'type-btn' + (type === 'income' ? ' active-income' : '');
  document.getElementById('btn-expense').className =
    'type-btn' + (type === 'expense' ? ' active-expense' : '');
}

function addTransaction() {
  const desc      = document.getElementById('desc').value.trim();
  const amountRaw = document.getElementById('amount').value.trim();
  const category  = document.getElementById('category').value;
  const errEl     = document.getElementById('error-msg');

  const amount = parseFloat(amountRaw);
  if (!desc || isNaN(amount) || amount <= 0) {
    errEl.classList.add('show');
    return;
  }
  errEl.classList.remove('show');

  const tx = {
    id: Date.now(),
    desc,
    amount: currentType === 'income' ? amount : -amount,
    type: currentType,
    category,
    date: new Date().toISOString()
  };

  transactions.unshift(tx);
  save();
  render();

  document.getElementById('desc').value     = '';
  document.getElementById('amount').value   = '';
  document.getElementById('category').value = 'General';
  setType('income');
}

function deleteTransaction(id) {
  if (!confirm('Are you sure you want to delete this transaction?')) return;
  transactions = transactions.filter(t => t.id !== id);
  save();
  render();
}

function clearAll() {
  if (transactions.length === 0) return;
  if (confirm('Do you want to delete all transactions?')) {
    transactions = [];
    save();
    render();
  }
}

const catIcons = {
  Food: '🍔', Transport: '🚌', Shopping: '🛍',
  Health: '💊', Education: '📚', Salary: '💼',
  General: '💳', Other: '📌'
};

function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function render() {
  const list    = document.getElementById('history-list');
  const income  = transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0);
  const balance = income + expense;

  document.getElementById('total-income').textContent  = fmt(income);
  document.getElementById('total-expense').textContent = fmt(Math.abs(expense));

  const balEl = document.getElementById('balance');
  balEl.textContent = (balance >= 0 ? '' : '-') + fmt(balance);
  balEl.className   = 'balance-amount ' +
    (balance > 0 ? 'positive' : balance < 0 ? 'negative' : 'zero');

  if (transactions.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="emoji">💳</div>
        <p>No transactions yet.<br />Add one from above!</p>
      </div>`;
    updateHistoryCard();
    updateHistoryAction();
    return;
  }

  list.innerHTML = transactions.map(t => {
    const isIncome = t.amount > 0;
    const icon     = catIcons[t.category] || '💳';
    return `
      <div class="history-item">
        <div class="t-icon ${isIncome ? 'income-bg' : 'expense-bg'}">${icon}</div>
        <div class="t-info">
          <div class="t-desc">${escapeHTML(t.desc)}</div>
          <div class="t-date">${t.category} · ${formatDate(t.date)}</div>
        </div>
        <div class="t-amount ${isIncome ? 'income' : 'expense'}">
          ${isIncome ? '+' : '−'}${fmt(t.amount)}
        </div>
        <button class="t-delete" onclick="deleteTransaction(${t.id})" title="Delete">✕</button>
      </div>`;
  }).join('');
  updateHistoryCard();
  updateHistoryAction();
}

function updateHistoryCard() {
  const countEl = document.getElementById('history-count');
  const lastEl = document.getElementById('history-last');

  if (!countEl || !lastEl) return;

  if (transactions.length === 0) {
    countEl.textContent = 'No transactions yet';
    lastEl.textContent = 'Add a transaction from above.';
    return;
  }

  const latest = transactions[0];
  const isIncome = latest.amount > 0;
  countEl.textContent = `${transactions.length} transaction${transactions.length === 1 ? '' : 's'}`;
  lastEl.textContent = `${isIncome ? 'Last: +' : 'Last: −'}${fmt(latest.amount)} · ${latest.category}`;
}

document.addEventListener('keydown', function(e) {
  const activeId = document.activeElement && document.activeElement.id;
  if (e.key === 'Enter' && (activeId === 'desc' || activeId === 'amount')) {
    addTransaction();
  }
});

loadTransactions();
render();