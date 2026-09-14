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

async function login(event) {
  if (event) event.preventDefault();

  try {
    const mobile = $("lm").value.trim();
    const password = $("lp").value;

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
    await loadDashboard();

  } catch (error) {
    alert(error.message);
  }
}

async function register(event) {
  if (event) event.preventDefault();

  try {
    const name = $("rn").value.trim();
    const mobile = $("rm").value.trim();
    const password = $("rp").value;
    const referralCode = $("rr").value.trim();

    const data = await api("/api/register", {
      method: "POST",
      body: JSON.stringify({
        name,
        mobile,
        password,
        referralCode
      })
    });

    alert(data.message || "Registration successful");
    showTab("login");

  } catch (error) {
    alert(error.message);
  }
}

async function loadDashboard() {
  try {
    const data = await api("/api/me");

    $("auth").classList.add("hidden");
    $("dashboard").classList.remove("hidden");

    $("balance").textContent =
      "₹" + Number(data.wallet?.balance || 0).toFixed(2);

    $("ref").textContent =
      data.user?.referral_code || "-";

    const txBox = $("tx");

    if (txBox) {
      txBox.innerHTML = "";

      if (!data.transactions || data.transactions.length === 0) {
        txBox.textContent = "No transactions yet.";
      } else {
        data.transactions.forEach((tx) => {
          const div = document.createElement("div");
          div.textContent =
            `${tx.type} - ₹${tx.amount} - ${tx.status}`;
          txBox.appendChild(div);
        });
      }
    }

    await loadPlans();

  } catch (error) {
    localStorage.removeItem("ag_token");
    token = null;
    $("dashboard").classList.add("hidden");
    $("auth").classList.remove("hidden");
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
  alert(
    "Plan ID: " + id +
    "\nDemo mode: payment/order flow is not connected."
  );
}

async function withdraw(event) {
  if (event) event.preventDefault();

  try {
    const amount = Number($("wa").value);
    const method = $("wm").value.trim();
    const account = $("wacc").value.trim();

    const data = await api("/api/withdrawals", {
      method: "POST",
      body: JSON.stringify({
        amount,
        method,
        account
      })
    });

    alert(data.message || "Withdrawal request submitted");

    $("wa").value = "";
    $("wm").value = "";
    $("wacc").value = "";

    await loadDashboard();

  } catch (error) {
    alert(error.message);
  }
}

function logout() {
  localStorage.removeItem("ag_token");
  token = null;
  location.reload();
}

window.login = login;
window.register = register;
window.withdraw = withdraw;
window.logout = logout;
window.viewPlan = viewPlan;

document.addEventListener("DOMContentLoaded", () => {
  if (token) {
    loadDashboard();
  } else {
    showTab("login");
  }
});
