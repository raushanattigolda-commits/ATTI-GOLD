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
  event.preventDefault();

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

    await loadDashboard();
  } catch (error) {
    $("msg").textContent = error.message;
  }
}

async function register(event) {
  event.preventDefault();

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

    $("msg").textContent =
      "Registration successful. Referral Code: " +
      data.referralCode;

    showTab("login");
  } catch (error) {
    $("msg").textContent = error.message;
  }
}

async function loadDashboard() {
  try {
    const data = await api("/api/me");

    $("auth").classList.add("hidden");
    $("dashboard").classList.remove("hidden");

    if ($("balance")) {
      $("balance").textContent =
        "₹" + Number(data.wallet?.balance || 0).toFixed(2);
    }

    if ($("ref")) {
      $("ref").textContent =
        data.user?.referral_code || "-";
    }

    if ($("tx")) {
      $("tx").innerHTML = "";

      (data.transactions || []).forEach((item) => {
        const div = document.createElement("div");

        div.innerHTML = `
          <p>
            <strong>${item.type}</strong>
            — ₹${item.amount}
            — ${item.status}
          </p>
        `;

        $("tx").appendChild(div);
      });
    }

    await loadPlans();

  } catch (error) {
    localStorage.removeItem("ag_token");
    token = null;
  }
}

async function loadPlans() {
  try {
    const data = await api("/api/plans");

    const plans = Array.isArray(data)
      ? data
      : (data.plans || []);

    const box = $("plans");

    if (!box) return;

    box.innerHTML = "";

    plans.forEach((plan) => {
      const div = document.createElement("div");

      div.className = "plan-card";

      div.innerHTML = `
        <h3>${plan.name}</h3>
        <p>Amount: ₹${plan.amount}</p>
        <p>Duration: ${plan.duration_days} days</p>
        <button onclick="viewPlan(${plan.id})">
          View
        </button>
      `;

      box.appendChild(div);
    });

  } catch (error) {
    console.error(error);
  }
}

async function viewPlan(id) {
  try {
    const data = await api("/api/payment/order", {
      method: "POST",
      body: JSON.stringify({ planId: id })
    });

    if (!window.Razorpay) {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";

      await new Promise((resolve, reject) => {
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    const options = {
      key: data.keyId,
      amount: data.amount,
      currency: data.currency,
      name: "ATTI GOLD",
      description: data.planName,
      order_id: data.orderId,

      handler: async function (response) {
        try {
          const result = await api("/api/payment/verify", {
            method: "POST",
            body: JSON.stringify(response)
          });

          alert(
            "Payment successful!\n\n" +
            "Payment ID: " + result.paymentId
          );

          loadDashboard();

        } catch (error) {
          alert("Payment verification failed: " + error.message);
        }
      },

      theme: {
        color: "#d4af37"
      }
    };

    const payment = new Razorpay(options);

    payment.on("payment.failed", function (response) {
      alert(
        "Payment failed.\n\n" +
        (response.error?.description || "Please try again.")
      );
    });

    payment.open();

  } catch (error) {
    alert("Unable to start payment: " + error.message);
  }
}
  

async function withdraw(event) {
  event.preventDefault();

  try {
    const amount = Number($("wa").value);
    const method = $("wm").value.trim();
    const account = $("wacc").value.trim();

    if (!amount || amount <= 0) {
      throw new Error("Please enter a valid amount.");
    }

    if (!method || !account) {
      throw new Error("Please enter withdrawal details.");
    }

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
window.viewPlan = viewPlan;
window.logout = logout;

document.addEventListener("DOMContentLoaded", () => {
  if (token) {
    loadDashboard();
  } else {
    showTab("login");
  }
});
