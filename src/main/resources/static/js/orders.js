
let myOrders = [];

async function loadMyOrders(){
  const user = JSON.parse(localStorage.getItem("ha_user") || "null");

  if(!user){
    showToast("Chưa đăng nhập", "Vui lòng đăng nhập để xem đơn hàng", "error");

    setTimeout(()=>{
      location.href = "/auth";
    },1000);

    return;
  }

  try{
    const res = await fetch(`${API_BASE}/orders/user/${user.userId}`);
    myOrders = await res.json();

    if(!res.ok){
      showToast("Lỗi", myOrders.message || "Không tải được đơn hàng", "error");
      return;
    }
    console.log(myOrders);
    renderOrders();

  }catch(e){
    console.error(e);
    showToast("Lỗi kết nối", "Không kết nối được backend", "error");
  }
}

function statusText(status){
  const map = {
    PENDING: "Chờ xác nhận",
    CONFIRMED: "Đã xác nhận",
    SHIPPING: "Đang giao",
    COMPLETED: "Hoàn thành",
    CANCELLED: "Đã hủy"
  };

  return map[status] || status || "Chờ xác nhận";
}

function statusClass(status){
  if(status === "COMPLETED") return "bg-green-50 text-green-700";
  if(status === "SHIPPING") return "bg-blue-50 text-blue-700";
  if(status === "CONFIRMED") return "bg-yellow-50 text-yellow-700";
  if(status === "CANCELLED") return "bg-red-50 text-red-700";
  return "bg-neutral-100 text-neutral-700";
}

function renderOrders(){
  const html = header() + `
    <main class="wrap py-12">

      <div class="mb-8">
        <p class="text-red-800 tracking-widest uppercase font-bold">
          HA Fashion Orders
        </p>

        <h1 class="serif text-5xl mt-2">
          Đơn hàng của tôi
        </h1>

        <p class="text-neutral-600 mt-3">
          Theo dõi trạng thái các đơn hàng bạn đã đặt.
        </p>
      </div>

      ${
        myOrders.length === 0
        ? `
          <div class="soft-card p-12 text-center">
            <h2 class="serif text-4xl">Bạn chưa có đơn hàng</h2>
            <p class="text-neutral-600 mt-3">Hãy chọn sản phẩm yêu thích và đặt hàng.</p>
            <a href="/products" class="inline-block mt-7 bg-red-800 text-white rounded-full px-8 py-3 font-bold">
              Mua sắm ngay
            </a>
          </div>
        `
        : `
          <div class="space-y-5">
            ${myOrders.map(order => orderCard(order)).join("")}
          </div>
        `
      }

    </main>
  ` + footer();

  renderApp(html);
}

function orderCard(order){
  return `
    <div class="soft-card p-6">

      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-5">

        <div>
          <h2 class="text-xl font-bold">
            Đơn hàng #${order.orderId}
          </h2>

          <p class="text-neutral-500 mt-1">
            Ngày đặt: ${order.createdAt ? new Date(order.createdAt).toLocaleString("vi-VN") : "Không rõ"}
          </p>
        </div>

        <span class="rounded-full px-4 py-2 font-bold ${statusClass(order.orderStatus)}">
          ${statusText(order.orderStatus)}
        </span>

      </div>

      <div class="grid md:grid-cols-3 gap-4 mt-5">

        <div>
          <p class="text-neutral-500">Địa chỉ nhận hàng</p>
          <b>${order.address || "Chưa có"}</b>
        </div>

        <div>
          <p class="text-neutral-500">Tạm tính</p>
          <b>${formatPrice(order.totalAmount)}</b>
        </div>

        <div>
          <p class="text-neutral-500">Tổng thanh toán</p>
          <b class="text-red-800">${formatPrice(order.finalAmount)}</b>
        </div>

      </div>

      <div class="mt-5 flex justify-end">
        <button onclick="toggleOrderItems(${order.orderId})"
          class="border rounded-full px-5 py-2 font-bold">
          Xem chi tiết
        </button>
      </div>

      <div id="order-items-${order.orderId}" class="hidden mt-5 border-t pt-5">
        ${
          order.items && order.items.length
          ? order.items.map((item,index)=>orderItemHtml(item,index)).join("")
          : `<p class="text-neutral-500">Không có sản phẩm trong đơn.</p>`
        }
      </div>

    </div>
  `;
}

function orderItemHtml(item,index){
  const v = item.variant;
  const p = v?.product;
  const img = p ? getProductImg(p,index) : fallbackImages[index % fallbackImages.length];

  return `
    <div class="grid grid-cols-[70px_1fr_120px] gap-4 items-center border-b py-4">

      <img src="${img}" class="w-16 h-20 object-cover rounded-xl border">

      <div>
        <b>${p?.productName || "Sản phẩm"}</b>
        <p class="text-sm text-neutral-500">
          Size: ${v?.size || "-"} · Màu: ${v?.color || "-"}
        </p>
        <p class="text-sm text-neutral-500">
          Số lượng: ${item.quantity}
        </p>
      </div>

      <b class="text-red-800">
        ${formatPrice(item.price || item.unitPrice)}
      </b>

    </div>
  `;
}

function toggleOrderItems(orderId){
  const box = document.getElementById(`order-items-${orderId}`);
  box.classList.toggle("hidden");
}

loadMyOrders();