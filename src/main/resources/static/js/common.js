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

function getProductImg(p, index=0){
  if(p.imageUrl) return p.imageUrl;
  if(p.images && p.images.length > 0) return p.images[0].imageUrl;
  return fallbackImages[index % fallbackImages.length];
}

function getBrandName(p){
  return p.brand?.brandName || p.brandName || "HA FASHION";
}

async function fetchJson(url){
  const res = await fetch(url);
  if(!res.ok) throw new Error("API lỗi: " + url);
  return res.json();
}

function getUser(){
  return JSON.parse(localStorage.getItem("ha_user") || "null");
}


function go(page){
  if(page === "home") location.href = "/";
  if(page === "shop") location.href = "/products";
  if(page === "promo") location.href = "/promo";
  if(page === "store") location.href = "/store";
  if(page === "auth") location.href = "/auth";
}

function detail(id){
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

    <div class="wrap py-4 flex items-center gap-7">
      <button onclick="go('home')" class="serif text-3xl lg:text-4xl tracking-[.22em] font-bold whitespace-nowrap">
        HA FASHION
      </button>

      <nav class="hidden lg:flex gap-8 font-semibold text-base whitespace-nowrap">
        <button onclick="go('home')" class="hover:text-red-800">Trang chủ</button>
        <button onclick="go('shop')" class="hover:text-red-800">Sản phẩm</button>
        <button onclick="go('promo')" class="hover:text-red-800">Khuyến mãi</button>
        <button onclick="go('store')" class="hover:text-red-800">Cửa hàng</button>
      </nav>

      <div class="hidden md:flex w-[360px] rounded-full border bg-neutral-50 px-4 py-3 items-center gap-3">
        ${icon("search","w-5 h-5")}
        <input id="searchInput" onkeydown="searchEnter(event)" class="bg-transparent outline-none flex-1" placeholder="Tìm sản phẩm..." />
      </div>

      <div class="flex gap-5 items-center">
        ${icon("heart")}
        <a href="/cart" title="Giỏ hàng">${icon("shopping-bag")}</a>
        <a href="/orders" title="Đơn hàng của tôi">
    ${icon("receipt-text","w-6 h-6")}
    </a>
        <button onclick="go('auth')" title="Tài khoản">${icon("user")}</button>
      </div>
    </div>
  </header>`;
}

function footer(){
  return `<footer class="mt-16 bg-black text-white"><div class="wrap py-12 grid md:grid-cols-4 gap-8"><div><h2 class="serif text-3xl tracking-widest font-bold">HA FASHION</h2><p class="mt-4 text-neutral-300">Thời trang nữ thanh lịch, hiện đại.</p></div><div><b>Danh mục</b><p class="mt-3 text-neutral-300">Đầm nữ</p><p>Áo sơ mi</p><p>Blazer</p></div><div><b>Hỗ trợ</b><p class="mt-3">Đổi trả</p><p>Chọn size</p><p>Theo dõi đơn</p></div><div><b>Liên hệ</b><p class="mt-3">Hà Nội, Việt Nam</p><p>0900 888 999</p></div></div></footer>`;
}



function card(p,index){
  return `<div onclick="detail(${p.productId})" class="cursor-pointer bg-white border rounded-2xl shadow-sm hover:shadow-xl transition overflow-hidden"><div class="relative aspect-[3/4]"><img class="w-full h-full object-cover" src="${getProductImg(p,index)}">${p.status === "ACTIVE" ? `
  <span class="absolute left-3 top-3 bg-red-800 text-white rounded-full px-3 py-1 text-xs font-bold">
    NEW
  </span>
` : ""}<button class="absolute right-3 top-3 bg-white rounded-full p-2 shadow">${icon("heart","w-5 h-5")}</button></div><div class="p-4"><p class="text-xs tracking-widest text-neutral-500">${getBrandName(p)}</p><h3 class="line-clamp-2 min-h-12 font-semibold mt-1">${p.productName}</h3><div class="mt-3 flex justify-between items-end"><b class="text-red-800 text-xl">${formatPrice(p.basePrice)}</b><span class="text-xs text-neutral-500">Còn hàng</span></div></div></div>`;
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