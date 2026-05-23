const API_BASE = "http://localhost:8080/api";

let orders = [];

function money(v){
  return Number(v || 0).toLocaleString("vi-VN") + "đ";
}

function staff(){
  return JSON.parse(localStorage.getItem("ha_staff") || "null");
}

function checkStaff(){
  if(staff()){
    document.getElementById("staffLogin").classList.add("hidden");
    document.getElementById("staffDashboard").classList.remove("hidden");
    loadOrders();
  }
}

async function loginStaff(){
  const body = {
    email: document.getElementById("staffEmail").value.trim(),
    password: document.getElementById("staffPassword").value
  };

  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify(body)
  });

  const data = await res.json();

  if(!res.ok){
    document.getElementById("staffMsg").innerText = data.message || "Đăng nhập thất bại";
    return;
  }

  if(data.role !== "STAFF"){
    document.getElementById("staffMsg").innerText = "Tài khoản không có quyền Staff";
    return;
  }

  localStorage.setItem("ha_staff", JSON.stringify(data));
  checkStaff();
}

function logoutStaff(){
  localStorage.removeItem("ha_staff");
  location.href = "/staff";
}

async function loadOrders(){
  const res = await fetch(`${API_BASE}/orders`);
  orders = await res.json();

  renderOrders();
  renderStats();
}

function renderStats(){
  document.getElementById("totalOrders").innerText = orders.length;
  document.getElementById("pendingOrders").innerText =
    orders.filter(o => o.orderStatus === "PENDING").length;
  document.getElementById("shippingOrders").innerText =
    orders.filter(o => o.orderStatus === "SHIPPING").length;
  document.getElementById("completedOrders").innerText =
    orders.filter(o => o.orderStatus === "COMPLETED").length;
}

function renderOrders(){
  document.getElementById("orderBody").innerHTML = orders.map(o => `
    <tr class="border-t">
      <td class="p-4 font-bold">#${o.orderId}</td>
      <td>${o.user?.fullname || o.user?.email || "Khách hàng"}</td>
      <td class="max-w-[260px] text-sm text-neutral-600">${o.address || "Chưa có"}</td>
      <td class="text-red-800 font-bold">${money(o.finalAmount || o.totalAmount)}</td>

      <td>
        <select onchange="updateOrderStatus(${o.orderId}, this.value)"
          class="border rounded-full px-3 py-2 text-sm font-semibold">
          ${["PENDING","CONFIRMED","SHIPPING","COMPLETED","CANCELLED"].map(s => `
            <option value="${s}" ${o.orderStatus === s ? "selected" : ""}>${s}</option>
          `).join("")}
        </select>
      </td>

      <td>
        <button onclick="openOrderDetail(${o.orderId})"
          class="bg-black text-white rounded-full px-4 py-2 text-sm">
          Chi tiết
        </button>
      </td>
    </tr>
  `).join("");
}

async function updateOrderStatus(orderId, status){
  const res = await fetch(`${API_BASE}/orders/${orderId}/status?status=${status}`, {
    method: "PUT"
  });

  if(!res.ok){
    alert("Cập nhật trạng thái thất bại");
    return;
  }

  await loadOrders();
}

async function openOrderDetail(orderId){
  const res = await fetch(`${API_BASE}/orders/${orderId}`);
  const order = await res.json();

  document.getElementById("orderModal").classList.remove("hidden");
  document.getElementById("orderModal").classList.add("flex");

  document.getElementById("orderDetailContent").innerHTML = `
    <div class="grid md:grid-cols-2 gap-4 mb-6">
      <div class="border rounded-2xl p-4">
        <p class="text-neutral-500">Mã đơn</p>
        <b>#${order.orderId}</b>
      </div>

      <div class="border rounded-2xl p-4">
        <p class="text-neutral-500">Trạng thái</p>
        <b class="text-red-800">${order.orderStatus}</b>
      </div>

      <div class="border rounded-2xl p-4">
        <p class="text-neutral-500">Khách hàng</p>
        <b>${order.user?.fullname || order.user?.email}</b>
      </div>

      <div class="border rounded-2xl p-4">
        <p class="text-neutral-500">Tổng thanh toán</p>
        <b class="text-red-800">${money(order.finalAmount)}</b>
      </div>
    </div>

    <h3 class="font-bold text-xl mb-4">Sản phẩm trong đơn</h3>

    ${
      order.items?.length
      ? order.items.map(item => `
        <div class="border-b py-4">
          <b>${item.variant?.product?.productName || "Sản phẩm"}</b>
          <p class="text-sm text-neutral-500">
            Size: ${item.variant?.size || "-"} · Màu: ${item.variant?.color || "-"}
          </p>
          <p>Số lượng: ${item.quantity}</p>
          <p class="text-red-800 font-bold">${money(item.price)}</p>
        </div>
      `).join("")
      : `<p class="text-neutral-500">Không có sản phẩm</p>`
    }
  `;
}

function closeOrderDetail(){
  document.getElementById("orderModal").classList.add("hidden");
  document.getElementById("orderModal").classList.remove("flex");
}

checkStaff();