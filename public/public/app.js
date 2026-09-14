let token = localStorage.getItem('ag_token');

const $ = id => document.getElementById(id);

function showTab(type) {
  $('login').classList.toggle('hidden', type !== 'login');
  $('register').classList.toggle('hidden', type !== 'register');
}

async function api(url, options = {}) {
  options.headers = {
    ...(options.headers || {}),
    'Content-Type': 'application/json',
    ...(token ? { Authorization: 'Bearer ' + token } : {})
  };

  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

async function login(event) {
  event.preventDefault();

  try {
    const data = await api('/api/login', {
      method: 'POST',
      body: JSON.stringify({
        mobile: $('lm').value,
        password: $('lp').value
      })
    });

    token = data.token;
    localStorage.setItem('ag_token', token);

    loadDashboard();

  } catch (error) {
    $('msg').textContent = error.message;
  }
}

async function register(event) {
  event.preventDefault();

  try {
    const data = await api('/api/register', {
      method: 'POST',
      body: JSON.stringify({
        name: $('rn').value,
        mobile: $('rm').value,
        password: $('rp').value,
        referralCode: $('rr').value
      })
    });

    $('msg').textContent =
      'Account created. Referral code: ' + data.referralCode;

    showTab('login');

  } catch (error) {
    $('msg').textContent = error.message;
  }
}

async function loadDashboard() {
  try {
    const data = await api('/api/me');

    $('auth').classList.add('hidden');
    $('dashboard').classList.remove('hidden');

    $('balance').textContent =
      '₹' + Number(data.wallet.balance).toFixed(2);

    $('ref').textContent = data.user.referral_code;

    if (data.transactions.length) {
      $('tx').innerHTML = data.transactions.map(t =>
        <p>${t.type}: ₹${t.amount} — ${t.status}</p>
      ).join('');
    } else {
      $('tx').innerHTML =
        '<p class="muted">No transactions yet.</p>';
    }

    const plans = await api('/api/plans');

    $('plans').innerHTML = plans.map(plan => `
      <div class="plan">
        <div>
          <b>${plan.name}</b>
          <div>₹${plan.amount} · ${plan.duration_days} days</div>
          <small class="muted">${plan.description}</small>
        </div>

        <button onclick="alert('Plan/order flow को अपने compliant payment system से connect करें.')">
          View
        </button>
      </div>
    `).join('');

  } catch (error) {
    logout();
  }
}

async function withdraw(event) {
  event.preventDefault();

  try {
    await api('/api/withdrawals', {
      method: 'POST',
      body: JSON.stringify({
        amount: Number($('wa').value),
        method: $('wm').value,
        account: $('wacc').value
      })
    });

    alert('Withdrawal request submitted');

    loadDashboard();

  } catch (error) {
    alert(error.message);
  }
}

function logout() {
  localStorage.removeItem('ag_token');
  token = null;

  $('dashboard').classList.add('hidden');
  $('auth').classList.remove('hidden');
}

if (token) {
  loadDashboard();
} else {
  showTab('login');
}
