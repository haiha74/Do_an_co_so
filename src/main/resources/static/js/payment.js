const API_BASE = "http://localhost:8080/api";
let cart = null;

function getUser(){
  return JSON.parse(localStorage.getItem("ha_user") || "null");
}

function money(v){
  return Number(v || 0).toLocaleString("vi-VN") + "đ";
}

function productImg(p){
  if(p?.imageUrl) return p.imageUrl;
  if(p?.images && p.images.length > 0) return p.images[0].imageUrl;
  return "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?q=80&w=900&auto=format&fit=crop";
}

async function loadCart(){
  const user = getUser();

  if(!user){
    showToast("Lỗi", "Vui lòng đăng nhập", "error");
    location.href = "/auth";
    return;
  }

  const res = await fetch(`${API_BASE}/cart/${user.userId}`);
  cart = await res.json();

  if(!res.ok){
    showToast("Lỗi", cart.message || "Không tải được giỏ hàng", "error");
    location.href = "/cart";
    return;
  }

  if(!cart.items || cart.items.length === 0){
    showToast("Thông báo", "Giỏ hàng trống", "error");
    location.href = "/cart";
    return;
  }

  renderPayment();
}

function renderPayment(){
  const user = getUser();
  const items = cart.items || [];
  let subtotal = 0;

  const itemHtml = items.map(item => {
    const v = item.variant;
    const p = v.product;
    const price = Number(v.price || p.basePrice || 0);
    const line = price * item.quantity;
    subtotal += line;

    return `
      <div class="flex gap-4 border-b pb-4">
        <img src="${productImg(p)}" class="w-20 h-24 object-cover rounded-xl">

        <div class="flex-1">
          <b>${p.productName}</b>
          <p class="text-sm text-neutral-500">
            Size: ${v.size} · Màu: ${v.color}
          </p>
          <p>Số lượng: ${item.quantity}</p>
        </div>

        <b class="text-red-800">${money(line)}</b>
      </div>
    `;
  }).join("");

  const shipping = subtotal >= 999000 ? 0 : 30000;
  const total = subtotal + shipping;

  document.getElementById("app").innerHTML = `
    <div class="max-w-6xl mx-auto px-6 py-10">

      <h1 class="text-5xl font-serif mb-8">
        Thanh toán
      </h1>

      <div class="grid lg:grid-cols-[1fr_420px] gap-8">

        <div class="bg-white rounded-3xl p-8 shadow">
          <h2 class="text-2xl font-bold mb-5">
            Thông tin nhận hàng
          </h2>

          <div class="space-y-4">

            <input
              id="fullname"
              class="w-full border rounded-2xl px-5 py-4"
              placeholder="Họ và tên"
              value="${user.fullname || ""}"
            >

            <input
              id="phone"
              class="w-full border rounded-2xl px-5 py-4"
              placeholder="Số điện thoại"
              value="${user.phone || ""}"
            >

            <textarea
              id="address"
              class="w-full border rounded-2xl px-5 py-4 h-32"
              placeholder="Địa chỉ nhận hàng"
            >${user.address || ""}</textarea>

            <h3 class="font-bold text-xl pt-4">
              Phương thức thanh toán
            </h3>

            <label class="block border rounded-2xl p-4 cursor-pointer">
              <input type="radio" name="paymentMethod" value="CASH" checked>
              Thanh toán khi nhận hàng
            </label>

            <label class="block border rounded-2xl p-4 cursor-pointer">
              <input type="radio" name="paymentMethod" value="QR">
              Chuyển khoản QR Code
            </label>

            <div id="qrBox" class="hidden border rounded-2xl p-5 bg-neutral-50">
              <p class="font-bold mb-2">Thông tin chuyển khoản</p>
              <p>Ngân hàng: MB Bank</p>
              <p>STK: 0123456789</p>
              <p>Chủ TK: HA FASHION</p>
              <p>Nội dung: THANHTOAN HAFASHION</p>
            </div>

          </div>
        </div>

        <div class="bg-white rounded-3xl p-8 shadow h-fit">

          <h2 class="text-2xl font-bold mb-5">
            Đơn hàng
          </h2>

          <div class="space-y-4 mb-6">
            ${itemHtml}
          </div>

          <div class="border-t pt-5 space-y-3">

            <div class="flex justify-between">
              <span>Tạm tính</span>
              <b>${money(subtotal)}</b>
            </div>

            <div class="flex justify-between">
              <span>Phí vận chuyển</span>
              <b>${shipping === 0 ? "Miễn phí" : money(shipping)}</b>
            </div>

            <div class="flex justify-between text-xl">
              <span class="font-bold">Tổng cộng</span>
              <b class="text-red-800">${money(total)}</b>
            </div>

          </div>

          <button
            onclick="submitPayment()"
            class="mt-7 w-full bg-red-800 text-white rounded-full py-4 font-bold"
          >
            Xác nhận đặt hàng
          </button>

          <a
            href="/cart"
            class="block text-center mt-4 border rounded-full py-3 font-bold"
          >
            Quay lại giỏ hàng
          </a>

        </div>
      </div>
    </div>
  `;

  document.addEventListener("change", e => {
    if(e.target.name === "paymentMethod"){
      document
        .getElementById("qrBox")
        .classList
        .toggle("hidden", e.target.value !== "QR");
    }
  });
}

async function submitPayment(){
  const user = getUser();

  const fullname = document.getElementById("fullname").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const address = document.getElementById("address").value.trim();

  const paymentMethod =
    document.querySelector("input[name='paymentMethod']:checked").value;

  if(!fullname || !phone || !address){
    showToast("Thiếu thông tin", "Vui lòng nhập đầy đủ thông tin", "error");
    return;
  }

  const res = await fetch(`${API_BASE}/orders/checkout`, {
    method: "POST",
    headers: {
      "Content-Type":"application/json"
    },
    body: JSON.stringify({
      userId: user.userId,
      fullname,
      phone,
      address,
      paymentMethod
    })
  });

  const data = await res.json();

  if(!res.ok){
    showToast("Lỗi", data.message || "Đặt hàng thất bại", "error");
    return;
  }

  if(paymentMethod === "QR"){
    showToast(
        "Đặt hàng thành công",
        "Đơn đang chờ thanh toán QR",
        "success"
        );
  }else{
    showToast(
        "Đặt hàng thành công",
        "Thanh toán khi nhận hàng",
        "success"
        );
  }

  setTimeout(()=>{
  location.href = "/orders";
    },1500);
    }

loadCart();



function showToast(title, text, type = "success"){
  const old = document.getElementById("toast");
  if(old) old.remove();

  const toast = document.createElement("div");
  toast.id = "toast";
  toast.className = `toast ${type === "error" ? "toast-error" : "toast-success"}`;

  toast.innerHTML = `
    <div class="toast-icon">${type === "error" ? "!" : "✓"}</div>
    <div>
      <div class="toast-title">${title}</div>
      <div class="toast-text">${text}</div>
    </div>
  `;

  document.body.appendChild(toast);
  setTimeout(()=>toast.remove(),2500);
}