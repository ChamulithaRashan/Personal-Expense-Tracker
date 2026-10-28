const STORAGE_KEY = "expenseTrackerTransactions";

const form = document.getElementById("transactionForm");
const typeEl = document.getElementById("type");
const descEl = document.getElementById("description");
const amountEl = document.getElementById("amount");
const categoryEl = document.getElementById("category");
const dateEl = document.getElementById("date");
const filterEl = document.getElementById("filter");
const searchEl = document.getElementById("search");
const bodyEl = document.getElementById("transactionBody");

let transactions = load();

function load(){
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

function todayString() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function formatLKR(n) {
  return "LKR " + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function setError(input, message) {
  document.getElementById(input.id + "Error").textContent = message;
  input.classList.toggle("invalid", Boolean(message));
}

function validate() {
  let ok = true;
  const checks = [
    [descEl, descEl.value.trim() === "", "Description is required."],
    [categoryEl, categoryEl.value === "", "Please select a category."],
    [dateEl, dateEl.value === "", "Date is required."],
  ];
  checks.forEach(([el, bad, msg]) => {
    setError(el, bad ? msg : "");
    if (bad) ok = false;
  });

  const amount = parseFloat(amountEl.value);
  if (isNaN(amount) || amount <= 0) {
    setError(amountEl, "Amount must be greater than zero.");
    ok = false;
  } else {
    setError(amountEl, "");
  }
  return ok;
}

function updateSummary() {
  const income = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expenses = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  document.getElementById("totalIncome").textContent = formatLKR(income);
  document.getElementById("totalExpenses").textContent = formatLKR(expenses);
  document.getElementById("balance").textContent = formatLKR(income - expenses);
}

function renderTable() {
  const filter = filterEl.value;
  const query = searchEl.value.trim().toLowerCase();

  const rows = transactions.filter(t => {
    const matchesType = filter === "all" || t.type === filter;
    const matchesSearch =
      t.description.toLowerCase().includes(query) ||
      t.category.toLowerCase().includes(query);
    return matchesType && matchesSearch;
  });

  if (rows.length === 0) {
    bodyEl.innerHTML = '<tr><td colspan="6" class="empty">No transactions found.</td></tr>';
    return;
  }

  bodyEl.innerHTML = rows.map(t => {
    const sign = t.type === "income" ? "+" : "\u2212";
    const label = t.type === "income" ? "Income" : "Expense";
    return `
      <tr>
        <td>${escapeHTML(t.date)}</td>
        <td>${escapeHTML(t.description)}</td>
        <td><span class="badge ${t.type}">${label}</span></td>
        <td>${escapeHTML(t.category)}</td>
        <td class="num amount-${t.type}">${sign} ${formatLKR(t.amount)}</td>
        <td><button class="btn btn-delete" data-id="${t.id}">Delete</button></td>
      </tr>`;
  }).join("");
}

function refresh() {
  updateSummary();
  renderTable();
}

function clearForm() {
  form.reset();
  dateEl.value = todayString();
  [descEl, amountEl, categoryEl, dateEl].forEach(el => setError(el, ""));
}

form.addEventListener("submit", e => {
  e.preventDefault();
  if (!validate()) return;

  transactions.push({
    id: Date.now(),
    type: typeEl.value,
    description: descEl.value.trim(),
    amount: parseFloat(amountEl.value),
    category: categoryEl.value,
    date: dateEl.value,
  });
  save();
  refresh();
  clearForm();
  alert("Transaction added successfully!");
});

document.getElementById("clearBtn").addEventListener("click", clearForm);
filterEl.addEventListener("change", renderTable);
searchEl.addEventListener("input", renderTable);

bodyEl.addEventListener("click", e => {
  const btn = e.target.closest(".btn-delete");
  if (!btn) return;
  const id = Number(btn.dataset.id);
  transactions = transactions.filter(t => t.id !== id);
  save();
  refresh();
});

dateEl.value = todayString();
refresh();