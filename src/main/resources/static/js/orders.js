let myOrders = [];
let orderLimit = 10;
let orderSort = "newest";
let orderPeriod = "";
let reviews = [];

async function loadMyOrders(){
  await checkPayOSReturn();
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
    try{
    const reviewRes = await fetch(`${API_BASE}/reviews`);

    if(reviewRes.ok){
      const data = await reviewRes.json();
      reviews = Array.isArray(data) ? data : [];
    }else{
      reviews = [];
    }
  }catch(e){
    reviews = [];
  }

  console.log(myOrders);
  renderOrders();

  }catch(e){
    console.error(e);
    showToast("Lỗi kết nối", "Không kết nối được backend", "error");
  }
}

async function checkPayOSReturn(){
  const params = new URLSearchParams(location.search);

  const status = params.get("status");
  const orderCode = params.get("orderCode");

  if(status === "PAID" && orderCode){
    await fetch(`${API_BASE}/orders/${orderCode}/paid`, {
      method: "PUT"
    });

    history.replaceState(null, "", "/orders");
  }
}

function statusText(status){
  const map = {
    PENDING: "Chờ xác nhận",
    PENDING_PAYMENT: "Chờ thanh toán PayOS",
    CONFIRMED: "Đã xác nhận",
    SHIPPING: "Đang giao",
    COMPLETED: "Hoàn thành",
    CANCELLED: "Đã hủy",
    PAID: "Đã thanh toán",
  };

  return map[status] || status || "Chờ xác nhận";
}

function statusClass(status){
  if(status === "PAID") return "bg-green-50 text-green-700";
  if(status === "COMPLETED") return "bg-green-50 text-green-700";
  if(status === "SHIPPING") return "bg-blue-50 text-blue-700";
  if(status === "CONFIRMED") return "bg-yellow-50 text-yellow-700";
  if(status === "CANCELLED") return "bg-red-50 text-red-700";
  return "bg-neutral-100 text-neutral-700";
}

function renderOrders(){
  let filteredOrders = [...myOrders];
  
  if(orderPeriod){
  filteredOrders = filteredOrders.filter(o =>
    o.createdAt &&
    new Date(o.createdAt).toISOString().slice(0,10) === orderPeriod
  );
}

  filteredOrders.sort((a,b)=>{
    const da = new Date(a.createdAt || 0);
    const db = new Date(b.createdAt || 0);
    return orderSort === "oldest" ? da - db : db - da;
  });

  const html = header() + `
    <main class="wrap py-12">

      <div class="mb-8">
        <p class="text-red-800 tracking-widest uppercase font-bold">
          JODOK Orders
        </p>

        <h1 class="serif text-5xl mt-2">
          Đơn hàng của tôi
        </h1>

        <p class="text-neutral-600 mt-3">
          Theo dõi trạng thái các đơn hàng bạn đã đặt.
        </p>
      </div>

      <div class="soft-card p-5 mb-6 flex flex-col lg:flex-row gap-3">

      <select onchange="changeOrderSort(this.value)"
        class="border rounded-full px-5 py-3">

        <option value="newest"
          ${orderSort === "newest" ? "selected" : ""}>
          Mới nhất
        </option>

        <option value="oldest"
          ${orderSort === "oldest" ? "selected" : ""}>
          Cũ nhất
        </option>

      </select>

      <input
        type="date"
        value="${orderPeriod}"
        onchange="changeOrderPeriod(this.value)"
        class="border rounded-full px-5 py-3"
      >

      <button
        onclick="resetOrderFilter()"
        class="border rounded-full px-5 py-3 font-bold">

        Xóa lọc

      </button>

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
          <div class="max-h-[700px] overflow-y-auto pr-2 custom-scroll space-y-5">
            ${filteredOrders.slice(0, orderLimit).map(order => orderCard(order)).join("")}
          </div>

          <div class="text-center mt-8 flex justify-center gap-4">

  ${
    filteredOrders.length > orderLimit
    ? `
      <button onclick="showMoreOrders()"
        class="border rounded-full px-8 py-3 font-bold hover:bg-black hover:text-white transition">
        Xem thêm
      </button>
    `
    : ""
  }

  ${
    orderLimit > 10
    ? `
      <button onclick="hideOrders()"
        class="border rounded-full px-8 py-3 font-bold hover:bg-red-800 hover:text-white transition">
        Ẩn bớt
      </button>
    `
    : ""
  }

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

        <div class="flex items-end justify-between gap-4">

        <div>
          <p class="text-neutral-500">
            ${order.orderStatus === "PAID"
              ? "Đã thanh toán"
              : "Tổng thanh toán"}
          </p>
          <b class="text-red-800">${formatPrice(order.finalAmount)}</b>
        </div>

        <button onclick="toggleOrderItems(${order.orderId})"
          class="border rounded-full px-5 py-2 font-bold hover:bg-black hover:text-white transition">
          Xem chi tiết
        </button>

      </div>

      </div>

      <div id="order-items-${order.orderId}" class="hidden mt-5 border-t pt-5">
        ${
          order.items && order.items.length
          ? order.items.map((item,index)=>orderItemHtml(item,index, order)).join("")
          : `<p class="text-neutral-500">Không có sản phẩm trong đơn.</p>`
        }
      </div>

    </div>
  `;
}

function orderItemHtml(item,index, order){
  const v = item.variant;
  const p = v?.product;
  const img = p ? getProductImg(p,index) : fallbackImages[index % fallbackImages.length];

  const orderItemId = String(item.orderItemId || item.id || index);

  const reviewed = Array.isArray(reviews) && reviews.some(r =>
    String(r.orderItem?.orderItemId) === orderItemId
  );

  const reviewUrl =
    `/detail?productId=${p?.productId}` +
    `${reviewed ? "" : "&review=1"}` +
    `&orderItemId=${orderItemId}` +
    `&size=${encodeURIComponent(v?.size || "")}` +
    `&color=${encodeURIComponent(v?.color || "")}`;

  return `
    <div class="grid grid-cols-[70px_1fr_120px] gap-4 items-center border-b py-4">

      <img src="${img}" class="w-16 h-20 object-cover rounded-xl border">

      <div>
        <b onclick="location.href='/detail?productId=${p?.productId}'"
          class="cursor-pointer hover:text-red-800">
          ${p?.productName || "Sản phẩm"}
        </b>

        <p class="text-sm text-neutral-500">
          Size: ${v?.size || "-"} · Màu: ${v?.color || "-"}
        </p>

        <p class="text-sm text-neutral-500">
          Số lượng: ${item.quantity}
        </p>

        ${
          order.orderStatus === "COMPLETED"
          ? `
            <button
              onclick="location.href='${reviewUrl}'"
              class="block mt-3 ${reviewed ? "bg-black" : "bg-red-800"} text-white rounded-full px-5 py-2 text-sm font-bold w-fit">
              ${reviewed ? "Xem đánh giá" : "Đánh giá"}
            </button>
          `
          : ""
        }
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

function showMoreOrders(){
  orderLimit += 10;
  renderOrders();
}


function hideOrders(){
  orderLimit = 10;
  renderOrders();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function changeOrderSort(value){
  orderSort = value;
  orderLimit = 10;
  renderOrders();
}

function changeOrderPeriod(value){
  orderPeriod = value;
  orderLimit = 10;
  renderOrders();
}

function resetOrderFilter(){
  orderSort = "newest";
  orderPeriod = "";
  orderLimit = 10;
  renderOrders();
}
loadMyOrders();