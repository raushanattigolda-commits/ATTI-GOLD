let token = localStorage.getItem("ag_token");

const $ = (id) => document.getElementById(id);

function showTab(type) {
  $("login").classList.toggle("hidden", type !== "login");
  $("register").classList.toggle("hidden", type !== "register");
}

window.showTab = showTab;

async function api(url, options = {}) {
  options.headers = {
    ...(options.headers || {}),
    "Content-Type": "application/json",
    ...(token ? { Authorization: "Bearer " + token } : {})
  };

  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data;
}

async function registerUser() {
  try {
    const fullName = $("regName").value.trim();
    const mobile = $("regMobile").value.trim();
    const password = $("regPassword").value;
    const inviteCode = $("regInvite").value.trim();

    const data = await api("/api/register", {
      method: "POST",
      body: JSON.stringify({
        fullName,
        mobile,
        password,
        inviteCode
      })
    });

    alert(data.message || "Registration successful");
    showTab("login");
  } catch (error) {
    alert(error.message);
  }
}

async function loginUser() {
  try {
    const mobile = $("loginMobile").value.trim();
    const password = $("loginPassword").value;

    const data = await api("/api/login", {
      method: "POST",
      body: JSON.stringify({
        mobile,
        password
      })
    });

    token = data.token;
    localStorage.setItem("ag_token", token);

    alert("Login successful");
    loadDashboard();
  } catch (error) {
    alert(error.message);
  }
}

async function loadDashboard() {
  try {
    const data = await api("/api/me");

    if ($("authArea")) $("authArea").classList.add("hidden");
    if ($("dashboard")) $("dashboard").classList.remove("hidden");

    if ($("userName")) {
      $("userName").textContent = data.user.full_name || data.user.mobile;
    }

    if ($("balance")) {
      $("balance").textContent = "₹" + Number(data.wallet.balance || 0).toFixed(2);
    }

    loadPlans();
  } catch (error) {
    localStorage.removeItem("ag_token");
    token = null;
  }
}

async function loadPlans() {
  try {
    const data = await api("/api/plans");

    const box = $("plans");
    if (!box) return;

    box.innerHTML = "";

    data.plans.forEach((plan) => {
      const div = document.createElement("div");
      div.className = "plan-card";

      div.innerHTML = `
        <h3>${plan.name}</h3>
        <p>Amount: ₹${plan.amount}</p>
        <p>Duration: ${plan.duration_days} days</p>
        <button onclick="viewPlan(${plan.id})">View</button>
      `;

      box.appendChild(div);
    });
  } catch (error) {
    console.error(error);
  }
}

function viewPlan(id) {
  alert("Plan ID: " + id + "\nDemo mode: payment/order flow is not connected.");
}

async function withdrawMoney() {
  try {
    const amount = Number($("withdrawAmount").value);

    if (!amount || amount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    const data = await api("/api/withdrawals", {
      method: "POST",
      body: JSON.stringify({ amount })
    });

    alert(data.message || "Withdrawal request submitted");
    loadDashboard();
  } catch (error) {
    alert(error.message);
  }
}

function logoutUser() {
  localStorage.removeItem("ag_token");
  token = null;
  location.reload();
}

window.registerUser = registerUser;
window.loginUser = loginUser;
window.withdrawMoney = withdrawMoney;
window.viewPlan = viewPlan;
window.logoutUser = logoutUser;

document.addEventListener("DOMContentLoaded", () => {
  if (token) {
    loadDashboard();
  } else {
    showTab("login");
  }
});
