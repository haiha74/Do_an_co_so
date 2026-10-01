const API_BASE = "http://localhost:8080/api";
// const fallbackImages = [
//   "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?q=80&w=900&auto=format&fit=crop",
//   "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?q=80&w=900&auto=format&fit=crop",
//   "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=900&auto=format&fit=crop",
//   "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?q=80&w=900&auto=format&fit=crop"
// ];

let products = [];
let categories = [];
let users = [];
let orders = [];
let variants = [];
let brands = [];
let brandStatusFilter = "ALL";
let brandSort = "newest";
let vouchers = [];
let reviews = [];
let reviewPage = 1;
const REVIEW_PAGE_SIZE = 10;
let currentTab = "overview";

let productPage = 1;
let productPageSize = 10;

// ===============================
// VARIANT
// ===============================
let variantPage = 1;
let variantPageSize = 5;
let variantProductFilter = "ALL";

let productCategoryFilter = "";
let productBrandFilter = "";
let productStatusFilter = "";
let overviewPeriod = "7";
let overviewFrom = "";
let overviewTo = "";
let selectedFiles = [];
let selectedCategoryFile = null;
let confirmCallback = null;
let orderLimit = 10;
let orderSort = "newest";
let orderDate = "";
let orderStatusFilter = "ALL";
let orderPaymentFilter = "ALL";
let orderFromDate = "";
let orderToDate = "";
let adminSearch = {
  products: "",
  categories: "",
  categoryStatus: "ALL",
  categorySort: "newest",
  brands: "",
  variants: "",
  promo: "",
  orders: "",
  users: "",
  reviews: ""
};

let reportFrom = "";
let reportTo = "";

function icon(n, cls="w-5 h-5"){return `<i data-lucide="${n}" class="${cls}"></i>`}
function money(v){
  return Math.round(Number(v || 0)).toLocaleString("vi-VN") + "đ";
}
function isVoucherExpired(v){
  if(!v.endDate) return false;
  return new Date(v.endDate + "T23:59:59") < new Date();
}

function adminAuthHeaders(){
  const admin = JSON.parse(
    localStorage.getItem("ha_admin") || "null"
  );

  if(!admin?.token){
    console.warn("ADMIN TOKEN KHÔNG TỒN TẠI");
    return {};
  }

  return {
    "Authorization": "Bearer " + admin.token
  };
}

function adminJsonHeaders(){
  return {
    "Content-Type": "application/json",
    ...adminAuthHeaders()
  };
}

function voucherStatusText(v){
  if(isVoucherExpired(v)) return "Hết hạn";
  if(v.status === "ACTIVE") return "Đang hoạt động";
  return "Tạm ẩn";
}
function admin(){return JSON.parse(localStorage.getItem("ha_admin") || "null")}
function showToast(
  title,
  message = "",
  type = "success"
){
  const old =
    document.getElementById(
      "adminToast"
    );

  if(old){
    old.remove();
  }


  const color =
    type === "error"
      ? "border-red-800"
      : "border-green-700";


  const safeTitle =
    title == null
      ? "Thông báo"
      : String(title);


  const safeMessage =
    message == null
      ? ""
      : String(message);


  const toast =
    document.createElement("div");


  toast.id =
    "adminToast";


  toast.className = `
    fixed top-6 right-6 z-[9999]
    bg-white
    border-l-8
    ${color}
    rounded-2xl
    shadow-2xl
    px-6 py-4
    min-w-[320px]
    max-w-[520px]
  `;


  toast.innerHTML = `
    <b class="block text-lg">
      ${escapeHtml(safeTitle)}
    </b>

    ${
      safeMessage
        ? `
          <p
            class="
              text-sm
              text-neutral-600
              mt-1
              break-words
            "
          >
            ${escapeHtml(safeMessage)}
          </p>
        `
        : ""
    }
  `;


  document.body.appendChild(
    toast
  );


  setTimeout(
    () => {
      toast.remove();
    },
    type === "error"
      ? 6000
      : 3000
  );
}

function showConfirm(message, onConfirm, confirmText = "Xóa"){
  confirmCallback = onConfirm;

  const old = document.getElementById("adminConfirmModal");
  if(old) old.remove();

  const modal = document.createElement("div");
  modal.id = "adminConfirmModal";
  modal.className = "fixed inset-0 bg-black/40 z-[9999] flex items-center justify-center p-5";

  modal.innerHTML = `
    <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md p-7">
      <h2 class="serif text-3xl mb-3">Xác nhận</h2>
      <p class="text-neutral-600 mb-7">${message}</p>

      <div class="flex justify-end gap-3">
        <button onclick="closeConfirm()"
          class="border rounded-full px-6 py-3 font-bold">
          Hủy
        </button>

        <button onclick="confirmAction()"
          class="bg-red-800 text-white rounded-full px-6 py-3 font-bold">
          ${confirmText}
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
}

function closeConfirm(){
  const modal = document.getElementById("adminConfirmModal");
  if(modal) modal.remove();
  confirmCallback = null;
}

function confirmAction(){
  if(confirmCallback){
    confirmCallback();
  }
  closeConfirm();
}

function adminToolbar(type, title, btnText, btnAction){
  return `
    <div class="px-6 py-4 border-b flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <h2 class="font-bold text-xl">${title}</h2>

      <div class="flex gap-3 w-full lg:w-auto">
        <input
          data-search="${type}"
          value="${adminSearch[type] || ""}"
          oninput="searchAdmin('${type}', this.value)"
          class="border rounded-full px-5 py-3 w-full lg:w-80 outline-none"
          placeholder="Tìm kiếm..."
        >

        <button onclick="${btnAction}"
          class="bg-red-800 text-white rounded-full px-6 py-3 font-bold whitespace-nowrap">
          + ${btnText}
        </button>
      </div>
    </div>
  `;
}

function searchAdmin(type, value){
  adminSearch[type] = value.toLowerCase();

  setTimeout(() => {
    render();

    setTimeout(() => {
      const input = document.querySelector(`input[data-search="${type}"]`);
      if(input){
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      }
    }, 0);
  }, 0);
}

function changeOrderSort(value){
  orderSort = value;
  orderLimit = 10;
  render();
}

function changeOrderDate(value){
  orderDate = value;
  orderLimit = 10;
  render();
}


function searchOrderAdmin(value){
  adminSearch.orders = value.toLowerCase();
  orderLimit = 10;

  setTimeout(() => {
    render();

    setTimeout(() => {
      const input = document.querySelector(`input[data-search="orders"]`);
      if(input){
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      }
    }, 0);
  }, 0);
}

function showMoreAdminOrders(){
  orderLimit += 10;
  render();
}

function hideLessAdminOrders(){
  orderLimit = Math.max(10, orderLimit - 10);
  render();
}

function productImg(p, i) {
  if (p?.imageUrl) {
    return p.imageUrl;
  }

  if (Array.isArray(p?.images) && p.images.length > 0) {
    const sorted = [...p.images].sort((a, b) =>
      Number(b.imageId || b.image_id || 0) -
      Number(a.imageId || a.image_id || 0)
    );

    const mainImg = sorted.find(img =>
      img.isMain == true ||
      img.isMain == 1 ||
      img.is_main == true ||
      img.is_main == 1
    );

    const img = mainImg || sorted[0];

    return img?.imageUrl || "/images/no-image.png";
  }

  return "/images/no-image.png";
}

function productHasVariant(productId){
  const id = Number(productId);

  if(!id){
    return false;
  }

  return variants.some(v => {
    const variantProductId =
      v?.product?.productId ??
      v?.productId ??
      v?.product_id;

    return Number(variantProductId) === id;
  });
}
function getActiveBrand(product){
  const brandId =
    product?.brand?.brandId ??
    product?.brandId ??
    product?.brand_id;

  if(!brandId){
    return null;
  }

  const brand = brands.find(
    b => String(b.brandId) === String(brandId)
  );

  if(!brand){
    return null;
  }

  if(String(brand.status || "").toUpperCase() !== "ACTIVE"){
    return null;
  }

  return brand;
}

function getActiveBrandName(product){
  const brand = getActiveBrand(product);

  return brand?.brandName || "";
}
async function fetchJson(url){
  const res = await fetch(url, {
    headers: adminAuthHeaders()
  });

  /*
   * 401 = token không hợp lệ / hết hạn.
   *
   * Chỉ trường hợp này mới xóa phiên đăng nhập.
   */
  if(res.status === 401){
    console.error(
      "ADMIN AUTH 401:",
      url
    );

    localStorage.removeItem("ha_admin");

    throw new Error(
      "Phiên đăng nhập đã hết hạn"
    );
  }

  if(res.status === 403){
    const text = await res.text();

    console.error(
      "ADMIN API 403:",
      {
        url: url,
        status: res.status,
        response: text
      }
    );

    throw new Error(
      text ||
      `Không có quyền truy cập API: ${url}`
    );
  }

  if(!res.ok){
    const text = await res.text();

    console.error(
      "API lỗi:",
      {
        url: url,
        status: res.status,
        response: text
      }
    );

    throw new Error(
      text ||
      `API lỗi HTTP ${res.status}`
    );
  }

  return res.json();
}
async function safeFetch(url, fallback = []) {
  try {
    const data = await fetchJson(url);
    return data ?? fallback;
  } catch (e) {
    console.error("LOAD FAILED:", url, e);
    return fallback;
  }
}
async function loadData() {
  const [
    productsData,
    categoriesData,
    usersData,
    ordersData,
    variantsData,
    brandsData,
    vouchersData,
    reviewsData
  ] = await Promise.all([
    safeFetch(`${API_BASE}/products?all=true`, []),
    safeFetch(`${API_BASE}/categories`, []),
    safeFetch(`${API_BASE}/users`, []),
    safeFetch(`${API_BASE}/orders`, []),
    safeFetch(`${API_BASE}/variants`, []),
    safeFetch(`${API_BASE}/brands`, []),
    safeFetch(`${API_BASE}/vouchers`, []),
    safeFetch(`${API_BASE}/reviews`, [])
  ]);

  products = productsData;
  categories = categoriesData;
  users = usersData;
  orders = ordersData;
  variants = variantsData;
  brands = brandsData;
  vouchers = vouchersData;
  reviews = reviewsData;

  console.log("ADMIN DATA LOADED:", {
    products: products.length,
    categories: categories.length,
    users: users.length,
    orders: orders.length,
    variants: variants.length,
    brands: brands.length,
    vouchers: vouchers.length,
    reviews: reviews.length
  });
}

function loginPage(){
  return `<main class="min-h-screen grid lg:grid-cols-[1fr_520px]">
    <section class="px-10 lg:px-20 flex items-center">
      <div>
        <p class="text-red-800 tracking-[.18em] uppercase font-bold mb-5">JODOK Admin</p>
        <h1 class="serif text-6xl leading-tight mb-5">Đăng nhập quản trị</h1>
        <p class="text-neutral-600 text-xl max-w-2xl">Quản lý sản phẩm, danh mục, đơn hàng, người dùng, khuyến mãi và báo cáo hệ thống.</p>
      </div>
    </section>
    <section class="bg-white border-l flex items-center justify-center px-8 py-12">
      <div class="soft-card p-8 w-full max-w-md">
        <h2 class="serif text-4xl text-center mb-7">Admin Login</h2>
        <div class="space-y-4">
          <input id="adminEmail" class="input-ui" placeholder="Email admin">
          <input id="adminPassword" type="password" class="input-ui" placeholder="Mật khẩu">
          <button onclick="loginAdmin()" class="btn-primary w-full">Đăng nhập</button>
        </div>
        <p id="adminMsg" class="text-center mt-4 text-red-800 font-semibold text-sm"></p>
        <a href="/" class="block text-center mt-5 text-neutral-500 hover:text-red-800">← Quay lại shop</a>
      </div>
    </section>
  </main>`;
}



function overviewDateKey(value) {
  if (!value) return "";

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function overviewDaysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return overviewDateKey(d);
}

function overviewRange() {
  if (overviewPeriod === "custom") {
    return {
      from: overviewFrom,
      to: overviewTo
    };
  }

  const days = Number(overviewPeriod) || 7;

  return {
    from: overviewDaysAgo(days - 1),
    to: overviewDaysAgo(0)
  };
}

function overviewFilteredOrders() {
  const { from, to } = overviewRange();

  return orders.filter(o => {
    const day = overviewDateKey(o.createdAt);

    if (!day) return false;
    if (from && day < from) return false;
    if (to && day > to) return false;

    return true;
  });
}

function changeOverviewPeriod(value) {
  overviewPeriod = value;

  if (value !== "custom") {
    overviewFrom = "";
    overviewTo = "";
  }

  render();
}

function changeOverviewDates() {
  overviewPeriod = "custom";
  overviewFrom = document.getElementById("overviewFrom")?.value || "";
  overviewTo = document.getElementById("overviewTo")?.value || "";

  render();
}

function overviewStatusInfo(status) {
  const map = {
    PENDING: ["Chờ xác nhận", "pending", "#f5b43c"],
    PENDING_PAYMENT: ["Chờ thanh toán PayOS", "pending", "#f59e0b"],
    PAID: ["Đã thanh toán", "processing", "#3b82f6"],
    CONFIRMED: ["Đã xác nhận", "processing", "#60a5fa"],
    SHIPPING: ["Đang giao", "shipping", "#9061d8"],
    COMPLETED: ["Hoàn thành", "delivered", "#12a05c"],
    CANCELLED: ["Đã hủy", "cancelled", "#b91c1c"]
  };

  return map[status] || [status || "Không rõ", "pending", "#9ca3af"];
}

function statCards() {
  const list = overviewFilteredOrders();

  const revenue = list
    .filter(o => o.orderStatus !== "CANCELLED")
    .reduce((sum, o) => sum + Number(o.finalAmount || 0), 0);

  const cards = [
    {
      label: "Tổng đơn hàng",
      value: list.length.toLocaleString("vi-VN"),
      icon: "shopping-cart",
      note: "Trong khoảng thời gian đã chọn"
    },
    {
      label: "Doanh thu",
      value: money(revenue),
      icon: "circle-dollar-sign",
      note: "Không gồm đơn đã hủy",
      revenue: true
    },
    {
      label: "Người dùng",
      value: users.length.toLocaleString("vi-VN"),
      icon: "users",
      note: "Tổng tài khoản hệ thống"
    },
    {
      label: "Sản phẩm",
      value: products.length.toLocaleString("vi-VN"),
      icon: "shopping-bag",
      note: "Tổng sản phẩm đang quản lý"
    }
  ];

  return `
    <div class="admin-kpi-grid">
      ${cards.map(c => `
        <div class="soft-card admin-kpi-card">
          <div class="admin-kpi-icon">
            ${icon(c.icon)}
          </div>

          <div class="admin-kpi-body">
            <p class="admin-kpi-label">${c.label}</p>

            <h3 class="admin-kpi-value ${c.revenue ? "revenue" : ""}">
              ${c.value}
            </h3>

            <p class="admin-kpi-change">
              ${c.note}
            </p>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

function overviewRevenueChart(list) {
  const { from, to } = overviewRange();
  const totals = {};

  list.forEach(o => {
    if (o.orderStatus === "CANCELLED") return;

    const day = overviewDateKey(o.createdAt);

    totals[day] = (totals[day] || 0)
      + Number(o.finalAmount || 0);
  });

  const dates = [];

  if (from && to && from <= to) {
    const cursor = new Date(from + "T12:00:00");
    const end = new Date(to + "T12:00:00");

    while (cursor <= end && dates.length < 366) {
      dates.push(overviewDateKey(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
  } else {
    dates.push(...Object.keys(totals).sort());
  }

  if (!dates.length) {
    return `
      <div class="admin-revenue-chart flex items-center justify-center text-neutral-400">
        Chưa có dữ liệu doanh thu
      </div>
    `;
  }

  const values = dates.map(day => totals[day] || 0);
  const max = Math.max(...values, 1);

  const W = 700;
  const H = 215;
  const left = 70;
  const right = 15;
  const top = 12;
  const bottom = 31;

  const plotW = W - left - right;
  const plotH = H - top - bottom;

  const points = values.map((value, index) => {
    const x = left + (
      dates.length === 1
        ? plotW / 2
        : index * plotW / (dates.length - 1)
    );

    const y = top + plotH - (value / max) * plotH;

    return { x, y, value, day: dates[index] };
  });

  const line = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const area = `
    ${line}
    L ${points[points.length - 1].x} ${top + plotH}
    L ${points[0].x} ${top + plotH}
    Z
  `;

  const ticks = Array.from({ length: 5 }, (_, i) => {
    const value = max * i / 4;
    const y = top + plotH - i * plotH / 4;

    return `
      <line x1="${left}" y1="${y}" x2="${W - right}" y2="${y}"
        stroke="#e8e8eb" stroke-width="1"/>

      <text x="${left - 9}" y="${y + 4}"
        text-anchor="end" fill="#667085" font-size="10">
        ${Math.round(value).toLocaleString("vi-VN")}
      </text>
    `;
  }).join("");

  const step = Math.max(1, Math.ceil(dates.length / 7));

  const labels = points.map((p, i) => {
    if (i % step !== 0 && i !== points.length - 1) return "";

    return `
      <text x="${p.x}" y="${H - 8}"
        text-anchor="middle" fill="#667085" font-size="10">
        ${p.day.slice(8)}/${p.day.slice(5, 7)}
      </text>
    `;
  }).join("");

  return `
    <div class="admin-revenue-chart">
      <svg viewBox="0 0 ${W} ${H}"
        preserveAspectRatio="none"
        role="img"
        aria-label="Biểu đồ doanh thu theo ngày">

        <defs>
          <linearGradient id="overviewRevenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#b91c1c" stop-opacity=".19"/>
            <stop offset="100%" stop-color="#b91c1c" stop-opacity=".015"/>
          </linearGradient>
        </defs>

        ${ticks}

        <path d="${area}" fill="url(#overviewRevenueFill)"/>

        <path d="${line}" fill="none"
          stroke="#a31515" stroke-width="2.5"
          stroke-linejoin="round" stroke-linecap="round"/>

        ${points.map(p => `
          <circle cx="${p.x}" cy="${p.y}" r="3"
            fill="#a31515" stroke="#fff" stroke-width="1">
            <title>${p.day}: ${money(p.value)}</title>
          </circle>
        `).join("")}

        ${labels}
      </svg>
    </div>
  `;
}

function overviewDonutChart(list) {
  const statuses = [
    "PENDING",
    "PENDING_PAYMENT",
    "PAID",
    "CONFIRMED",
    "SHIPPING",
    "COMPLETED",
    "CANCELLED"
  ];

  const total = list.length;

  const data = statuses.map(status => {
    const [label, cls, color] = overviewStatusInfo(status);

    return {
      label,
      cls,
      color,
      count: list.filter(o => o.orderStatus === status).length
    };
  });

  let current = 0;

  const segments = data.map(item => {
    const start = current;
    const percent = total ? item.count / total * 100 : 0;

    current += percent;

    return `${item.color} ${start}% ${current}%`;
  });

  return `
    <div class="admin-donut-layout">
      <div class="admin-donut"
        style="background:${total
          ? `conic-gradient(${segments.join(",")})`
          : "#e5e7eb"}">

        <div class="admin-donut-center">
          <strong>${total.toLocaleString("vi-VN")}</strong>
          <span>đơn hàng</span>
        </div>
      </div>

      <div class="admin-donut-legend">
        ${data.map(item => `
          <div class="admin-legend-item">
            <span class="admin-legend-dot"
              style="background:${item.color}"></span>

            <span>${item.label}</span>

            <b>
              ${item.count}
              (${total ? Math.round(item.count / total * 100) : 0}%)
            </b>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function overviewRecentOrders(list) {
  const recent = [...list]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 5);

  return `
    <div class="soft-card admin-table-card">
      <div class="admin-card-heading">
        <h3 class="admin-card-title">
          ${icon("receipt-text")}
          Đơn hàng gần đây
        </h3>

        <a href="javascript:void(0)"
          onclick="setTab('orders')"
          class="admin-view-all">
          Xem tất cả ${icon("arrow-right", "w-4 h-4")}
        </a>
      </div>

      <div class="admin-table-scroll">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Mã đơn</th>
              <th>Khách hàng</th>
              <th>Tổng tiền</th>
              <th>Trạng thái</th>
              <th>Ngày đặt</th>
            </tr>
          </thead>

          <tbody>
            ${recent.length ? recent.map(o => {
              const [label, cls] = overviewStatusInfo(o.orderStatus);

              return `
                <tr>
                  <td>
                    <b>${escapeHtml(o.orderCode ||
                      ("DH" + String(o.orderId).padStart(6, "0")))}</b>
                  </td>

                  <td>${escapeHtml(o.user?.fullname ||
                    o.user?.email || "Khách hàng")}</td>

                  <td>${money(o.finalAmount ?? o.totalAmount)}</td>

                  <td>
                    <span class="admin-status ${cls}">
                      ${label}
                    </span>
                  </td>

                  <td>
                    ${o.createdAt
                      ? new Date(o.createdAt).toLocaleString("vi-VN")
                      : "-"}
                  </td>
                </tr>
              `;
            }).join("") : `
              <tr>
                <td colspan="5" class="text-center">
                  Chưa có đơn hàng trong khoảng thời gian này
                </td>
              </tr>
            `}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function overviewBestProducts(list) {
  const productList = topProducts(
    list.filter(o => o.orderStatus !== "CANCELLED")
  );

  return `
    <div class="soft-card admin-table-card">
      <div class="admin-card-heading">
        <h3 class="admin-card-title">
          ${icon("trophy")}
          Sản phẩm bán chạy
        </h3>

        <a href="javascript:void(0)"
          onclick="setTab('products')"
          class="admin-view-all">
          Xem tất cả ${icon("arrow-right", "w-4 h-4")}
        </a>
      </div>

      <div class="admin-table-scroll">
        <table class="admin-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Sản phẩm</th>
              <th>Đã bán</th>
              <th>Doanh thu</th>
            </tr>
          </thead>

          <tbody>
            ${productList.length ? productList.map((p, i) => {
              const product = products.find(x => x.productName === p.name);

              return `
                <tr>
                  <td>${i + 1}</td>

                  <td>
                    <div class="flex items-center gap-2">
                      <img
                        src="${product
                          ? productImg(product, i)
                          : "/images/no-image.png"}"
                        alt=""
                        onerror="this.src='/images/no-image.png'">

                      <span>${escapeHtml(p.name)}</span>
                    </div>
                  </td>

                  <td>${p.qty}</td>
                  <td>${money(p.revenue)}</td>
                </tr>
              `;
            }).join("") : `
              <tr>
                <td colspan="4" class="text-center">
                  Chưa có dữ liệu bán hàng
                </td>
              </tr>
            `}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function overviewCharts() {
  const list = overviewFilteredOrders();

  return `
    <div class="admin-chart-grid">
      <div class="soft-card admin-chart-card">
        <div class="admin-card-heading">
          <h3 class="admin-card-title">
            ${icon("chart-no-axes-combined")}
            Doanh thu theo ngày
          </h3>

          <select class="admin-chart-select"
            onchange="changeOverviewPeriod(this.value)">

            <option value="7" ${overviewPeriod === "7" ? "selected" : ""}>
              7 ngày gần nhất
            </option>

            <option value="14" ${overviewPeriod === "14" ? "selected" : ""}>
              14 ngày gần nhất
            </option>

            <option value="30" ${overviewPeriod === "30" ? "selected" : ""}>
              30 ngày gần nhất
            </option>

            <option value="custom" ${overviewPeriod === "custom" ? "selected" : ""}>
              Khoảng ngày đã chọn
            </option>
          </select>
        </div>

        ${overviewRevenueChart(list)}
      </div>

      <div class="soft-card admin-chart-card">
        <div class="admin-card-heading">
          <h3 class="admin-card-title">
            ${icon("chart-pie")}
            Tỉ lệ đơn hàng theo trạng thái
          </h3>
        </div>

        ${overviewDonutChart(list)}
      </div>
    </div>

    <div class="admin-table-grid">
      ${overviewRecentOrders(list)}
      ${overviewBestProducts(list)}
    </div>
  `;
}

function todayOrders(){
  const today = new Date().toDateString();

  return orders.filter(o =>
    o.createdAt && new Date(o.createdAt).toDateString() === today
  );
}

function todayRevenue(){
  return todayOrders()
    .filter(o => o.orderStatus !== "CANCELLED")
    .reduce((sum, o) => sum + Number(o.finalAmount || 0), 0);
}

function dateOnly(d){
  return new Date(d).toISOString().slice(0, 10);
}

function daysAgo(n){
  const d = new Date();
  d.setDate(d.getDate() - n);
  return dateOnly(d);
}

function validOrders(){
  return orders.filter(o => o.orderStatus !== "CANCELLED");
}

function ordersInLastDays(days){
  const from = daysAgo(days - 1);
  return validOrders().filter(o =>
    o.createdAt && dateOnly(o.createdAt) >= from
  );
}

function revenueOf(list){
  return list
    .filter(o => o.orderStatus !== "CANCELLED")
    .reduce((sum, o) => sum + Number(o.finalAmount || 0), 0);
}

function topProducts(orderList = validOrders()){

  const map = {};

  orderList.forEach(order => {
    (order.items || []).forEach(item => {

      const p = item.variant?.product;
      if(!p) return;

      const id = p.productId;

      if(!map[id]){
        map[id] = {
          name: p.productName,
          qty: 0,
          revenue: 0
        };
      }

      map[id].qty += Number(item.quantity || 0);
      map[id].revenue +=
        Number(item.price || 0) *
        Number(item.quantity || 0);

    });
  });

  return Object.values(map)
    .sort((a,b)=>b.qty-a.qty)
    .slice(0,5);
}

function topCustomers(orderList = validOrders()){

  const map = {};

  orderList.forEach(o => {

    const u = o.user;
    if(!u) return;

    const id = u.userId;

    if(!map[id]){
      map[id] = {
        name: u.fullname || u.email,
        email: u.email || "",
        total: 0,
        orders: 0
      };
    }

    map[id].total += Number(o.finalAmount || 0);
    map[id].orders += 1;

  });

  return Object.values(map)
    .sort((a,b)=>b.total-a.total)
    .slice(0,5);
}

function reportChartData(){

  const map = {};

  reportOrders().forEach(o => {
    const day = dateOnly(o.createdAt);
    map[day] = (map[day] || 0) + Number(o.finalAmount || 0);
  });

  let from = reportFrom;
  let to = reportTo;

  if(!from && !to){
    const days = Object.keys(map).sort();

    if(days.length === 0){
      return [];
    }

    from = days[0];
    to = days[days.length - 1];
  }

  if(from && !to){
    to = dateOnly(new Date());
  }

  if(!from && to){
    from = Object.keys(map).sort()[0] || to;
  }

  const result = [];
  const current = new Date(from + "T00:00:00");
  const end = new Date(to + "T00:00:00");

  while(current <= end){
    const day = dateOnly(current);

    result.push({
      day,
      revenue: map[day] || 0
    });

    current.setDate(current.getDate() + 1);
  }

  return result;
}

function reportPanel() {
  const reportData = reportOrders();

  const revenue = revenueOf(reportData);
  const totalOrders = reportData.length;

  const completed = reportData.filter(
    o => o.orderStatus === "COMPLETED"
  ).length;

  const cancelled = reportData.filter(
    o => o.orderStatus === "CANCELLED"
  ).length;

  const productList = topProducts(
    reportData.filter(o => o.orderStatus !== "CANCELLED")
  );

  const customerList = topCustomers(
    reportData.filter(o => o.orderStatus !== "CANCELLED")
  );

  const chartData = reportChartData();

  const maxRevenue = Math.max(
    ...chartData.map(x => Number(x.revenue || 0)),
    1
  );

  const validOrderCount = Math.max(
    totalOrders - cancelled,
    1
  );

  const completePercent =
    Math.round(completed / validOrderCount * 100);

  return `
    <div class="space-y-5">

      <!-- BỘ LỌC -->
      <div class="soft-card p-5">

        <div class="
          flex flex-col xl:flex-row
          xl:items-center xl:justify-between
          gap-4
        ">

          <div>
            <h2 class="text-xl font-bold">
              Báo cáo thống kê
            </h2>

            <p class="text-sm text-neutral-500 mt-1">
              Theo dõi doanh thu, đơn hàng, sản phẩm và khách hàng
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2">

            <input
              id="reportFrom"
              type="date"
              value="${reportFrom}"
              onchange="changeReportFilter()"
              class="
                border border-neutral-200
                rounded-lg
                px-3 py-2
                text-sm
                outline-none
              "
            >

            <span class="text-neutral-400">–</span>

            <input
              id="reportTo"
              type="date"
              value="${reportTo}"
              onchange="changeReportFilter()"
              class="
                border border-neutral-200
                rounded-lg
                px-3 py-2
                text-sm
                outline-none
              "
            >

            <button
              type="button"
              onclick="reportFrom=''; reportTo=''; render()"
              class="
                border border-neutral-200
                rounded-lg
                px-4 py-2
                text-sm font-semibold
                hover:bg-neutral-50
              "
            >
              Xóa lọc
            </button>

            <button
              type="button"
              onclick="exportReportExcel()"
              class="
                inline-flex items-center gap-2
                bg-green-700 hover:bg-green-800
                text-white
                rounded-lg
                px-4 py-2
                text-sm font-bold
                transition
              "
            >
              ${icon("file-spreadsheet", "w-4 h-4")}
              Xuất Excel
            </button>

          </div>
        </div>
      </div>


      <!-- KPI -->
      <div class="
        grid
        grid-cols-1
        sm:grid-cols-2
        xl:grid-cols-4
        gap-4
      ">

        <!-- DOANH THU -->
        <div class="soft-card p-5">
          <div class="flex items-start gap-4">

            <div class="
              w-10 h-10
              rounded-xl
              bg-red-50
              text-red-700
              flex items-center justify-center
              shrink-0
            ">
              ${icon("circle-dollar-sign", "w-5 h-5")}
            </div>

            <div class="min-w-0">
              <p class="text-sm text-neutral-500">
                Doanh thu
              </p>

              <h3 class="
                text-xl
                font-bold
                text-red-800
                mt-1
                break-words
              ">
                ${money(revenue)}
              </h3>

              <p class="text-xs text-neutral-400 mt-1">
                Không gồm đơn đã hủy
              </p>
            </div>

          </div>
        </div>


        <!-- ĐƠN HÀNG -->
        <div class="soft-card p-5">
          <div class="flex items-start gap-4">

            <div class="
              w-10 h-10
              rounded-xl
              bg-red-50
              text-red-700
              flex items-center justify-center
              shrink-0
            ">
              ${icon("shopping-cart", "w-5 h-5")}
            </div>

            <div>
              <p class="text-sm text-neutral-500">
                Đơn hàng
              </p>

              <h3 class="text-2xl font-bold mt-1">
                ${totalOrders.toLocaleString("vi-VN")}
              </h3>

              <p class="text-xs text-neutral-400 mt-1">
                Trong khoảng đã chọn
              </p>
            </div>

          </div>
        </div>


        <!-- HOÀN THÀNH -->
        <div class="soft-card p-5">
          <div class="flex items-start gap-4">

            <div class="
              w-10 h-10
              rounded-xl
              bg-green-50
              text-green-700
              flex items-center justify-center
              shrink-0
            ">
              ${icon("circle-check", "w-5 h-5")}
            </div>

            <div>
              <p class="text-sm text-neutral-500">
                Hoàn thành
              </p>

              <h3 class="text-2xl font-bold mt-1">
                ${completed.toLocaleString("vi-VN")}
              </h3>

              <p class="text-xs text-green-700 mt-1">
                ${completePercent}% đơn không bị hủy
              </p>
            </div>

          </div>
        </div>


        <!-- HỦY -->
        <div class="soft-card p-5">
          <div class="flex items-start gap-4">

            <div class="
              w-10 h-10
              rounded-xl
              bg-red-50
              text-red-700
              flex items-center justify-center
              shrink-0
            ">
              ${icon("circle-x", "w-5 h-5")}
            </div>

            <div>
              <p class="text-sm text-neutral-500">
                Đã hủy
              </p>

              <h3 class="text-2xl font-bold mt-1">
                ${cancelled.toLocaleString("vi-VN")}
              </h3>

              <p class="text-xs text-neutral-400 mt-1">
                Đơn hàng bị hủy
              </p>
            </div>

          </div>
        </div>

      </div>


      <!-- BIỂU ĐỒ -->
      <div class="
        grid
        grid-cols-1
        xl:grid-cols-[1.6fr_1fr]
        gap-4
      ">

        <!-- DOANH THU THEO NGÀY -->
        <div class="soft-card p-5">

          <div class="
            flex items-center justify-between
            mb-5
          ">
            <div>
              <h3 class="font-bold text-lg">
                Doanh thu theo ngày
              </h3>

              <p class="text-xs text-neutral-400 mt-1">
                Biến động doanh thu trong khoảng thời gian
              </p>
            </div>

            ${icon(
              "chart-no-axes-combined",
              "w-5 h-5 text-red-700"
            )}
          </div>

          ${
            chartData.length
              ? `
                <div class="
                  h-[260px]
                  flex items-end
                  gap-2
                  border-b
                  border-neutral-200
                  pt-5
                ">

                  ${chartData.map(item => {

                    const percent =
                      Math.max(
                        (Number(item.revenue || 0) / maxRevenue) * 100,
                        item.revenue > 0 ? 4 : 1
                      );

                    return `
                      <div class="
                        flex-1
                        min-w-[18px]
                        h-full
                        flex flex-col
                        justify-end
                        items-center
                        group
                        relative
                      ">

                        <div
                          class="
                            absolute
                            -top-3
                            hidden
                            group-hover:block
                            bg-neutral-900
                            text-white
                            text-xs
                            rounded-lg
                            px-3 py-2
                            whitespace-nowrap
                            z-20
                          "
                        >
                          ${item.day}
                          <br>
                          ${money(item.revenue)}
                        </div>

                        <div
                          class="
                            w-full
                            max-w-[38px]
                            bg-red-700
                            hover:bg-red-800
                            rounded-t-md
                            transition
                          "
                          style="
                            height:${percent}%;
                            min-height:${item.revenue ? 5 : 2}px;
                          "
                        ></div>

                      </div>
                    `;
                  }).join("")}

                </div>

                <div class="
                  flex justify-between
                  text-[11px]
                  text-neutral-400
                  mt-2
                ">
                  <span>
                    ${chartData[0]?.day || ""}
                  </span>

                  <span>
                    ${chartData[chartData.length - 1]?.day || ""}
                  </span>
                </div>
              `
              : `
                <div class="
                  h-[260px]
                  flex items-center justify-center
                  text-neutral-400
                ">
                  Chưa có dữ liệu doanh thu
                </div>
              `
          }

        </div>


        <!-- TÓM TẮT -->
        <div class="soft-card p-5">

          <h3 class="font-bold text-lg mb-5">
            Tình trạng đơn hàng
          </h3>

          <div class="space-y-5">

            ${[
              ["Tổng đơn", totalOrders, "receipt"],
              ["Hoàn thành", completed, "circle-check"],
              ["Đã hủy", cancelled, "circle-x"]
            ].map(item => `

              <div class="
                flex items-center justify-between
                border-b
                pb-4
                last:border-0
              ">

                <div class="flex items-center gap-3">

                  <div class="
                    w-9 h-9
                    rounded-lg
                    bg-neutral-50
                    flex items-center justify-center
                    text-red-700
                  ">
                    ${icon(item[2], "w-4 h-4")}
                  </div>

                  <span class="text-sm text-neutral-600">
                    ${item[0]}
                  </span>

                </div>

                <b class="text-lg">
                  ${Number(item[1]).toLocaleString("vi-VN")}
                </b>

              </div>

            `).join("")}

          </div>

        </div>

      </div>


      <!-- TOP SẢN PHẨM + KHÁCH HÀNG -->
      <div class="
        grid
        grid-cols-1
        xl:grid-cols-2
        gap-4
      ">

        <!-- TOP SẢN PHẨM -->
        <div class="soft-card overflow-hidden">

          <div class="
            px-5 py-4
            border-b
            flex items-center justify-between
          ">
            <div>
              <h3 class="font-bold text-lg">
                Top sản phẩm bán chạy
              </h3>

              <p class="text-xs text-neutral-400 mt-1">
                Xếp hạng theo số lượng đã bán
              </p>
            </div>

            ${icon("trophy", "w-5 h-5 text-red-700")}
          </div>

          <div class="overflow-x-auto">

            <table class="w-full text-sm">

              <thead class="bg-neutral-50">
                <tr class="text-left text-neutral-500">
                  <th class="px-5 py-3 w-12">#</th>
                  <th class="px-3 py-3">Sản phẩm</th>
                  <th class="px-3 py-3 text-center">
                    Đã bán
                  </th>
                  <th class="px-5 py-3 text-right">
                    Doanh thu
                  </th>
                </tr>
              </thead>

              <tbody>

                ${
                  productList.length
                    ? productList.map((p, index) => {

                      const product =
                        products.find(
                          x => x.productName === p.name
                        );

                      return `
                        <tr class="
                          border-t
                          hover:bg-neutral-50
                        ">

                          <td class="px-5 py-4">
                            <span class="
                              inline-flex
                              w-7 h-7
                              rounded-full
                              bg-red-50
                              text-red-700
                              items-center justify-center
                              font-bold
                            ">
                              ${index + 1}
                            </span>
                          </td>

                          <td class="px-3 py-4">
                            <div class="
                              flex items-center gap-3
                            ">

                              <img
                                src="${
                                  product
                                    ? productImg(product, index)
                                    : "/images/no-image.png"
                                }"
                                onerror="
                                  this.src='/images/no-image.png'
                                "
                                class="
                                  w-10 h-10
                                  rounded-lg
                                  object-cover
                                  border
                                "
                                alt=""
                              >

                              <span class="
                                font-semibold
                                max-w-[180px]
                                truncate
                              ">
                                ${escapeHtml(p.name)}
                              </span>

                            </div>
                          </td>

                          <td class="
                            px-3 py-4
                            text-center
                            font-semibold
                          ">
                            ${Number(p.qty || 0)
                              .toLocaleString("vi-VN")}
                          </td>

                          <td class="
                            px-5 py-4
                            text-right
                            font-semibold
                          ">
                            ${money(p.revenue)}
                          </td>

                        </tr>
                      `;
                    }).join("")
                    : `
                      <tr>
                        <td
                          colspan="4"
                          class="
                            p-10
                            text-center
                            text-neutral-400
                          "
                        >
                          Chưa có dữ liệu sản phẩm
                        </td>
                      </tr>
                    `
                }

              </tbody>
            </table>

          </div>
        </div>


        <!-- TOP KHÁCH HÀNG -->
        <div class="soft-card overflow-hidden">

          <div class="
            px-5 py-4
            border-b
            flex items-center justify-between
          ">
            <div>
              <h3 class="font-bold text-lg">
                Top khách hàng
              </h3>

              <p class="text-xs text-neutral-400 mt-1">
                Xếp hạng theo tổng giá trị mua hàng
              </p>
            </div>

            ${icon("users", "w-5 h-5 text-red-700")}
          </div>

          <div class="overflow-x-auto">

            <table class="w-full text-sm">

              <thead class="bg-neutral-50">
                <tr class="text-left text-neutral-500">
                  <th class="px-5 py-3 w-12">#</th>
                  <th class="px-3 py-3">Khách hàng</th>
                  <th class="px-3 py-3 text-center">
                    Đơn
                  </th>
                  <th class="px-5 py-3 text-right">
                    Tổng chi
                  </th>
                </tr>
              </thead>

              <tbody>

                ${
                  customerList.length
                    ? customerList.map((c, index) => `

                      <tr class="
                        border-t
                        hover:bg-neutral-50
                      ">

                        <td class="px-5 py-4">
                          <span class="
                            inline-flex
                            w-7 h-7
                            rounded-full
                            bg-red-50
                            text-red-700
                            items-center justify-center
                            font-bold
                          ">
                            ${index + 1}
                          </span>
                        </td>

                        <td class="px-3 py-4">

                          <div class="font-semibold">
                            ${escapeHtml(c.name || "Khách hàng")}
                          </div>

                          <div class="
                            text-xs
                            text-neutral-400
                            mt-1
                            max-w-[200px]
                            truncate
                          ">
                            ${escapeHtml(c.email || "")}
                          </div>

                        </td>

                        <td class="
                          px-3 py-4
                          text-center
                          font-semibold
                        ">
                          ${Number(c.orders || 0)
                            .toLocaleString("vi-VN")}
                        </td>

                        <td class="
                          px-5 py-4
                          text-right
                          font-semibold
                          text-red-800
                        ">
                          ${money(c.total)}
                        </td>

                      </tr>

                    `).join("")
                    : `
                      <tr>
                        <td
                          colspan="4"
                          class="
                            p-10
                            text-center
                            text-neutral-400
                          "
                        >
                          Chưa có dữ liệu khách hàng
                        </td>
                      </tr>
                    `
                }

              </tbody>
            </table>

          </div>
        </div>

      </div>

    </div>
  `;
}

function payosPanel(){
  return `
    <div class="soft-card p-8">
      <p class="uppercase tracking-widest text-green-700 font-bold mb-3">
        PAYOS
      </p>

      <h2 class="serif text-4xl mb-3">
        Lịch sử giao dịch PayOS
      </h2>

      <p class="text-neutral-500 mb-8">
        Mở trang quản lý thanh toán PayOS để xem lịch sử giao dịch realtime.
      </p>

      <a
        href="https://my.payos.vn/"
        target="_blank"
        class="inline-flex items-center gap-3 bg-green-600 hover:bg-green-700
        text-white font-bold px-7 py-4 rounded-2xl transition"
      >
        ${icon("external-link")}
        <span>Mở PayOS Dashboard</span>
      </a>
    </div>
  `;
}


function sidebar() {
  const items = [
    ["overview", "Tổng quan", "layout-dashboard"],
    ["products", "Quản lý sản phẩm", "shopping-bag"],
    ["categories", "Danh mục", "list-tree"],
    ["brands", "Thương hiệu", "tag"],
    ["orders", "Quản lý đơn hàng", "receipt"],
    ["variants", "Biến thể sản phẩm", "palette"],
    ["users", "Quản lý người dùng", "users"],
    ["reviews", "Quản lý đánh giá", "message-square"],
    ["promo", "Voucher", "badge-percent"],
    ["payos", "Lịch sử PayOS", "wallet"],
    ["reports", "Báo cáo thống kê", "bar-chart-3"]
  ];

  return `
    <aside class="admin-sidebar">
      <div class="admin-logo">
        <strong>JODOK</strong>

        <button type="button"
          onclick="toggleAdminSidebar()"
          title="Thu gọn menu">
          ${icon("panel-left-close", "w-5 h-5")}
        </button>
      </div>

      <h2>Menu quản trị</h2>

      <nav class="admin-nav">
        ${items.map(item => `
          <button
            type="button"
            onclick="setTab('${item[0]}')"
            class="${currentTab === item[0] ? "active" : ""}">

            ${icon(item[2])}

            <span>${item[1]}</span>
          </button>
        `).join("")}
      </nav>
    </aside>
  `;
}

function toggleAdminSidebar() {
  document.querySelector(".admin-dashboard")
    ?.classList.toggle("sidebar-collapsed");
}

function toggleAdminProfile() {
  document.getElementById("adminProfileMenu")
    ?.classList.toggle("hidden");
}

function changeProductFilter(type, value) {
  if (type === "category") {
    productCategoryFilter = value;
  }

  if (type === "brand") {
    productBrandFilter = value;
  }

  if (type === "status") {
    productStatusFilter = value;
  }

  productPage = 1;
  render();
}

let productSearchTimer = null;

function searchProductAdmin(input) {
  // Không render khi Unikey/IME đang ghép dấu tiếng Việt
  if (input.isComposing) return;

  clearTimeout(productSearchTimer);

  productSearchTimer = setTimeout(() => {
    adminSearch.products = input.value.trim().toLowerCase();
    productPage = 1;
    render();
  }, 350);
}

function finishProductSearch(input) {
  clearTimeout(productSearchTimer);

  adminSearch.products = input.value.trim().toLowerCase();
  productPage = 1;

  render();

  requestAnimationFrame(() => {
    const searchInput =
      document.querySelector('[data-search="products"]');

    if (searchInput) {
      searchInput.focus();

      const end = searchInput.value.length;
      searchInput.setSelectionRange(end, end);
    }
  });
}

function changeProductPage(page) {
  productPage = page;
  render();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function productPagination(totalPages) {
  if (totalPages <= 1) return "";

  let pages = [];

  if (totalPages <= 7) {
    pages = Array.from(
      { length: totalPages },
      (_, i) => i + 1
    );
  } else {
    pages = [
      1,
      2,
      3,
      "...",
      totalPages
    ];

    if (productPage > 3 && productPage < totalPages - 1) {
      pages = [
        1,
        "...",
        productPage,
        "...",
        totalPages
      ];
    }
  }

  return `
    <div class="admin-product-pagination">

      <button
        class="product-page-arrow"
        onclick="changeProductPage(${Math.max(1, productPage - 1)})"
        ${productPage === 1 ? "disabled" : ""}>
        ${icon("chevron-left", "w-4 h-4")}
      </button>

      ${pages.map(page => {
        if (page === "...") {
          return `
            <span class="product-page-dots">...</span>
          `;
        }

        return `
          <button
            onclick="changeProductPage(${page})"
            class="product-page-number
              ${productPage === page ? "active" : ""}">
            ${page}
          </button>
        `;
      }).join("")}

      <button
        class="product-page-arrow"
        onclick="changeProductPage(${Math.min(totalPages, productPage + 1)})"
        ${productPage === totalPages ? "disabled" : ""}>
        ${icon("chevron-right", "w-4 h-4")}
      </button>

    </div>
  `;
}
function productTable() {
  const keyword = (adminSearch.products || "").trim().toLowerCase();

  let filtered = products.filter(p => {
    const name = (p.productName || "").toLowerCase();
    const categoryName = (p.category?.categoryName || "").toLowerCase();
    const brandName = (p.brand?.brandName || "").toLowerCase();

    const matchKeyword =
      name.includes(keyword) ||
      categoryName.includes(keyword) ||
      brandName.includes(keyword);

    const matchCategory =
      !productCategoryFilter ||
      String(p.category?.categoryId || "") === String(productCategoryFilter);

    const matchBrand =
      !productBrandFilter ||
      String(p.brand?.brandId || "") === String(productBrandFilter);

    const matchStatus =
      !productStatusFilter ||
      p.status === productStatusFilter;

    return (
      matchKeyword &&
      matchCategory &&
      matchBrand &&
      matchStatus
    );
  });

  const totalProducts = filtered.length;

  const totalPages = Math.max(
    1,
    Math.ceil(totalProducts / productPageSize)
  );

  if (productPage > totalPages) {
    productPage = totalPages;
  }

  if (productPage < 1) {
    productPage = 1;
  }

  const start = (productPage - 1) * productPageSize;

  const list = filtered.slice(
    start,
    start + productPageSize
  );

  return `
    <div class="admin-product-page">

      <!-- ================= TOOLBAR ================= -->
      <div class="admin-product-toolbar">

        <!-- SEARCH -->
        <div class="admin-product-search">
          ${icon("search", "w-4 h-4")}

          <input
            data-search="products"
            type="search"
            value="${escapeHtml(adminSearch.products || "")}"
            oninput="searchProductAdmin(this)"
            oncompositionend="finishProductSearch(this)"
            autocomplete="off"
            spellcheck="false"
            placeholder="Tìm kiếm sản phẩm..."
          >
        </div>

        <!-- CATEGORY -->
        <select
          class="admin-product-filter"
          onchange="changeProductFilter('category', this.value)"
        >
          <option value="">Danh mục</option>

          ${categories
            .filter(c => c.parent != null)
            .map(c => `
              <option
                value="${c.categoryId}"
                ${
                  String(productCategoryFilter) === String(c.categoryId)
                    ? "selected"
                    : ""
                }
              >
                ${escapeHtml(c.categoryName)}
              </option>
            `)
            .join("")}
        </select>

        <!-- BRAND -->
        <select
          class="admin-product-filter"
          onchange="changeProductFilter('brand', this.value)"
        >
          <option value="">Thương hiệu</option>

          ${brands
          .filter(b => String(b.status || "").toUpperCase() === "ACTIVE")
          .map(b => `
            <option
              value="${b.brandId}"
              ${
                String(productBrandFilter) === String(b.brandId)
                  ? "selected"
                  : ""
              }
            >
              ${escapeHtml(b.brandName || "")}
            </option>
          `)
          .join("")}
        </select>

        <!-- STATUS -->
        <select
          class="admin-product-filter"
          onchange="changeProductFilter('status', this.value)"
        >
          <option value="">Trạng thái</option>

          <option
            value="ACTIVE"
            ${productStatusFilter === "ACTIVE" ? "selected" : ""}
          >
            Đang bán
          </option>

          <option
            value="INACTIVE"
            ${productStatusFilter === "INACTIVE" ? "selected" : ""}
          >
            Ngừng bán
          </option>
        </select>

        <!-- ADD PRODUCT -->
        <button
          type="button"
          onclick="openProductForm()"
          class="admin-add-product"
        >
          ${icon("plus", "w-4 h-4")}
          <span>Thêm sản phẩm</span>
        </button>

      </div>
      <!-- =============== END TOOLBAR =============== -->


      <!-- ================= TABLE ================= -->
      <div class="admin-product-table-wrap">

        <table class="admin-product-table">

          <thead>
            <tr>
              <th>#</th>
              <th>Ảnh</th>
              <th>Tên sản phẩm</th>
              <th>Danh mục</th>
              <th>Thương hiệu</th>
              <th>Giá</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>

          <tbody>

            ${
              list.length
                ? list.map((p, index) => {
                    const number = start + index + 1;
                    const active = p.status === "ACTIVE";

                    return `
                      <tr>

                        <td class="product-index">
                          ${number}
                        </td>

                        <td>
                          <img
                            src="${productImg(p, index)}"
                            class="admin-product-image"
                            alt="${escapeHtml(p.productName || "")}"
                            onerror="this.onerror=null;this.src='/images/no-image.png'"
                          >
                        </td>

                        <td>
                          <div class="admin-product-name">

                            <strong>
                              ${escapeHtml(p.productName || "Chưa có tên")}
                            </strong>

                            ${
                              productHasVariant(p.productId)
                                ? ""
                                : `
                                  <span class="product-no-variant">
                                    Chưa có biến thể
                                  </span>
                                `
                            }

                          </div>
                        </td>

                        <td>
                          ${escapeHtml(
                            p.category?.categoryName || "Chưa có"
                          )}
                        </td>

                        <td>
                          ${escapeHtml(getActiveBrandName(p) || "-")}
                        </td>

                        <td class="admin-product-price">
                          ${money(p.basePrice)}
                        </td>

                        <td>
                          <span class="
                            admin-product-status
                            ${active ? "active" : "inactive"}
                          ">
                            ${active ? "Đang bán" : "Ngừng bán"}
                          </span>
                        </td>

                        <td>
                          <div class="admin-product-actions">

                            <!-- EDIT -->
                            <button
                              type="button"
                              onclick="openProductForm(${p.productId})"
                              title="Chỉnh sửa"
                              class="product-action edit"
                            >
                              ${icon("pencil", "w-4 h-4")}
                            </button>

                            <!-- SHOW / HIDE -->
                            ${
                              active
                                ? `
                                  <button
                                    type="button"
                                    onclick="hideProduct(${p.productId})"
                                    title="Ẩn sản phẩm"
                                    class="product-action view"
                                  >
                                    ${icon("eye", "w-4 h-4")}
                                  </button>
                                `
                                : `
                                  <button
                                    type="button"
                                    onclick="showProduct(${p.productId})"
                                    title="Hiện sản phẩm"
                                    class="product-action view"
                                  >
                                    ${icon("eye-off", "w-4 h-4")}
                                  </button>
                                `
                            }

                            <!-- DELETE -->
                            ${
                              !productHasOrders(p.productId)
                                ? `
                                  <button
                                    type="button"
                                    onclick="deleteProduct(${p.productId})"
                                    title="Xóa sản phẩm"
                                    class="product-action delete"
                                  >
                                    ${icon("trash-2", "w-4 h-4")}
                                  </button>
                                `
                                : ""
                            }

                          </div>
                        </td>

                      </tr>
                    `;
                  }).join("")
                : `
                  <tr>
                    <td
                      colspan="8"
                      class="admin-product-empty"
                    >
                      Không tìm thấy sản phẩm
                    </td>
                  </tr>
                `
            }

          </tbody>

        </table>

      </div>
      <!-- ================= END TABLE ================= -->


      <!-- ================= FOOTER ================= -->
      <div class="admin-product-footer">

        <p>
          Hiển thị
          <b>${list.length ? start + 1 : 0}</b>
          –
          <b>${list.length ? start + list.length : 0}</b>
          / ${totalProducts} sản phẩm
        </p>

        ${productPagination(totalPages)}

      </div>
      <!-- ================ END FOOTER ================ -->

    </div>

    ${productModal()}
  `;
}

function categoryPanel() {

  // ==========================================
  // SEARCH
  // ==========================================
  const keyword = String(
    adminSearch.categories || ""
  )
    .trim()
    .toLowerCase();


  // ==========================================
  // STATUS FILTER
  // ==========================================
  const selectedStatus = String(
    adminSearch.categoryStatus || "ALL"
  )
    .trim()
    .toUpperCase();


  // ==========================================
  // SORT FILTER
  // ==========================================
  const selectedSort = String(
    adminSearch.categorySort || "newest"
  );


  // ==========================================
  // FILTER
  // ==========================================
  let list = categories.filter(c => {

    const name = String(
      c.categoryName || ""
    )
      .trim()
      .toLowerCase();


    const description = String(
      c.description || ""
    )
      .trim()
      .toLowerCase();


    const status = String(
      c.status || ""
    )
      .trim()
      .toUpperCase();


    // SEARCH
    const matchKeyword =
      keyword === "" ||
      name.includes(keyword) ||
      description.includes(keyword);


    // STATUS
    let matchStatus = true;

    if (selectedStatus === "ACTIVE") {
      matchStatus = status === "ACTIVE";
    }

    if (selectedStatus === "HIDDEN") {
      matchStatus = status !== "ACTIVE";
    }


    return matchKeyword && matchStatus;
  });


  // ==========================================
  // SORT MỚI NHẤT / CŨ NHẤT
  // ==========================================
  list = [...list].sort((a, b) => {

    /*
      Nếu API có createdAt -> dùng createdAt.

      Nếu category không có createdAt
      -> dùng categoryId.

      categoryId lớn hơn = tạo sau.
    */

    const getSortValue = category => {

      if (category.createdAt) {

        const time =
          new Date(category.createdAt).getTime();

        if (!Number.isNaN(time)) {
          return time;
        }
      }

      return Number(
        category.categoryId || 0
      );
    };


    const aValue = getSortValue(a);
    const bValue = getSortValue(b);


    if (selectedSort === "oldest") {
      return aValue - bValue;
    }

    return bValue - aValue;
  });


  // ==========================================
  // PRODUCT COUNT
  // ==========================================
  const productCountMap = new Map();

  products.forEach(p => {

    const categoryId = Number(
      p?.category?.categoryId ??
      p?.categoryId ??
      0
    );

    if (!categoryId) return;

    productCountMap.set(
      categoryId,
      (productCountMap.get(categoryId) || 0) + 1
    );
  });


  // ==========================================
  // HTML
  // ==========================================
  return `
    <div class="soft-card overflow-hidden">


      <!-- ================= TOOLBAR ================= -->

      <div class="p-5 border-b border-neutral-200">

        <div class="flex items-center gap-3">


          <!-- SEARCH -->
          <div class="relative flex-1">

            <span
              class="
                absolute
                left-4
                top-1/2
                -translate-y-1/2
                text-neutral-400
                pointer-events-none
              "
            >
              ${icon("search", "w-5 h-5")}
            </span>


            <input
              id="categorySearchInput"

              type="text"

              value="${adminSearch.categories || ""}"

              placeholder="Tìm kiếm danh mục..."

              oninput="
                adminSearch.categories =
                  this.value.toLowerCase();

                render();
              "

              class="
                w-full
                h-11
                border
                border-neutral-200
                rounded-lg
                pl-11
                pr-4
                text-sm
                outline-none
                bg-white
                focus:border-red-800
                focus:ring-1
                focus:ring-red-800
              "
            >

          </div>


          <!-- ================= STATUS ================= -->

          <select
            id="categoryStatusFilter"

            onchange="
              adminSearch.categoryStatus =
                this.value;

              render();
            "

            class="
              h-11
              min-w-[190px]
              border
              border-neutral-200
              rounded-lg
              px-2
              bg-white
              text-sm
              text-neutral-700
              outline-none
              cursor-pointer
              focus:border-red-800
              focus:ring-1
              focus:ring-red-800
            "
          >

            <option
              value="ALL"
              ${selectedStatus === "ALL"
                ? "selected"
                : ""}
            >
              Tất cả trạng thái
            </option>


            <option
              value="ACTIVE"
              ${selectedStatus === "ACTIVE"
                ? "selected"
                : ""}
            >
              Đang hiển thị
            </option>


            <option
              value="HIDDEN"
              ${selectedStatus === "HIDDEN"
                ? "selected"
                : ""}
            >
              Đã ẩn
            </option>

          </select>


          <!-- ================= SORT ================= -->

          <select
            id="categorySortFilter"

            onchange="
              adminSearch.categorySort =
                this.value;

              render();
            "

            class="
              h-11
              min-w-[155px]
              border
              border-neutral-200
              rounded-lg
              px-2
              bg-white
              text-sm
              text-neutral-700
              outline-none
              cursor-pointer
              focus:border-red-800
              focus:ring-1
              focus:ring-red-800
            "
          >

            <option
              value="newest"
              ${selectedSort === "newest"
                ? "selected"
                : ""}
            >
              Mới nhất
            </option>


            <option
              value="oldest"
              ${selectedSort === "oldest"
                ? "selected"
                : ""}
            >
              Cũ nhất
            </option>

          </select>


          <!-- ================= ADD ================= -->

          <button
            type="button"

            onclick="openCategoryForm()"

            class="
              h-11
              inline-flex
              items-center
              justify-center
              gap-2
              bg-red-800
              hover:bg-red-900
              text-white
              font-semibold
              rounded-lg
              px-5
              whitespace-nowrap
              transition
            "
          >
            ${icon("plus", "w-4 h-4")}

            Thêm danh mục
          </button>

        </div>

      </div>


      <!-- ================= TABLE ================= -->

      <div class="overflow-x-auto">

        <table class="w-full text-left">

          <thead
            class="
              bg-neutral-50
              text-sm
              text-neutral-500
              border-b
              border-neutral-200
            "
          >

            <tr>

              <th class="px-6 py-4">
                #
              </th>

              <th class="px-6 py-4">
                Tên danh mục
              </th>

              <th class="px-6 py-4">
                Mô tả
              </th>

              <th class="px-6 py-4 text-center">
                Số sản phẩm
              </th>

              <th class="px-6 py-4">
                Trạng thái
              </th>

              <th class="px-6 py-4 text-center">
                Hành động
              </th>

            </tr>

          </thead>


          <tbody>

            ${
              list.length

                ? list.map((c, index) => {

                    const categoryId =
                      Number(c.categoryId || 0);


                    const productCount =
                      productCountMap.get(
                        categoryId
                      ) || 0;


                    /*
                     * Dùng CHÍNH status API trả về.
                     *
                     * ACTIVE = đang hiển thị.
                     * Còn lại = đã ẩn.
                     */
                    const isActive =
                      String(c.status || "")
                        .trim()
                        .toUpperCase()
                        === "ACTIVE";


                    return `
                      <tr
                        class="
                          border-b
                          border-neutral-100
                          hover:bg-neutral-50/70
                        "
                      >

                        <!-- STT -->
                        <td class="px-6 py-4 text-neutral-500">

                          ${index + 1}

                        </td>


                        <!-- CATEGORY -->
                        <td class="px-6 py-4">

                          <div
                            class="
                              flex
                              items-center
                              gap-3
                            "
                          >

                            <img
                              src="${
                                c.imageUrl ||
                                "/images/no-image.png"
                              }"

                              alt="${
                                c.categoryName ||
                                "Danh mục"
                              }"

                              onerror="
                                this.src='/images/no-image.png'
                              "

                              class="
                                w-10
                                h-10
                                rounded-lg
                                object-cover
                                border
                                border-neutral-200
                                bg-neutral-50
                              "
                            >


                            <span
                              class="
                                font-semibold
                                text-neutral-900
                              "
                            >
                              ${
                                c.categoryName ||
                                "Không có tên"
                              }
                            </span>

                          </div>

                        </td>


                        <!-- DESCRIPTION -->
                        <td
                          class="
                            px-6
                            py-4
                            text-sm
                            text-neutral-500
                          "
                        >

                          ${
                            c.description ||
                            "Không có mô tả"
                          }

                        </td>


                        <!-- PRODUCT COUNT -->
                        <td
                          class="
                            px-6
                            py-4
                            text-center
                            font-semibold
                          "
                        >

                          ${productCount}

                        </td>


                        <!-- STATUS -->
                        <td class="px-6 py-4">

                          <span
                            class="
                              inline-flex
                              items-center
                              rounded-full
                              px-3
                              py-1
                              text-xs
                              font-semibold

                              ${
                                isActive
                                  ? "bg-green-50 text-green-700"
                                  : "bg-neutral-100 text-neutral-600"
                              }
                            "
                          >

                            ${
                              isActive
                                ? "Đang hiển thị"
                                : "Đã ẩn"
                            }

                          </span>

                        </td>


                        <!-- ACTION -->
                        <td class="px-6 py-4">

                          <div
                            class="
                              flex
                              items-center
                              justify-center
                              gap-2
                            "
                          >

                            <button
                              type="button"

                              onclick="
                                openCategoryForm(
                                  ${c.categoryId}
                                )
                              "

                              title="Sửa danh mục"

                              class="
                                w-9
                                h-9
                                inline-flex
                                items-center
                                justify-center
                                border
                                border-neutral-200
                                rounded-lg
                                text-neutral-600
                                hover:border-red-800
                                hover:text-red-800
                              "
                            >
                              ${icon(
                                "pencil",
                                "w-4 h-4"
                              )}
                            </button>


                            <button
                              type="button"

                              onclick="
                                deleteCategory(
                                  ${c.categoryId}
                                )
                              "

                              title="Xóa danh mục"

                              class="
                                w-9
                                h-9
                                inline-flex
                                items-center
                                justify-center
                                border
                                border-red-100
                                rounded-lg
                                text-red-700
                                hover:bg-red-50
                              "
                            >
                              ${icon(
                                "trash-2",
                                "w-4 h-4"
                              )}
                            </button>

                          </div>

                        </td>

                      </tr>
                    `;

                  }).join("")

                : `
                  <tr>

                    <td
                      colspan="6"
                      class="
                        px-6
                        py-12
                        text-center
                        text-neutral-400
                      "
                    >

                      Không tìm thấy danh mục phù hợp

                    </td>

                  </tr>
                `
            }

          </tbody>

        </table>

      </div>


      <!-- ================= FOOTER ================= -->

      <div
        class="
          px-6
          py-4
          border-t
          border-neutral-100
          flex
          items-center
          justify-between
        "
      >

        <p class="text-sm text-neutral-500">

          Hiển thị

          <b class="text-neutral-800">
            ${list.length}
          </b>

          /

          <b class="text-neutral-800">
            ${categories.length}
          </b>

          danh mục

        </p>

      </div>

    </div>

    ${categoryModal()}
  `;
}
function brandPanel() {
  const keyword = String(adminSearch?.brands || "")
    .trim()
    .toLowerCase();

  // Lấy trạng thái filter, nếu chưa có thì mặc định ALL
  const statusFilter =
    adminSearch.brandStatus || "ALL";

  // Lấy kiểu sắp xếp, mặc định mới nhất
  const sortType =
    adminSearch.brandSort || "newest";


  // =========================
  // LỌC
  // =========================
  let list = (Array.isArray(brands) ? brands : []).filter(b => {

    const name =
      String(b?.brandName || "").toLowerCase();

    const description =
      String(b?.description || "").toLowerCase();

    const status =
      String(b?.status || "ACTIVE").toUpperCase();


    const matchSearch =
      !keyword ||
      name.includes(keyword) ||
      description.includes(keyword);


    const matchStatus =
      statusFilter === "ALL" ||
      status === statusFilter;


    return matchSearch && matchStatus;
  });


  // =========================
  // SẮP XẾP
  // =========================
  list.sort((a, b) => {

    const idA = Number(a?.brandId || 0);
    const idB = Number(b?.brandId || 0);

    if (sortType === "oldest") {
      return idA - idB;
    }

    return idB - idA;
  });


  // =========================
  // ĐẾM SẢN PHẨM THEO BRAND
  // =========================
  const productCountMap = new Map();

  (Array.isArray(products) ? products : []).forEach(p => {

    const brandId = Number(
      p?.brand?.brandId ??
      p?.brandId ??
      p?.brand_id ??
      0
    );

    if (!brandId) return;

    productCountMap.set(
      brandId,
      (productCountMap.get(brandId) || 0) + 1
    );
  });


  return `
    <div class="soft-card overflow-hidden">


      <!-- ===================================== -->
      <!-- TOOLBAR -->
      <!-- ===================================== -->

      <div
        class="
          px-5
          py-5
          border-b
          border-neutral-200
          bg-white
        "
      >

        <div
          class="
            flex
            flex-col
            xl:flex-row
            xl:items-center
            gap-3
          "
        >


          <!-- SEARCH -->
          <div class="relative flex-1">

            <span
              class="
                absolute
                left-4
                top-1/2
                -translate-y-1/2
                text-neutral-400
                pointer-events-none
              "
            >
              ${icon("search", "w-5 h-5")}
            </span>


            <input
              type="text"
              data-search="brands"

              value="${escapeHtml(
                adminSearch?.brands || ""
              )}"

              placeholder="Tìm kiếm thương hiệu..."

              autocomplete="off"

              oninput="
                searchAdmin(
                  'brands',
                  this.value
                )
              "

              class="
                w-full
                border
                border-neutral-200
                rounded-xl
                pl-12
                pr-4
                py-3
                text-sm
                bg-white
                outline-none
                focus:border-red-800
              "
            >

          </div>


          <!-- ================================= -->
          <!-- FILTER TRẠNG THÁI -->
          <!-- ================================= -->

          <select
            onchange="
              adminSearch.brandStatus =
                this.value;

              render();
            "

            class="
              border
              border-neutral-200
              rounded-xl
              px-2
              py-3
              text-sm
              bg-white
              outline-none
              min-w-[190px]
              cursor-pointer
              focus:border-red-800
            "
          >

            <option
              value="ALL"
              ${
                statusFilter === "ALL"
                  ? "selected"
                  : ""
              }
            >
              Tất cả trạng thái
            </option>


            <option
              value="ACTIVE"
              ${
                statusFilter === "ACTIVE"
                  ? "selected"
                  : ""
              }
            >
              Đang hiển thị
            </option>


            <option
              value="INACTIVE"
              ${
                statusFilter === "INACTIVE"
                  ? "selected"
                  : ""
              }
            >
              Đã ẩn
            </option>

          </select>


          <!-- ================================= -->
          <!-- SORT MỚI / CŨ -->
          <!-- ================================= -->

          <select
            onchange="
              adminSearch.brandSort =
                this.value;

              render();
            "

            class="
              border
              border-neutral-200
              rounded-xl
              px-2
              py-3
              text-sm
              bg-white
              outline-none
              min-w-[160px]
              cursor-pointer
              focus:border-red-800
            "
          >

            <option
              value="newest"
              ${
                sortType === "newest"
                  ? "selected"
                  : ""
              }
            >
              Mới nhất
            </option>


            <option
              value="oldest"
              ${
                sortType === "oldest"
                  ? "selected"
                  : ""
              }
            >
              Cũ nhất
            </option>

          </select>


          <!-- ================================= -->
          <!-- ADD BRAND -->
          <!-- ================================= -->

          <button
            type="button"

            onclick="openBrandForm()"

            class="
              bg-red-800
              hover:bg-red-900
              text-white
              rounded-xl
              px-5
              py-3
              font-semibold
              text-sm
              whitespace-nowrap
              inline-flex
              items-center
              justify-center
              gap-2
            "
          >

            ${icon(
              "plus",
              "w-4 h-4"
            )}

            Thêm thương hiệu

          </button>

        </div>

      </div>


      <!-- ===================================== -->
      <!-- TABLE -->
      <!-- ===================================== -->

      <div class="overflow-x-auto">

        <table class="w-full text-left">

          <thead
            class="
              bg-neutral-50
              text-sm
              text-neutral-500
            "
          >

            <tr>

              <th class="px-5 py-4 w-[70px]">
                #
              </th>

              <th class="px-5 py-4">
                Tên thương hiệu
              </th>

              <th class="px-5 py-4">
                Mô tả
              </th>

              <th
                class="
                  px-5
                  py-4
                  text-center
                  whitespace-nowrap
                "
              >
                Số sản phẩm
              </th>

              <th
                class="
                  px-5
                  py-4
                  text-center
                  whitespace-nowrap
                "
              >
                Trạng thái
              </th>

              <th
                class="
                  px-5
                  py-4
                  text-center
                  whitespace-nowrap
                "
              >
                Hành động
              </th>

            </tr>

          </thead>


          <tbody>

            ${
              list.length

                ? list.map((b, index) => {

                    const brandId =
                      Number(
                        b?.brandId || 0
                      );


                    const brandName =
                      escapeHtml(
                        b?.brandName ||
                        "Chưa có tên"
                      );


                    const description =
                      escapeHtml(
                        b?.description ||
                        "Không có mô tả"
                      );


                    const status =
                      String(
                        b?.status ||
                        "ACTIVE"
                      ).toUpperCase();


                    const active =
                      status === "ACTIVE";


                    const productCount =
                      productCountMap.get(
                        brandId
                      ) || 0;


                    return `

                      <tr
                        class="
                          border-t
                          border-neutral-100
                          hover:bg-neutral-50/60
                        "
                      >


                        <!-- STT -->

                        <td
                          class="
                            px-5
                            py-5
                            text-neutral-500
                          "
                        >
                          ${index + 1}
                        </td>


                        <!-- BRAND NAME -->

                        <td class="px-5 py-5">

                          <div
                            class="
                              flex
                              items-center
                              gap-3
                            "
                          >

                            <div
                              class="
                                w-10
                                h-10
                                rounded-xl
                                bg-neutral-100
                                border
                                border-neutral-200
                                flex
                                items-center
                                justify-center
                                font-bold
                                text-red-800
                                shrink-0
                              "
                            >
                              ${
                                brandName
                                  .charAt(0)
                                  .toUpperCase()
                              }
                            </div>


                            <span
                              class="
                                font-semibold
                                text-neutral-900
                              "
                            >
                              ${brandName}
                            </span>

                          </div>

                        </td>


                        <!-- DESCRIPTION -->

                        <td
                          class="
                            px-5
                            py-5
                            text-neutral-500
                          "
                        >
                          ${description}
                        </td>


                        <!-- PRODUCT COUNT -->

                        <td
                          class="
                            px-5
                            py-5
                            text-center
                            font-semibold
                          "
                        >
                          ${productCount}
                        </td>


                        <!-- STATUS -->

                        <td
                          class="
                            px-5
                            py-5
                            text-center
                          "
                        >

                          <span
                            class="
                              inline-flex
                              rounded-full
                              px-3
                              py-1
                              text-xs
                              font-semibold

                              ${
                                active

                                  ? "bg-green-50 text-green-700"

                                  : "bg-neutral-100 text-neutral-500"
                              }
                            "
                          >

                            ${
                              active
                                ? "Đang hiển thị"
                                : "Đã ẩn"
                            }

                          </span>

                        </td>


                        <!-- ACTION -->

                        <td class="px-5 py-5">

                          <div
                            class="
                              flex
                              justify-center
                              items-center
                              gap-2
                            "
                          >


                            <button
                              type="button"

                              onclick="
                                openBrandForm(
                                  ${brandId}
                                )
                              "

                              title="Sửa"

                              class="
                                w-10
                                h-10
                                rounded-xl
                                border
                                border-neutral-200
                                flex
                                items-center
                                justify-center
                                text-neutral-600
                                hover:bg-neutral-50
                                hover:text-red-800
                              "
                            >

                              ${icon(
                                "pencil",
                                "w-4 h-4"
                              )}

                            </button>


                            <button
                              type="button"

                              onclick="
                                deleteBrand(
                                  ${brandId}
                                )
                              "

                              title="Xóa"

                              class="
                                w-10
                                h-10
                                rounded-xl
                                border
                                border-red-100
                                flex
                                items-center
                                justify-center
                                text-red-600
                                hover:bg-red-50
                              "
                            >

                              ${icon(
                                "trash-2",
                                "w-4 h-4"
                              )}

                            </button>


                          </div>

                        </td>

                      </tr>

                    `;

                  }).join("")

                : `

                  <tr>

                    <td
                      colspan="6"

                      class="
                        px-6
                        py-16
                        text-center
                        text-neutral-400
                      "
                    >

                      Không tìm thấy thương hiệu phù hợp

                    </td>

                  </tr>

                `
            }

          </tbody>

        </table>

      </div>


      <!-- ===================================== -->
      <!-- FOOTER -->
      <!-- ===================================== -->

      <div
        class="
          px-5
          py-4
          border-t
          border-neutral-200
          bg-white
          text-sm
          text-neutral-500
        "
      >

        Hiển thị

        <b class="text-neutral-800">
          ${list.length}
        </b>

        /

        <b class="text-neutral-800">
          ${
            Array.isArray(brands)
              ? brands.length
              : 0
          }
        </b>

        thương hiệu

      </div>

    </div>


    ${
      typeof brandModal === "function"
        ? brandModal()
        : ""
    }
  `;
}
function userTable(){
  const list = users.filter(u =>
    (u.fullname || "").toLowerCase().includes(adminSearch.users) ||
    (u.email || "").toLowerCase().includes(adminSearch.users) ||
    (u.phone || "").toLowerCase().includes(adminSearch.users) ||
    (u.role || "").toLowerCase().includes(adminSearch.users)
  );

  return `<div class="soft-card overflow-hidden">
    ${adminToolbar("users", "Quản lý người dùng", "Thêm", "openUserForm()")}

    <div class="overflow-x-auto">
      <table class="w-full text-left">
        <thead class="bg-neutral-50 text-sm text-neutral-500">
          <tr>
            <th class="p-4">Tên</th>
            <th>Email</th>
            <th>SĐT</th>
            <th>Vai trò</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>

        <tbody>
          ${
            list.map(u => `
              <tr class="border-t">
                <td class="p-4 font-semibold">${u.fullname || "Chưa có"}</td>
                <td>${u.email}</td>
                <td>${u.phone || "-"}</td>
                <td><span class="rounded-full bg-neutral-100 px-3 py-1 text-sm">${u.role}</span></td>
                <td>${u.status}</td>
                <td class="space-x-2">
                  <button onclick="openUserForm(${u.userId})" class="border rounded-full px-2 py-2 text-sm">Sửa</button>
                  <button onclick="deleteUser(${u.userId})" class="bg-red-800 text-white rounded-full px-2 py-2 text-sm">Xóa</button>
                </td>
              </tr>
            `).join("") || `<tr><td colspan="6" class="p-6 text-center text-neutral-500">Chưa có người dùng</td></tr>`
          }
        </tbody>
      </table>
    </div>
  </div>${userModal()}`;
}

function userModal(){
  return `<div id="userModal" class="fixed inset-0 bg-black/40 z-[999] hidden items-center justify-center p-5">
    <div class="bg-white rounded-3xl p-7 w-full max-w-lg shadow-xl">
      <div class="flex justify-between items-center mb-5">
        <h2 id="userFormTitle" class="serif text-3xl">Thêm người dùng</h2>
        <button onclick="closeUserForm()" class="text-2xl">×</button>
      </div>

      <input type="hidden" id="userId">

      <div class="space-y-4">
        <input id="userFullname" class="input-ui" placeholder="Họ tên">
        <input id="userEmail" class="input-ui" placeholder="Email">
        <input id="userPhone" class="input-ui" placeholder="Số điện thoại">
        <input id="userPassword" type="password" class="input-ui" placeholder="Mật khẩu">

        <select id="userRole" class="input-ui">
          <option value="USER">USER</option>
          <option value="STAFF">STAFF</option>
          <option value="ADMIN">ADMIN</option>
        </select>

        <select id="userStatus" class="input-ui">
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
        </select>

        <textarea id="userAddress" class="input-ui" placeholder="Địa chỉ"></textarea>

        <button onclick="saveUser()" class="btn-primary w-full">Lưu người dùng</button>
      </div>
    </div>
  </div>`;
}

function content() {
  if (currentTab === "products") return productTable();
  if (currentTab === "categories") return categoryPanel();
  if (currentTab === "brands") return brandPanel();
  if (currentTab === "orders") return orderTable();
  if (currentTab === "variants") return variantPanel();
  if (currentTab === "users") return userTable();
  if (currentTab === "reviews") return reviewPanel();
  if (currentTab === "promo") return voucherPanel();
  if (currentTab === "payos") return payosPanel();
  if (currentTab === "reports") return reportPanel();

  return `
    ${statCards()}
    ${overviewCharts()}
  `;
}


function adminPage() {
  const a = admin();

  if (!a) return loginPage();

  const name = escapeHtml(a.fullname || a.email || "Admin");
  const initial = name.charAt(0).toUpperCase();

  const { from, to } = overviewRange();

  const pageNames = {
    overview: "Tổng quan",
    products: "Quản lý sản phẩm",
    categories: "Danh mục",
    brands: "Thương hiệu",
    orders: "Quản lý đơn hàng",
    variants: "Biến thể sản phẩm",
    users: "Quản lý người dùng",
    reviews: "Quản lý đánh giá",
    promo: "Voucher",
    payos: "Lịch sử PayOS",
    reports: "Báo cáo thống kê"
  };

  return `
    <main class="admin-dashboard">
      <div class="admin-layout">

        ${sidebar()}

        <div class="admin-main">

          <header class="admin-topbar">

            <div class="admin-notification">
              <button type="button"
                title="Xem đơn hàng"
                onclick="setTab('orders')">

                ${icon("bell", "w-5 h-5")}
              </button>
            </div>

            <div class="admin-profile relative">

              <button type="button"
                onclick="toggleAdminProfile()"
                class="flex items-center gap-3">

                <span class="admin-avatar">${initial}</span>

                <span>${name}</span>

                ${icon("chevron-down", "w-4 h-4")}
              </button>

              <div id="adminProfileMenu"
                class="hidden absolute right-0 top-full mt-3 bg-white border rounded-xl shadow-xl p-2 z-50 min-w-[150px]">

                <button type="button"
                  onclick="logoutAdmin()"
                  class="w-full text-left px-2 py-3 rounded-lg hover:bg-red-50 text-red-800 font-semibold">

                  ${icon("log-out", "w-4 h-4 inline-block")}
                  Đăng xuất
                </button>
              </div>

            </div>
          </header>

          <section class="admin-content">

            <div class="admin-page-heading">
              <div>
                <h1>${pageNames[currentTab] || "Quản trị"}</h1>

                <p>
                  ${currentTab === "overview"
                    ? "Thống kê tổng quan hoạt động của hệ thống JODOK"
                    : "Quản lý dữ liệu và hoạt động hệ thống JODOK"}
                </p>
              </div>

              ${currentTab === "overview" ? `
                <div class="admin-date-filter">
                  ${icon("calendar-days", "w-4 h-4")}

                  <input
                    id="overviewFrom"
                    type="date"
                    value="${from}"
                    onchange="changeOverviewDates()"
                    aria-label="Từ ngày">

                  <span>–</span>

                  <input
                    id="overviewTo"
                    type="date"
                    value="${to}"
                    onchange="changeOverviewDates()"
                    aria-label="Đến ngày">
                </div>
              ` : ""}
            </div>

            <div class="admin-page-body">
              ${content()}
            </div>

          </section>
        </div>
      </div>
    </main>
  `;
}

async function loginAdmin(){
  const body = {email:document.getElementById("adminEmail").value.trim(), password:document.getElementById("adminPassword").value};
  const res = await fetch(`${API_BASE}/auth/login`, {
    method:"POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if(!res.ok){document.getElementById("adminMsg").innerText = data.message || "Đăng nhập thất bại"; return;}
  if(data.role !== "ADMIN"){document.getElementById("adminMsg").innerText = "Tài khoản không có quyền Admin"; return;}
  localStorage.setItem("ha_admin", JSON.stringify(data));
  await init();
}

function logoutAdmin(){

   localStorage.removeItem("ha_admin");
   localStorage.removeItem("token");

   location.reload();
}
function setTab(tab) {
  console.log("CHANGE TAB:", tab);

  // đóng các modal đang mở trước khi chuyển trang
  document
    .querySelectorAll(
      "#variantModal, #productModal, #orderModal, #userModal"
    )
    .forEach(modal => {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
    });

  currentTab = tab;

  // reset riêng dữ liệu phân trang khi vào sản phẩm
  if (tab === "products") {
    productPage = 1;
  }

  try {
    render();
  } catch (error) {
    console.error("SET TAB ERROR:", error);

    const app = document.getElementById("app");

    if (app) {
      app.innerHTML = `
        <div style="
          padding:40px;
          font-family:Arial,sans-serif;
        ">
          <h2 style="color:#991b1b;">
            Lỗi khi mở trang ${tab}
          </h2>

          <pre style="
            margin-top:20px;
            padding:20px;
            background:#f5f5f5;
            border-radius:12px;
            white-space:pre-wrap;
          ">${escapeHtml(error?.stack || error?.message || String(error))}</pre>

          <button
            type="button"
            onclick="currentTab='overview'; render();"
            style="
              margin-top:20px;
              padding:10px 18px;
              border:0;
              border-radius:8px;
              background:#991b1b;
              color:white;
              cursor:pointer;
            "
          >
            Quay lại Tổng quan
          </button>
        </div>
      `;
    }
  }
}


function render() {
  const app = document.getElementById("app");

  if (!app) {
    console.error("Không tìm thấy #app");
    return;
  }

  try {
    app.innerHTML = adminPage();

    if (
      window.lucide &&
      typeof window.lucide.createIcons === "function"
    ) {
      window.lucide.createIcons();
    }
  } catch (error) {
    console.error("RENDER ERROR:", error);
    throw error;
  }
}


async function init() {
  try {
    await loadData();
    render();
  } catch (error) {
    console.error("INIT ERROR:", error);

    showToast?.(
      "Lỗi",
      "Không thể tải dữ liệu quản trị.",
      "error"
    );
  }
}
init();

function productModal(){
  return `
    <div id="productModal" class="admin-product-modal hidden">

      <div class="admin-product-modal-box">

        <!-- HEADER -->
        <div class="admin-product-form-header">

          <div>
            <h2 id="productFormTitle">
              Thêm sản phẩm
            </h2>

            <p>
              Nhập thông tin sản phẩm trong hệ thống JODOK
            </p>
          </div>

          <button
            type="button"
            class="admin-product-modal-close"
            onclick="closeProductForm()"
          >
            ${icon("x", "w-5 h-5")}
          </button>

        </div>


        <!-- ID SẢN PHẨM - BẮT BUỘC -->
        <input
          type="hidden"
          id="productId"
        >


        <!-- BODY -->
        <div class="admin-product-form-body">


          <!-- ================= LEFT ================= -->
          <div class="admin-product-form-left">


            <!-- TÊN -->
            <div class="admin-form-group">

              <label for="productName">
                Tên sản phẩm
                <span>*</span>
              </label>

              <input
                id="productName"
                type="text"
                placeholder="Nhập tên sản phẩm"
                autocomplete="off"
              >

            </div>


            <!-- BRAND + CATEGORY -->
            <div class="admin-form-row">

              <div class="admin-form-group">

                <label for="productBrand">
                  Thương hiệu
                </label>

                <select id="productBrand">

                  <option value="">
                    Không chọn thương hiệu
                  </option>

                  ${brands.map(b => `
                    <option value="${b.brandId}">
                      ${escapeHtml(b.brandName || "")}
                    </option>
                  `).join("")}

                </select>

              </div>


              <div class="admin-form-group">

                <label for="productCategory">
                  Danh mục
                  <span>*</span>
                </label>

                <select id="productCategory">

                  <option value="">
                    Chọn danh mục
                  </option>

                  ${categories.map(c => `
                    <option value="${c.categoryId}">
                      ${escapeHtml(c.categoryName || "")}
                    </option>
                  `).join("")}

                </select>

              </div>

            </div>


            <!-- DESCRIPTION -->
            <div class="admin-form-group">

              <label for="productDesc">
                Mô tả
              </label>

              <div class="admin-description-editor">

                <div class="admin-editor-toolbar">
                  <button type="button"><b>B</b></button>
                  <button type="button"><i>I</i></button>
                  <button type="button"><u>U</u></button>
                  <span></span>
                  <button type="button">≡</button>
                  <button type="button">•</button>
                </div>

                <textarea
                  id="productDesc"
                  placeholder="Nhập mô tả sản phẩm..."
                ></textarea>

              </div>

            </div>


            <!-- IMAGE -->
            <div class="admin-form-group">

              <label>
                Hình ảnh sản phẩm
              </label>


              <!-- CLICK UPLOAD -->
              <div
                class="admin-product-upload"
                onclick="document.getElementById('productImageFile').click()"
              >

                <div class="admin-upload-icon">
                  ${icon("image-up", "w-7 h-7")}
                </div>

                <strong>
                  Kéo thả hình ảnh vào đây hoặc
                  <em>chọn file</em>
                </strong>

                <small>
                  JPG, JPEG, PNG, WEBP
                </small>

              </div>


              <!-- INPUT THẬT -->
              <input
                id="productImageFile"
                type="file"
                accept="image/*"
                multiple
                hidden
                onchange="previewImage(event)"
              >


              <!-- PREVIEW -->
              <div class="admin-product-preview-box">

                <img
                  id="previewImage"
                  class="admin-product-preview-image hidden"
                  alt="Ảnh sản phẩm"
                >

              </div>


              <p class="admin-upload-note">
                Có thể chọn tối đa 3 ảnh sản phẩm
              </p>

            </div>

          </div>


          <!-- ================= RIGHT ================= -->
          <div class="admin-product-form-right">

            <h3>
              Thông tin cơ bản
            </h3>


            <!-- PRICE -->
            <div class="admin-form-group">

              <label for="productPrice">
                Giá gốc
              </label>

              <div class="admin-price-input">

                <input
                  id="productPrice"
                  type="number"
                  min="0"
                  placeholder="150000"
                >

                <span>đ</span>

              </div>

            </div>


            <!-- STATUS -->
            <div class="admin-form-group">

              <label for="productStatus">
                Trạng thái
              </label>

              <select id="productStatus">

                <option value="ACTIVE">
                  Đang bán
                </option>

                <option value="INACTIVE">
                  Ngừng bán
                </option>

              </select>

            </div>

          </div>

        </div>


        <!-- FOOTER -->
        <div class="admin-product-form-footer">

          <button
            type="button"
            class="admin-product-cancel-btn"
            onclick="closeProductForm()"
          >
            Hủy
          </button>


          <button
            type="button"
            class="admin-product-save-btn"
            onclick="saveProduct()"
          >
            ${icon("save", "w-4 h-4")}

            <span>
              Lưu sản phẩm
            </span>
          </button>

        </div>

      </div>

    </div>
  `;
}

// =====================================================
// VARIANT - HELPERS
// =====================================================

function getVariantProductId(v){
  return (
    v?.product?.productId ??
    v?.productId ??
    v?.product_id ??
    ""
  );
}

function getVariantProductName(v){
  return (
    v?.product?.productName ||
    v?.productName ||
    "Không rõ"
  );
}

function changeVariantProductFilter(value){
  variantProductFilter = value || "ALL";
  variantPage = 1;
  render();
}

let variantSearchTimer = null;

function searchVariantAdmin(input){
  if(input?.isComposing){
    return;
  }

  clearTimeout(variantSearchTimer);

  variantSearchTimer = setTimeout(() => {
    adminSearch.variants =
      String(input?.value || "")
        .trim()
        .toLowerCase();

    variantPage = 1;

    render();

    requestAnimationFrame(() => {
      const searchInput =
        document.getElementById("variantSearch");

      if(searchInput){
        searchInput.focus();

        const end =
          searchInput.value.length;

        searchInput.setSelectionRange(
          end,
          end
        );
      }
    });
  }, 250);
}

function finishVariantSearch(input){
  clearTimeout(variantSearchTimer);

  adminSearch.variants =
    String(input?.value || "")
      .trim()
      .toLowerCase();

  variantPage = 1;

  render();

  requestAnimationFrame(() => {
    const searchInput =
      document.getElementById("variantSearch");

    if(searchInput){
      searchInput.focus();

      const end =
        searchInput.value.length;

      searchInput.setSelectionRange(
        end,
        end
      );
    }
  });
}

function changeVariantPage(page){
  const value = Number(page);

  if(
    !Number.isFinite(value) ||
    value < 1
  ){
    return;
  }

  variantPage = value;
  render();
}

function getVariantStatusInfo(v){
  const status =
    String(v?.status || "ACTIVE")
      .toUpperCase();

  if(status === "ACTIVE"){
    return {
      text: "Đang bán",
      className:
        "bg-green-50 text-green-700"
    };
  }

  return {
    text: "Ngừng bán",
    className:
      "bg-red-50 text-red-700"
  };
}

function getVariantColorStyle(color){
  const value =
    String(color || "")
      .trim()
      .toLowerCase();

  const colorMap = {
    "trắng": "#ffffff",
    "white": "#ffffff",

    "đen": "#171717",
    "black": "#171717",

    "đỏ": "#dc2626",
    "red": "#dc2626",

    "xanh": "#2563eb",
    "blue": "#2563eb",
    "xanh dương": "#2563eb",

    "xanh lá": "#16a34a",
    "green": "#16a34a",

    "vàng": "#eab308",
    "yellow": "#eab308",

    "hồng": "#ec4899",
    "pink": "#ec4899",

    "tím": "#9333ea",
    "purple": "#9333ea",

    "cam": "#f97316",
    "orange": "#f97316",

    "nâu": "#92400e",
    "brown": "#92400e",

    "xám": "#9ca3af",
    "gray": "#9ca3af",
    "grey": "#9ca3af",

    "bạc": "#cbd5e1",
    "silver": "#cbd5e1",

    "be": "#e7d7bd",
    "beige": "#e7d7bd"
  };

  return (
    colorMap[value] ||
    "#e5e7eb"
  );
}


// =====================================================
// VARIANT PAGINATION
// =====================================================

function variantPagination(totalPages){
  if(totalPages <= 1){
    return "";
  }

  let pages = [];

  if(totalPages <= 5){

    for(
      let i = 1;
      i <= totalPages;
      i++
    ){
      pages.push(i);
    }

  }else{

    pages.push(1);

    if(variantPage > 3){
      pages.push("...");
    }

    const start =
      Math.max(
        2,
        variantPage - 1
      );

    const end =
      Math.min(
        totalPages - 1,
        variantPage + 1
      );

    for(
      let i = start;
      i <= end;
      i++
    ){
      pages.push(i);
    }

    if(
      variantPage <
      totalPages - 2
    ){
      pages.push("...");
    }

    pages.push(totalPages);
  }


  return `
    <div
      class="
        flex
        items-center
        gap-1
      "
    >

      <button
        type="button"

        onclick="
          changeVariantPage(
            ${variantPage - 1}
          )
        "

        ${
          variantPage <= 1
            ? "disabled"
            : ""
        }

        class="
          w-8 h-8
          flex
          items-center
          justify-center

          border
          rounded-lg

          bg-white
          text-neutral-500

          hover:bg-neutral-50

          disabled:opacity-40
          disabled:cursor-not-allowed
        "

        title="Trang trước"
      >
        ${icon(
          "chevron-left",
          "w-4 h-4"
        )}
      </button>


      ${pages.map(page => {

        if(page === "..."){
          return `
            <span
              class="
                w-8 h-8

                flex
                items-center
                justify-center

                text-sm
                text-neutral-400
              "
            >
              ...
            </span>
          `;
        }


        const active =
          Number(page) ===
          Number(variantPage);


        return `
          <button
            type="button"

            onclick="
              changeVariantPage(
                ${page}
              )
            "

            class="
              w-8 h-8

              flex
              items-center
              justify-center

              rounded-lg

              text-sm
              font-semibold

              transition

              ${
                active
                  ? `
                    bg-red-800
                    text-white
                    border
                    border-red-800
                  `
                  : `
                    bg-white
                    text-neutral-600
                    border

                    hover:bg-neutral-50
                  `
              }
            "
          >
            ${page}
          </button>
        `;

      }).join("")}


      <button
        type="button"

        onclick="
          changeVariantPage(
            ${variantPage + 1}
          )
        "

        ${
          variantPage >= totalPages
            ? "disabled"
            : ""
        }

        class="
          w-8 h-8

          flex
          items-center
          justify-center

          border
          rounded-lg

          bg-white
          text-neutral-500

          hover:bg-neutral-50

          disabled:opacity-40
          disabled:cursor-not-allowed
        "

        title="Trang sau"
      >
        ${icon(
          "chevron-right",
          "w-4 h-4"
        )}
      </button>

    </div>
  `;
}


// =====================================================
// VARIANT PANEL
// =====================================================

function variantPanel(){

  const keyword =
    String(
      adminSearch.variants || ""
    )
      .trim()
      .toLowerCase();


  // ===============================
  // FILTER
  // ===============================

  let list =
    variants.filter(v => {

      const productId =
        String(
          getVariantProductId(v)
        );

      const productName =
        String(
          getVariantProductName(v)
        ).toLowerCase();

      const sku =
        String(
          v?.sku || ""
        ).toLowerCase();

      const size =
        String(
          v?.size || ""
        ).toLowerCase();

      const color =
        String(
          v?.color || ""
        ).toLowerCase();


      const matchSearch =
        !keyword ||
        productName.includes(keyword) ||
        sku.includes(keyword) ||
        size.includes(keyword) ||
        color.includes(keyword);


      const matchProduct =
        variantProductFilter === "ALL" ||
        productId ===
          String(
            variantProductFilter
          );


      return (
        matchSearch &&
        matchProduct
      );
    });


  // ===============================
  // PAGINATION
  // ===============================

  const totalItems =
    list.length;


  const totalPages =
    Math.max(
      1,
      Math.ceil(
        totalItems /
        variantPageSize
      )
    );


  if(variantPage > totalPages){
    variantPage = totalPages;
  }

  if(variantPage < 1){
    variantPage = 1;
  }


  const startIndex =
    (variantPage - 1) *
    variantPageSize;


  const pageList =
    list.slice(
      startIndex,
      startIndex +
      variantPageSize
    );


  // ===============================
  // PRODUCT FILTER OPTIONS
  // ===============================

  const productOptions =
    [...products]

      .sort((a, b) =>
        String(
          a?.productName || ""
        ).localeCompare(
          String(
            b?.productName || ""
          ),
          "vi"
        )
      )

      .map(p => {

        const id =
          p?.productId ?? "";

        const selected =
          String(
            variantProductFilter
          ) ===
          String(id)
            ? "selected"
            : "";


        return `
          <option
            value="${id}"
            ${selected}
          >
            ${escapeHtml(
              p?.productName ||
              "Không tên"
            )}
          </option>
        `;

      }).join("");


  // ===============================
  // HTML
  // ===============================

  return `
    <div
      class="
        soft-card
        overflow-hidden
        bg-white
      "
    >

      <!-- HEADER -->
      <div
        class="
          px-5 py-4
          border-b

          flex
          flex-col

          lg:flex-row
          lg:items-center
          lg:justify-between

          gap-4
        "
      >

        <div
          class="
            flex
            flex-col
            sm:flex-row

            items-stretch

            gap-3

            w-full
            lg:w-auto
          "
        >

          <!-- SEARCH -->
          <div
            class="
              relative
              w-full
              sm:w-[260px]
            "
          >

            <span
              class="
                absolute
                left-3
                top-1/2
                -translate-y-1/2

                text-neutral-400

                pointer-events-none
              "
            >
              ${icon(
                "search",
                "w-4 h-4"
              )}
            </span>


            <input
              id="variantSearch"

              type="text"

              value="${escapeHtml(
                adminSearch.variants || ""
              )}"

              oninput="
                searchVariantAdmin(this)
              "

              oncompositionend="
                finishVariantSearch(this)
              "

              placeholder="
                Tìm kiếm biến thể...
              "

              class="
                w-full
                h-10

                border
                border-neutral-200

                rounded-lg

                pl-9
                pr-3

                text-sm

                outline-none
                bg-white

                focus:border-red-700
                focus:ring-1
                focus:ring-red-100
              "
            >
          </div>


          <!-- PRODUCT FILTER -->
          <div
            class="
              relative
              w-full
              sm:w-[190px]
            "
          >

            <select
              onchange="
                changeVariantProductFilter(
                  this.value
                )
              "

              class="
                appearance-none

                w-full
                h-10

                border
                border-neutral-200

                rounded-lg

                bg-white

                pl-3
                pr-9

                text-sm

                outline-none
                cursor-pointer

                focus:border-red-700
              "
            >

              <option
                value="ALL"

                ${
                  variantProductFilter ===
                  "ALL"
                    ? "selected"
                    : ""
                }
              >
                Chọn sản phẩm
              </option>

              ${productOptions}

            </select>


            <span
              class="
                absolute

                right-3
                top-1/2
                -translate-y-1/2

                pointer-events-none

                text-neutral-400
              "
            >
              ${icon(
                "chevron-down",
                "w-4 h-4"
              )}
            </span>

          </div>


          <!-- ADD -->
          <button
            type="button"

            onclick="
              openVariantForm()
            "

            class="
              h-10

              px-4

              rounded-lg

              bg-red-800
              text-white

              text-sm
              font-semibold

              whitespace-nowrap

              hover:bg-red-900

              transition
            "
          >
            + Thêm
          </button>

        </div>

      </div>


      <!-- TABLE -->
      <div class="overflow-x-auto">

        <table
          class="
            w-full
            text-left
            border-collapse
          "
        >

          <thead
            class="
              bg-neutral-50

              text-[13px]
              text-neutral-500
            "
          >

            <tr>

              <th
                class="
                  px-5 py-3
                  w-[55px]
                  font-semibold
                "
              >
                #
              </th>

              <th
                class="
                  px-3 py-3
                  font-semibold
                "
              >
                Sản phẩm
              </th>

              <th
                class="
                  px-3 py-3
                  w-[80px]
                  font-semibold
                "
              >
                Size
              </th>

              <th
                class="
                  px-3 py-3
                  w-[145px]
                  font-semibold
                "
              >
                Màu sắc
              </th>

              <th
                class="
                  px-3 py-3
                  w-[125px]
                  font-semibold
                "
              >
                Giá
              </th>

              <th
                class="
                  px-3 py-3
                  w-[90px]
                  font-semibold
                "
              >
                Tồn kho
              </th>

              <th
                class="
                  px-3 py-3
                  w-[125px]
                  font-semibold
                "
              >
                Trạng thái
              </th>

              <th
                class="
                  px-3 py-3
                  w-[115px]

                  text-center
                  font-semibold
                "
              >
                Hành động
              </th>

            </tr>

          </thead>


          <tbody>

            ${
              pageList.length

                ? pageList.map(
                    (v, index) => {

                      const status =
                        getVariantStatusInfo(v);

                      const color =
                        v?.color || "";

                      const colorStyle =
                        getVariantColorStyle(
                          color
                        );

                      const number =
                        startIndex +
                        index +
                        1;


                      return `
                        <tr
                          class="
                            border-t
                            border-neutral-100

                            hover:bg-neutral-50/70

                            transition
                          "
                        >

                          <td
                            class="
                              px-5 py-3

                              text-sm
                              text-neutral-600
                            "
                          >
                            ${number}
                          </td>


                          <td
                            class="
                              px-3 py-3

                              font-semibold
                              text-sm

                              text-neutral-800
                            "
                          >
                            ${escapeHtml(
                              getVariantProductName(v)
                            )}
                          </td>


                          <td
                            class="
                              px-3 py-3
                              text-sm
                            "
                          >
                            ${escapeHtml(
                              v?.size || "-"
                            )}
                          </td>


                          <td
                            class="
                              px-3 py-3
                            "
                          >

                            <div
                              class="
                                flex
                                items-center
                                gap-2
                              "
                            >

                              <span
                                class="
                                  inline-block

                                  w-5 h-5

                                  rounded

                                  border
                                  border-neutral-300

                                  shrink-0
                                "

                                style="
                                  background:
                                  ${colorStyle};
                                "
                              ></span>


                              <span
                                class="
                                  text-sm
                                  text-neutral-700
                                "
                              >
                                ${escapeHtml(
                                  color || "-"
                                )}
                              </span>

                            </div>

                          </td>


                          <td
                            class="
                              px-3 py-3

                              text-sm
                              font-semibold

                              text-neutral-800
                            "
                          >
                            ${money(
                              v?.price
                            )}
                          </td>


                          <td
                            class="
                              px-3 py-3

                              text-sm
                              font-semibold
                            "
                          >
                            ${Number(
                              v?.stock ?? 0
                            ).toLocaleString(
                              "vi-VN"
                            )}
                          </td>


                          <td
                            class="
                              px-3 py-3
                            "
                          >

                            <span
                              class="
                                inline-flex

                                items-center

                                rounded-full

                                px-3 py-1

                                text-xs
                                font-medium

                                ${status.className}
                              "
                            >
                              ${status.text}
                            </span>

                          </td>


                          <td
                            class="
                              px-3 py-3
                            "
                          >

                            <div
                              class="
                                flex
                                items-center
                                justify-center
                                gap-1
                              "
                            >

                              <button
                                type="button"

                                onclick="
                                  openVariantForm(
                                    ${v.variantId}
                                  )
                                "

                                class="
                                  w-8 h-8

                                  inline-flex
                                  items-center
                                  justify-center

                                  rounded-lg

                                  text-red-700

                                  hover:bg-red-50

                                  transition
                                "

                                title="
                                  Sửa biến thể
                                "
                              >
                                ${icon(
                                  "pencil",
                                  "w-4 h-4"
                                )}
                              </button>


                              <button
                                type="button"

                                onclick="
                                  openVariantForm(
                                    ${v.variantId}
                                  )
                                "

                                class="
                                  w-8 h-8

                                  inline-flex
                                  items-center
                                  justify-center

                                  rounded-lg

                                  text-neutral-500

                                  hover:bg-neutral-100

                                  transition
                                "

                                title="
                                  Xem biến thể
                                "
                              >
                                ${icon(
                                  "eye",
                                  "w-4 h-4"
                                )}
                              </button>


                              <button
                                type="button"

                                onclick="
                                  deleteVariant(
                                    ${v.variantId}
                                  )
                                "

                                class="
                                  w-8 h-8

                                  inline-flex
                                  items-center
                                  justify-center

                                  rounded-lg

                                  text-red-700

                                  hover:bg-red-50

                                  transition
                                "

                                title="
                                  Xóa biến thể
                                "
                              >
                                ${icon(
                                  "trash-2",
                                  "w-4 h-4"
                                )}
                              </button>

                            </div>

                          </td>

                        </tr>
                      `;

                    }
                  ).join("")

                : `
                  <tr>

                    <td
                      colspan="8"

                      class="
                        px-6
                        py-12

                        text-center
                        text-neutral-400
                      "
                    >

                      <div
                        class="
                          flex
                          flex-col

                          items-center

                          gap-2
                        "
                      >

                        ${icon(
                          "package-search",
                          "w-8 h-8"
                        )}

                        <span>
                          Không tìm thấy biến thể sản phẩm
                        </span>

                      </div>

                    </td>

                  </tr>
                `
            }

          </tbody>

        </table>

      </div>


      <!-- FOOTER -->
      <div
        class="
          px-5 py-4

          border-t

          flex
          flex-col

          sm:flex-row
          sm:items-center
          sm:justify-between

          gap-3
        "
      >

        <p
          class="
            text-sm
            text-neutral-500
          "
        >
          Hiển thị

          <b class="text-neutral-700">
            ${pageList.length}
          </b>

          /

          <b class="text-neutral-700">
            ${totalItems}
          </b>

          biến thể
        </p>


        ${variantPagination(
          totalPages
        )}

      </div>

    </div>


    ${variantModal()}
  `;
}
function variantModal() {
  return `
    <div
      id="variantModal"
      class="
        fixed inset-0
        z-[9999]
        hidden
        items-center
        justify-center
        bg-black/45
        p-4
      "
    >

      <div
        class="
          bg-white
          w-full
          max-w-2xl
          max-h-[86vh]
          rounded-2xl
          shadow-2xl
          overflow-hidden
          flex
          flex-col
        "
      >

        <!-- HEADER -->
        <div
          class="
            px-6
            py-5
            border-b
            border-neutral-100
            flex
            items-start
            justify-between
            shrink-0
          "
        >

          <div>
            <h2
              id="variantFormTitle"
              class="
                text-2xl
                font-bold
                text-neutral-900
              "
            >
              Thêm biến thể
            </h2>

            <p
              class="
                text-sm
                text-neutral-500
                mt-1
              "
            >
              Thiết lập thuộc tính, giá và tồn kho cho biến thể
            </p>
          </div>


          <button
            type="button"
            onclick="closeVariantForm()"
            class="
              w-9
              h-9
              rounded-lg
              hover:bg-neutral-100
              text-neutral-500
              text-2xl
              inline-flex
              items-center
              justify-center
              transition
            "
          >
            ×
          </button>

        </div>


        <!-- BODY -->
        <div
          class="
            flex-1
            overflow-y-auto
            px-6
            py-5
          "
        >

          <!-- ID -->
          <input
            type="hidden"
            id="variantId"
            value=""
          >


          <!-- SẢN PHẨM -->
          <div class="mb-5">

            <label
              class="
                block
                text-sm
                font-semibold
                text-neutral-700
                mb-2
              "
            >
              Sản phẩm
              <span class="text-red-700">*</span>
            </label>


            <select
              id="variantProductId"
              class="
                w-full
                h-12
                px-4
                rounded-xl
                border
                border-neutral-200
                bg-white
                outline-none
                focus:border-red-800
                focus:ring-2
                focus:ring-red-800/10
                transition
              "
            >

              <option value="">
                Chọn sản phẩm
              </option>

              ${products.map(p => `
                <option value="${p.productId}">
                  ${p.productName}
                </option>
              `).join("")}

            </select>

          </div>


          <!-- THUỘC TÍNH -->
          <div
            class="
              border
              border-neutral-200
              rounded-2xl
              p-4
              mb-5
            "
          >

            <div
              class="
                flex
                items-center
                gap-2
                font-bold
                text-neutral-800
                mb-4
              "
            >
              <span class="text-red-800">
                ⚙
              </span>

              Thuộc tính biến thể
            </div>


            <div
              class="
                grid
                grid-cols-1
                md:grid-cols-2
                gap-4
              "
            >

              <!-- SIZE -->
              <div>

                <label
                  class="
                    block
                    text-sm
                    font-semibold
                    text-neutral-700
                    mb-2
                  "
                >
                  Size
                  <span class="text-red-700">*</span>
                </label>

                <input
                  id="variantSize"
                  type="text"
                  autocomplete="off"
                  placeholder="Ví dụ: S, M, L, XL"
                  class="
                    w-full
                    h-12
                    px-4
                    rounded-xl
                    border
                    border-neutral-200
                    outline-none
                    focus:border-red-800
                    focus:ring-2
                    focus:ring-red-800/10
                  "
                >

              </div>


              <!-- COLOR -->
              <div>

                <label
                  class="
                    block
                    text-sm
                    font-semibold
                    text-neutral-700
                    mb-2
                  "
                >
                  Màu sắc
                  <span class="text-red-700">*</span>
                </label>

                <input
                  id="variantColor"
                  type="text"
                  autocomplete="off"
                  placeholder="Ví dụ: Đen, Trắng"
                  class="
                    w-full
                    h-12
                    px-4
                    rounded-xl
                    border
                    border-neutral-200
                    outline-none
                    focus:border-red-800
                    focus:ring-2
                    focus:ring-red-800/10
                  "
                >

              </div>

            </div>


            <!-- SKU -->
            <div class="mt-4">

              <label
                class="
                  block
                  text-sm
                  font-semibold
                  text-neutral-700
                  mb-2
                "
              >
                SKU
                <span class="text-red-700">*</span>
              </label>

              <input
                id="variantSku"
                type="text"
                autocomplete="off"
                placeholder="Ví dụ: AO-DEN-M"
                class="
                  w-full
                  h-12
                  px-4
                  rounded-xl
                  border
                  border-neutral-200
                  outline-none
                  focus:border-red-800
                  focus:ring-2
                  focus:ring-red-800/10
                "
              >

              <p
                class="
                  mt-2
                  text-xs
                  text-neutral-400
                "
              >
                SKU dùng để nhận diện riêng từng biến thể sản phẩm.
              </p>

            </div>

          </div>


          <!-- GIÁ + TỒN KHO -->
          <div
            class="
              border
              border-neutral-200
              rounded-2xl
              p-4
              mb-5
            "
          >

            <div
              class="
                font-bold
                text-neutral-800
                mb-4
              "
            >
              Giá & tồn kho
            </div>


            <div
              class="
                grid
                grid-cols-1
                md:grid-cols-2
                gap-4
              "
            >

              <!-- PRICE -->
              <div>

                <label
                  class="
                    block
                    text-sm
                    font-semibold
                    text-neutral-700
                    mb-2
                  "
                >
                  Giá biến thể
                  <span class="text-red-700">*</span>
                </label>


                <div class="relative">

                  <input
                    id="variantPrice"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    class="
                      w-full
                      h-12
                      pl-4
                      pr-10
                      rounded-xl
                      border
                      border-neutral-200
                      outline-none
                      focus:border-red-800
                      focus:ring-2
                      focus:ring-red-800/10
                    "
                  >

                  <span
                    class="
                      absolute
                      right-4
                      top-1/2
                      -translate-y-1/2
                      text-neutral-400
                    "
                  >
                    đ
                  </span>

                </div>

              </div>


              <!-- STOCK -->
              <div>

                <label
                  class="
                    block
                    text-sm
                    font-semibold
                    text-neutral-700
                    mb-2
                  "
                >
                  Tồn kho
                  <span class="text-red-700">*</span>
                </label>

                <input
                  id="variantStock"
                  type="number"
                  min="0"
                  step="1"
                  value="0"
                  oninput="
                    if(Number(this.value) < 0){
                      this.value = 0;
                    }
                  "
                  class="
                    w-full
                    h-12
                    px-4
                    rounded-xl
                    border
                    border-neutral-200
                    outline-none
                    focus:border-red-800
                    focus:ring-2
                    focus:ring-red-800/10
                  "
                >

              </div>

            </div>

          </div>


          <!-- STATUS -->
          <div>

            <label
              class="
                block
                text-sm
                font-semibold
                text-neutral-700
                mb-2
              "
            >
              Trạng thái
            </label>


            <select
              id="variantStatus"
              class="
                w-full
                h-12
                px-4
                rounded-xl
                border
                border-neutral-200
                bg-white
                outline-none
                focus:border-red-800
                focus:ring-2
                focus:ring-red-800/10
              "
            >

              <option value="ACTIVE">
                Đang bán
              </option>

              <option value="INACTIVE">
                Ngừng bán
              </option>

            </select>

          </div>

        </div>


        <!-- FOOTER -->
        <div
          class="
            shrink-0
            px-6
            py-4
            border-t
            border-neutral-100
            bg-white
            flex
            items-center
            justify-end
            gap-3
          "
        >

          <button
            type="button"
            onclick="closeVariantForm()"
            class="
              h-10
              px-5
              rounded-xl
              border
              border-neutral-200
              bg-white
              text-sm
              font-semibold
              hover:bg-neutral-50
              transition
            "
          >
            Hủy
          </button>


          <button
            id="variantSaveButton"
            type="button"
            onclick="saveVariant()"
            class="
              h-10
              px-6
              rounded-xl
              bg-red-800
              text-white
              text-sm
              font-bold
              hover:bg-red-900
              transition
              shadow-sm
              inline-flex
              items-center
              gap-2
            "
          >
            ${icon("save", "w-4 h-4")}

            Lưu biến thể
          </button>

        </div>

      </div>

    </div>
  `;
}
function categoryModal(){
  return `<div id="categoryModal" class="fixed inset-0 bg-black/40 z-[999] hidden items-center justify-center p-5">
    <div class="bg-white rounded-3xl p-7 w-full max-w-lg shadow-xl">
      <div class="flex justify-between items-center mb-5"><h2 id="categoryFormTitle" class="serif text-3xl">Thêm danh mục</h2><button onclick="closeCategoryForm()" class="text-2xl">×</button></div>
      <input type="hidden" id="categoryId">
      <div class="space-y-4">
        <input id="categoryName" class="input-ui" placeholder="Tên danh mục">
        <textarea id="categoryDesc" class="input-ui" placeholder="Mô tả"></textarea>
        <div>
          <label class="font-semibold">Ảnh danh mục</label>
          <input id="categoryImageFile" type="file" accept="image/*"
            class="mt-2 block w-full border rounded-xl p-3"
            onchange="previewCategoryImage(event)">
          <img id="previewCategoryImage"
            class="mt-4 w-32 h-32 object-cover rounded-xl border hidden">
        </div>
        <select id="categoryParent" class="input-ui"><option value="">Không có danh mục cha</option>${categories.map(c=>`<option value="${c.categoryId}">${c.categoryName}</option>`).join('')}</select>
        <select id="categoryStatus" class="input-ui"><option value="ACTIVE">ACTIVE</option><option value="INACTIVE">INACTIVE</option></select>
        <button onclick="saveCategory()" class="btn-primary w-full">Lưu danh mục</button>
      </div>
    </div>
  </div>`;
}

function brandModal(){
  return `<div id="brandModal" class="fixed inset-0 bg-black/40 z-[999] hidden items-center justify-center p-5">
    <div class="bg-white rounded-3xl p-7 w-full max-w-lg shadow-xl">
      <div class="flex justify-between items-center mb-5">
        <h2 id="brandFormTitle" class="serif text-3xl">Thêm thương hiệu</h2>
        <button onclick="closeBrandForm()" class="text-2xl">×</button>
      </div>
      <input type="hidden" id="brandId">
      <div class="space-y-4">
        <input id="brandName" class="input-ui" placeholder="Tên thương hiệu">
        <textarea id="brandDesc" class="input-ui" placeholder="Mô tả"></textarea>
        <select id="brandStatus" class="input-ui"><option value="ACTIVE">ACTIVE</option><option value="INACTIVE">INACTIVE</option></select>
        <button onclick="saveBrand()" class="btn-primary w-full">Lưu thương hiệu</button>
      </div>
    </div>
  </div>`;
}
function changeOrderStatusFilter(status){
  orderStatusFilter = status;
  orderLimit = 10;
  render();
}

function changeOrderPaymentFilter(value){
  orderPaymentFilter = value;
  orderLimit = 10;
  render();
}

function changeOrderDateRange(){
  orderFromDate = document.getElementById("orderFromDate")?.value || "";
  orderToDate = document.getElementById("orderToDate")?.value || "";
  orderLimit = 10;
  render();
}

function orderStatusLabel(status){
  const map = {
    PENDING: "Chờ xác nhận",
    PENDING_PAYMENT: "Chờ thanh toán",
    PAID: "Đang xử lý",
    CONFIRMED: "Đang xử lý",
    SHIPPING: "Đang giao",
    COMPLETED: "Hoàn thành",
    CANCELLED: "Đã hủy"
  };

  return map[status] || status || "Không rõ";
}

function orderStatusBadge(status){
  if(status === "COMPLETED"){
    return "bg-green-100 text-green-700";
  }

  if(status === "SHIPPING"){
    return "bg-blue-100 text-blue-700";
  }

  if(status === "PAID" || status === "CONFIRMED"){
    return "bg-yellow-100 text-yellow-700";
  }

  if(status === "CANCELLED"){
    return "bg-neutral-200 text-neutral-600";
  }

  return "bg-red-100 text-red-700";
}

function getOrderPaymentMethod(o){
  return String(
    o.paymentMethod ||
    o.payment?.paymentMethod ||
    o.payment?.method ||
    ""
  ).toUpperCase();
}

function orderPaymentLabel(o){
  const method = getOrderPaymentMethod(o);

  if(method === "CASH"){
    return "COD";
  }

  if(method === "QR"){
    return "Chuyển khoản";
  }

  return "—";
}

function orderStatusCount(type){
  if(type === "ALL"){
    return orders.length;
  }

  if(type === "PENDING"){
    return orders.filter(o =>
      o.orderStatus === "PENDING" ||
      o.orderStatus === "PENDING_PAYMENT"
    ).length;
  }

  if(type === "PROCESSING"){
    return orders.filter(o =>
      o.orderStatus === "PAID" ||
      o.orderStatus === "CONFIRMED"
    ).length;
  }

  return orders.filter(o => o.orderStatus === type).length;
}

function formatOrderDate(value){
  if(!value) return "—";

  const d = new Date(value);

  if(Number.isNaN(d.getTime())){
    return value;
  }

  return d.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}
function orderStatusSelect(order){

  const statuses = [
    ["PENDING", "Chờ xác nhận"],
    ["PENDING_PAYMENT", "Chờ thanh toán PayOS"],
    ["PAID", "Đã thanh toán"],
    ["CONFIRMED", "Đã xác nhận"],
    ["SHIPPING", "Đang giao"],
    ["COMPLETED", "Hoàn thành"],
    ["CANCELLED", "Đã hủy"]
  ];

  return `
    <select
      onchange="
        changeOrderStatusFromTable(
          ${Number(order.orderId)},
          this
        )
      "
      data-old-status="${safeOrderText(order.orderStatus || "PENDING")}"
      class="
        min-w-[205px]
        border
        border-neutral-300
        rounded-xl
        bg-white
        px-2
        py-2.5
        text-sm
        font-semibold
        outline-none
        cursor-pointer
        focus:border-red-700
        focus:ring-2
        focus:ring-red-100
      "
    >

      ${statuses.map(([value, label]) => `
        <option
          value="${value}"
          ${order.orderStatus === value ? "selected" : ""}
        >
          ${label}
        </option>
      `).join("")}

    </select>
  `;
}
async function changeOrderStatusFromTable(orderId, select){

  if(!select){
    return;
  }

  const newStatus =
    select.value;

  const oldStatus =
    select.dataset.oldStatus;


  if(newStatus === oldStatus){
    return;
  }


  // khóa select để tránh bấm liên tục
  select.disabled = true;

  select.classList.add(
    "opacity-60",
    "cursor-wait"
  );


  const success =
    await updateOrderStatus(
      orderId,
      newStatus
    );


  if(!success){

    // API lỗi -> trả về trạng thái cũ
    select.value =
      oldStatus;

    select.disabled = false;

    select.classList.remove(
      "opacity-60",
      "cursor-wait"
    );

    return;
  }

  // thành công -> trạng thái mới trở thành old status
  select.dataset.oldStatus =
    newStatus;

  await loadData();

  render();
}
function getOrderStaffName(order){

  return (
    order?.staffName ||
    order?.employeeName ||
    order?.updatedByStaff ||
    order?.updatedBy ||
    order?.updatedByName ||
    order?.staff?.fullname ||
    order?.staff?.fullName ||
    order?.employee?.fullname ||
    order?.employee?.fullName ||
    "—"
  );
}
function getOrderStatusClass(status) {
  switch (status) {
    case "PENDING":
      return "bg-amber-50 text-amber-700 border-amber-300";

    case "PENDING_PAYMENT":
      return "bg-orange-50 text-orange-700 border-orange-300";

    case "PAID":
      return "bg-cyan-50 text-cyan-700 border-cyan-300";

    case "CONFIRMED":
      return "bg-blue-50 text-blue-700 border-blue-300";

    case "SHIPPING":
      return "bg-violet-50 text-violet-700 border-violet-300";

    case "COMPLETED":
      return "bg-green-50 text-green-700 border-green-300";

    case "CANCELLED":
      return "bg-red-50 text-red-700 border-red-300";

    default:
      return "bg-neutral-50 text-neutral-700 border-neutral-300";
  }
}
function orderTable(){

  const keyword = (adminSearch.orders || "")
    .trim()
    .toLowerCase();


  // =========================================================
  // LỌC TÌM KIẾM
  // =========================================================

  let filteredOrders = orders.filter(o => {

    const orderId =
      String(o.orderId || "").toLowerCase();

    const orderCode =
      String(o.orderCode || "").toLowerCase();

    const name =
      String(
        o.user?.fullname ||
        o.customerName ||
        o.receiverName ||
        ""
      ).toLowerCase();

    const email =
      String(
        o.user?.email ||
        o.email ||
        ""
      ).toLowerCase();

    const phone =
      String(
        o.user?.phone ||
        o.phone ||
        o.receiverPhone ||
        ""
      ).toLowerCase();

    const address =
      String(
        o.address ||
        o.shippingAddress ||
        o.receiverAddress ||
        ""
      ).toLowerCase();


    return (
      !keyword ||
      orderId.includes(keyword) ||
      orderCode.includes(keyword) ||
      name.includes(keyword) ||
      email.includes(keyword) ||
      phone.includes(keyword) ||
      address.includes(keyword)
    );

  });


  // =========================================================
  // LỌC TRẠNG THÁI
  // =========================================================

  if(orderStatusFilter !== "ALL"){

    if(orderStatusFilter === "PENDING"){

      filteredOrders = filteredOrders.filter(o =>
        o.orderStatus === "PENDING" ||
        o.orderStatus === "PENDING_PAYMENT"
      );

    }

    else if(orderStatusFilter === "PROCESSING"){

      filteredOrders = filteredOrders.filter(o =>
        o.orderStatus === "PAID" ||
        o.orderStatus === "CONFIRMED"
      );

    }

    else{

      filteredOrders = filteredOrders.filter(
        o => o.orderStatus === orderStatusFilter
      );

    }

  }


  // =========================================================
  // LỌC THANH TOÁN
  // =========================================================

  if(orderPaymentFilter !== "ALL"){

    filteredOrders = filteredOrders.filter(o =>

      String(
        getOrderPaymentMethod(o)
      ).toUpperCase() === orderPaymentFilter

    );

  }


  // =========================================================
  // LỌC TỪ NGÀY
  // =========================================================

  if(orderFromDate){

    filteredOrders = filteredOrders.filter(o => {

      if(!o.createdAt){
        return false;
      }

      const date =
        new Date(o.createdAt);

      if(Number.isNaN(date.getTime())){
        return false;
      }

      const day =
        [
          date.getFullYear(),
          String(date.getMonth() + 1).padStart(2, "0"),
          String(date.getDate()).padStart(2, "0")
        ].join("-");

      return day >= orderFromDate;

    });

  }


  // =========================================================
  // LỌC ĐẾN NGÀY
  // =========================================================

  if(orderToDate){

    filteredOrders = filteredOrders.filter(o => {

      if(!o.createdAt){
        return false;
      }

      const date =
        new Date(o.createdAt);

      if(Number.isNaN(date.getTime())){
        return false;
      }

      const day =
        [
          date.getFullYear(),
          String(date.getMonth() + 1).padStart(2, "0"),
          String(date.getDate()).padStart(2, "0")
        ].join("-");

      return day <= orderToDate;

    });

  }


  // =========================================================
  // SẮP XẾP
  // =========================================================

  filteredOrders.sort((a, b) =>
    new Date(b.createdAt || 0) -
    new Date(a.createdAt || 0)
  );


  const list =
    filteredOrders.slice(0, orderLimit);


  // =========================================================
  // TAB
  // =========================================================

  const tabs = [

    {
      key: "ALL",
      label: "Tất cả",
      count: orderStatusCount("ALL")
    },

    {
      key: "PENDING",
      label: "Chờ xác nhận",
      count: orderStatusCount("PENDING")
    },

    {
      key: "PROCESSING",
      label: "Đang xử lý",
      count: orderStatusCount("PROCESSING")
    },

    {
      key: "SHIPPING",
      label: "Đang giao",
      count: orderStatusCount("SHIPPING")
    },

    {
      key: "COMPLETED",
      label: "Hoàn thành",
      count: orderStatusCount("COMPLETED")
    },

    {
      key: "CANCELLED",
      label: "Đã hủy",
      count: orderStatusCount("CANCELLED")
    }

  ];


  return `

    <div class="space-y-4">


      <!-- ===================================================
           TAB TRẠNG THÁI
      ==================================================== -->

      <div
        class="
          bg-white
          border
          border-neutral-200
          rounded-2xl
          p-3
          grid
          grid-cols-2
          md:grid-cols-3
          xl:grid-cols-6
          gap-3
        "
      >

        ${tabs.map(tab => `

          <button
            type="button"
            onclick="changeOrderStatusFilter('${tab.key}')"
            class="
              min-h-[48px]
              rounded-full
              px-5
              font-semibold
              transition

              ${
                orderStatusFilter === tab.key
                  ? "bg-red-800 text-white shadow"
                  : "bg-white border border-neutral-200 text-neutral-700 hover:border-red-300"
              }
            "
          >

            ${tab.label} (${tab.count})

          </button>

        `).join("")}

      </div>



      <!-- ===================================================
           BẢNG
      ==================================================== -->

      <div
        class="
          bg-white
          border
          border-neutral-200
          rounded-2xl
          overflow-hidden
        "
      >


        <!-- =================================================
             TOOLBAR
        ================================================== -->

        <div
          class="
            p-4
            border-b
            border-neutral-200
            flex
            flex-col
            xl:flex-row
            xl:items-center
            gap-3
          "
        >


          <!-- SEARCH -->

          <div
            class="
              relative
              flex-1
              min-w-[260px]
            "
          >

            <span
              class="
                absolute
                left-4
                top-1/2
                -translate-y-1/2
                text-neutral-400
              "
            >
              ${icon("search", "w-5 h-5")}
            </span>


            <input
              data-search="orders"
              value="${escapeHtml(adminSearch.orders || "")}"
              oninput="searchOrderAdmin(this.value)"
              class="
                w-full
                h-12
                border
                border-neutral-200
                rounded-xl
                pl-12
                pr-4
                outline-none
                focus:border-red-700
              "
              placeholder="Tìm kiếm theo mã đơn hàng, tên khách hàng, SĐT..."
            >

          </div>


          <!-- DATE -->

          <div
            class="
              flex
              items-center
              gap-2
              border
              border-neutral-200
              rounded-xl
              px-3
              h-12
            "
          >

            ${icon(
              "calendar-days",
              "w-5 h-5 text-neutral-500"
            )}


            <input
              id="orderFromDate"
              type="date"
              value="${orderFromDate}"
              onchange="changeOrderDateRange()"
              class="
                outline-none
                bg-transparent
                text-sm
              "
            >


            <span class="text-neutral-400">
              -
            </span>


            <input
              id="orderToDate"
              type="date"
              value="${orderToDate}"
              onchange="changeOrderDateRange()"
              class="
                outline-none
                bg-transparent
                text-sm
              "
            >

          </div>


          <!-- PAYMENT -->

          <select
            onchange="changeOrderPaymentFilter(this.value)"
            class="
              h-12
              border
              border-neutral-200
              rounded-xl
              px-2
              outline-none
              bg-white
              min-w-[210px]
            "
          >

            <option
              value="ALL"
              ${orderPaymentFilter === "ALL" ? "selected" : ""}
            >
              Phương thức thanh toán
            </option>


            <option
              value="CASH"
              ${orderPaymentFilter === "CASH" ? "selected" : ""}
            >
              COD
            </option>


            <option
              value="QR"
              ${orderPaymentFilter === "QR" ? "selected" : ""}
            >
              Chuyển khoản
            </option>

          </select>


          <!-- EXCEL -->

          <button
            type="button"
            onclick="exportShippingExcel()"
            class="
              h-12
              px-5
              rounded-xl
              border
              border-green-600
              text-green-700
              font-bold
              flex
              items-center
              justify-center
              gap-2
              whitespace-nowrap
              hover:bg-green-50
              transition
            "
          >

            ${icon("sheet", "w-5 h-5")}

            Xuất Excel

          </button>

        </div>



        <!-- =================================================
             TABLE
        ================================================== -->

        <div class="overflow-x-auto">

          <table
            class="
              w-full
              table-fixed
              text-left
            "
          >


            <!-- HEADER -->

            <thead
              class="
                bg-neutral-50
                text-[13px]
                text-neutral-600
              "
            >

              <tr>

                <th class="w-[4%] px-2 py-4">
                  #
                </th>

                <th class="w-[11%] px-2 py-4">
                  Mã đơn
                </th>

                <th class="w-[11%] px-2 py-4">
                  Khách hàng
                </th>

                <th class="w-[10%] px-2 py-4">
                  SĐT
                </th>

                <th class="w-[9%] px-2 py-4">
                  Tổng tiền
                </th>

                <th class="w-[12%] px-2 py-4">
                  Trạng thái
                </th>

                <th class="w-[10%] px-2 py-4">
                  Nhân viên
                </th>

                <th class="w-[11%] px-2 py-4">
                  Thanh toán
                </th>

                <th class="w-[12%] px-2 py-4">
                  Ngày đặt
                </th>

                <th class="w-[7%] px-2 py-4 text-center">
                  Xem
                </th>

              </tr>

            </thead>
            <!-- BODY -->

            <tbody>

              ${
                list.length

                ? list.map((o, index) => {


                    const customerName =
                      o.user?.fullname ||
                      o.customerName ||
                      o.receiverName ||
                      "Khách hàng";


                    const phone =
                      o.user?.phone ||
                      o.phone ||
                      o.receiverPhone ||
                      "—";


                    const staffName =
                      o.staffName ||
                      o.employeeName ||
                      o.updatedByStaff ||
                      o.updatedBy ||
                      o.updatedByName ||
                      o.staff?.fullname ||
                      o.staff?.fullName ||
                      o.employee?.fullname ||
                      o.employee?.fullName ||
                      "—";


                    return `

                      <tr
                        class="
                          border-t
                          border-neutral-100
                          hover:bg-neutral-50/70
                        "
                      >


                        <!-- STT -->

                        <td
                          class="
                            px-5
                            py-4
                            text-neutral-500
                          "
                        >
                          ${index + 1}
                        </td>


                        <!-- MÃ ĐƠN -->

                        <td
                          class="
                            px-2
                            py-4
                            font-bold
                            whitespace-nowrap
                          "
                        >

                          ${
                            escapeHtml(
                              o.orderCode ||
                              `#JODOK${o.orderId}`
                            )
                          }

                        </td>


                        <!-- KHÁCH -->

                        <td
                          class="
                            px-2
                            py-4
                            font-medium
                            whitespace-nowrap
                          "
                        >

                          ${escapeHtml(customerName)}

                        </td>


                        <!-- PHONE -->

                        <td
                          class="
                            px-2
                            py-4
                            text-neutral-600
                            whitespace-nowrap
                          "
                        >

                          ${escapeHtml(phone)}

                        </td>


                        <!-- TOTAL -->

                        <td
                          class="
                            px-2
                            py-4
                            font-semibold
                            whitespace-nowrap
                          "
                        >

                          ${money(
                            o.finalAmount ??
                            o.totalAmount ??
                            0
                          )}

                        </td>


                        <!-- =================================
                             TRẠNG THÁI - CHỈNH TRỰC TIẾP
                        ================================== -->
                        <td class="px-2 py-4 whitespace-nowrap">
                          <div class="relative inline-flex items-center">

                            <select
                              data-old-status="${escapeHtml(o.orderStatus || "PENDING")}"

                              onchange="
                                this.className =
                                  'appearance-none h-10 w-[125px] rounded-lg pl-3 pr-6 text-[13px] font-medium outline-none cursor-pointer border transition-colors ' +
                                  getOrderStatusClass(this.value);

                                changeOrderStatusFromTable(
                                  ${Number(o.orderId)},
                                  this
                                );
                              "

                              class="
                                appearance-none
                                h-10
                                w-[125px]
                                rounded-lg
                                pl-3
                                pr-6
                                text-[13px]
                                font-medium
                                outline-none
                                cursor-pointer
                                border
                                transition-colors
                                ${getOrderStatusClass(o.orderStatus || "PENDING")}
                              "
                            >

                              <option
                                value="PENDING"
                                ${o.orderStatus === "PENDING" ? "selected" : ""}
                              >
                                Chờ xác nhận
                              </option>

                              <option
                                value="PENDING_PAYMENT"
                                ${o.orderStatus === "PENDING_PAYMENT" ? "selected" : ""}
                              >
                                Chờ thanh toán
                              </option>

                              <option
                                value="PAID"
                                ${o.orderStatus === "PAID" ? "selected" : ""}
                              >
                                Đã thanh toán
                              </option>

                              <option
                                value="CONFIRMED"
                                ${o.orderStatus === "CONFIRMED" ? "selected" : ""}
                              >
                                Đã xác nhận
                              </option>

                              <option
                                value="SHIPPING"
                                ${o.orderStatus === "SHIPPING" ? "selected" : ""}
                              >
                                Đang giao
                              </option>

                              <option
                                value="COMPLETED"
                                ${o.orderStatus === "COMPLETED" ? "selected" : ""}
                              >
                                Hoàn thành
                              </option>

                              <option
                                value="CANCELLED"
                                ${o.orderStatus === "CANCELLED" ? "selected" : ""}
                              >
                                Đã hủy
                              </option>

                            </select>

                            <span
                              class="
                                pointer-events-none
                                absolute
                                right-1.5
                                top-1/2
                                -translate-y-1/2
                                text-current
                                flex
                                items-center
                              "
                            >
                              ${icon("chevron-down", "w-3 h-3")}
                            </span>

                          </div>
                        </td>
                        <!-- =================================
                             NHÂN VIÊN
                        ================================== -->

                        <td
                          class="
                            px-2
                            py-4
                            whitespace-nowrap
                          "
                        >

                          <div
                            class="
                              flex
                              items-center
                              gap-2
                            "
                          >

                            <span
                              class="
                                w-8
                                h-8
                                rounded-full
                                bg-neutral-100
                                flex
                                items-center
                                justify-center
                                text-neutral-500
                                shrink-0
                              "
                            >

                              ${icon("user", "w-4 h-4")}

                            </span>


                            <span class="font-medium">

                              ${escapeHtml(staffName)}

                            </span>

                          </div>

                        </td>


                        <!-- PAYMENT -->

                        <td
                          class="
                            px-2
                            py-4
                            text-neutral-600
                            whitespace-nowrap
                          "
                        >

                          ${orderPaymentLabel(o)}

                        </td>


                        <!-- DATE -->

                        <td
                          class="
                            px-2
                            py-4
                            text-neutral-600
                            whitespace-nowrap
                          "
                        >

                          ${formatOrderDate(o.createdAt)}

                        </td>


                        <!-- ACTION -->
                        <td class="px-2 py-4 text-center">

                          <button
                            type="button"
                            onclick="openOrderDetail(${Number(o.orderId)})"
                            title="Xem chi tiết đơn hàng"
                            class="
                              inline-flex
                              w-9
                              h-9
                              items-center
                              justify-center
                              border
                              border-neutral-200
                              rounded-lg
                              text-neutral-600
                              hover:bg-red-50
                              hover:border-red-200
                              hover:text-red-800
                              transition
                            "
                          >
                            ${icon("eye", "w-4 h-4")}
                          </button>

                        </td>
                      </tr>
                    `;

                  }).join("")

                : `

                  <tr>

                    <td
                      colspan="10"
                      class="
                        px-6
                        py-14
                        text-center
                        text-neutral-400
                      "
                    >

                      Không tìm thấy đơn hàng

                    </td>

                  </tr>

                `
              }

            </tbody>

          </table>

        </div>



        <!-- =================================================
             FOOTER
        ================================================== -->

        <div
          class="
            px-5
            py-4
            border-t
            border-neutral-100
            flex
            flex-col
            sm:flex-row
            sm:items-center
            sm:justify-between
            gap-4
          "
        >

          <p class="text-sm text-neutral-500">

            Hiển thị

            <b>
              ${filteredOrders.length ? 1 : 0}
              -
              ${Math.min(
                orderLimit,
                filteredOrders.length
              )}
            </b>

            của

            <b>
              ${filteredOrders.length}
            </b>

            đơn hàng

          </p>


          <div
            class="
              flex
              items-center
              gap-2
            "
          >

            ${
              orderLimit > 10

              ? `

                <button
                  type="button"
                  onclick="hideLessAdminOrders()"
                  class="
                    border
                    rounded-lg
                    px-2
                    py-2
                    text-sm
                    font-semibold
                    hover:bg-neutral-50
                  "
                >
                  Thu gọn
                </button>

              `

              : ""
            }


            ${
              orderLimit < filteredOrders.length

              ? `

                <button
                  type="button"
                  onclick="showMoreAdminOrders()"
                  class="
                    border
                    rounded-lg
                    px-2
                    py-2
                    text-sm
                    font-semibold
                    hover:bg-neutral-50
                  "
                >
                  Xem thêm
                </button>

              `

              : ""
            }

          </div>

        </div>

      </div>

    </div>

  `;

}

function orderDetailModal(){
  return `<div id="orderModal" class="fixed inset-0 bg-black/40 z-[999] hidden items-center justify-center p-5">
    <div class="bg-white rounded-3xl p-7 w-full max-w-3xl shadow-xl max-h-[90vh] overflow-y-auto">
      <div class="flex justify-between items-center mb-5">
        <h2 class="serif text-3xl">Chi tiết đơn hàng</h2>
        <button onclick="closeOrderDetail()" class="text-2xl">×</button>
      </div>
      <div id="orderDetailContent"></div>
    </div>
  </div>`;
}

async function openProductForm(id = null){
  // Reset file được chọn của lần mở form trước
  selectedFiles = [];

  const modal = document.getElementById("productModal");

  if(!modal){
    console.error("Không tìm thấy #productModal");
    return;
  }

  modal.classList.remove("hidden");
  modal.classList.add("flex");

  const title = document.getElementById("productFormTitle");
  const idInput = document.getElementById("productId");
  const nameInput = document.getElementById("productName");
  const descInput = document.getElementById("productDesc");
  const priceInput = document.getElementById("productPrice");
  const categoryInput = document.getElementById("productCategory");
  const brandInput = document.getElementById("productBrand");
  const statusInput = document.getElementById("productStatus");
  const fileInput = document.getElementById("productImageFile");
  const preview = document.getElementById("previewImage");

  if(title){
    title.innerText = id ? "Sửa sản phẩm" : "Thêm sản phẩm";
  }

  if(idInput){
    idInput.value = id || "";
  }

  const p = products.find(
    x => Number(x.productId) === Number(id)
  );

  if(nameInput){
    nameInput.value = p?.productName || "";
  }

  if(descInput){
    descInput.value = p?.description || "";
  }

  if(priceInput){
    priceInput.value = p?.basePrice ?? "";
  }

  if(categoryInput){
    categoryInput.value =
      p?.category?.categoryId || "";
  }

  if(brandInput){
    brandInput.value =
      p?.brand?.brandId || "";
  }

  if(statusInput){
    statusInput.value =
      p?.status || "ACTIVE";
  }

  if(fileInput){
    fileInput.value = "";
  }

  // ============================
  // HIỂN THỊ ẢNH HIỆN TẠI
  // ============================
  if(preview){
    if(p){
      const currentImg = productImg(p, 0);

      if(
        currentImg &&
        currentImg !== "/images/no-image.png"
      ){
        preview.src = currentImg;
        preview.classList.remove("hidden");
      }else{
        preview.removeAttribute("src");
        preview.classList.add("hidden");
      }
    }else{
      preview.removeAttribute("src");
      preview.classList.add("hidden");
    }
  }
}

function closeProductForm(){
  const modal =
    document.getElementById("productModal");

  if(!modal) return;

  modal.classList.add("hidden");
  modal.classList.remove("flex");

  const fileInput =
    document.getElementById("productImageFile");

  if(fileInput){
    fileInput.value = "";
  }

  selectedFiles = [];
}

function previewImage(event){
  const input = event.target;

  const files = Array.from(
    input.files || []
  );

  if(files.length === 0){
    selectedFiles = [];

    const preview =
      document.getElementById("previewImage");

    if(preview){
      preview.removeAttribute("src");
      preview.classList.add("hidden");
    }

    return;
  }

  // Chỉ lấy file ảnh
  const imageFiles = files.filter(file =>
    file &&
    file.type &&
    file.type.startsWith("image/")
  );

  if(imageFiles.length !== files.length){
    showToast(
      "Lỗi",
      "Vui lòng chỉ chọn file hình ảnh",
      "error"
    );

    input.value = "";
    selectedFiles = [];

    return;
  }

  if(imageFiles.length > 3){
    showToast(
      "Thông báo",
      "Chỉ sử dụng 3 ảnh đầu tiên",
      "success"
    );
  }

  // QUAN TRỌNG:
  // giữ File object để saveProduct() upload sau
  selectedFiles = imageFiles.slice(0, 3);

  const preview =
    document.getElementById("previewImage");

  if(!preview || !selectedFiles.length){
    return;
  }

  /*
   * Dùng FileReader cho preview FE.
   *
   * Không dùng URL.createObjectURL + revoke ngay
   * sau khi load nữa để tránh preview biến mất.
   */
  const reader = new FileReader();

  reader.onload = function(e){
    preview.src = e.target.result;
    preview.classList.remove("hidden");
  };

  reader.onerror = function(){
    preview.removeAttribute("src");
    preview.classList.add("hidden");

    showToast(
      "Lỗi",
      "Không thể đọc file ảnh đã chọn",
      "error"
    );
  };

  reader.readAsDataURL(selectedFiles[0]);

  showToast(
    "Đã chọn ảnh",
    `Đã chọn ${selectedFiles.length} ảnh. Ảnh sẽ được tải lên khi lưu sản phẩm.`,
    "success"
  );
}

function previewCategoryImage(event){
  const file = event.target.files[0];
  if(!file) return;

  if(!file.type.startsWith('image/')){
    showToast("Lỗi", "Vui lòng chọn file ảnh", "error");
    return;
  }

  selectedCategoryFile = file;

  const reader = new FileReader();
  reader.onload = function(e){
    const img = document.getElementById('previewCategoryImage');
    img.src = e.target.result;
    img.classList.remove('hidden');
  };

  reader.readAsDataURL(file);
}

async function saveProduct(){

  // =====================================================
  // 1. LẤY DỮ LIỆU FORM
  // =====================================================

  const id =
    document.getElementById("productId").value;


  const body = {

    productName:
      document
        .getElementById("productName")
        .value
        .trim(),

    description:
      document
        .getElementById("productDesc")
        .value
        .trim(),

    basePrice:
      Number(
        document.getElementById("productPrice").value
      ),

    categoryId:
      Number(
        document.getElementById("productCategory").value
      ),

    brandId:
      document.getElementById("productBrand").value
        ? Number(
            document.getElementById("productBrand").value
          )
        : null,

    status:
      document.getElementById("productStatus").value
  };


  // =====================================================
  // 2. VALIDATE FE
  // =====================================================

  if(!body.productName){

    showToast(
      "Lỗi",
      "Vui lòng nhập tên sản phẩm",
      "error"
    );

    return;
  }


  if(!body.categoryId){

    showToast(
      "Lỗi",
      "Vui lòng chọn danh mục",
      "error"
    );

    return;
  }


  if(
    Number.isNaN(body.basePrice) ||
    body.basePrice < 0
  ){

    showToast(
      "Lỗi",
      "Giá sản phẩm không hợp lệ",
      "error"
    );

    return;
  }


  // =====================================================
  // 3. XÁC ĐỊNH POST / PUT
  // =====================================================

  const url = id
    ? `${API_BASE}/products/${id}`
    : `${API_BASE}/products`;


  const method = id
    ? "PUT"
    : "POST";


  // =====================================================
  // DEBUG
  // =====================================================

  console.log(
    "========== SAVE PRODUCT =========="
  );

  console.log(
    "URL:",
    url
  );

  console.log(
    "METHOD:",
    method
  );

  console.log(
    "BODY:",
    body
  );

  console.log(
    "AUTH:",
    adminAuthHeaders()
  );


  // =====================================================
  // 4. LƯU SẢN PHẨM
  // =====================================================

  let res;


  try{

    res = await fetch(
      url,
      {
        method: method,

        headers:
          adminJsonHeaders(),

        body:
          JSON.stringify(body)
      }
    );

  }catch(error){

    console.error(
      "SAVE PRODUCT FETCH ERROR:",
      error
    );


    showToast(
      "Lỗi",
      "Không thể kết nối tới server",
      "error"
    );

    return;
  }


  // =====================================================
  // 5. BACKEND TRẢ LỖI
  // =====================================================

  if(!res.ok){

    const errorText =
      await res.text();


    console.error(
      "SAVE PRODUCT FAILED:",
      {
        status:
          res.status,

        statusText:
          res.statusText,

        url:
          url,

        method:
          method,

        body:
          body,

        response:
          errorText,

        auth:
          adminAuthHeaders()
      }
    );


    let message =
      errorText;


    // Backend có thể trả JSON
    if(errorText){

      try{

        const data =
          JSON.parse(errorText);


        message =
          data.message ||
          data.error ||
          data.detail ||
          errorText;

      }catch(e){

        // Backend trả plain text
      }

    }


    // Nếu backend không trả message
    if(!message){

      if(res.status === 400){

        message =
          "Dữ liệu sản phẩm không hợp lệ (HTTP 400)";

      }else if(res.status === 401){

        message =
          "Phiên đăng nhập không hợp lệ (HTTP 401)";

      }else if(res.status === 403){

        message =
          "Backend từ chối quyền lưu sản phẩm (HTTP 403)";

      }else if(res.status === 404){

        message =
          "Không tìm thấy API lưu sản phẩm (HTTP 404)";

      }else if(res.status === 409){

        message =
          "Dữ liệu sản phẩm bị trùng hoặc xung đột (HTTP 409)";

      }else if(res.status >= 500){

        message =
          `Backend gặp lỗi khi lưu sản phẩm (HTTP ${res.status})`;

      }else{

        message =
          `Lưu sản phẩm thất bại (HTTP ${res.status})`;
      }
    }


    showToast(
      "Lỗi",
      message,
      "error"
    );


    return;
  }


  // =====================================================
  // 6. ĐỌC PRODUCT BACKEND TRẢ VỀ
  // =====================================================

  let product;


  try{

    product =
      await res.json();

  }catch(error){

    console.error(
      "SAVE PRODUCT JSON ERROR:",
      error
    );


    showToast(
      "Lỗi",
      "Backend đã lưu nhưng không trả về dữ liệu sản phẩm hợp lệ",
      "error"
    );

    return;
  }


  console.log(
    "PRODUCT SAVED:",
    product
  );


  // =====================================================
  // 7. KIỂM TRA PRODUCT ID
  // =====================================================

  if(!product?.productId){

    console.error(
      "PRODUCT RESPONSE KHÔNG CÓ productId:",
      product
    );


    showToast(
      "Lỗi",
      "Không xác định được ID sản phẩm vừa lưu",
      "error"
    );

    return;
  }


  // =====================================================
  // 8. UPLOAD ẢNH
  // =====================================================

  if(
    Array.isArray(selectedFiles) &&
    selectedFiles.length > 0
  ){

    console.log(
      "SỐ ẢNH CẦN UPLOAD:",
      selectedFiles.length
    );


    for(
      let i = 0;
      i < selectedFiles.length;
      i++
    ){

      const file =
        selectedFiles[i];


      console.log(
        `UPLOAD IMAGE ${i + 1}:`,
        file
      );


      const formData =
        new FormData();


      formData.append(
        "file",
        file
      );


      // =================================================
      // 8.1 UPLOAD FILE
      // =================================================

      let uploadRes;


      try{

        uploadRes =
          await fetch(
            `${API_BASE}/upload/image`,
            {
              method:
                "POST",

              // KHÔNG set Content-Type
              // browser tự tạo multipart boundary
              headers:
                adminAuthHeaders(),

              body:
                formData
            }
          );

      }catch(error){

        console.error(
          "UPLOAD IMAGE FETCH ERROR:",
          error
        );


        showToast(
          "Lỗi",
          "Sản phẩm đã lưu nhưng không thể kết nối server để upload ảnh",
          "error"
        );

        return;
      }


      // =================================================
      // 8.2 ĐỌC RESPONSE UPLOAD
      // =================================================

      const uploadText =
        await uploadRes.text();


      console.log(
        "UPLOAD STATUS:",
        uploadRes.status
      );


      console.log(
        "UPLOAD RESPONSE:",
        uploadText
      );


      if(!uploadRes.ok){

        let message =
          uploadText;


        if(uploadText){

          try{

            const data =
              JSON.parse(uploadText);


            message =
              data.message ||
              data.error ||
              data.detail ||
              uploadText;

          }catch(e){

          }

        }


        showToast(
          "Lỗi",
          message ||
          `Upload ảnh thất bại (HTTP ${uploadRes.status})`,
          "error"
        );


        return;
      }


      // =================================================
      // 8.3 PARSE RESPONSE UPLOAD
      // =================================================

      let uploadData;


      try{

        uploadData =
          uploadText
            ? JSON.parse(uploadText)
            : {};

      }catch(error){

        console.error(
          "UPLOAD RESPONSE KHÔNG PHẢI JSON:",
          uploadText
        );


        showToast(
          "Lỗi",
          "Server upload ảnh trả dữ liệu không hợp lệ",
          "error"
        );

        return;
      }


      // =================================================
      // 8.4 KIỂM TRA IMAGE URL
      // =================================================

      if(!uploadData?.imageUrl){

        console.error(
          "UPLOAD KHÔNG CÓ imageUrl:",
          uploadData
        );


        showToast(
          "Lỗi",
          "Upload ảnh thành công nhưng backend không trả imageUrl",
          "error"
        );

        return;
      }


      // =================================================
      // 8.5 LƯU ẢNH VÀO PRODUCT
      // =================================================

      const imageBody = {

        productId:
          product.productId,

        imageUrl:
          uploadData.imageUrl,

        isMain:
          i === 0
      };


      console.log(
        "SAVE PRODUCT IMAGE:",
        imageBody
      );


      let imageRes;


      try{

        imageRes =
          await fetch(
            `${API_BASE}/product-images`,
            {
              method:
                "POST",

              headers:
                adminJsonHeaders(),

              body:
                JSON.stringify(imageBody)
            }
          );

      }catch(error){

        console.error(
          "PRODUCT IMAGE FETCH ERROR:",
          error
        );


        showToast(
          "Lỗi",
          "Ảnh đã upload nhưng không thể liên kết ảnh với sản phẩm",
          "error"
        );

        return;
      }


      // =================================================
      // 8.6 KIỂM TRA PRODUCT IMAGE
      // =================================================

      if(!imageRes.ok){

        const imageError =
          await imageRes.text();


        console.error(
          "SAVE PRODUCT IMAGE FAILED:",
          {
            status:
              imageRes.status,

            response:
              imageError,

            body:
              imageBody
          }
        );


        let message =
          imageError;


        if(imageError){

          try{

            const data =
              JSON.parse(imageError);


            message =
              data.message ||
              data.error ||
              data.detail ||
              imageError;

          }catch(e){

          }

        }


        showToast(
          "Lỗi",
          message ||
          `Không thể lưu ảnh sản phẩm (HTTP ${imageRes.status})`,
          "error"
        );


        return;
      }


      console.log(
        `IMAGE ${i + 1} SAVED`
      );
    }
  }


  // =====================================================
  // 9. RESET FILE
  // =====================================================

  selectedFiles = [];


  // =====================================================
  // 10. ĐÓNG FORM
  // =====================================================

  closeProductForm();


  // =====================================================
  // 11. LOAD LẠI DATA
  // =====================================================

  try{

    await init();

  }catch(error){

    console.error(
      "RELOAD ADMIN DATA ERROR:",
      error
    );


    showToast(
      "Lỗi",
      "Sản phẩm đã lưu nhưng không thể tải lại dữ liệu",
      "error"
    );

    return;
  }


  // =====================================================
  // 12. KIỂM TRA BIẾN THỂ
  // GIỮ LOGIC CŨ
  // =====================================================

  const hasVariant =
    productHasVariant(
      product.productId
    );


  // =====================================================
  // 13. CHƯA CÓ BIẾN THỂ
  // =====================================================

  if(!hasVariant){

    currentTab =
      "variants";


    render();


    setTimeout(
      () => {

        openVariantForm();


        const variantProduct =
          document.getElementById(
            "variantProductId"
          );


        if(variantProduct){

          variantProduct.value =
            String(
              product.productId
            );
        }

      },
      100
    );


    showToast(
      "Cần thêm biến thể",
      "Sản phẩm cần có size, màu, SKU, tồn kho để hiển thị mua hàng ở shop",
      "error"
    );


    return;
  }


  // =====================================================
  // 14. THÀNH CÔNG
  // =====================================================

  showToast(
    "Thành công",
    "Đã lưu sản phẩm"
  );
}

function deleteProduct(id){
  showConfirm("Xóa vĩnh viễn sản phẩm này?", async () => {
    const res = await fetch(`${API_BASE}/products/${id}`, {
  method:'DELETE',
  headers: adminAuthHeaders()
});

    if(!res.ok){
      showToast("Lỗi", await res.text(), "error");
      return;
    }

    showToast("Thành công", "Đã xóa sản phẩm");
    await init();
  }, "Xóa");
}

function openVariantForm(id = null) {
  const modal = document.getElementById("variantModal");

  if (!modal) {
    console.error("Không tìm thấy #variantModal");
    return;
  }

  const v = id
    ? variants.find(
        item => Number(item.variantId) === Number(id)
      )
    : null;

  console.log("OPEN VARIANT:", v);

  modal.classList.remove("hidden");
  modal.classList.add("flex");

  const title = document.getElementById("variantFormTitle");
  const idInput = document.getElementById("variantId");
  const productInput = document.getElementById("variantProductId");
  const sizeInput = document.getElementById("variantSize");
  const colorInput = document.getElementById("variantColor");
  const skuInput = document.getElementById("variantSku");
  const priceInput = document.getElementById("variantPrice");
  const stockInput = document.getElementById("variantStock");
  const statusInput = document.getElementById("variantStatus");

  if (title) {
    title.textContent = id ? "Sửa biến thể" : "Thêm biến thể";
  }

  if (idInput) {
    idInput.value = id || "";
  }

  /*
   * FIX QUAN TRỌNG:
   * Backend có thể trả:
   *
   * v.product.productId
   * hoặc
   * v.productId
   *
   * hỗ trợ cả 2.
   */
  const productId =
    v?.product?.productId ??
    v?.productId ??
    "";

  if (productInput) {
    productInput.value = String(productId);

    /*
     * Trường hợp option được render sau
     */
    if (
      productId &&
      productInput.value !== String(productId)
    ) {
      const option = document.createElement("option");

      option.value = String(productId);
      option.textContent =
        v?.product?.productName ||
        v?.productName ||
        `Sản phẩm #${productId}`;

      option.selected = true;

      productInput.appendChild(option);
    }
  }

  if (sizeInput) {
    sizeInput.value = v?.size ?? "";
  }

  if (colorInput) {
    colorInput.value = v?.color ?? "";
  }

  if (skuInput) {
    skuInput.value = v?.sku ?? "";
  }

  if (priceInput) {
    priceInput.value =
      v?.price !== undefined &&
      v?.price !== null
        ? v.price
        : "";
  }

  if (stockInput) {
    stockInput.value =
      v?.stock !== undefined &&
      v?.stock !== null
        ? v.stock
        : 0;
  }

  if (statusInput) {
    statusInput.value = v?.status || "ACTIVE";
  }
}


function closeVariantForm() {
  const modal =
    document.getElementById("variantModal");

  if (!modal) return;

  modal.classList.add("hidden");
  modal.classList.remove("flex");
}


async function saveVariant() {
  /*
   * =====================================================
   * 1. LẤY FORM
   * =====================================================
   */

  const idEl =
    document.getElementById("variantId");

  const productEl =
    document.getElementById("variantProductId");

  const sizeEl =
    document.getElementById("variantSize");

  const colorEl =
    document.getElementById("variantColor");

  const skuEl =
    document.getElementById("variantSku");

  const priceEl =
    document.getElementById("variantPrice");

  const stockEl =
    document.getElementById("variantStock");

  const statusEl =
    document.getElementById("variantStatus");


  /*
   * =====================================================
   * 2. DEBUG FIELD
   * =====================================================
   */

  console.log("========== VARIANT FORM ==========");

  console.log({
    idEl,
    productEl,
    sizeEl,
    colorEl,
    skuEl,
    priceEl,
    stockEl,
    statusEl
  });


  /*
   * Chỉ những field thực sự cần mới kiểm tra.
   * variantId có thể null/empty khi tạo mới.
   */

  if (!productEl) {
    showToast(
      "Lỗi",
      "Không tìm thấy trường sản phẩm.",
      "error"
    );
    return;
  }

  if (!sizeEl) {
    showToast(
      "Lỗi",
      "Không tìm thấy trường Size.",
      "error"
    );
    return;
  }

  if (!colorEl) {
    showToast(
      "Lỗi",
      "Không tìm thấy trường Màu sắc.",
      "error"
    );
    return;
  }

  if (!skuEl) {
    showToast(
      "Lỗi",
      "Không tìm thấy trường SKU.",
      "error"
    );
    return;
  }

  if (!priceEl) {
    showToast(
      "Lỗi",
      "Không tìm thấy trường Giá.",
      "error"
    );
    return;
  }

  if (!stockEl) {
    showToast(
      "Lỗi",
      "Không tìm thấy trường Tồn kho.",
      "error"
    );
    return;
  }


  /*
   * =====================================================
   * 3. LẤY VALUE
   * =====================================================
   */

  const id =
    idEl?.value?.trim() || "";

  const productId =
    Number(productEl.value);

  const size =
    String(sizeEl.value || "").trim();

  const color =
    String(colorEl.value || "").trim();

  const sku =
    String(skuEl.value || "").trim();

  const price =
    Number(priceEl.value);

  const stock =
    Number(stockEl.value);

  const status =
    statusEl?.value || "ACTIVE";


  /*
   * =====================================================
   * 4. VALIDATE
   * =====================================================
   */

  if (
    !Number.isFinite(productId) ||
    productId <= 0
  ) {
    showToast(
      "Thiếu thông tin",
      "Vui lòng chọn sản phẩm.",
      "error"
    );

    productEl.focus();
    return;
  }


  if (!size) {
    showToast(
      "Thiếu thông tin",
      "Vui lòng nhập Size.",
      "error"
    );

    sizeEl.focus();
    return;
  }


  if (!color) {
    showToast(
      "Thiếu thông tin",
      "Vui lòng nhập màu sắc.",
      "error"
    );

    colorEl.focus();
    return;
  }


  if (!sku) {
    showToast(
      "Thiếu thông tin",
      "Vui lòng nhập SKU.",
      "error"
    );

    skuEl.focus();
    return;
  }


  if (
    priceEl.value === "" ||
    !Number.isFinite(price) ||
    price < 0
  ) {
    showToast(
      "Giá không hợp lệ",
      "Giá biến thể phải lớn hơn hoặc bằng 0.",
      "error"
    );

    priceEl.focus();
    return;
  }


  if (
    stockEl.value === "" ||
    !Number.isFinite(stock) ||
    stock < 0
  ) {
    showToast(
      "Tồn kho không hợp lệ",
      "Tồn kho phải lớn hơn hoặc bằng 0.",
      "error"
    );

    stockEl.focus();
    return;
  }


  /*
   * =====================================================
   * 5. BODY GỬI BACKEND
   * =====================================================
   */

  const body = {
    productId,
    size,
    color,
    sku,
    price,
    stock,
    status
  };


  /*
   * =====================================================
   * 6. POST / PUT
   * =====================================================
   */

  const isEdit = Boolean(id);

  const url = isEdit
    ? `${API_BASE}/variants/${id}`
    : `${API_BASE}/variants`;

  const method = isEdit
    ? "PUT"
    : "POST";


  console.log(
    "========== SAVE VARIANT =========="
  );

  console.log("ID:", id);
  console.log("URL:", url);
  console.log("METHOD:", method);
  console.log("BODY:", body);


  /*
   * =====================================================
   * 7. DISABLE NÚT TRÁNH CLICK 2 LẦN
   * =====================================================
   */

  const saveButton =
    document.getElementById(
      "variantSaveButton"
    );

  const oldButtonHtml =
    saveButton?.innerHTML;

  if (saveButton) {
    saveButton.disabled = true;

    saveButton.innerHTML = `
      <span>Đang lưu...</span>
    `;

    saveButton.classList.add(
      "opacity-60",
      "cursor-not-allowed"
    );
  }


  /*
   * =====================================================
   * 8. REQUEST
   * =====================================================
   */

  try {
    const res = await fetch(
      url,
      {
        method,

        headers:
          adminJsonHeaders(),

        body:
          JSON.stringify(body)
      }
    );


    const responseText =
      await res.text();


    console.log(
      "VARIANT STATUS:",
      res.status
    );

    console.log(
      "VARIANT RESPONSE:",
      responseText
    );


    /*
     * ===================================================
     * 9. BACKEND BÁO LỖI
     * ===================================================
     */

    if (!res.ok) {
      let message =
        responseText ||
        "Không thể lưu biến thể.";

      try {
        const json =
          JSON.parse(responseText);

        message =
          json.message ||
          json.error ||
          json.detail ||
          message;

      } catch (_) {
        // response không phải JSON
      }


      showToast(
        "Không thể lưu biến thể",
        message,
        "error"
      );

      return;
    }


    /*
     * ===================================================
     * 10. THÀNH CÔNG
     * ===================================================
     */

    showToast(
      "Thành công",
      isEdit
        ? "Đã cập nhật biến thể."
        : "Đã thêm biến thể."
    );


    closeVariantForm();


    /*
     * ===================================================
     * 11. LOAD LẠI DATA
     * ===================================================
     */

    await init();


    /*
     * Nếu init() không render lại giao diện
     * thì gọi render().
     */
    if (
      typeof render === "function"
    ) {
      render();
    }

  } catch (error) {
    console.error(
      "SAVE VARIANT ERROR:",
      error
    );

    showToast(
      "Lỗi kết nối",
      error?.message ||
        "Không thể kết nối tới máy chủ.",
      "error"
    );

  } finally {

    /*
     * ===================================================
     * 12. ENABLE LẠI BUTTON
     * ===================================================
     */

    if (saveButton) {
      saveButton.disabled = false;

      saveButton.innerHTML =
        oldButtonHtml;

      saveButton.classList.remove(
        "opacity-60",
        "cursor-not-allowed"
      );
    }
  }
}

function closeVariantForm(){
  document.getElementById('variantModal').classList.add('hidden');
  document.getElementById('variantModal').classList.remove('flex');
}

async function saveVariant(){

  const getEl = id =>
    document.getElementById(id);

  const idEl = getEl("variantId");
  const productEl = getEl("variantProductId");
  const sizeEl = getEl("variantSize");
  const colorEl = getEl("variantColor");
  const skuEl = getEl("variantSku");
  const priceEl = getEl("variantPrice");
  const stockEl = getEl("variantStock");
  const statusEl = getEl("variantStatus");


  // ================================
  // KIỂM TRA FORM
  // ================================

  if(
    !idEl ||
    !productEl ||
    !sizeEl ||
    !colorEl ||
    !skuEl ||
    !priceEl ||
    !stockEl ||
    !statusEl
  ){
    console.error("VARIANT FORM MISSING:", {
      idEl,
      productEl,
      sizeEl,
      colorEl,
      skuEl,
      priceEl,
      stockEl,
      statusEl
    });

    showToast(
      "Lỗi",
      "Form biến thể đang thiếu trường dữ liệu.",
      "error"
    );

    return;
  }


  const id = idEl.value.trim();

  const productId =
    Number(productEl.value);

  const size =
    sizeEl.value.trim();

  const color =
    colorEl.value.trim();

  const sku =
    skuEl.value.trim();

  const price =
    Number(priceEl.value);

  const stock =
    Number(stockEl.value);

  const status =
    statusEl.value || "ACTIVE";


  // ================================
  // VALIDATE
  // ================================

  if(!productId){

    showToast(
      "Thiếu thông tin",
      "Vui lòng chọn sản phẩm.",
      "error"
    );

    productEl.focus();
    return;
  }


  if(!size){

    showToast(
      "Thiếu thông tin",
      "Vui lòng nhập size.",
      "error"
    );

    sizeEl.focus();
    return;
  }


  if(!color){

    showToast(
      "Thiếu thông tin",
      "Vui lòng nhập màu sắc.",
      "error"
    );

    colorEl.focus();
    return;
  }


  if(!sku){

    showToast(
      "Thiếu thông tin",
      "Vui lòng nhập SKU.",
      "error"
    );

    skuEl.focus();
    return;
  }


  if(
    !Number.isFinite(price) ||
    price < 0
  ){

    showToast(
      "Giá không hợp lệ",
      "Vui lòng nhập giá biến thể.",
      "error"
    );

    priceEl.focus();
    return;
  }


  if(
    !Number.isFinite(stock) ||
    stock < 0
  ){

    showToast(
      "Tồn kho không hợp lệ",
      "Tồn kho phải lớn hơn hoặc bằng 0.",
      "error"
    );

    stockEl.focus();
    return;
  }


  // ================================
  // BODY
  // ================================

  const body = {
    productId: productId,
    size: size,
    color: color,
    sku: sku,
    price: price,
    stock: stock,
    status: status
  };


  const url =
    id
      ? `${API_BASE}/variants/${id}`
      : `${API_BASE}/variants`;


  const method =
    id
      ? "PUT"
      : "POST";


  console.log(
    "========== SAVE VARIANT =========="
  );

  console.log("URL:", url);
  console.log("METHOD:", method);
  console.log("BODY:", body);
  console.log(
    "HEADERS:",
    adminJsonHeaders()
  );


  // ================================
  // DISABLE BUTTON
  // ================================

  const saveButton =
    document.getElementById(
      "variantSaveButton"
    );

  if(saveButton){
    saveButton.disabled = true;
    saveButton.innerHTML =
      "Đang lưu...";
  }


  try{

    const res = await fetch(
      url,
      {
        method: method,

        headers:
          adminJsonHeaders(),

        body:
          JSON.stringify(body)
      }
    );


    const responseText =
      await res.text();


    console.log(
      "VARIANT STATUS:",
      res.status
    );

    console.log(
      "VARIANT RESPONSE:",
      responseText
    );


    // ================================
    // BACKEND ERROR
    // ================================

    if(!res.ok){

      let message =
        responseText ||
        `HTTP ${res.status}`;


      try{

        const json =
          JSON.parse(responseText);

        message =
          json.message ||
          json.error ||
          json.detail ||
          message;

      }catch(e){
        // response không phải JSON
      }


      showToast(
        "Không thể lưu biến thể",
        message,
        "error"
      );

      return;
    }


    // ================================
    // SUCCESS
    // ================================

    closeVariantForm();


    showToast(
      "Thành công",
      id
        ? "Đã cập nhật biến thể"
        : "Đã thêm biến thể"
    );


    await init();

  }catch(error){

    console.error(
      "SAVE VARIANT ERROR:",
      error
    );


    showToast(
      "Lỗi kết nối",
      error?.message ||
      "Không thể kết nối tới máy chủ.",
      "error"
    );

  }finally{

    if(saveButton){

      saveButton.disabled = false;

      saveButton.innerHTML = `
        ${icon("save", "w-4 h-4")}
        Lưu biến thể
      `;

      if(window.lucide){
        lucide.createIcons();
      }
    }
  }
}

function deleteVariant(id){
  showConfirm("Xóa biến thể này?", async () => {
    const res = await fetch(
      `${API_BASE}/variants/${id}`,
      {
        method:'DELETE',
        headers: adminAuthHeaders()
      }
    );

    if(!res.ok){
      showToast("Lỗi", await res.text(), "error");
      return;
    }

    showToast("Thành công", "Đã xóa biến thể");
    await init();
  });
}

function openCategoryForm(id=null){
  document.getElementById('categoryModal').classList.remove('hidden');
  document.getElementById('categoryModal').classList.add('flex');
  document.getElementById('categoryFormTitle').innerText = id ? 'Sửa danh mục' : 'Thêm danh mục';
  document.getElementById('categoryId').value = id || '';

  const c = categories.find(x => x.categoryId === id);
    document.getElementById('categoryName').value = c?.categoryName || '';
    document.getElementById('categoryDesc').value = c?.description || '';
    selectedCategoryFile = null;
  document.getElementById('categoryImageFile').value = '';

  const preview = document.getElementById('previewCategoryImage');

  if(c?.imageUrl){
    preview.src = c.imageUrl;
    preview.classList.remove('hidden');
  }else{
    preview.src = '';
    preview.classList.add('hidden');
  }
  document.getElementById('categoryParent').value = c?.parent?.categoryId || '';
  document.getElementById('categoryStatus').value = c?.status || 'ACTIVE';
}

function closeCategoryForm(){
  document.getElementById('categoryModal').classList.add('hidden');
  document.getElementById('categoryModal').classList.remove('flex');
}

async function saveCategory(){
  const id = document.getElementById('categoryId').value;

  const body = {
    categoryName: document.getElementById('categoryName').value.trim(),
    description: document.getElementById('categoryDesc').value.trim(),
    parentId: document.getElementById('categoryParent').value
      ? Number(document.getElementById('categoryParent').value)
      : null,
    status: document.getElementById('categoryStatus').value
  };

  if(!body.categoryName){
    showToast("Lỗi", "Vui lòng nhập tên danh mục", "error");
    return;
  }

  const url = id ? `${API_BASE}/categories/${id}` : `${API_BASE}/categories`;
  const method = id ? 'PUT' : 'POST';

  const res = await fetch(url,{
    method,
    headers: adminJsonHeaders(),
    body:JSON.stringify(body)
  });

  if(!res.ok){
  showToast("Lỗi", await res.text(), "error");
  return;
}

const category = await res.json();

if(selectedCategoryFile){
  const formData = new FormData();
  formData.append('file', selectedCategoryFile);

  const uploadRes = await fetch(`${API_BASE}/upload/image`, {
    method: 'POST',
    headers: adminAuthHeaders(),
    body: formData
  });

  const uploadData = await uploadRes.json();

  if(!uploadRes.ok){
    showToast("Lỗi", uploadData.message || "Upload ảnh danh mục thất bại", "error");
    return;
  }

  const updateBody = {
    ...body,
    imageUrl: uploadData.imageUrl
  };

  const updateRes = await fetch(`${API_BASE}/categories/${category.categoryId}`, {
    method: 'PUT',
    headers: adminJsonHeaders(),
    body: JSON.stringify(updateBody)
  });

  if(!updateRes.ok){
    showToast("Cảnh báo", "Danh mục đã lưu nhưng lưu ảnh thất bại", "error");
    return;
  }
}

selectedCategoryFile = null;
closeCategoryForm();

showToast("Thành công", "Đã lưu danh mục");

await init();
}

function deleteCategory(id){
  showConfirm("Xóa danh mục này?", async () => {
    const res = await fetch(
      `${API_BASE}/categories/${id}`,
      {
        method:'DELETE',
        headers: adminAuthHeaders()
      }
    );

    if(!res.ok){
      showToast("Lỗi", "Không thể xóa danh mục đang có sản phẩm hoặc danh mục con", "error");
      return;
    }

    showToast("Thành công", "Đã xóa danh mục");
    await init();
  });
}

function openBrandForm(id=null){
  document.getElementById('brandModal').classList.remove('hidden');
  document.getElementById('brandModal').classList.add('flex');
  document.getElementById('brandFormTitle').innerText = id ? 'Sửa thương hiệu' : 'Thêm thương hiệu';
  document.getElementById('brandId').value = id || '';

  const b = brands.find(x => x.brandId === id);
  document.getElementById('brandName').value = b?.brandName || '';
  document.getElementById('brandDesc').value = b?.description || '';
  document.getElementById('brandStatus').value = b?.status || 'ACTIVE';
}

function closeBrandForm(){
  document.getElementById('brandModal').classList.add('hidden');
  document.getElementById('brandModal').classList.remove('flex');
}

async function saveBrand(){
  const id = document.getElementById('brandId').value;

  const body = {
    brandName: document.getElementById('brandName').value.trim(),
    description: document.getElementById('brandDesc').value.trim(),
    status: document.getElementById('brandStatus').value
  };

  if(!body.brandName){
    showToast("Lỗi", "Vui lòng nhập tên thương hiệu", "error");
    return;
  }

  const url = id ? `${API_BASE}/brands/${id}` : `${API_BASE}/brands`;
  const method = id ? 'PUT' : 'POST';

  const res = await fetch(url,{
    method,
    headers: adminJsonHeaders(),
    body:JSON.stringify(body)
  });

  const data = await res.json().catch(()=>({}));

  if(!res.ok){
    showToast("Lỗi", data.message || "Lưu thương hiệu thất bại", "error");
    return;
  }

  closeBrandForm();

  showToast("Thành công", "Đã lưu thương hiệu");

  await init();
}

function deleteBrand(id){
  showConfirm("Xóa thương hiệu này?", async () => {
    const res = await fetch(
      `${API_BASE}/brands/${id}`,
      {
        method:'DELETE',
        headers: adminAuthHeaders()
      }
    );
    const data = await res.json().catch(() => ({}));

    if(!res.ok){
      showToast(
        "Lỗi",
        "Không thể xóa vì đang có sản phẩm dùng thương hiệu",
        "error"
      );
      return;
    }

    showToast("Thành công", "Đã xóa thương hiệu");
    await init();
  });
}
// ============================================================
// ORDER ADMIN - CHI TIẾT + CẬP NHẬT TRẠNG THÁI + EXCEL
// ============================================================

function safeOrderText(value){
  if(value === null || value === undefined){
    return "";
  }

  if(typeof escapeHtml === "function"){
    return escapeHtml(String(value));
  }

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


// ============================================================
// LẤY THÔNG TIN NGƯỜI NHẬN
// Hỗ trợ nhiều tên field để không phụ thuộc 1 DTO duy nhất
// ============================================================

function getOrderReceiverName(order){
  return (
    order?.receiverName ||
    order?.customerName ||
    order?.shippingName ||
    order?.user?.fullname ||
    order?.user?.fullName ||
    order?.user?.email ||
    "Khách hàng"
  );
}


function getOrderReceiverPhone(order){
  return (
    order?.receiverPhone ||
    order?.phone ||
    order?.shippingPhone ||
    order?.user?.phone ||
    ""
  );
}


function getOrderReceiverEmail(order){
  return (
    order?.email ||
    order?.user?.email ||
    ""
  );
}


function getOrderAddress(order) {

  let address =
    order?.shippingAddress ||
    order?.address ||
    order?.deliveryAddress ||
    order?.receiverAddress ||
    "";

  address = String(address || "").trim();

  if (!address) {
    return "—";
  }
  const parts = address
    .split("|")
    .map(item => item.trim())
    .filter(Boolean);

  if (parts.length >= 3) {
    return parts.slice(2).join(" | ");
  }

  return address;
}


function getOrderCode(order){
  if(order?.orderCode){
    return order.orderCode;
  }

  return "JODOK" + String(order?.orderId || "").padStart(6, "0");
}


function getOrderTotal(order){
  return Number(
    order?.finalAmount ??
    order?.totalAmount ??
    0
  );
}
function getOrderShippingFee(order) {

  // 1. Nếu backend đã trả riêng phí ship thì ưu tiên dùng
  const backendShippingFee =
    order?.shippingFee ??
    order?.shipFee ??
    order?.deliveryFee ??
    order?.shippingCost ??
    order?.feeShip;

  if (
    backendShippingFee !== undefined &&
    backendShippingFee !== null &&
    backendShippingFee !== ""
  ) {
    const fee = Number(backendShippingFee);

    if (Number.isFinite(fee)) {
      return Math.max(0, fee);
    }
  }


  // 2. Nếu API không trả phí ship riêng:
  // tính tổng tiền hàng từ items
  const items =
    Array.isArray(order?.items)
      ? order.items
      : [];

  const productTotal =
    items.reduce((sum, item) => {

      const qty =
        getOrderItemQuantity(item);

      const price =
        getOrderItemPrice(item);

      return sum + (price * qty);

    }, 0);


  // 3. Tổng tiền khách phải thanh toán
  const finalTotal =
    getOrderTotal(order);


  // 4. Phí ship = tổng thanh toán - tiền hàng
  const shippingFee =
    finalTotal - productTotal;


  return Math.max(0, shippingFee);
}

// ============================================================
// LẤY SẢN PHẨM TRONG ĐƠN
// ============================================================

function getOrderItemName(item){
  return (
    item?.variant?.product?.productName ||
    item?.product?.productName ||
    item?.productName ||
    item?.name ||
    "Sản phẩm"
  );
}


function getOrderItemQuantity(item){
  return Number(
    item?.quantity ??
    item?.qty ??
    0
  );
}


function getOrderItemPrice(item){
  return Number(
    item?.price ??
    item?.unitPrice ??
    item?.variant?.price ??
    0
  );
}


function getOrderItemVariant(item){
  const size =
    item?.variant?.size?.sizeName ||
    item?.variant?.size ||
    item?.size ||
    "";

  const color =
    item?.variant?.color?.colorName ||
    item?.variant?.color ||
    item?.color ||
    "";

  return [size, color]
    .filter(Boolean)
    .join(" / ");
}


function getOrderProductsText(order){
  const items = Array.isArray(order?.items)
    ? order.items
    : [];

  if(!items.length){
    return "";
  }

  return items
    .map(item => {
      const name = getOrderItemName(item);
      const variant = getOrderItemVariant(item);
      const quantity = getOrderItemQuantity(item);

      return `${name}${variant ? " (" + variant + ")" : ""} x${quantity}`;
    })
    .join("; ");
}


function getOrderTotalQuantity(order){
  return (order?.items || [])
    .reduce(
      (sum, item) =>
        sum + getOrderItemQuantity(item),
      0
    );
}


// ============================================================
// LABEL TRẠNG THÁI
// ============================================================

function orderDetailStatusLabel(status){
  const map = {
    PENDING: "Chờ xác nhận",
    PENDING_PAYMENT: "Chờ thanh toán",
    PAID: "Đã thanh toán",
    CONFIRMED: "Đã xác nhận",
    SHIPPING: "Đang giao",
    COMPLETED: "Hoàn thành",
    CANCELLED: "Đã hủy"
  };

  return map[status] || status || "Không rõ";
}


// ============================================================
// ĐÓNG POPUP
// ============================================================

function closeOrderDetail(){
  const modal =
    document.getElementById("orderDetailModalDynamic");

  if(modal){
    modal.remove();
  }

  document.body.style.overflow = "";
}


// ============================================================
// MỞ CHI TIẾT ĐƠN
// ============================================================
function getOrderItemProduct(item){

  const productId =
    item?.variant?.product?.productId ??
    item?.variant?.productId ??
    item?.product?.productId ??
    item?.productId ??
    item?.variant?.product_id ??
    item?.product_id;

  // Ưu tiên product đầy đủ đã load ở admin
  if(productId){

    const fullProduct = products.find(
      p => Number(p.productId) === Number(productId)
    );

    if(fullProduct){
      return fullProduct;
    }
  }

  // API order detail có trả product đầy đủ
  if(item?.variant?.product){
    return item.variant.product;
  }

  if(item?.product){
    return item.product;
  }

  return null;
}


function getOrderItemImage(item){

  const product =
    getOrderItemProduct(item);

  if(product){
    const src = productImg(product, 0);

    if(src){
      return src;
    }
  }


  // fallback nếu DTO order trả ảnh trực tiếp
  return (
    item?.imageUrl ||
    item?.productImage ||
    item?.variant?.imageUrl ||
    "/images/no-image.png"
  );
}


function getOrderItemName(item){

  const product =
    getOrderItemProduct(item);

  return (
    product?.productName ||
    item?.variant?.product?.productName ||
    item?.product?.productName ||
    item?.productName ||
    item?.name ||
    "Sản phẩm"
  );
}
async function openOrderDetail(orderId){

  const id = Number(orderId);

  if(!id){
    showToast(
      "Lỗi",
      "Mã đơn hàng không hợp lệ",
      "error"
    );
    return;
  }

  closeOrderDetail();

  try{

    const res = await fetch(
      `${API_BASE}/orders/${id}`,
      {
        method: "GET",
        headers: adminAuthHeaders()
      }
    );

    let order = null;

    try{
      order = await res.json();
    }catch(e){
      order = null;
    }

    if(!res.ok){

      const message =
        order?.message ||
        (
          res.status === 401
            ? "Phiên đăng nhập đã hết hạn"
            : res.status === 403
              ? "Tài khoản không có quyền xem đơn hàng"
              : "Không tải được chi tiết đơn hàng"
        );

      showToast(
        "Lỗi",
        message,
        "error"
      );

      return;
    }

    if(!order){
      showToast(
        "Lỗi",
        "API không trả về dữ liệu đơn hàng",
        "error"
      );
      return;
    }

    const items =
      Array.isArray(order.items)
        ? order.items
        : [];

    const modal =
      document.createElement("div");

    modal.id =
      "orderDetailModalDynamic";

    modal.className = `
      fixed
      inset-0
      z-[99999]
      bg-black/50
      flex
      items-center
      justify-center
      p-3
    `;

    modal.onclick = function(event){
      if(event.target === modal){
        closeOrderDetail();
      }
    };


    modal.innerHTML = `

      <div
        class="
          bg-white
          w-full
          max-w-5xl
          max-h-[96vh]
          rounded-2xl
          shadow-2xl
          overflow-hidden
          flex
          flex-col
        "
        onclick="event.stopPropagation()"
      >

        <!-- =================================================
             HEADER GỌN
        ================================================== -->

        <div
          class="
            shrink-0
            bg-white
            border-b
            px-5
            py-3
            flex
            items-center
            justify-between
            gap-4
          "
        >

          <div>

            <p
              class="
                text-xs
                text-red-800
                font-bold
                uppercase
                tracking-wider
              "
            >
              Chi tiết đơn hàng
            </p>

            <h2
              class="
                text-xl
                font-bold
                mt-0.5
              "
            >
              ${safeOrderText(getOrderCode(order))}
            </h2>

          </div>


          <button
            type="button"
            onclick="closeOrderDetail()"
            class="
              w-9
              h-9
              rounded-full
              border
              flex
              items-center
              justify-center
              hover:bg-neutral-100
              shrink-0
            "
          >
            ${icon("x", "w-4 h-4")}
          </button>

        </div>


        <!-- =================================================
             NỘI DUNG
        ================================================== -->

              <div
                class="
                  px-5
                  py-3
                  space-y-3
                  overflow-y-auto
                  min-h-0
                "
              >

          <!-- =================================================
               NGƯỜI NHẬN - 4 THÔNG TIN CÙNG HÀNG
          ================================================== -->

          <div
            class="
              border
              border-neutral-200
              rounded-xl
              px-4
              py-3
            "
          >

            <div
              class="
                flex
                items-center
                gap-2
                mb-2
              "
            >
              ${icon("user-round", "w-4 h-4")}

              <h3 class="font-bold text-base">
                Thông tin người nhận
              </h3>
            </div>


            <div
              class="
                grid
                grid-cols-2
                lg:grid-cols-4
                gap-x-5
                gap-y-2
              "
            >

              <div class="min-w-0">

                <p
                  class="
                    text-[11px]
                    text-neutral-500
                  "
                >
                  Họ và tên
                </p>

                <p
                  class="
                    font-semibold
                    text-sm
                    truncate
                  "
                  title="${safeOrderText(getOrderReceiverName(order))}"
                >
                  ${safeOrderText(getOrderReceiverName(order))}
                </p>

              </div>


              <div class="min-w-0">

                <p
                  class="
                    text-[11px]
                    text-neutral-500
                  "
                >
                  Số điện thoại
                </p>

                <p class="font-semibold text-sm">
                  ${safeOrderText(getOrderReceiverPhone(order) || "—")}
                </p>

              </div>


              <div class="min-w-0">

                <p
                  class="
                    text-[11px]
                    text-neutral-500
                  "
                >
                  Email
                </p>

                <p
                  class="
                    font-semibold
                    text-sm
                    truncate
                  "
                  title="${safeOrderText(getOrderReceiverEmail(order) || "—")}"
                >
                  ${safeOrderText(getOrderReceiverEmail(order) || "—")}
                </p>

              </div>


              <div class="min-w-0">

                <p
                  class="
                    text-[11px]
                    text-neutral-500
                  "
                >
                  Địa chỉ giao hàng
                </p>

                <p
                  class="
                    font-semibold
                    text-sm
                    truncate
                  "
                  title="${safeOrderText(getOrderAddress(order) || "—")}"
                >
                  ${safeOrderText(getOrderAddress(order) || "—")}
                </p>

              </div>

            </div>

          </div>


          <!-- =================================================
               TRẠNG THÁI - CHỈ 1 HÀNG
          ================================================== -->

          <div
            class="
              border
              border-red-100
              bg-red-50/30
              rounded-xl
              px-4
              py-2.5
            "
          >

            <div
              class="
                flex
                flex-col
                md:flex-row
                md:items-center
                gap-2
              "
            >

              <div
                class="
                  flex
                  items-center
                  gap-2
                  shrink-0
                "
              >
                <span
                  class="
                    text-sm
                    font-bold
                    whitespace-nowrap
                  "
                >
                  Trạng thái:
                </span>

                <span
                  class="
                    text-xs
                    text-neutral-500
                    whitespace-nowrap
                  "
                >
                  Hiện tại:
                  <b class="text-neutral-800">
                    ${
                      safeOrderText(
                        orderDetailStatusLabel(
                          order.orderStatus
                        )
                      )
                    }
                  </b>
                </span>

              </div>


              <div class="flex-1 min-w-0">

                <select
                  id="orderDetailStatus"
                  class="
                    w-full
                    h-10
                    border
                    border-neutral-300
                    rounded-lg
                    px-3
                    bg-white
                    outline-none
                    text-sm
                    focus:border-red-700
                  "
                >

                  <option
                    value="PENDING"
                    ${
                      order.orderStatus === "PENDING"
                        ? "selected"
                        : ""
                    }
                  >
                    Chờ xác nhận
                  </option>

                  <option
                    value="PENDING_PAYMENT"
                    ${
                      order.orderStatus === "PENDING_PAYMENT"
                        ? "selected"
                        : ""
                    }
                  >
                    Chờ thanh toán
                  </option>

                  <option
                    value="PAID"
                    ${
                      order.orderStatus === "PAID"
                        ? "selected"
                        : ""
                    }
                  >
                    Đã thanh toán
                  </option>

                  <option
                    value="CONFIRMED"
                    ${
                      order.orderStatus === "CONFIRMED"
                        ? "selected"
                        : ""
                    }
                  >
                    Đã xác nhận / Đang xử lý
                  </option>

                  <option
                    value="SHIPPING"
                    ${
                      order.orderStatus === "SHIPPING"
                        ? "selected"
                        : ""
                    }
                  >
                    Đang giao
                  </option>

                  <option
                    value="COMPLETED"
                    ${
                      order.orderStatus === "COMPLETED"
                        ? "selected"
                        : ""
                    }
                  >
                    Hoàn thành
                  </option>

                  <option
                    value="CANCELLED"
                    ${
                      order.orderStatus === "CANCELLED"
                        ? "selected"
                        : ""
                    }
                  >
                    Đã hủy
                  </option>

                </select>

              </div>


              <button
                id="saveOrderStatusBtn"
                type="button"
                onclick="saveOrderStatusFromDetail(${Number(order.orderId)})"
                class="
                  h-10
                  px-5
                  rounded-lg
                  bg-red-800
                  hover:bg-red-900
                  text-white
                  text-sm
                  font-bold
                  inline-flex
                  items-center
                  justify-center
                  gap-2
                  whitespace-nowrap
                  shrink-0
                "
              >
                ${icon("save", "w-4 h-4")}
                Cập nhật trạng thái
              </button>

            </div>

          </div>


          <!-- =================================================
               SẢN PHẨM
          ================================================== -->

          <div>

            <div
              class="
                flex
                items-center
                justify-between
                mb-2
              "
            >

              <h3
                class="
                  font-bold
                  text-lg
                "
              >
                Sản phẩm trong đơn
              </h3>

              <span
                class="
                  text-xs
                  text-neutral-500
                "
              >
                ${items.length} sản phẩm
              </span>

            </div>


            <div
              class="
                border
                border-neutral-200
                rounded-xl
                overflow-hidden
              "
            >

              <!-- Header sản phẩm -->

              <div
                class="
                  hidden
                  md:grid
                  grid-cols-[minmax(0,2.4fr)_1fr_55px_110px_110px]
                  gap-3
                  bg-neutral-50
                  border-b
                  px-3
                  py-2
                  text-xs
                  font-semibold
                  text-neutral-600
                "
              >

                <div>Sản phẩm</div>

                <div>Phân loại</div>

                <div class="text-center">
                  SL
                </div>

                <div class="text-right">
                  Đơn giá
                </div>

                <div class="text-right">
                  Thành tiền
                </div>

              </div>


              <!--
                Chỉ khu vực sản phẩm cuộn khi đơn có nhiều SP.
                1-3 sản phẩm sẽ nhìn thấy ngay.
              -->

              <div
                class="
                  max-h-[230px]
                  overflow-y-auto
                  divide-y
                  divide-neutral-100
                "
              >

                ${
                  items.length

                    ? items.map(item => {

                        const qty =
                          getOrderItemQuantity(item);

                        const price =
                          getOrderItemPrice(item);

                        const variant =
                          getOrderItemVariant(item);

                        const image =
                          getOrderItemImage(item);

                        const name =
                          getOrderItemName(item);


                        return `

                          <div
                            class="
                              grid
                              grid-cols-1
                              md:grid-cols-[minmax(0,2.4fr)_1fr_55px_110px_110px]
                              md:items-center
                              gap-2
                              md:gap-3
                              px-3
                              py-2
                            "
                          >

                            <!-- SẢN PHẨM -->

                            <div
                              class="
                                flex
                                items-center
                                gap-3
                                min-w-0
                              "
                            >

                              <img
                                src="${safeOrderText(image)}"
                                alt="${safeOrderText(name)}"
                                onerror="this.src='/images/no-image.png'"
                                class="
                                  w-11
                                  h-12
                                  rounded-lg
                                  object-cover
                                  border
                                  border-neutral-200
                                  shrink-0
                                "
                              >


                              <div class="min-w-0">

                                <p
                                  class="
                                    font-semibold
                                    text-sm
                                    truncate
                                  "
                                  title="${safeOrderText(name)}"
                                >
                                  ${safeOrderText(name)}
                                </p>

                                ${
                                  variant

                                    ? `
                                      <p
                                        class="
                                          md:hidden
                                          text-xs
                                          text-neutral-500
                                          mt-0.5
                                        "
                                      >
                                        ${safeOrderText(variant)}
                                      </p>
                                    `

                                    : ""
                                }

                              </div>

                            </div>


                            <!-- PHÂN LOẠI -->

                            <div
                              class="
                                hidden
                                md:block
                                text-sm
                                text-neutral-600
                                truncate
                              "
                              title="${safeOrderText(variant || "—")}"
                            >
                              ${safeOrderText(variant || "—")}
                            </div>


                            <!-- SỐ LƯỢNG -->

                            <div
                              class="
                                hidden
                                md:block
                                text-sm
                                text-center
                              "
                            >
                              ${qty}
                            </div>


                            <!-- ĐƠN GIÁ -->

                            <div
                              class="
                                hidden
                                md:block
                                text-sm
                                text-right
                              "
                            >
                              ${money(price)}
                            </div>


                            <!-- THÀNH TIỀN -->

                            <div
                              class="
                                hidden
                                md:block
                                text-sm
                                font-bold
                                text-right
                              "
                            >
                              ${money(price * qty)}
                            </div>


                            <!-- MOBILE -->

                            <div
                              class="
                                md:hidden
                                flex
                                items-center
                                justify-between
                                text-xs
                                text-neutral-600
                              "
                            >

                              <span>
                                SL: ${qty}
                              </span>

                              <span>
                                ${money(price)} × ${qty}
                              </span>

                              <b class="text-neutral-900">
                                ${money(price * qty)}
                              </b>

                            </div>

                          </div>

                        `;

                      }).join("")

                    : `

                      <div
                        class="
                          px-4
                          py-6
                          text-center
                          text-sm
                          text-neutral-400
                        "
                      >
                        Đơn hàng chưa có sản phẩm
                      </div>

                    `
                }

              </div>

            </div>

          </div>
          <!-- =================================================
              TỔNG KẾT ĐƠN HÀNG
          ================================================== -->

          <div
            class="
              border-t
              pt-3
              flex
              items-start
              justify-between
              gap-5
            "
          >

            <!-- TỔNG SỐ LƯỢNG -->

            <div
              class="
                text-sm
                text-neutral-500
                pt-1
              "
            >
              Tổng số lượng:

              <b class="text-neutral-900">
                ${getOrderTotalQuantity(order)}
              </b>
            </div>


            <!-- CHI TIẾT THANH TOÁN -->

            <div
              class="
                ml-auto
                w-[280px]
                space-y-1.5
              "
            >

              <!-- TIỀN HÀNG -->

              <div
                class="
                  flex
                  items-center
                  justify-between
                  gap-6
                  text-sm
                "
              >

                <span class="text-neutral-500">
                  Tiền hàng
                </span>

                <span class="font-semibold text-neutral-800">
                  ${
                    money(
                      Math.max(
                        0,
                        getOrderTotal(order) -
                        getOrderShippingFee(order)
                      )
                    )
                  }
                </span>

              </div>


              <!-- PHÍ SHIP -->

              <div
                class="
                  flex
                  items-center
                  justify-between
                  gap-6
                  text-sm
                "
              >

                <span
                  class="
                    text-neutral-500
                    flex
                    items-center
                    gap-1.5
                  "
                >
                  ${icon("truck", "w-4 h-4")}

                  Phí vận chuyển
                </span>

                <span class="font-semibold text-neutral-800">
                  ${money(getOrderShippingFee(order))}
                </span>

              </div>


              <!-- ĐƯỜNG KẺ -->

              <div class="border-t my-2"></div>


              <!-- TỔNG THANH TOÁN -->

              <div
                class="
                  flex
                  items-center
                  justify-between
                  gap-6
                "
              >

                <span class="font-semibold text-neutral-700">
                  Tổng thanh toán
                </span>

                <strong
                  class="
                    text-lg
                    text-red-800
                  "
                >
                  ${money(getOrderTotal(order))}
                </strong>

              </div>

            </div>

          </div>

        </div>

      </div>

    `;


    document.body.appendChild(modal);

    document.body.style.overflow =
      "hidden";


    if(
      window.lucide &&
      typeof lucide.createIcons === "function"
    ){
      lucide.createIcons();
    }


  }catch(error){

    console.error(
      "OPEN ORDER DETAIL ERROR:",
      error
    );

    showToast(
      "Lỗi",
      error?.message ||
      "Không thể mở chi tiết đơn hàng",
      "error"
    );

  }

}


// ============================================================
// CẬP NHẬT TRẠNG THÁI
// ============================================================

async function updateOrderStatus(orderId, status){

  const id =
    Number(orderId);

  const newStatus =
    String(status || "")
      .trim()
      .toUpperCase();


  if(!id){

    showToast(
      "Lỗi",
      "Mã đơn hàng không hợp lệ",
      "error"
    );

    return false;

  }


  const allowedStatuses = [
    "PENDING",
    "PENDING_PAYMENT",
    "PAID",
    "CONFIRMED",
    "SHIPPING",
    "COMPLETED",
    "CANCELLED"
  ];


  if(!allowedStatuses.includes(newStatus)){

    showToast(
      "Lỗi",
      "Trạng thái đơn hàng không hợp lệ",
      "error"
    );

    return false;

  }


  try{

    const res = await fetch(
      `${API_BASE}/orders/${id}/status?status=${encodeURIComponent(newStatus)}`,
      {
        method: "PUT",
        headers: adminAuthHeaders()
      }
    );


    let data = {};

    try{
      data = await res.json();
    }catch(e){
      data = {};
    }


    if(!res.ok){

      let message =
        data?.message ||
        "Cập nhật trạng thái thất bại";


      if(res.status === 401){
        message =
          "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
      }


      if(res.status === 403){
        message =
          data?.message ||
          "Tài khoản hiện tại không có quyền cập nhật đơn hàng.";
      }


      showToast(
        "Lỗi",
        message,
        "error"
      );


      console.error(
        "UPDATE ORDER STATUS FAILED:",
        {
          orderId: id,
          status: newStatus,
          httpStatus: res.status,
          response: data
        }
      );


      return false;

    }


    // cập nhật local ngay lập tức
    const index =
      orders.findIndex(
        o => Number(o.orderId) === id
      );


    if(index !== -1){

      orders[index] = {
        ...orders[index],
        ...data,
        orderStatus:
          data?.orderStatus ||
          newStatus
      };

    }


    showToast(
      "Thành công",
      "Đã cập nhật trạng thái đơn hàng"
    );


    return true;


  }catch(error){

    console.error(
      "UPDATE ORDER STATUS ERROR:",
      error
    );


    showToast(
      "Lỗi",
      "Không kết nối được tới máy chủ để cập nhật trạng thái.",
      "error"
    );


    return false;

  }

}


// ============================================================
// LƯU TRẠNG THÁI TỪ POPUP
// ============================================================

async function saveOrderStatusFromDetail(orderId){

  const select =
    document.getElementById(
      "orderDetailStatus"
    );


  if(!select){

    showToast(
      "Lỗi",
      "Không tìm thấy ô chọn trạng thái",
      "error"
    );

    return;

  }


  const button =
    document.getElementById(
      "saveOrderStatusBtn"
    );


  const status =
    select.value;


  if(button){

    button.disabled = true;

    button.classList.add(
      "opacity-60",
      "cursor-not-allowed"
    );

    button.innerHTML =
      "Đang cập nhật...";

  }


  const success =
    await updateOrderStatus(
      orderId,
      status
    );


  if(!success){

    if(button){

      button.disabled = false;

      button.classList.remove(
        "opacity-60",
        "cursor-not-allowed"
      );

      button.innerHTML = `
        ${icon("save", "w-5 h-5")}
        Cập nhật trạng thái
      `;

      if(
        window.lucide &&
        typeof lucide.createIcons === "function"
      ){
        lucide.createIcons();
      }

    }

    return;

  }


  // tải lại toàn bộ danh sách
  await loadData();


  // render lại bảng
  render();


  // render() xóa modal nếu modal nằm trong app,
  // nên đóng modal động trước khi mở lại
  closeOrderDetail();


  // mở lại chi tiết với dữ liệu mới
  await openOrderDetail(orderId);

}


// ============================================================
// ESCAPE GIÁ TRỊ CHO EXCEL HTML
// ============================================================

function excelEscape(value){

  if(value === null || value === undefined){
    return "";
  }


  return String(value)

    .replaceAll("&", "&amp;")

    .replaceAll("<", "&lt;")

    .replaceAll(">", "&gt;")

    .replaceAll('"', "&quot;");

}


// ============================================================
// LẤY DANH SÁCH ĐƠN THEO BỘ LỌC HIỆN TẠI
// Dùng cho Excel
// ============================================================

function getFilteredOrdersForExport(){

  const keyword =
    String(
      adminSearch.orders || ""
    )
    .trim()
    .toLowerCase();


  let list =
    [...orders];


  // SEARCH
  if(keyword){

    list = list.filter(o => {

      const text = [

        o.orderId,

        getOrderCode(o),

        getOrderReceiverName(o),

        getOrderReceiverPhone(o),

        getOrderReceiverEmail(o),

        getOrderAddress(o)

      ]
      .join(" ")
      .toLowerCase();


      return text.includes(keyword);

    });

  }


  // STATUS
  if(orderStatusFilter !== "ALL"){

    if(orderStatusFilter === "PENDING"){

      list = list.filter(o =>
        o.orderStatus === "PENDING" ||
        o.orderStatus === "PENDING_PAYMENT"
      );

    }

    else if(
      orderStatusFilter === "PROCESSING"
    ){

      list = list.filter(o =>
        o.orderStatus === "PAID" ||
        o.orderStatus === "CONFIRMED"
      );

    }

    else{

      list = list.filter(
        o =>
          o.orderStatus ===
          orderStatusFilter
      );

    }

  }


  // PAYMENT
  if(orderPaymentFilter !== "ALL"){

    list = list.filter(o =>
      String(
        getOrderPaymentMethod(o)
      ).toUpperCase()
      ===
      orderPaymentFilter
    );

  }


  // FROM DATE
  if(orderFromDate){

    list = list.filter(o => {

      if(!o.createdAt){
        return false;
      }

      const d =
        new Date(o.createdAt);

      if(Number.isNaN(d.getTime())){
        return false;
      }

      const day =
        [
          d.getFullYear(),
          String(
            d.getMonth() + 1
          ).padStart(2, "0"),
          String(
            d.getDate()
          ).padStart(2, "0")
        ].join("-");


      return day >= orderFromDate;

    });

  }


  // TO DATE
  if(orderToDate){

    list = list.filter(o => {

      if(!o.createdAt){
        return false;
      }

      const d =
        new Date(o.createdAt);

      if(Number.isNaN(d.getTime())){
        return false;
      }

      const day =
        [
          d.getFullYear(),
          String(
            d.getMonth() + 1
          ).padStart(2, "0"),
          String(
            d.getDate()
          ).padStart(2, "0")
        ].join("-");


      return day <= orderToDate;

    });

  }


  return list.sort(
    (a, b) =>
      new Date(b.createdAt || 0) -
      new Date(a.createdAt || 0)
  );

}


// ============================================================
// XUẤT FILE EXCEL ĐƠN VẬN CHUYỂN
//
// Không cần thư viện XLSX.
// Xuất .xls HTML tương thích Excel.
// ============================================================

function exportShippingExcel(){

  try{

    const list =
      getFilteredOrdersForExport();


    if(!list.length){

      showToast(
        "Thông báo",
        "Không có đơn hàng phù hợp để xuất Excel",
        "error"
      );

      return;

    }
    /*
     * Đây là mẫu chung cho dữ liệu vận chuyển.
     */
    const rows =
      list.map((order, index) => {


        const payment =
          typeof orderPaymentLabel === "function"
            ? orderPaymentLabel(order)
            : getOrderPaymentMethod(order);


        /*
         * COD:
         * CASH -> thu tiền khi giao.
         *
         * QR -> khách đã/chuyển khoản,
         * mặc định tiền thu hộ = 0.
         */
        const method =
          String(
            getOrderPaymentMethod(order)
          ).toUpperCase();


        const cod =
          method === "CASH"
            ? getOrderTotal(order)
            : 0;


        const productValue =
          getOrderTotal(order);


        return `

          <tr>

            <td>
              ${index + 1}
            </td>

            <td style="mso-number-format:'\\@';">
              ${excelEscape(getOrderCode(order))}
            </td>

            <td>
              ${excelEscape(getOrderReceiverName(order))}
            </td>

            <td style="mso-number-format:'\\@';">
              ${excelEscape(getOrderReceiverPhone(order))}
            </td>

            <td>
              ${excelEscape(getOrderReceiverEmail(order))}
            </td>

            <td>
              ${excelEscape(getOrderAddress(order))}
            </td>

            <td>
              ${excelEscape(getOrderProductsText(order))}
            </td>

            <td>
              ${getOrderTotalQuantity(order)}
            </td>

            <td>
            </td>

            <td>
              ${cod}
            </td>

            <td>
              ${productValue}
            </td>

            <td>
              ${excelEscape(payment)}
            </td>

            <td>
              ${excelEscape(
                orderDetailStatusLabel(
                  order.orderStatus
                )
              )}
            </td>

            <td>
              ${excelEscape(
                typeof formatOrderDate === "function"
                  ? formatOrderDate(order.createdAt)
                  : order.createdAt || ""
              )}
            </td>

            <td>
              ${excelEscape(
                order.note ||
                order.notes ||
                order.customerNote ||
                ""
              )}
            </td>

          </tr>

        `;

      }).join("");


    const html = `

      <!DOCTYPE html>

      <html>

      <head>

        <meta charset="UTF-8">

        <style>

          table{
            border-collapse:collapse;
            font-family:Arial,sans-serif;
            font-size:12px;
          }

          th,
          td{
            border:1px solid #999;
            padding:8px;
            vertical-align:top;
          }

          th{
            background:#eeeeee;
            font-weight:bold;
            white-space:nowrap;
          }

        </style>

      </head>


      <body>


        <table>


          <tr>

            <th colspan="15">
              DANH SÁCH ĐƠN VẬN CHUYỂN JODOK
            </th>

          </tr>


          <tr>

            <td colspan="15">

              Ngày xuất:
              ${
                excelEscape(
                  new Date().toLocaleString(
                    "vi-VN"
                  )
                )
              }

            </td>

          </tr>


          <tr>

            <th>STT</th>

            <th>Mã đơn hàng</th>

            <th>Tên người nhận</th>

            <th>SĐT người nhận</th>

            <th>Email</th>

            <th>Địa chỉ giao hàng</th>

            <th>Nội dung hàng hóa</th>

            <th>Số lượng</th>

            <th>Khối lượng (gram)</th>

            <th>Tiền thu hộ COD</th>

            <th>Giá trị hàng hóa</th>

            <th>Phương thức thanh toán</th>

            <th>Trạng thái đơn</th>

            <th>Ngày đặt hàng</th>

            <th>Ghi chú</th>

          </tr>


          ${rows}


        </table>


      </body>

      </html>

    `;


    const blob =
      new Blob(
        [
          "\ufeff",
          html
        ],
        {
          type:
            "application/vnd.ms-excel;charset=utf-8;"
        }
      );


    const url =
      URL.createObjectURL(blob);


    const link =
      document.createElement("a");


    const today =
      new Date()
        .toISOString()
        .slice(0, 10);


    link.href =
      url;


    link.download =
      `don-van-chuyen-jodok-${today}.xls`;


    document.body.appendChild(link);


    link.click();


    link.remove();


    setTimeout(
      () =>
        URL.revokeObjectURL(url),
      1000
    );


    showToast(
      "Thành công",
      `Đã xuất ${list.length} đơn hàng ra Excel`
    );


  }catch(error){

    console.error(
      "EXPORT SHIPPING EXCEL ERROR:",
      error
    );


    showToast(
      "Lỗi",
      error?.message ||
      "Không thể xuất file Excel",
      "error"
    );

  }

}

function voucherPanel(){
  const list = vouchers.filter(v =>
    (v.code || "").toLowerCase().includes(adminSearch.promo)
  );
  return `<div class="soft-card overflow-hidden">
    ${adminToolbar("promo", "Quản lý voucher", "Thêm", "openVoucherForm()")}

    <div class="overflow-x-auto">
      <table class="w-full text-left">
        <thead class="bg-neutral-50 text-sm text-neutral-500">
          <tr>
            <th class="p-4">Mã</th>
            <th>Loại</th>
            <th>Giá trị</th>
            <th>Đơn tối thiểu</th>
            <th>Hết hạn</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>

        <tbody>
          ${
            list.length
              ? list.map(v => `
              <tr class="border-t">
                <td class="p-4 font-bold">${v.code}</td>
                <td>${v.discountType}</td>
                <td class="text-red-800 font-bold">
                  ${v.discountType === "PERCENT" ? v.discountValue + "%" : money(v.discountValue)}
                </td>
                <td>${money(v.minOrderValue)}</td>
                <td>${v.endDate || "-"}</td>
                <td>
                  <span class="rounded-full px-3 py-1 text-sm ${
                    isVoucherExpired(v)
                      ? "bg-red-50 text-red-700"
                      : v.status === "ACTIVE"
                        ? "bg-green-50 text-green-700"
                        : "bg-neutral-100 text-neutral-500"
                  }">
                    ${voucherStatusText(v)}
                  </span>
                </td>
                <td class="space-x-2">
                  <button onclick="openVoucherForm(${v.voucherId})" class="border rounded-full px-2 py-2 text-sm">Sửa</button>
                  <button onclick="deleteVoucher(${v.voucherId})" class="bg-red-800 text-white rounded-full px-2 py-2 text-sm">Xóa</button>
                </td>
              </tr>
            `).join("")
            : `<tr><td colspan="7" class="p-6 text-neutral-500 text-center">Chưa có voucher</td></tr>`
          }
        </tbody>
      </table>
    </div>
  </div>${voucherModal()}`;
}

function voucherModal(){
  return `<div id="voucherModal" class="fixed inset-0 bg-black/40 z-[999] hidden items-center justify-center p-5">
    <div class="bg-white rounded-3xl p-7 w-full max-w-lg shadow-xl">
      <div class="flex justify-between items-center mb-5">
        <h2 id="voucherFormTitle" class="serif text-3xl">Thêm voucher</h2>
        <button onclick="closeVoucherForm()" class="text-2xl">×</button>
      </div>

      <input type="hidden" id="voucherId">

      <div class="space-y-4">
        <input id="voucherCode" class="input-ui" placeholder="Mã voucher, VD: SALE10">

        <select id="voucherType" class="input-ui">
          <option value="PERCENT">Giảm theo %</option>
          <option value="FIXED">Giảm tiền cố định</option>
        </select>

        <input id="voucherValue" type="number" class="input-ui" placeholder="Giá trị giảm">

        <input id="voucherMinOrder" type="number" class="input-ui" placeholder="Đơn tối thiểu">

        <input id="voucherEndDate" type="date" class="input-ui">

        <select id="voucherStatus" class="input-ui">
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
        </select>

        <button onclick="saveVoucher()" class="btn-primary w-full">Lưu voucher</button>
      </div>
    </div>
  </div>`;
}

function openVoucherForm(id=null){
  document.getElementById("voucherModal").classList.remove("hidden");
  document.getElementById("voucherModal").classList.add("flex");

  document.getElementById("voucherFormTitle").innerText = id ? "Sửa voucher" : "Thêm voucher";
  document.getElementById("voucherId").value = id || "";

  const v = vouchers.find(x => x.voucherId === id);

  document.getElementById("voucherCode").value = v?.code || "";
  document.getElementById("voucherType").value = v?.discountType || "PERCENT";
  document.getElementById("voucherValue").value = v?.discountValue || "";
  document.getElementById("voucherMinOrder").value = v?.minOrderValue || 0;
  document.getElementById("voucherEndDate").value = v?.endDate || "";
  document.getElementById("voucherStatus").value = v?.status || "ACTIVE";
}

function closeVoucherForm(){
  document.getElementById("voucherModal").classList.add("hidden");
  document.getElementById("voucherModal").classList.remove("flex");
}

async function saveVoucher(){
  const id = document.getElementById("voucherId").value;

  const body = {
    code: document.getElementById("voucherCode").value.trim(),
    discountType: document.getElementById("voucherType").value,
    discountValue: Number(document.getElementById("voucherValue").value),
    minOrderValue: Number(document.getElementById("voucherMinOrder").value),
    endDate: document.getElementById("voucherEndDate").value || null,
    status: document.getElementById("voucherStatus").value
  };

  if(!body.code || !body.discountValue){
    showToast("Lỗi", "Vui lòng nhập mã và giá trị voucher", "error");
    return;
  }

  const url = id ? `${API_BASE}/vouchers/${id}` : `${API_BASE}/vouchers`;
  const method = id ? "PUT" : "POST";

  const res = await fetch(url,{
    method,
    headers: adminJsonHeaders(),
    body: JSON.stringify(body)
  });

  if(!res.ok){
    showToast("Lỗi", await res.text(), "error");
    return;
  }

  closeVoucherForm();
  showToast("Thành công", "Đã lưu voucher");
  await init();

  currentTab = "promo";
  render();
}

function deleteVoucher(id){
  showConfirm("Xóa voucher này?", async () => {
    const res = await fetch(
      `${API_BASE}/vouchers/${id}`,
      {
        method:"DELETE",
        headers: adminAuthHeaders()
      }
    );

    if(!res.ok){
      showToast("Lỗi", "Xóa voucher thất bại", "error");
      return;
    }

    showToast("Thành công", "Đã xóa voucher");
    await init();
    currentTab = "promo";
    render();
  });
}

function openUserForm(id=null){
  document.getElementById("userModal").classList.remove("hidden");
  document.getElementById("userModal").classList.add("flex");

  document.getElementById("userFormTitle").innerText = id ? "Sửa người dùng" : "Thêm người dùng";
  document.getElementById("userId").value = id || "";

  const u = users.find(x => x.userId === id);

  document.getElementById("userFullname").value = u?.fullname || "";
  document.getElementById("userEmail").value = u?.email || "";
  document.getElementById("userPhone").value = u?.phone || "";
  document.getElementById("userPassword").value = "";
  document.getElementById("userRole").value = u?.role || "USER";
  document.getElementById("userStatus").value = u?.status || "ACTIVE";
  document.getElementById("userAddress").value = u?.address || "";
}

function closeUserForm(){
  document.getElementById("userModal").classList.add("hidden");
  document.getElementById("userModal").classList.remove("flex");
}

async function saveUser(){
  const id = document.getElementById("userId").value;

  const body = {
    fullname: document.getElementById("userFullname").value.trim(),
    email: document.getElementById("userEmail").value.trim(),
    phone: document.getElementById("userPhone").value.trim(),
    password: document.getElementById("userPassword").value,
    role: document.getElementById("userRole").value,
    status: document.getElementById("userStatus").value,
    address: document.getElementById("userAddress").value.trim()
  };

  if(!body.fullname || !body.email){
    showToast("Lỗi", "Vui lòng nhập họ tên và email", "error");
    return;
  }

  if(!id && !body.password){
    showToast("Lỗi", "Vui lòng nhập mật khẩu cho tài khoản mới", "error");
    return;
  }

  const url = id ? `${API_BASE}/users/${id}` : `${API_BASE}/users`;
  const method = id ? "PUT" : "POST";

  const res = await fetch(url, {
    method,
    headers: adminJsonHeaders(),
    body: JSON.stringify(body)
  });

  const data = await res.json().catch(() => ({}));

  if(!res.ok){
    showToast("Lỗi", data.message || "Lưu người dùng thất bại", "error");
    return;
  }

  closeUserForm();
  await init();
  currentTab = "users";
  render();
  showToast("Thành công", "Đã lưu người dùng");
}

function deleteUser(id){
  const currentAdmin = admin();

  if(currentAdmin?.userId === id){
    showToast("Lỗi", "Không thể xóa chính tài khoản đang đăng nhập", "error");
    return;
  }

  showConfirm("Xóa người dùng này?", async () => {
    const res = await fetch(
      `${API_BASE}/users/${id}`,
      {
        method:"DELETE",
        headers: adminAuthHeaders()
      }
    );

    const data = await res.json().catch(() => ({}));

    if(!res.ok){
      showToast("Lỗi", data.message || "Xóa người dùng thất bại", "error");
      return;
    }

    await init();
    currentTab = "users";
    render();
    showToast("Thành công", "Đã xóa người dùng");
  });
}



function productHasOrders(productId){
  return orders.some(order =>
    (order.items || []).some(item =>
      item.variant?.product?.productId === productId
    )
  );
}

async function hideProduct(id){
  const p = products.find(x => x.productId === id);

  if(!p) return;

  showConfirm("Ẩn sản phẩm này?", async () => {

    const res = await fetch(`${API_BASE}/products/${id}`,{
      method:"PUT",
      headers: adminJsonHeaders(),
      body:JSON.stringify({
        productName:p.productName,
        description:p.description || "",
        basePrice:p.basePrice,
        categoryId:p.category?.categoryId,
        brandId:p.brand?.brandId || null,
        status:"INACTIVE"
      })
    });

    if(!res.ok){
      showToast("Lỗi","Không thể ẩn sản phẩm","error");
      return;
    }

    showToast("Thành công","Đã ẩn sản phẩm khỏi shop");
    await init();

  }, "Ẩn");
}

async function showProduct(id){
  const p = products.find(x => x.productId === id);

  if(!p) return;

  showConfirm("Hiện lại sản phẩm này trên shop?", async () => {

    const body = {
      productName: p.productName,
      description: p.description || "",
      basePrice: Number(p.basePrice),
      categoryId: p.category?.categoryId || null,
      brandId: p.brand?.brandId || null,
      status: "ACTIVE"
    };

    if(!body.productName || !body.categoryId){
      showToast("Lỗi", "Sản phẩm thiếu tên hoặc danh mục", "error");
      return;
    }

    const res = await fetch(`${API_BASE}/products/${id}`,{
      method:"PUT",
      headers: adminJsonHeaders(),
      body: JSON.stringify(body)
    });

    if(!res.ok){
      const text = await res.text();
      console.error("Lỗi hiện sản phẩm:", text);
      showToast("Lỗi", text || "Không thể hiện sản phẩm", "error");
      return;
    }

    showToast("Thành công","Đã hiện sản phẩm trên shop");
    await init();

    currentTab = "products";
    render();

  }, "Hiện");
}

function reportOrders(){
  let list = orders;

  if(reportFrom){
    list = list.filter(o =>
      o.createdAt && dateOnly(o.createdAt) >= reportFrom
    );
  }

  if(reportTo){
    list = list.filter(o =>
      o.createdAt && dateOnly(o.createdAt) <= reportTo
    );
  }

  return list;
}

function changeReportFilter(){

  reportFrom =
    document.getElementById("reportFrom").value;

  reportTo =
    document.getElementById("reportTo").value;

  render();
}

function escapeHtml(value){
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* =========================================================
   QUẢN LÝ ĐÁNH GIÁ
========================================================= */

function reviewProductName(review) {
  return (
    review?.orderItem?.variant?.product?.productName ||
    review?.orderItem?.product?.productName ||
    review?.product?.productName ||
    review?.productName ||
    "Không rõ sản phẩm"
  );
}


/* =========================================================
   PRODUCT ID CỦA REVIEW
========================================================= */

function reviewProductId(review) {
  return (
    review?.orderItem?.variant?.product?.productId ??
    review?.orderItem?.product?.productId ??
    review?.product?.productId ??
    review?.productId ??
    null
  );
}


/* =========================================================
   ORDER ID CỦA REVIEW
========================================================= */

function reviewOrderId(review) {
  return (
    review?.orderItem?.order?.orderId ??
    review?.orderItem?.orderId ??
    review?.order?.orderId ??
    review?.orderId ??
    null
  );
}


/* =========================================================
   ORDER ITEM ID
========================================================= */

function reviewOrderItemId(review) {
  return (
    review?.orderItem?.orderItemId ??
    review?.orderItem?.id ??
    null
  );
}


/* =========================================================
   FORMAT DATE
========================================================= */

function reviewDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("vi-VN");
}


/* =========================================================
   RATING STARS
========================================================= */

function reviewStars(rating) {
  let value = Number(rating || 0);

  value = Math.max(
    0,
    Math.min(5, value)
  );

  return `
    <span class="text-yellow-500">
      ${"★".repeat(value)}
    </span>

    <span class="text-neutral-300">
      ${"★".repeat(5 - value)}
    </span>
  `;
}


/* =========================================================
   TÌM REVIEW THEO ID
========================================================= */

function findReviewById(id) {
  return reviews.find(
    r => Number(r.reviewId) === Number(id)
  );
}


/* =========================================================
   ĐỔI TRANG REVIEW
========================================================= */

function changeReviewPage(page) {
  const keyword =
    String(adminSearch.reviews || "")
      .trim()
      .toLowerCase();

  const filtered = reviews.filter(r => {

    const userName =
      String(r.user?.fullname || "")
        .toLowerCase();

    const email =
      String(r.user?.email || "")
        .toLowerCase();

    const productName =
      String(reviewProductName(r))
        .toLowerCase();

    const comment =
      String(r.comment || "")
        .toLowerCase();

    return (
      userName.includes(keyword) ||
      email.includes(keyword) ||
      productName.includes(keyword) ||
      comment.includes(keyword)
    );
  });

  const totalPages = Math.max(
    1,
    Math.ceil(
      filtered.length / REVIEW_PAGE_SIZE
    )
  );

  reviewPage = Math.min(
    Math.max(1, Number(page) || 1),
    totalPages
  );

  render();
}


/* =========================================================
   PHÂN TRANG
========================================================= */

function reviewPagination(totalPages) {

  if (totalPages <= 1) {
    return "";
  }

  const pages = [];

  /*
   * Tối đa hiển thị khoảng 5 số trang quanh trang hiện tại.
   */
  let start = Math.max(
    1,
    reviewPage - 2
  );

  let end = Math.min(
    totalPages,
    reviewPage + 2
  );


  if (reviewPage <= 3) {
    end = Math.min(
      totalPages,
      5
    );
  }


  if (reviewPage >= totalPages - 2) {
    start = Math.max(
      1,
      totalPages - 4
    );
  }


  /*
   * Trang đầu.
   */
  if (start > 1) {

    pages.push(`
      <button
        type="button"
        onclick="changeReviewPage(1)"
        class="
          w-9 h-9
          rounded-lg
          border
          bg-white
          hover:bg-neutral-50
          font-semibold
        "
      >
        1
      </button>
    `);


    if (start > 2) {

      pages.push(`
        <span
          class="
            w-8
            text-center
            text-neutral-400
          "
        >
          ...
        </span>
      `);
    }
  }


  /*
   * Các trang giữa.
   */
  for (
    let page = start;
    page <= end;
    page++
  ) {

    pages.push(`
      <button
        type="button"
        onclick="changeReviewPage(${page})"
        class="
          w-9 h-9
          rounded-lg
          border
          font-semibold
          transition

          ${
            page === reviewPage
              ? "bg-red-800 text-white border-red-800"
              : "bg-white hover:bg-neutral-50"
          }
        "
      >
        ${page}
      </button>
    `);
  }


  /*
   * Trang cuối.
   */
  if (end < totalPages) {

    if (end < totalPages - 1) {

      pages.push(`
        <span
          class="
            w-8
            text-center
            text-neutral-400
          "
        >
          ...
        </span>
      `);
    }


    pages.push(`
      <button
        type="button"
        onclick="changeReviewPage(${totalPages})"
        class="
          w-9 h-9
          rounded-lg
          border
          bg-white
          hover:bg-neutral-50
          font-semibold
        "
      >
        ${totalPages}
      </button>
    `);
  }


  return `
    <div
      class="
        flex
        items-center
        gap-2
        flex-wrap
        justify-end
      "
    >

      <!-- TRƯỚC -->
      <button
        type="button"

        onclick="
          changeReviewPage(
            ${Math.max(1, reviewPage - 1)}
          )
        "

        ${reviewPage <= 1 ? "disabled" : ""}

        class="
          h-9
          px-3
          rounded-lg
          border
          bg-white
          font-semibold
          text-sm
          flex
          items-center
          gap-1

          ${
            reviewPage <= 1
              ? "opacity-40 cursor-not-allowed"
              : "hover:bg-neutral-50"
          }
        "
      >
        ‹ Trước
      </button>


      ${pages.join("")}


      <!-- SAU -->
      <button
        type="button"

        onclick="
          changeReviewPage(
            ${Math.min(
              totalPages,
              reviewPage + 1
            )}
          )
        "

        ${
          reviewPage >= totalPages
            ? "disabled"
            : ""
        }

        class="
          h-9
          px-3
          rounded-lg
          border
          bg-white
          font-semibold
          text-sm
          flex
          items-center
          gap-1

          ${
            reviewPage >= totalPages
              ? "opacity-40 cursor-not-allowed"
              : "hover:bg-neutral-50"
          }
        "
      >
        Sau ›
      </button>

    </div>
  `;
}


/* =========================================================
   REVIEW PANEL
========================================================= */

function reviewPanel() {

  const keyword =
    String(adminSearch.reviews || "")
      .trim()
      .toLowerCase();


  /* =======================================================
     FILTER
  ======================================================= */

  const list = reviews.filter(r => {

    const userName =
      String(r.user?.fullname || "")
        .toLowerCase();

    const email =
      String(r.user?.email || "")
        .toLowerCase();

    const productName =
      String(reviewProductName(r))
        .toLowerCase();

    const comment =
      String(r.comment || "")
        .toLowerCase();


    return (
      userName.includes(keyword) ||
      email.includes(keyword) ||
      productName.includes(keyword) ||
      comment.includes(keyword)
    );
  });


  /* =======================================================
     PAGINATION
  ======================================================= */

  const totalItems = list.length;

  const totalPages = Math.max(
    1,
    Math.ceil(
      totalItems / REVIEW_PAGE_SIZE
    )
  );


  if (reviewPage > totalPages) {
    reviewPage = totalPages;
  }

  if (reviewPage < 1) {
    reviewPage = 1;
  }


  const startIndex =
    (reviewPage - 1) *
    REVIEW_PAGE_SIZE;


  const endIndex = Math.min(
    startIndex + REVIEW_PAGE_SIZE,
    totalItems
  );


  const pageItems =
    list.slice(
      startIndex,
      endIndex
    );


  /* =======================================================
     HTML
  ======================================================= */

  return `

    <div
      class="
        soft-card
        overflow-hidden
      "
    >

      <!-- HEADER -->
      <div
        class="
          px-6
          py-4
          border-b
          flex
          flex-col
          lg:flex-row
          lg:items-center
          lg:justify-between
          gap-4
        "
      >

        <div>

          <h2
            class="
              font-bold
              text-xl
            "
          >
            Quản lý đánh giá
          </h2>


          <p
            class="
              text-sm
              text-neutral-500
              mt-1
            "
          >
            Tổng cộng ${reviews.length} đánh giá
          </p>

        </div>


        <div
          class="
            flex
            gap-3
            w-full
            lg:w-auto
          "
        >

          <input
            data-search="reviews"

            value="${
              escapeHtml(
                adminSearch.reviews || ""
              )
            }"

            oninput="
              reviewPage = 1;
              searchAdmin(
                'reviews',
                this.value
              )
            "

            class="
              border
              rounded-full
              px-5
              py-3
              w-full
              lg:w-80
              outline-none
              focus:border-red-800
            "

            placeholder="Tìm user, sản phẩm, nội dung..."
          >


          <button
            type="button"

            onclick="
              reviewPage = 1;

              loadData().then(() => {
                currentTab = 'reviews';
                render();
              })
            "

            class="
              border
              rounded-full
              px-5
              py-3
              font-bold
              whitespace-nowrap
              hover:bg-neutral-50
              transition
            "
          >
            Làm mới
          </button>

        </div>

      </div>


      <!-- TABLE -->
      <div class="overflow-x-auto">

        <table
          class="
            w-full
            text-left
            table-fixed
          "
        >

          <thead
            class="
              bg-neutral-50
              text-sm
              text-neutral-500
            "
          >

            <tr>

              <th
                class="
                  p-4
                  w-[150px]
                "
              >
                Khách hàng
              </th>


              <th
                class="
                  w-[155px]
                "
              >
                Sản phẩm
              </th>


              <th
                class="
                  w-[115px]
                "
              >
                Đánh giá
              </th>


              <th>
                Nội dung
              </th>


              <th
                class="
                  w-[105px]
                "
              >
                Hình ảnh
              </th>


              <th
                class="
                  w-[145px]
                "
              >
                Ngày
              </th>


              <!-- THU GỌN CỘT THAO TÁC -->
              <th
                class="
                  w-[100px]
                  text-center
                "
              >
                Thao tác
              </th>

            </tr>

          </thead>


          <tbody>

            ${
              pageItems.length

              ? pageItems.map(r => {

                  const image =
                    r.imageUrl;


                  const productName =
                    reviewProductName(r);


                  const size =
                    r.orderItem
                      ?.variant
                      ?.size || "-";


                  const color =
                    r.orderItem
                      ?.variant
                      ?.color || "-";


                  return `

                    <tr
                      class="
                        border-t
                        align-top
                        hover:bg-neutral-50/50
                        transition-colors
                      "
                    >

                      <!-- KHÁCH HÀNG -->
                      <td
                        class="
                          p-4
                        "
                      >

                        <b
                          class="
                            block
                            truncate
                          "

                          title="${
                            escapeHtml(
                              r.user?.fullname ||
                              "Khách hàng"
                            )
                          }"
                        >
                          ${
                            escapeHtml(
                              r.user?.fullname ||
                              "Khách hàng"
                            )
                          }
                        </b>


                        <p
                          class="
                            text-xs
                            text-neutral-500
                            mt-1
                            truncate
                          "

                          title="${
                            escapeHtml(
                              r.user?.email || ""
                            )
                          }"
                        >
                          ${
                            escapeHtml(
                              r.user?.email || ""
                            )
                          }
                        </p>

                      </td>


                      <!-- SẢN PHẨM -->
                      <td
                        class="
                          pr-3
                          py-4
                        "
                      >

                        <b
                          class="
                            block
                            truncate
                          "

                          title="${
                            escapeHtml(
                              productName
                            )
                          }"
                        >
                          ${
                            escapeHtml(
                              productName
                            )
                          }
                        </b>


                        <p
                          class="
                            text-xs
                            text-neutral-500
                            mt-1
                            truncate
                          "

                          title="Size: ${
                            escapeHtml(size)
                          } · Màu: ${
                            escapeHtml(color)
                          }"
                        >
                          Size:
                          ${escapeHtml(size)}
                          · Màu:
                          ${escapeHtml(color)}
                        </p>

                      </td>


                      <!-- RATING -->
                      <td
                        class="
                          py-4
                          pr-2
                        "
                      >

                        <div
                          class="
                            text-base
                            whitespace-nowrap
                          "
                        >
                          ${reviewStars(r.rating)}
                        </div>


                        <span
                          class="
                            text-sm
                            font-bold
                          "
                        >
                          ${
                            Number(
                              r.rating || 0
                            )
                          }/5
                        </span>

                      </td>


                      <!-- NỘI DUNG -->
                      <td
                        class="
                          py-4
                          pr-4
                        "
                      >

                        <p
                          class="
                            whitespace-normal
                            break-words
                            line-clamp-3
                            text-sm
                          "

                          title="${
                            escapeHtml(
                              r.comment || ""
                            )
                          }"
                        >
                          ${
                            escapeHtml(
                              r.comment ||
                              "Không có nội dung"
                            )
                          }
                        </p>

                      </td>


                      <!-- HÌNH ẢNH -->
                      <td
                        class="
                          py-4
                          pr-3
                        "
                      >

                        ${
                          image

                          ? `
                            <a
                              href="${escapeHtml(image)}"
                              target="_blank"
                              rel="noopener noreferrer"
                            >

                              <img
                                src="${escapeHtml(image)}"

                                class="
                                  w-16
                                  h-16
                                  object-cover
                                  rounded-xl
                                  border
                                  transition
                                  hover:scale-105
                                "

                                onerror="
                                  this.src='/images/no-image.png'
                                "
                              >

                            </a>
                          `

                          : `
                            <span
                              class="
                                text-xs
                                text-neutral-400
                              "
                            >
                              Không có ảnh
                            </span>
                          `
                        }

                      </td>


                      <!-- NGÀY -->
                      <td
                        class="
                          py-4
                          pr-3
                          text-xs
                          text-neutral-500
                        "
                      >
                        ${
                          escapeHtml(
                            reviewDate(
                              r.createdAt
                            )
                          )
                        }
                      </td>


                      <!-- =================================================
                           THAO TÁC - GIAO DIỆN MỚI
                      ================================================== -->

                      <td
                        class="
                          py-4
                          px-2
                        "
                      >

                        <div
                          class="
                            flex
                            items-center
                            justify-center
                            gap-2
                          "
                        >

                          <!-- XEM CHI TIẾT -->
                          <button
                            type="button"

                            onclick="
                              openReviewDetail(
                                ${Number(r.reviewId)}
                              )
                            "

                            title="Xem chi tiết đánh giá"

                            aria-label="Xem chi tiết đánh giá"

                            class="
                              group
                              w-9
                              h-9
                              shrink-0
                              inline-flex
                              items-center
                              justify-center

                              rounded-xl

                              border
                              border-neutral-200

                              bg-white
                              text-neutral-600

                              shadow-sm

                              transition-all
                              duration-200

                              hover:bg-neutral-900
                              hover:text-white
                              hover:border-neutral-900
                              hover:shadow-md
                              hover:-translate-y-0.5

                              active:translate-y-0
                              active:scale-95
                            "
                          >

                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="17"
                              height="17"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="2"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              aria-hidden="true"
                            >
                              <path
                                d="
                                  M2.062 12.348
                                  a1 1 0 0 1 0-.696
                                  10.75 10.75 0 0 1 19.876 0
                                  1 1 0 0 1 0 .696
                                  10.75 10.75 0 0 1-19.876 0
                                "
                              />
                              <circle
                                cx="12"
                                cy="12"
                                r="3"
                              />
                            </svg>

                          </button>


                          <!-- XÓA -->
                          <button
                            type="button"

                            onclick="
                              deleteReview(
                                ${Number(r.reviewId)}
                              )
                            "

                            title="Xóa đánh giá"

                            aria-label="Xóa đánh giá"

                            class="
                              group
                              w-9
                              h-9
                              shrink-0
                              inline-flex
                              items-center
                              justify-center

                              rounded-xl

                              border
                              border-red-100

                              bg-red-50
                              text-red-600

                              shadow-sm

                              transition-all
                              duration-200

                              hover:bg-red-600
                              hover:text-white
                              hover:border-red-600
                              hover:shadow-md
                              hover:-translate-y-0.5

                              active:translate-y-0
                              active:scale-95
                            "
                          >

                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="17"
                              height="17"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="2"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              aria-hidden="true"
                            >
                              <path d="M3 6h18"/>
                              <path
                                d="
                                  M8 6V4
                                  c0-1 1-2 2-2
                                  h4
                                  c1 0 2 1 2 2
                                  v2
                                "
                              />
                              <path
                                d="
                                  M19 6l-1 14
                                  c-.1 1-1 2-2 2
                                  H8
                                  c-1 0-1.9-1-2-2
                                  L5 6
                                "
                              />
                              <path d="M10 11v6"/>
                              <path d="M14 11v6"/>
                            </svg>

                          </button>

                        </div>

                      </td>

                    </tr>

                  `;

                }).join("")

              : `

                <tr>

                  <td
                    colspan="7"
                    class="
                      p-10
                      text-center
                      text-neutral-500
                    "
                  >
                    ${
                      keyword
                        ? "Không tìm thấy đánh giá phù hợp"
                        : "Chưa có đánh giá"
                    }
                  </td>

                </tr>

              `
            }

          </tbody>

        </table>

      </div>


      <!-- FOOTER / PAGINATION -->
      <div
        class="
          border-t
          px-5
          py-4
          flex
          flex-col
          md:flex-row
          md:items-center
          md:justify-between
          gap-4
        "
      >

        <div
          class="
            text-sm
            text-neutral-500
          "
        >

          ${
            totalItems > 0

            ? `
              Hiển thị

              <b class="text-neutral-800">
                ${startIndex + 1}
                -
                ${endIndex}
              </b>

              /

              <b class="text-neutral-800">
                ${totalItems}
              </b>

              đánh giá
            `

            : `
              Hiển thị

              <b class="text-neutral-800">
                0
              </b>

              đánh giá
            `
          }

        </div>


        ${reviewPagination(totalPages)}

      </div>

    </div>
  `;
}


/* =========================================================
   OPEN REVIEW DETAIL
========================================================= */

function openReviewDetail(id) {

  const review =
    findReviewById(id);


  if (!review) {

    showToast(
      "Lỗi",
      "Không tìm thấy đánh giá",
      "error"
    );

    return;
  }


  /*
   * Đóng modal cũ nếu tồn tại.
   */
  closeReviewDetail();


  const productName =
    reviewProductName(review);


  const productId =
    reviewProductId(review);


  const orderId =
    reviewOrderId(review);


  const orderItemId =
    reviewOrderItemId(review);


  const size =
    review.orderItem
      ?.variant
      ?.size || "-";


  const color =
    review.orderItem
      ?.variant
      ?.color || "-";


  const quantity =
    review.orderItem
      ?.quantity ?? "-";


  const image =
    review.imageUrl;


  const modal =
    document.createElement("div");


  modal.id =
    "reviewDetailModalDynamic";


  modal.className = `
    fixed
    inset-0
    z-[99999]
    bg-black/50
    flex
    items-center
    justify-center
    p-4
  `;


  /*
   * Click nền đen -> đóng.
   */
  modal.onclick = function(event) {

    if (event.target === modal) {
      closeReviewDetail();
    }

  };


  modal.innerHTML = `

    <div

      class="
        bg-white
        w-full
        max-w-3xl
        max-h-[92vh]
        overflow-y-auto
        rounded-2xl
        shadow-2xl
      "

      onclick="
        event.stopPropagation()
      "
    >

      <!-- HEADER -->
      <div
        class="
          px-6
          py-5
          border-b
          flex
          items-center
          justify-between
          sticky
          top-0
          bg-white
          z-10
        "
      >

        <div>

          <h2
            class="
              text-2xl
              font-bold
            "
          >
            Chi tiết đánh giá
          </h2>


          <p
            class="
              text-sm
              text-neutral-500
              mt-1
            "
          >
            Mã đánh giá:
            #${escapeHtml(review.reviewId)}
          </p>

        </div>


        <button

          type="button"

          onclick="
            closeReviewDetail()
          "

          class="
            w-10
            h-10
            rounded-full
            border
            text-xl
            hover:bg-neutral-100
          "
        >
          ×
        </button>

      </div>


      <div
        class="
          p-6
          space-y-6
        "
      >

        <!-- =================================================
             NGUỒN ĐÁNH GIÁ
        ================================================== -->

        <div
          class="
            rounded-2xl
            border
            bg-neutral-50
            p-5
          "
        >

          <div
            class="
              flex
              items-center
              justify-between
              gap-3
              mb-4
            "
          >

            <div>

              <p
                class="
                  text-xs
                  uppercase
                  tracking-wider
                  text-neutral-500
                  font-bold
                "
              >
                Đánh giá từ
              </p>


              <h3
                class="
                  text-xl
                  font-bold
                  mt-1
                "
              >
                ${
                  escapeHtml(
                    productName
                  )
                }
              </h3>

            </div>


            ${
              productId

              ? `
                <a

                  href="/detail?productId=${
                    encodeURIComponent(
                      productId
                    )
                  }"

                  target="_blank"

                  class="
                    shrink-0
                    bg-red-800
                    text-white
                    rounded-xl
                    px-4
                    py-2
                    text-sm
                    font-bold
                    hover:bg-red-900
                  "
                >
                  Xem sản phẩm
                </a>
              `

              : ""
            }

          </div>


          <div
            class="
              grid
              sm:grid-cols-2
              gap-3
              text-sm
            "
          >

            <div>
              <span class="text-neutral-500">
                Sản phẩm:
              </span>

              <b>
                ${escapeHtml(productName)}
              </b>
            </div>


            <div>
              <span class="text-neutral-500">
                Product ID:
              </span>

              <b>
                ${
                  productId
                    ? "#" + escapeHtml(productId)
                    : "Không có dữ liệu"
                }
              </b>
            </div>


            <div>
              <span class="text-neutral-500">
                Size:
              </span>

              <b>
                ${escapeHtml(size)}
              </b>
            </div>


            <div>
              <span class="text-neutral-500">
                Màu:
              </span>

              <b>
                ${escapeHtml(color)}
              </b>
            </div>


            <div>
              <span class="text-neutral-500">
                Số lượng mua:
              </span>

              <b>
                ${escapeHtml(quantity)}
              </b>
            </div>


            <div>
              <span class="text-neutral-500">
                Order Item:
              </span>

              <b>
                ${
                  orderItemId
                    ? "#" + escapeHtml(orderItemId)
                    : "Không có dữ liệu"
                }
              </b>
            </div>


            <div>
              <span class="text-neutral-500">
                Đơn hàng:
              </span>

              <b>
                ${
                  orderId
                    ? "#" + escapeHtml(orderId)
                    : "Không có dữ liệu"
                }
              </b>
            </div>

          </div>

        </div>


        <!-- =================================================
             KHÁCH HÀNG
        ================================================== -->

        <div>

          <h3
            class="
              font-bold
              text-lg
              mb-3
            "
          >
            Khách hàng
          </h3>


          <div
            class="
              grid
              sm:grid-cols-2
              gap-4
              border
              rounded-2xl
              p-5
            "
          >

            <div>

              <p
                class="
                  text-xs
                  text-neutral-500
                  mb-1
                "
              >
                Họ tên
              </p>

              <b>
                ${
                  escapeHtml(
                    review.user?.fullname ||
                    "Khách hàng"
                  )
                }
              </b>

            </div>


            <div>

              <p
                class="
                  text-xs
                  text-neutral-500
                  mb-1
                "
              >
                Email
              </p>

              <b>
                ${
                  escapeHtml(
                    review.user?.email || "-"
                  )
                }
              </b>

            </div>

          </div>

        </div>


        <!-- =================================================
             ĐÁNH GIÁ
        ================================================== -->

        <div>

          <h3
            class="
              font-bold
              text-lg
              mb-3
            "
          >
            Nội dung đánh giá
          </h3>


          <div
            class="
              border
              rounded-2xl
              p-5
            "
          >

            <div
              class="
                flex
                flex-wrap
                items-center
                justify-between
                gap-3
                mb-4
              "
            >

              <div>

                <div
                  class="
                    text-xl
                    whitespace-nowrap
                  "
                >
                  ${reviewStars(review.rating)}
                </div>


                <b
                  class="
                    text-red-800
                  "
                >
                  ${
                    Number(
                      review.rating || 0
                    )
                  }/5
                </b>

              </div>


              <div
                class="
                  text-sm
                  text-neutral-500
                "
              >
                ${
                  escapeHtml(
                    reviewDate(
                      review.createdAt
                    )
                  )
                }
              </div>

            </div>


            <p
              class="
                leading-7
                whitespace-pre-wrap
                break-words
              "
            >${
              escapeHtml(
                review.comment ||
                "Không có nội dung đánh giá"
              )
            }</p>

          </div>

        </div>


        <!-- =================================================
             IMAGE
        ================================================== -->

        <div>

          <h3
            class="
              font-bold
              text-lg
              mb-3
            "
          >
            Hình ảnh đánh giá
          </h3>


          ${
            image

            ? `
              <a
                href="${escapeHtml(image)}"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-block"
              >

                <img

                  src="${escapeHtml(image)}"

                  class="
                    max-w-full
                    max-h-[420px]
                    object-contain
                    rounded-2xl
                    border
                  "

                  onerror="
                    this.src='/images/no-image.png'
                  "
                >

              </a>
            `

            : `
              <div
                class="
                  border
                  border-dashed
                  rounded-2xl
                  p-8
                  text-center
                  text-neutral-400
                "
              >
                Đánh giá này không có hình ảnh
              </div>
            `
          }

        </div>


        <!-- =================================================
             BUTTONS
        ================================================== -->

        <div
          class="
            flex
            justify-end
            gap-3
            border-t
            pt-5
          "
        >

          <button

            type="button"

            onclick="
              closeReviewDetail()
            "

            class="
              border
              rounded-xl
              px-6
              py-3
              font-bold
              hover:bg-neutral-50
            "
          >
            Đóng
          </button>


          <button

            type="button"

            onclick="
              closeReviewDetail();
              deleteReview(
                ${Number(review.reviewId)}
              );
            "

            class="
              bg-red-800
              text-white
              rounded-xl
              px-6
              py-3
              font-bold
              hover:bg-red-900
            "
          >
            Xóa đánh giá
          </button>

        </div>

      </div>

    </div>
  `;


  document.body.appendChild(
    modal
  );


  document.body.style.overflow =
    "hidden";
}


/* =========================================================
   CLOSE REVIEW DETAIL
========================================================= */

function closeReviewDetail() {

  const modal =
    document.getElementById(
      "reviewDetailModalDynamic"
    );


  if (modal) {
    modal.remove();
  }


  document.body.style.overflow =
    "";
}


/* =========================================================
   DELETE REVIEW
========================================================= */

function deleteReview(id) {

  showConfirm(

    "Xóa vĩnh viễn đánh giá này? Đánh giá sẽ không còn hiển thị trên sản phẩm.",

    async () => {

      try {

        const res =
          await fetch(
            `${API_BASE}/reviews/${id}`,
            {
              method: "DELETE",
              headers: adminAuthHeaders()
            }
          );


        const text =
          await res.text();


        if (!res.ok) {

          showToast(
            "Lỗi",
            text ||
            "Không thể xóa đánh giá",
            "error"
          );

          return;
        }


        /*
         * Xóa khỏi dữ liệu frontend.
         */
        reviews =
          reviews.filter(
            r =>
              Number(r.reviewId) !==
              Number(id)
          );


        /*
         * Tính lại trang sau khi xóa.
         */
        const keyword =
          String(
            adminSearch.reviews || ""
          )
            .trim()
            .toLowerCase();


        const filtered =
          reviews.filter(r => {

            const userName =
              String(
                r.user?.fullname || ""
              ).toLowerCase();

            const email =
              String(
                r.user?.email || ""
              ).toLowerCase();

            const productName =
              String(
                reviewProductName(r)
              ).toLowerCase();

            const comment =
              String(
                r.comment || ""
              ).toLowerCase();


            return (
              userName.includes(keyword) ||
              email.includes(keyword) ||
              productName.includes(keyword) ||
              comment.includes(keyword)
            );
          });


        const totalPages =
          Math.max(
            1,
            Math.ceil(
              filtered.length /
              REVIEW_PAGE_SIZE
            )
          );


        if (
          reviewPage >
          totalPages
        ) {

          reviewPage =
            totalPages;
        }


        currentTab =
          "reviews";


        render();


        showToast(
          "Thành công",
          "Đã xóa đánh giá"
        );


      } catch (error) {

        console.error(
          "DELETE REVIEW ERROR:",
          error
        );


        showToast(
          "Lỗi",
          error?.message ||
          "Không thể kết nối máy chủ",
          "error"
        );

      }

    },

    "Xóa"
  );
}
