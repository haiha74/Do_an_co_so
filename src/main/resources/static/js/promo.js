function promo(){
  return header()+`<main class="wrap py-14"><section class="rounded-3xl bg-gradient-to-r from-red-900 to-red-600 text-white p-12"><p class="uppercase tracking-widest">Ưu đãi tháng này</p><h1 class="serif text-6xl mt-3">Khuyến mãi hot</h1><p class="text-xl mt-4">Săn sale cho các sản phẩm thời trang nữ mới nhất.</p><button onclick="go('shop')" class="mt-7 bg-white text-red-800 rounded-full px-8 py-4 font-bold">Mua ngay</button></section><h2 class="serif text-4xl mt-12 mb-6">Sản phẩm đang bán</h2>${productGrid(products.slice(0,8))}</main>`+footer();
}

async function loadPromoPage(){
  try{
    const productData = await fetchJson(`${API_BASE}/products`);
    allProducts = productData.filter(p => p.status === "ACTIVE");
    products = allProducts;

    renderApp(promo());
  }catch(err){
    console.error(err);
    renderApp(header()+`<main class="wrap py-20">Không tải được dữ liệu.</main>`+footer());
  }
}

loadPromoPage();