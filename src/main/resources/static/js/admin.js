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
let vouchers = [];
let currentTab = "overview";
let selectedFile = null;
let selectedCategoryFile = null;
let confirmCallback = null;
let orderLimit = 10;
let orderSort = "newest";
let orderDate = "";
let adminSearch = {
  products: "",
  categories: "",
  brands: "",
  variants: "",
  promo: "",
  orders: "",
  users: ""
};

function icon(n, cls="w-5 h-5"){return `<i data-lucide="${n}" class="${cls}"></i>`}
function money(v){return Number(v || 0).toLocaleString("vi-VN") + "đ"}
function isVoucherExpired(v){
  if(!v.endDate) return false;
  return new Date(v.endDate + "T23:59:59") < new Date();
}

function voucherStatusText(v){
  if(isVoucherExpired(v)) return "Hết hạn";
  if(v.status === "ACTIVE") return "Đang hoạt động";
  return "Tạm ẩn";
}
function admin(){return JSON.parse(localStorage.getItem("ha_admin") || "null")}
function showToast(title, message = "", type = "success"){
  const old = document.getElementById("adminToast");
  if(old) old.remove();

  const color = type === "error"
    ? "border-red-800"
    : "border-green-700";

  const toast = document.createElement("div");
  toast.id = "adminToast";
  toast.className = `
    fixed top-6 right-6 z-[9999]
    bg-white border-l-8 ${color}
    rounded-2xl shadow-2xl px-6 py-4
    min-w-[320px] max-w-[420px]
  `;

  toast.innerHTML = `
    <b class="block text-lg">${title}</b>
    <p class="text-sm text-neutral-600 mt-1">${message}</p>
  `;

  document.body.appendChild(toast);

  setTimeout(() => toast.remove(), 3000);
}

function showConfirm(message, onConfirm){
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
          Xóa
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

function productImg(p,i){
  if(p.imageUrl) return p.imageUrl + "?v=" + Date.now();

  if(p.images && p.images.length > 0){
    const sorted = [...p.images].sort((a,b)=>
      Number(b.imageId || b.image_id || 0) - Number(a.imageId || a.image_id || 0)
    );

    const mainImg = sorted.find(img =>
      img.isMain == true ||
      img.isMain == 1 ||
      img.is_main == true ||
      img.is_main == 1
    );

    const img = mainImg || sorted[0];

    return img.imageUrl + "?v=" + Date.now();
  }

  return "/images/no-image.png";
}

function productHasVariant(productId){
  return variants.some(v =>
    v.product?.productId === productId &&
    v.status === "ACTIVE"
  );
}

async function fetchJson(url){
  const res = await fetch(url);
  if(!res.ok){
    const text = await res.text();
    console.error("API lỗi:", url, text);
    throw new Error(text);
  }
  return res.json();
}

async function loadData(){
  try{ products = await fetchJson(`${API_BASE}/products`); }catch(e){ products = []; }
  try{ categories = await fetchJson(`${API_BASE}/categories`); }catch(e){ categories = []; }
  try{ users = await fetchJson(`${API_BASE}/users`); }catch(e){ users = []; }
  try{ orders = await fetchJson(`${API_BASE}/orders`); }catch(e){ orders = []; }
  try{ variants = await fetchJson(`${API_BASE}/variants`); }catch(e){ variants = []; }
  try{ brands = await fetchJson(`${API_BASE}/brands`); }catch(e){ brands = []; }
  try{ vouchers = await fetchJson(`${API_BASE}/vouchers`); }catch(e){ vouchers = []; }
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


function statCards(){
  const revenue = orders
    .filter(o => o.orderStatus !== "CANCELLED")
    .reduce((s,o)=>s + Number(o.finalAmount || 0),0);

  const activeCategories = categories.filter(c => c.status === "ACTIVE").length;

  return `<div class="grid md:grid-cols-4 gap-4 mb-6">
    <div class="soft-card p-6">
      <p class="text-neutral-500">Tổng doanh thu</p>
      <h3 class="text-3xl font-bold mt-3">${money(revenue)}</h3>
      <span class="text-red-800 text-sm font-semibold">Từ đơn hàng thực tế</span>
    </div>

    <div class="soft-card p-6">
      <p class="text-neutral-500">Sản phẩm</p>
      <h3 class="text-3xl font-bold mt-3">${products.length}</h3>
      <span class="text-red-800 text-sm font-semibold">Đang quản lý</span>
    </div>

    <div class="soft-card p-6">
      <p class="text-neutral-500">Danh mục</p>
      <h3 class="text-3xl font-bold mt-3">${activeCategories}</h3>
      <span class="text-red-800 text-sm font-semibold">Danh mục active</span>
    </div>

    <div class="soft-card p-6">
      <p class="text-neutral-500">Người dùng</p>
      <h3 class="text-3xl font-bold mt-3">${users.length}</h3>
      <span class="text-red-800 text-sm font-semibold">Tài khoản hệ thống</span>
    </div>
  </div>`;
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

function overviewCharts(){
  const todayList = todayOrders();

  const statusMap = {
    PENDING: "Chờ xử lý",
    PENDING_PAYMENT: "Chờ thanh toán PayOS",
    PAID: "Đã thanh toán",
    CONFIRMED: "Đã xác nhận",
    SHIPPING: "Đang giao",
    COMPLETED: "Hoàn thành",
    CANCELLED: "Đã hủy"
  };

  const statusCounts = Object.keys(statusMap).map(status => ({
    status,
    label: statusMap[status],
    count: todayList.filter(o => o.orderStatus === status).length
  }));

  const maxStatus = Math.max(...statusCounts.map(x => x.count), 1);

  const hours = Array.from({length: 24}, (_, hour) => {
    const revenue = todayList
      .filter(o => {
        const d = new Date(o.createdAt);
        return d.getHours() === hour && o.orderStatus !== "CANCELLED";
      })
      .reduce((sum, o) => sum + Number(o.finalAmount || 0), 0);

    return { hour, revenue };
  });

  const maxRevenue = Math.max(...hours.map(x => x.revenue), 1);

  return `
    <div class="grid lg:grid-cols-2 gap-6">

      <div class="soft-card p-6">
        <p class="uppercase tracking-widest text-red-800 font-bold mb-3">
          Doanh thu hôm nay
        </p>

        <h2 class="text-5xl font-bold mb-3 tracking-tight">
          ${money(todayRevenue())}
        </h2>

        <p class="text-neutral-500">
          Tính từ đơn hôm nay, không gồm đơn đã hủy.
        </p>

        <div class="mt-7 h-56 flex items-end gap-1 border-b border-l px-4 pb-4">
          ${hours.map(x => `
            <div class="flex-1 bg-red-800 rounded-t"
              title="${x.hour}h: ${money(x.revenue)}"
              style="height:${x.revenue > 0 ? Math.max((x.revenue / maxRevenue) * 100, 8) : 2}%">
            </div>
          `).join("")}
        </div>

        <div class="flex justify-between text-xs text-neutral-500 mt-3">
          <span>0h</span>
          <span>6h</span>
          <span>12h</span>
          <span>18h</span>
          <span>23h</span>
        </div>
      </div>

      <div class="soft-card p-6">
        <p class="uppercase tracking-widest text-red-800 font-bold mb-3">
          Đơn hàng hôm nay
        </p>

        <h2 class="text-5xl font-bold mb-3 tracking-tight">
          ${todayList.length}
        </h2>

        <p class="text-neutral-500 mb-6">
          Thống kê đơn theo trạng thái trong ngày.
        </p>

        <div class="space-y-4">
          ${statusCounts.map(s => `
            <div>
              <div class="flex justify-between mb-1">
                <span class="font-semibold">${s.label}</span>
                <b>${s.count}</b>
              </div>

              <div class="h-3 bg-neutral-100 rounded-full overflow-hidden">
                <div class="h-full bg-red-800 rounded-full"
                  style="width:${s.count > 0 ? (s.count / maxStatus) * 100 : 0}%">
                </div>
              </div>
            </div>
          `).join("")}
        </div>
      </div>

    </div>
  `;
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
  return list.reduce((sum, o) => sum + Number(o.finalAmount || 0), 0);
}

function topProducts(){
  const map = {};

  validOrders().forEach(order => {
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
      map[id].revenue += Number(item.price || 0) * Number(item.quantity || 0);
    });
  });

  return Object.values(map)
    .sort((a,b) => b.qty - a.qty)
    .slice(0, 5);
}

function topCustomers(){
  const map = {};

  validOrders().forEach(o => {
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
    .sort((a,b) => b.total - a.total)
    .slice(0, 5);
}

function revenue7Days(){
  return Array.from({length: 7}, (_, i) => {
    const day = daysAgo(6 - i);
    const list = validOrders().filter(o =>
      o.createdAt && dateOnly(o.createdAt) === day
    );

    return {
      day,
      revenue: revenueOf(list)
    };
  });
}

function reportPanel(){
  const today = todayOrders().filter(o => o.orderStatus !== "CANCELLED");
  const last7 = ordersInLastDays(7);
  const last30 = ordersInLastDays(30);
  const allValid = validOrders();

  const completed = orders.filter(o => o.orderStatus === "COMPLETED").length;
  const cancelled = orders.filter(o => o.orderStatus === "CANCELLED").length;
  const shipping = orders.filter(o => o.orderStatus === "SHIPPING").length;

  const productList = topProducts();
  const customerList = topCustomers();
  const chartData = revenue7Days();
  const maxRevenue = Math.max(...chartData.map(x => x.revenue), 1);

  return `
    <div class="space-y-6">

      <div class="soft-card p-6">
        <p class="uppercase tracking-widest text-red-800 font-bold mb-2">
          Báo cáo thống kê
        </p>
        <h2 class="serif text-4xl">Tổng hợp kinh doanh</h2>
        <p class="text-neutral-500 mt-2">
          Doanh thu, đơn hàng, sản phẩm bán chạy và khách hàng nổi bật.
        </p>
      </div>

      <div class="grid md:grid-cols-4 gap-4">
        <div class="soft-card p-6">
          <p class="text-neutral-500">Doanh thu hôm nay</p>
          <h3 class="text-3xl font-bold mt-3">${money(revenueOf(today))}</h3>
        </div>

        <div class="soft-card p-6">
          <p class="text-neutral-500">Doanh thu 7 ngày</p>
          <h3 class="text-3xl font-bold mt-3">${money(revenueOf(last7))}</h3>
        </div>

        <div class="soft-card p-6">
          <p class="text-neutral-500">Doanh thu 30 ngày</p>
          <h3 class="text-3xl font-bold mt-3">${money(revenueOf(last30))}</h3>
        </div>

        <div class="soft-card p-6">
          <p class="text-neutral-500">Tổng doanh thu</p>
          <h3 class="text-3xl font-bold mt-3">${money(revenueOf(allValid))}</h3>
        </div>
      </div>

      <div class="grid md:grid-cols-4 gap-4">
        <div class="soft-card p-6">
          <p class="text-neutral-500">Tổng đơn</p>
          <h3 class="text-3xl font-bold mt-3">${orders.length}</h3>
        </div>

        <div class="soft-card p-6">
          <p class="text-neutral-500">Đơn hoàn thành</p>
          <h3 class="text-3xl font-bold mt-3">${completed}</h3>
        </div>

        <div class="soft-card p-6">
          <p class="text-neutral-500">Đơn đang giao</p>
          <h3 class="text-3xl font-bold mt-3">${shipping}</h3>
        </div>

        <div class="soft-card p-6">
          <p class="text-neutral-500">Đơn đã hủy</p>
          <h3 class="text-3xl font-bold mt-3">${cancelled}</h3>
        </div>
      </div>

      <div class="soft-card p-6">
        <h3 class="font-bold text-xl mb-5">Biểu đồ doanh thu 7 ngày</h3>

        <div class="h-72 flex items-end gap-4 border-l border-b px-4 pb-4 mt-8">
            ${
              chartData.map(x => {
                const h = x.revenue > 0
                  ? Math.max((x.revenue / maxRevenue) * 220, 36)
                  : 10;

                return `
                  <div class="flex-1 h-full flex flex-col items-center justify-end gap-2">

                  <span class="text-[11px] font-bold text-red-800 text-center leading-tight min-h-[16px]">
                    ${x.revenue > 0 ? money(x.revenue) : ""}
                  </span>

                  <div
                    class="w-full bg-gradient-to-t from-red-900 via-red-700 to-red-500
                          rounded-t-2xl shadow-lg hover:scale-[1.03]
                          transition-all duration-300 relative"
                    title="${x.day}: ${money(x.revenue)}"
                    style="height:${h}px">

                    <div class="absolute inset-x-0 top-0 h-3 bg-white/30 rounded-t-2xl"></div>

                  </div>

                </div>
              `;
            }).join("")
          }
        </div>

        <div class="grid grid-cols-7 gap-3 text-xs text-neutral-500 mt-3 text-center">
          ${chartData.map(x => `<span>${x.day.slice(5)}</span>`).join("")}
        </div>
      </div>

      <div class="grid lg:grid-cols-2 gap-6">

        <div class="soft-card overflow-hidden">
          <div class="p-6 border-b">
            <h3 class="font-bold text-xl">Top sản phẩm bán chạy</h3>
          </div>

          <table class="w-full text-left">
            <thead class="bg-neutral-50 text-sm text-neutral-500">
              <tr>
                <th class="p-4">Sản phẩm</th>
                <th>Đã bán</th>
                <th>Doanh thu</th>
              </tr>
            </thead>

            <tbody>
              ${
                productList.length
                ? productList.map(p => `
                  <tr class="border-t">
                    <td class="p-4 font-semibold">${p.name}</td>
                    <td>${p.qty}</td>
                    <td class="text-red-800 font-bold">${money(p.revenue)}</td>
                  </tr>
                `).join("")
                : `<tr><td colspan="3" class="p-6 text-center text-neutral-500">Chưa có dữ liệu</td></tr>`
              }
            </tbody>
          </table>
        </div>

        <div class="soft-card overflow-hidden">
          <div class="p-6 border-b">
            <h3 class="font-bold text-xl">Top khách hàng</h3>
          </div>

          <table class="w-full text-left">
            <thead class="bg-neutral-50 text-sm text-neutral-500">
              <tr>
                <th class="p-4">Khách hàng</th>
                <th>Số đơn</th>
                <th>Tổng chi</th>
              </tr>
            </thead>

            <tbody>
              ${
                customerList.length
                ? customerList.map(c => `
                  <tr class="border-t">
                    <td class="p-4">
                      <b>${c.name}</b>
                      <p class="text-sm text-neutral-500">${c.email}</p>
                    </td>
                    <td>${c.orders}</td>
                    <td class="text-red-800 font-bold">${money(c.total)}</td>
                  </tr>
                `).join("")
                : `<tr><td colspan="3" class="p-6 text-center text-neutral-500">Chưa có dữ liệu</td></tr>`
              }
            </tbody>
          </table>
        </div>

      </div>

    </div>
  `;
}

function sidebar(){
  const items = [
    ["overview","Tổng quan","layout-dashboard"],
    ["products","Quản lý sản phẩm","shopping-bag"],
    ["categories","Danh mục","list-tree"],
    ["brands","Thương hiệu","tag"],
    ["orders","Quản lý đơn hàng","receipt"],
    ["variants","Biến thể sản phẩm","palette"],
    ["users","Quản lý người dùng","users"],
    ["promo","Voucher","badge-percent"],
    ["reports","Báo cáo thống kê","bar-chart-3"]
  ];
  return `<aside class="soft-card p-5 h-fit sticky top-28">
    <h2 class="font-bold text-xl mb-4">Menu quản trị</h2>
    ${items.map(i=>`<button onclick="setTab('${i[0]}')" class="w-full flex items-center gap-3 text-left rounded-2xl px-4 py-3 mb-2 ${currentTab===i[0]?"bg-red-50 text-red-800 font-bold":"hover:bg-neutral-50"}">${icon(i[2])}<span>${i[1]}</span></button>`).join("")}
  </aside>`;
}

function productTable(){
  const list = products.filter(p =>
    (p.productName || "").toLowerCase().includes(adminSearch.products)
  );
  return `<div class="soft-card overflow-hidden">
    ${adminToolbar("products", "Quản lý sản phẩm", "Thêm", "openProductForm()")}
    <div class="overflow-x-auto">
      <table class="w-full text-left">
        <thead class="bg-neutral-50 text-sm text-neutral-500"><tr><th class="p-4">Ảnh</th><th>Sản phẩm</th><th>Danh mục</th><th>Giá</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
        <tbody>${list.map((p,i)=>`<tr class="border-t"><td class="p-4"><img src="${productImg(p,i)}" class="w-14 h-14 object-cover rounded-xl"></td><td class="font-semibold">
  ${p.productName}
  ${
    productHasVariant(p.productId)
    ? ""
    : `<p class="text-xs text-red-800 font-bold mt-1">Chưa có biến thể</p>`
  }
</td><td>${p.category?.categoryName || "Chưa có"}</td><td class="text-red-800 font-bold">${money(p.basePrice)}</td><td><span class="bg-green-50 text-green-700 rounded-full px-3 py-1 text-sm">${p.status || "ACTIVE"}</span></td><td class="space-x-2"><button onclick="openProductForm(${p.productId})" class="border rounded-full px-4 py-2 text-sm">Sửa</button><button onclick="deleteProduct(${p.productId})" class="bg-red-800 text-white rounded-full px-4 py-2 text-sm">Xóa</button></td></tr>`).join("")}</tbody>
      </table>
    </div>
  </div>${productModal()}`;
}

function categoryPanel(){
  const list = categories.filter(c =>
    (c.categoryName || "").toLowerCase().includes(adminSearch.categories)
  );
  return `<div class="soft-card p-6">
    ${adminToolbar("categories", "Danh mục", "Thêm", "openCategoryForm()")}

    ${
      list.map((c,i)=>`
        <div class="border rounded-2xl p-4 mb-3 flex justify-between items-center gap-4">

          <div class="flex items-center gap-4">
            <img
              src="${c.imageUrl || '/images/no-image.png'}"
              class="w-16 h-16 object-cover rounded-2xl border"
            >

            <div>
              <b>${c.categoryName}</b>
              <p class="text-sm text-neutral-500">
                ${c.description || "Không có mô tả"}
              </p>
            </div>
          </div>

          <div class="flex gap-2 items-center">
            <span class="text-red-800 font-bold">${c.status || "ACTIVE"}</span>

            <button onclick="openCategoryForm(${c.categoryId})"
              class="border rounded-full px-4 py-2 text-sm">
              Sửa
            </button>

            <button onclick="deleteCategory(${c.categoryId})"
              class="bg-red-800 text-white rounded-full px-4 py-2 text-sm">
              Xóa
            </button>
          </div>

        </div>
      `).join("") || `<p class="text-neutral-500">Chưa có danh mục</p>`
    }
  </div>${categoryModal()}`;
}

function brandPanel(){
  const list = brands.filter(b =>
    (b.brandName || "").toLowerCase().includes(adminSearch.brands)
  );
  return `<div class="soft-card overflow-hidden">
    ${adminToolbar("brands", "Quản lý thương hiệu", "Thêm", "openBrandForm()")}
    <div class="overflow-x-auto">
      <table class="w-full text-left">
        <thead class="bg-neutral-50 text-sm text-neutral-500">
          <tr><th class="p-4">ID</th><th>Tên thương hiệu</th><th>Mô tả</th><th>Trạng thái</th><th>Thao tác</th></tr>
        </thead>
        <tbody>${list.map(b=>`<tr class="border-t">
          <td class="p-4 font-bold">#${b.brandId}</td>
          <td class="font-semibold">${b.brandName}</td>
          <td class="text-neutral-600">${b.description || 'Không có mô tả'}</td>
          <td><span class="rounded-full ${b.status === 'ACTIVE' ? 'bg-green-50 text-green-700' : 'bg-neutral-100 text-neutral-500'} px-3 py-1 text-sm">${b.status || 'ACTIVE'}</span></td>
          <td class="space-x-2">
            <button onclick="openBrandForm(${b.brandId})" class="border rounded-full px-4 py-2 text-sm">Sửa</button>
            <button onclick="deleteBrand(${b.brandId})" class="bg-red-800 text-white rounded-full px-4 py-2 text-sm">Xóa</button>
          </td>
        </tr>`).join('') || `<tr><td class="p-6 text-neutral-500" colspan="5">Chưa có thương hiệu</td></tr>`}</tbody>
      </table>
    </div>
  </div>${brandModal()}`;
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
                  <button onclick="openUserForm(${u.userId})" class="border rounded-full px-4 py-2 text-sm">Sửa</button>
                  <button onclick="deleteUser(${u.userId})" class="bg-red-800 text-white rounded-full px-4 py-2 text-sm">Xóa</button>
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


function content(){
  if(currentTab === "products") return productTable();
  if(currentTab === "categories") return categoryPanel();
  if(currentTab === "brands") return brandPanel();
  if(currentTab === "orders") return orderTable();
  if(currentTab === "variants") return variantPanel();
  if(currentTab === "users") return userTable();
  if(currentTab === "promo") return voucherPanel();
  if(currentTab === "reports") return reportPanel();
  return `${statCards()}${overviewCharts()}`;
}

function adminPage(){
  const a = admin();

  if(!a) return loginPage();

  return `
    <main class="container py-10">

      <div class="soft-card p-8 mb-8">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

          <div>
            <p class="uppercase tracking-widest text-red-800 font-bold mb-3">
              Admin Panel
            </p>

            <h1 class="serif text-5xl leading-tight">
              Quản trị hệ thống bán hàng
            </h1>

            <p class="text-neutral-600 mt-4 max-w-3xl">
              Quản lý sản phẩm, danh mục, đơn hàng, người dùng, khuyến mãi và báo cáo thống kê.
            </p>
          </div>

          <div class="flex items-center gap-4">
            <div class="hidden md:block text-right">
              <p class="text-sm text-neutral-500">Đang đăng nhập</p>
              <p class="font-bold">${a?.fullname || a?.email || "Admin"}</p>
            </div>

            <button onclick="logoutAdmin()"
              class="bg-black text-white rounded-full px-6 py-3 font-bold hover:bg-red-800 transition">
              Đăng xuất
            </button>
          </div>

        </div>
      </div>

      <div class="grid lg:grid-cols-[260px_1fr] gap-6">
        ${sidebar()}

        <section class="space-y-6">
          ${content()}
        </section>
      </div>

    </main>
  `;
}

async function loginAdmin(){
  const body = {email:document.getElementById("adminEmail").value.trim(), password:document.getElementById("adminPassword").value};
  const res = await fetch(`${API_BASE}/auth/login`, {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body)});
  const data = await res.json();
  if(!res.ok){document.getElementById("adminMsg").innerText = data.message || "Đăng nhập thất bại"; return;}
  if(data.role !== "ADMIN"){document.getElementById("adminMsg").innerText = "Tài khoản không có quyền Admin"; return;}
  localStorage.setItem("ha_admin", JSON.stringify(data));
  await init();
}

function logoutAdmin(){localStorage.removeItem("ha_admin"); render();}
function setTab(tab){currentTab = tab; render();}
function render(){document.getElementById("app").innerHTML = adminPage(); lucide.createIcons();}
async function init(){await loadData(); render();}
init();

function productModal(){
  return `<div id="productModal" class="fixed inset-0 bg-black/40 z-[999] hidden items-start justify-center p-5 overflow-y-auto">
    <div class="bg-white rounded-3xl w-full max-w-xl shadow-xl my-8 max-h-[90vh] overflow-y-auto">
      <div class="sticky top-0 bg-white z-10 px-7 pt-7 pb-4 border-b flex justify-between items-center">
        <h2 id="productFormTitle" class="serif text-3xl">Thêm sản phẩm</h2>
        <button onclick="closeProductForm()" class="text-2xl">×</button>
      </div>
      <div class="p-7">
        <input type="hidden" id="productId">
        <div class="space-y-4">
          <input id="productName" class="input-ui" placeholder="Tên sản phẩm">
          <textarea id="productDesc" class="input-ui" placeholder="Mô tả"></textarea>
          <input id="productPrice" type="number" class="input-ui" placeholder="Giá gốc">
          <select id="productCategory" class="input-ui"><option value="">Chọn danh mục</option>${categories.map(c=>`<option value="${c.categoryId}">${c.categoryName}</option>`).join('')}</select>
          <select id="productBrand" class="input-ui"><option value="">Không chọn thương hiệu</option>${brands.map(b=>`<option value="${b.brandId}">${b.brandName}</option>`).join('')}</select>
          <select id="productStatus" class="input-ui"><option value="ACTIVE">ACTIVE</option><option value="INACTIVE">INACTIVE</option></select>
          <div>
            <label class="font-semibold">Ảnh sản phẩm</label>
            <input id="productImageFile" type="file" accept="image/*" class="mt-2 block w-full border rounded-xl p-3" onchange="previewImage(event)">
            <img id="previewImage" class="mt-4 w-40 h-52 object-cover rounded-xl border hidden">
          </div>
        </div>
      </div>
      <div class="sticky bottom-0 bg-white border-t p-5">
        <button onclick="saveProduct()" class="btn-primary w-full">Lưu sản phẩm</button>
      </div>
    </div>
  </div>`;
}

function variantPanel(){
  const list = variants.filter(v =>
    (v.product?.productName || "").toLowerCase().includes(adminSearch.variants) ||
    (v.sku || "").toLowerCase().includes(adminSearch.variants) ||
    (v.size || "").toLowerCase().includes(adminSearch.variants) ||
    (v.color || "").toLowerCase().includes(adminSearch.variants)
  );
  return `<div class="soft-card overflow-hidden">
    ${adminToolbar("variants", "Quản lý biến thể sản phẩm", "Thêm", "openVariantForm()")}
    <div class="overflow-x-auto">
      <table class="w-full text-left">
        <thead class="bg-neutral-50 text-sm text-neutral-500">
          <tr><th class="p-4">Sản phẩm</th><th>Size</th><th>Màu</th><th>SKU</th><th>Giá</th><th>Tồn kho</th><th>Trạng thái</th><th>Thao tác</th></tr>
        </thead>
        <tbody>${list.map(v=>`<tr class="border-t"><td class="p-4 font-semibold">${v.product?.productName || 'Không rõ'}</td><td>${v.size || ''}</td><td>${v.color || ''}</td><td class="font-mono text-sm">${v.sku || ''}</td><td class="text-red-800 font-bold">${money(v.price)}</td><td class="font-bold">${v.stock ?? 0}</td><td><span class="rounded-full ${v.status === 'ACTIVE' ? 'bg-green-50 text-green-700' : 'bg-neutral-100 text-neutral-500'} px-3 py-1 text-sm">${v.status || 'ACTIVE'}</span></td><td class="space-x-2"><button onclick="openVariantForm(${v.variantId})" class="border rounded-full px-4 py-2 text-sm">Sửa</button><button onclick="deleteVariant(${v.variantId})" class="bg-red-800 text-white rounded-full px-4 py-2 text-sm">Xóa</button></td></tr>`).join('') || `<tr><td class="p-6 text-neutral-500" colspan="8">Chưa có biến thể sản phẩm</td></tr>`}</tbody>
      </table>
    </div>
  </div>${variantModal()}`;
}

function variantModal(){
  return `<div id="variantModal" class="fixed inset-0 bg-black/40 z-[999] hidden items-center justify-center p-5">
    <div class="bg-white rounded-3xl p-7 w-full max-w-lg shadow-xl">
      <div class="flex justify-between items-center mb-5"><h2 id="variantFormTitle" class="serif text-3xl">Thêm biến thể</h2><button onclick="closeVariantForm()" class="text-2xl">×</button></div>
      <input type="hidden" id="variantId">
      <div class="space-y-4">
        <select id="variantProductId" class="input-ui"><option value="">Chọn sản phẩm</option>${products.map(p=>`<option value="${p.productId}">${p.productName}</option>`).join('')}</select>
        <input id="variantSize" class="input-ui" placeholder="Size, ví dụ: S, M, L, XL">
        <input id="variantColor" class="input-ui" placeholder="Màu sắc, ví dụ: Đen, Trắng">
        <input id="variantSku" class="input-ui" placeholder="SKU, ví dụ: SP001-DEN-M">
        <input id="variantPrice" type="number" class="input-ui" placeholder="Giá biến thể">
        <input
          id="variantStock"
          type="number"
          min="0"
          value="0"
          oninput="if(this.value < 0) this.value = 0"
          class="input-ui"
          placeholder="Tồn kho"
        >
        <select id="variantStatus" class="input-ui"><option value="ACTIVE">ACTIVE</option><option value="INACTIVE">INACTIVE</option></select>
        <button onclick="saveVariant()" class="btn-primary w-full">Lưu biến thể</button>
      </div>
    </div>
  </div>`;
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

function orderTable(){
  const keyword = adminSearch.orders || "";

  let filteredOrders = orders.filter(o => {
    const orderId = String(o.orderId || "").toLowerCase();
    const name = (o.user?.fullname || "").toLowerCase();
    const email = (o.user?.email || "").toLowerCase();
    const phone = (o.user?.phone || "").toLowerCase();
    const address = (o.address || "").toLowerCase();

    return orderId.includes(keyword)
      || name.includes(keyword)
      || email.includes(keyword)
      || phone.includes(keyword)
      || address.includes(keyword);
  });
    if(orderDate){
    filteredOrders = filteredOrders.filter(o =>
      o.createdAt &&
      new Date(o.createdAt).toISOString().slice(0,10) === orderDate
    );
  }

  filteredOrders.sort((a,b)=>{
    const da = new Date(a.createdAt || 0);
    const db = new Date(b.createdAt || 0);

    return orderSort === "oldest"
      ? da - db
      : db - da;
  });
  const list = filteredOrders.slice(0, orderLimit);

  return `<div class="soft-card overflow-hidden">
    <div class="px-6 py-4 border-b flex flex-col gap-4">
  <h2 class="font-bold text-xl">Quản lý đơn hàng</h2>

  <div class="flex flex-col lg:flex-row gap-3 w-full">
    <input
      data-search="orders"
      value="${adminSearch.orders || ""}"
      oninput="searchOrderAdmin(this.value)"
      class="border rounded-full px-5 py-3 w-full lg:w-96 outline-none"
      placeholder="Tìm mã đơn, tên, email, số điện thoại..."
    >

    <select onchange="changeOrderSort(this.value)"
      class="border rounded-full px-5 py-3 outline-none">
      <option value="newest" ${orderSort === "newest" ? "selected" : ""}>Mới nhất</option>
      <option value="oldest" ${orderSort === "oldest" ? "selected" : ""}>Cũ nhất</option>
    </select>

    <input type="date"
      value="${orderDate}"
      onchange="changeOrderDate(this.value)"
      class="border rounded-full px-5 py-3 outline-none"
    >

    <button onclick="orderDate=''; orderSort='newest'; orderLimit=10; render()"
      class="border rounded-full px-5 py-3 font-bold whitespace-nowrap">
      Xóa lọc
    </button>

    <button onclick="orderLimit=10; loadData().then(render)"
      class="border rounded-full px-5 py-3 font-bold whitespace-nowrap">
      Làm mới
    </button>
  </div>
</div>

    <div class="overflow-x-auto">
      <table class="w-full text-left">
        <thead class="bg-neutral-50 text-sm text-neutral-500">
          <tr>
            <th class="p-4">Mã đơn</th>
            <th>Khách hàng</th>
            <th>Địa chỉ</th>
            <th>Tổng tiền</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>

        <tbody>
          ${
            list.length
            ? list.map(o => `
              <tr class="border-t">
                <td class="p-4 font-bold">#${o.orderId}</td>
                <td>${o.user?.fullname || o.user?.email || "Khách hàng"}</td>
                <td class="max-w-[240px] text-sm text-neutral-600">${o.address || "Chưa có"}</td>
                <td class="text-red-800 font-bold">${money(o.finalAmount || o.totalAmount)}</td>
                <td>
                  <select onchange="updateOrderStatus(${o.orderId}, this.value)"
                    class="border rounded-full px-3 py-2 text-sm font-semibold">
                    ${[
                      ["PENDING","Chờ xử lý"],
                      ["PENDING_PAYMENT","Chờ thanh toán PayOS"],
                      ["PAID","Đã thanh toán"],
                      ["CONFIRMED","Đã xác nhận"],
                      ["SHIPPING","Đang giao"],
                      ["COMPLETED","Hoàn thành"],
                      ["CANCELLED","Đã hủy"]
                    ].map(s => `
                      <option value="${s[0]}" ${o.orderStatus === s[0] ? "selected" : ""}>
                        ${s[1]}
                      </option>
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
            `).join("")
            : `<tr><td colspan="6" class="p-6 text-center text-neutral-500">Không tìm thấy đơn hàng</td></tr>`
          }
        </tbody>
      </table>
    </div>

    <div class="px-6 py-5 border-t flex justify-center gap-4">
      ${
        filteredOrders.length > orderLimit
        ? `<button onclick="showMoreAdminOrders()"
            class="border rounded-full px-7 py-3 font-bold hover:bg-black hover:text-white transition">
            Xem thêm
          </button>`
        : ""
      }

      ${
        orderLimit > 10
        ? `<button onclick="hideLessAdminOrders()"
            class="border rounded-full px-7 py-3 font-bold hover:bg-red-800 hover:text-white transition">
            Ẩn bớt
          </button>`
        : ""
      }
    </div>

  </div>${orderDetailModal()}`;
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

async function openProductForm(id=null){
  selectedFile = null;
  document.getElementById('productModal').classList.remove('hidden');
  document.getElementById('productModal').classList.add('flex');
  document.getElementById('productFormTitle').innerText = id ? 'Sửa sản phẩm' : 'Thêm sản phẩm';
  document.getElementById('productId').value = id || '';

  const p = products.find(x => x.productId === id);
  document.getElementById('productName').value = p?.productName || '';
  document.getElementById('productDesc').value = p?.description || '';
  document.getElementById('productPrice').value = p?.basePrice || '';
  document.getElementById('productCategory').value = p?.category?.categoryId || '';
  document.getElementById('productBrand').value = p?.brand?.brandId || '';
  document.getElementById('productStatus').value = p?.status || 'ACTIVE';
  document.getElementById('productImageFile').value = '';

  const preview = document.getElementById('previewImage');
  const currentImg = p ? productImg(p,0) : '';
  if(currentImg){
    preview.src = currentImg;
    preview.classList.remove('hidden');
  }else{
    preview.src = '';
    preview.classList.add('hidden');
  }
}

function closeProductForm(){
  document.getElementById('productModal').classList.add('hidden');
  document.getElementById('productModal').classList.remove('flex');
}

function previewImage(event){
  const file = event.target.files[0];
  if(!file) return;
  if(!file.type.startsWith('image/')){showToast("Lỗi", "Vui lòng chọn file ảnh", "error");return;}
  selectedFile = file;
  const reader = new FileReader();
  reader.onload = function(e){
    const img = document.getElementById('previewImage');
    img.src = e.target.result;
    img.classList.remove('hidden');
  };
  reader.readAsDataURL(file);
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
  const id = document.getElementById('productId').value;
  const body = {
    productName: document.getElementById('productName').value.trim(),
    description: document.getElementById('productDesc').value.trim(),
    basePrice: Number(document.getElementById('productPrice').value),
    categoryId: Number(document.getElementById('productCategory').value),
    brandId: document.getElementById('productBrand').value ? Number(document.getElementById('productBrand').value) : null,
    status: document.getElementById('productStatus').value
  };

  if(!body.productName || !body.categoryId){ showToast("Lỗi", "Vui lòng nhập tên sản phẩm và chọn danh mục", "error"); return; }

  const url = id ? `${API_BASE}/products/${id}` : `${API_BASE}/products`;
  const method = id ? 'PUT' : 'POST';
  const res = await fetch(url,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  if(!res.ok){ showToast("Lỗi", await res.text(), "error"); return; }

  const product = await res.json();

  if(selectedFile){
    const formData = new FormData();
    formData.append("file", selectedFile);

    const uploadRes = await fetch(`${API_BASE}/upload/image`, {
      method: "POST",
      body: formData
    });

    const uploadData = await uploadRes.json().catch(()=>({}));

    if(!uploadRes.ok || !uploadData.imageUrl){
      showToast("Lỗi", uploadData.message || "Upload ảnh thất bại", "error");
      return;
    }

    const imageRes = await fetch(`${API_BASE}/product-images`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({
        productId: product.productId,
        imageUrl: uploadData.imageUrl,
        isMain: true
      })
    });

    const imageData = await imageRes.json().catch(()=>({}));

    if(!imageRes.ok){
      showToast("Lỗi", imageData.message || "Lưu ảnh sản phẩm thất bại", "error");
      return;
    }
  }

  selectedFile = null;
  closeProductForm();

  await init();

  const hasVariant = productHasVariant(product.productId);

  if(!hasVariant){
    currentTab = "variants";
    render();

    setTimeout(() => {
      openVariantForm();
      document.getElementById("variantProductId").value = product.productId;
    }, 100);

    showToast(
      "Cần thêm biến thể",
      "Sản phẩm cần có size, màu, SKU, tồn kho để hiển thị mua hàng ở shop",
      "error"
    );

    return;
  }

  showToast("Thành công", "Đã lưu sản phẩm");
}

function deleteProduct(id){
  showConfirm("Xóa sản phẩm này?", async () => {
    const res = await fetch(`${API_BASE}/products/${id}`, { method:'DELETE' });

    if(!res.ok){
      showToast("Lỗi", await res.text(), "error");
      return;
    }

    showToast("Thành công", "Đã xóa sản phẩm");
    await init();
  });
}

function openVariantForm(id=null){
  document.getElementById('variantModal').classList.remove('hidden');
  document.getElementById('variantModal').classList.add('flex');
  document.getElementById('variantFormTitle').innerText = id ? 'Sửa biến thể' : 'Thêm biến thể';
  document.getElementById('variantId').value = id || '';

  const v = variants.find(x => x.variantId === id);
  document.getElementById('variantProductId').value = v?.product?.productId || '';
  document.getElementById('variantSize').value = v?.size || '';
  document.getElementById('variantColor').value = v?.color || '';
  document.getElementById('variantSku').value = v?.sku || '';
  document.getElementById('variantPrice').value = v?.price || '';
  document.getElementById('variantStock').value = v?.stock ?? '';
  document.getElementById('variantStatus').value = v?.status || 'ACTIVE';
}

function closeVariantForm(){
  document.getElementById('variantModal').classList.add('hidden');
  document.getElementById('variantModal').classList.remove('flex');
}

async function saveVariant(){
  const id = document.getElementById('variantId').value;
  const body = {
    productId: Number(document.getElementById('variantProductId').value),
    size: document.getElementById('variantSize').value.trim(),
    color: document.getElementById('variantColor').value.trim(),
    sku: document.getElementById('variantSku').value.trim(),
    price: Number(document.getElementById('variantPrice').value),
    stock: Number(document.getElementById('variantStock').value),
    status: document.getElementById('variantStatus').value
  };

  if(body.stock < 0){
    body.stock = 0;
  }

  if(!body.productId || !body.sku){
    showToast("Lỗi", "Vui lòng chọn sản phẩm và nhập SKU", "error");
    return;
  }

  const url = id ? `${API_BASE}/variants/${id}` : `${API_BASE}/variants`;
  const method = id ? 'PUT' : 'POST';

  const res = await fetch(url,{
    method,
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(body)
  });

  if(!res.ok){
    showToast("Lỗi", await res.text(), "error");
    return;
  }

  closeVariantForm();

  showToast("Thành công", "Đã lưu biến thể");

  await init();
}

function deleteVariant(id){
  showConfirm("Xóa biến thể này?", async () => {
    const res = await fetch(`${API_BASE}/variants/${id}`, { method:'DELETE' });

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
    headers:{'Content-Type':'application/json'},
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
    headers: {'Content-Type':'application/json'},
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
    const res = await fetch(`${API_BASE}/categories/${id}`, { method:'DELETE' });

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
    headers:{'Content-Type':'application/json'},
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
    const res = await fetch(`${API_BASE}/brands/${id}`, { method:'DELETE' });
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

async function updateOrderStatus(orderId, status){
  const res = await fetch(`${API_BASE}/orders/${orderId}/status?status=${status}`, {
    method: "PUT"
    
  });

  const data = await res.json().catch(()=>({}));

  if(!res.ok){
    showToast("Lỗi", data.message || "Cập nhật trạng thái thất bại", "error");
    await init();
    return;
  }
  showToast("Thành công", "Đã cập nhật trạng thái đơn hàng");
  await init();
}

async function openOrderDetail(orderId){
  const res = await fetch(`${API_BASE}/orders/${orderId}`);
  const order = await res.json();

  if(!res.ok){
    showToast("Lỗi", order.message || "Không tải được đơn hàng", "error");
    return;
  }

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
        <b class="text-red-800">${order.orderStatus || "PENDING"}</b>
      </div>

      <div class="border rounded-2xl p-4">
        <p class="text-neutral-500">Khách hàng</p>
        <b>${order.user?.fullname || order.user?.email || "Khách hàng"}</b>
      </div>

      <div class="border rounded-2xl p-4">
        <p class="text-neutral-500">Địa chỉ</p>
        <b>${order.address || "Chưa có"}</b>
      </div>
    </div>

    <h3 class="font-bold text-xl mb-4">Sản phẩm trong đơn</h3>

    <div class="border rounded-2xl overflow-hidden">
      ${
        order.items && order.items.length
        ? order.items.map((item, index) => {
            const v = item.variant;
            const p = v?.product;
            const img = p
              ? productImg(p, index)
              : "/images/no-image.png";

            return `
              <div class="p-4 border-b grid grid-cols-[70px_1fr_130px] gap-4 items-center">
                <img src="${img}" class="w-16 h-20 object-cover rounded-xl border">

                <div>
                  <b>${p?.productName || "Sản phẩm"}</b>
                  <p class="text-sm text-neutral-500">
                    Size: ${v?.size || "-"} · Màu: ${v?.color || "-"} · SKU: ${v?.sku || "-"}
                  </p>
                  <p class="text-sm text-neutral-500">Số lượng: ${item.quantity}</p>
                </div>

                <b class="text-red-800">${money(item.price || item.unitPrice)}</b>
              </div>
            `;
          }).join("")
        : `<div class="p-5 text-neutral-500">Không có sản phẩm</div>`
      }
    </div>

    <div class="mt-6 bg-neutral-50 rounded-2xl p-5 space-y-2">
      <div class="flex justify-between">
        <span>Tạm tính</span>
        <b>${money(order.totalAmount)}</b>
      </div>

      <div class="flex justify-between">
        <span>Giảm giá</span>
        <b>${money(order.discountAmount)}</b>
      </div>

      <div class="border-t pt-3 flex justify-between text-xl">
        <span class="font-bold">Tổng thanh toán</span>
        <b class="text-red-800">${money(order.finalAmount)}</b>
      </div>
    </div>
  `;
}

function closeOrderDetail(){
  document.getElementById("orderModal").classList.add("hidden");
  document.getElementById("orderModal").classList.remove("flex");
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
                  <button onclick="openVoucherForm(${v.voucherId})" class="border rounded-full px-4 py-2 text-sm">Sửa</button>
                  <button onclick="deleteVoucher(${v.voucherId})" class="bg-red-800 text-white rounded-full px-4 py-2 text-sm">Xóa</button>
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
    headers:{ "Content-Type":"application/json" },
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
    const res = await fetch(`${API_BASE}/vouchers/${id}`, { method:"DELETE" });

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
    headers: {"Content-Type":"application/json"},
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
    const res = await fetch(`${API_BASE}/users/${id}`, {
      method: "DELETE"
    });

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