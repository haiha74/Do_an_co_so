const API_BASE = "http://localhost:8080/api";

const fallbackImages = [
  "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?q=80&w=900&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?q=80&w=900&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=900&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?q=80&w=900&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=900&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1543076447-215ad9ba6923?q=80&w=900&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=900&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=900&auto=format&fit=crop"
];

let products = [];
let allProducts = [];
let categories = [];
let brands = [];

let selectedProduct = null;
let selectedCategoryId = null;
let searchKeyword = "";

let selectedProductVariants = [];
let selectedSize = "";
let selectedColor = "";
let selectedQty = 1;

let authMode = "login";

function icon(n,c="w-6 h-6"){
  return `<i data-lucide="${n}" class="${c}"></i>`;
}

function formatPrice(price){
  if(price === null || price === undefined || price === "") return "Liên hệ";
  return Number(price).toLocaleString("vi-VN") + "đ";
}

function getSoldCount(productId){

  let total = 0;

  if(!window.allOrders){
    return 0;
  }

  allOrders.forEach(order => {

    if(
      order.orderStatus === "CANCELLED" ||
      order.orderStatus === "PENDING"
    ){
      return;
    }

    (order.items || []).forEach(item => {

      const itemProductId =
        item.variant?.product?.productId;

      if(itemProductId === productId){
        total += Number(item.quantity || 0);
      }

    });

  });

  return total;
}

function getProductImg(p,index=0){
  if(p.imageUrl){
    return p.imageUrl + "?v=" + Date.now();
  }

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

  return fallbackImages[index % fallbackImages.length];
}

function getBrandName(p){
  return p.brand?.brandName || p.brandName || p.brand?.name || "JODOK";
}

async function fetchJson(url){
  const res = await fetch(url);
  if(!res.ok) throw new Error("API lỗi: " + url);
  return res.json();
}

function getUser(){
  return JSON.parse(localStorage.getItem("ha_user") || "null");
}

async function getCartCount(){
  const user = getUser();

  if(user?.userId){
    try{
      const res = await fetch(`${API_BASE}/cart/${user.userId}`);

      if(res.ok){
        const data = await res.json();

        console.log("CART API DATA:", data);

        const items = Array.isArray(data)
          ? data
          : (data.items || data.cartItems || []);

        return items.reduce((sum,item)=>{
          return sum + Number(item.quantity || 0);
        },0);
      }
    }catch(e){
      console.error("Không lấy được giỏ hàng DB", e);
    }
  }

  const localCart = JSON.parse(localStorage.getItem("ha_cart") || "[]");

  return localCart.reduce((total,item)=>{
    return total + Number(item.quantity || 0);
  },0);
}


function go(page){
  if(page === "home") location.href = "/";
  if(page === "shop") location.href = "/products";
  if(page === "promo") location.href = "/promo";
  if(page === "store") location.href = "/store";
  if(page === "auth") location.href = "/auth";
}

async function saveProductView(productId){
  const user = getUser();

  if(!user?.userId){
    return;
  }

  try{
    await fetch(`${API_BASE}/recommendations/view`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userId: user.userId,
        productId: productId
      })
    });
  }catch(e){
    console.error("Không lưu được lịch sử xem", e);
  }
}

async function detail(id){
  await saveProductView(id);
  location.href = `/detail?productId=${id}`;
}

function goShop(){
  window.location.href = "/";
}

function goAdmin(){
  window.location.href = "/admin";
}

function goStaff(){
  window.location.href = "/staff";
}


function header(){
  return `<header class="sticky top-0 z-50 bg-white border-b shadow-sm">
    <div class="bg-black text-white text-xs">
      <div class="wrap py-2 flex justify-between">
        <span>Freeship đơn từ 999.000đ</span>
        <span>Hotline: 0900 888 999 · Đổi trả 7 ngày</span>
      </div>
    </div>

    <div class="wrap py-3 flex flex-wrap items-center justify-between gap-4">
      <button onclick="go('home')" class="whitespace-nowrap">
        <img
          src="/images/logo1.jpg"
          alt="JODOK"
          class="h-12 md:h-14 lg:h-16 xl:h-20 object-contain"
        >
      </button>

      <nav class="
        flex flex-wrap items-center justify-center
        gap-4 md:gap-6 lg:gap-8
        text-sm lg:text-base
        font-semibold
        flex-1
      ">
        <button onclick="go('home')" class="hover:text-red-800">Trang chủ</button>
        <button onclick="go('shop')" class="hover:text-red-800">Sản phẩm</button>
        <button onclick="go('promo')" class="hover:text-red-800">Khuyến mãi</button>
        <button onclick="go('store')" class="hover:text-red-800">Cửa hàng</button>
      </nav>

      <div class="w-full md:w-[260px] lg:w-[320px] flex rounded-full border bg-neutral-50 px-4 py-3 items-center gap-3">
        ${icon("search","w-5 h-5")}
        <input id="searchInput" onkeydown="searchEnter(event)" class="bg-transparent outline-none flex-1" placeholder="Tìm sản phẩm..." />
      </div>

      <div class="flex items-center gap-3 md:gap-5 shrink-0">
        <a href="/cart"
          title="Giỏ hàng"
          class="relative">

          ${icon("shopping-bag")}

          <span id="cartCount"
            class="hidden absolute -top-2 -right-3
                  min-w-[20px] h-5 px-1
                  rounded-full bg-red-800 text-white
                  text-[11px] font-bold
                  flex items-center justify-center">
            0
          </span>

        </a>
        <a href="/orders" title="Đơn hàng của tôi">
    ${icon("receipt-text","w-6 h-6")}
    </a>
        <button onclick="go('auth')" title="Tài khoản">${icon("user")}</button>
      </div>
    </div>
  </header>`;
}

function footer(){
  return `<footer class="mt-16 bg-black text-white"><div class="wrap py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center sm:text-left"><div><h2 class="serif text-3xl tracking-widest font-bold">JODOK</h2><p class="mt-4 text-neutral-300">Thời trang nữ thanh lịch, hiện đại.</p></div><div><b>Danh mục</b><p class="mt-3 text-neutral-300">Đầm nữ</p><p>Áo sơ mi</p><p>Blazer</p></div><div><b>Hỗ trợ</b><p class="mt-3">Đổi trả</p><p>Chọn size</p><p>Theo dõi đơn</p></div><div><b>Liên hệ</b><p class="mt-3">Hà Nội, Việt Nam</p><p>0900 888 999</p></div></div></footer>`;
}



function card(p,index){

  return `
    <div onclick="detail(${p.productId})"
      class="cursor-pointer bg-white border rounded-2xl shadow-sm hover:shadow-xl transition overflow-hidden">

      <div class="relative aspect-[3/4]">

        <img class="w-full h-full object-cover"
          src="${getProductImg(p,index)}">

        ${p.status === "ACTIVE" ? `
          <span class="absolute left-3 top-3 bg-red-800 text-white rounded-full px-3 py-1 text-xs font-bold">
            NEW
          </span>
        ` : ""}

      </div>

      <div class="p-4">

        <p class="text-xs tracking-widest text-neutral-500">
          ${getBrandName(p)}
        </p>

        <h3 class="line-clamp-2 min-h-12 font-semibold mt-1">
          ${p.productName}
        </h3>

        <div class="mt-3 flex justify-between items-end">

          <b class="text-red-800 text-xl">
            ${formatPrice(p.basePrice)}
          </b>

          <span class="text-xs text-neutral-500">
            Đã bán ${getSoldCount(p.productId)}
          </span>

        </div>

      </div>
    </div>
  `;
}

function productGrid(list = products){
  if(!list.length) return `<div class="bg-white rounded-3xl border p-10 text-center text-neutral-500">Chưa có sản phẩm để hiển thị.</div>`;
  return `<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">${list.map(card).join("")}</div>`;
}

function renderApp(html){
  document.getElementById("app").innerHTML = html;

  if(window.lucide){
    lucide.createIcons();
  }

  updateCartCount();
}

async function updateCartCount(){
  const badge = document.getElementById("cartCount");
  if(!badge) return;

  const user = getUser();

  if(!user?.userId){
    badge.classList.add("hidden");
    return;
  }

  const total = await getCartCount();

  badge.innerText = total;
  badge.classList.remove("hidden");
}

function showToast(title, text, type = "success"){

  const old = document.getElementById("toast");
  if(old) old.remove();

  const toast = document.createElement("div");

  toast.id = "toast";

  toast.className =
    `toast ${type === "error" ? "toast-error" : "toast-success"}`;

  toast.innerHTML = `
    <div class="toast-icon">
      ${type === "error" ? "!" : "✓"}
    </div>

    <div>
      <div class="toast-title">${title}</div>
      <div class="toast-text">${text}</div>
    </div>
  `;

  document.body.appendChild(toast);

  setTimeout(()=>{
    toast.remove();
  },2500);
}

function searchEnter(event){
  if(event.key !== "Enter") return;

  const keyword = event.target.value.trim();

  if(!keyword) return;

  location.href = `/products?keyword=${encodeURIComponent(keyword)}`;
}

console.log("COMMON LOADED");