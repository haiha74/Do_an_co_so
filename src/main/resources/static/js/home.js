function hero(){
  return `<section class="relative h-[560px] overflow-hidden bg-black"><img class="absolute inset-0 w-full h-full object-cover opacity-70" src="https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=1600&auto=format&fit=crop"><div class="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent"></div><div class="wrap relative h-full flex items-center text-white"><div class="max-w-2xl"><p class="uppercase tracking-[.35em] text-red-200 font-semibold">HA Fashion</p><h1 class="serif text-7xl leading-tight mt-4">Summer Collection 2026</h1><p class="text-xl mt-5 text-white/85">Đầm, blazer và áo sơ mi thanh lịch cho mùa mới.</p><button onclick="go('shop')" class="mt-8 rounded-full bg-white text-black px-8 py-4 font-bold">Khám phá ngay</button></div></div></section>`;
}

function categoryGrid(){
  const list = categories.length ? categories : [];
  return `<section class="wrap py-12"><div class="bg-white border rounded-3xl overflow-hidden shadow-sm"><h2 class="px-6 py-5 border-b text-xl font-bold uppercase text-neutral-700">Danh mục nổi bật</h2><div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6">${list.map((c,i)=>`<button onclick="location.href='/products?categoryId=${c.categoryId}'" class="h-40 border-r border-b hover:bg-red-50 flex flex-col items-center justify-center gap-3"><img class="w-20 h-20 rounded-full object-cover" src="${c.imageUrl ? c.imageUrl + '?t=' + Date.now() : '/images/no-image.png'}"><span class="font-semibold">${c.categoryName}</span></button>`).join("")}</div></div></section>`;
}

function home(){
  return header()+hero()+categoryGrid()+`<section class="wrap py-10"><div class="mb-7 flex justify-between items-end"><div><p class="text-red-800 tracking-widest uppercase font-bold">Sản phẩm nổi bật</p><h2 class="serif text-5xl">Best Sellers</h2></div><button onclick="go('shop')" class="border rounded-full px-6 py-3 bg-white font-semibold">Xem tất cả</button></div>${productGrid(products.slice(0,8))}</section>`+footer();
}

async function loadHomePage(){
  try{
    const [productData, categoryData, brandData] = await Promise.all([
      fetchJson(`${API_BASE}/products`),
      fetchJson(`${API_BASE}/categories`),
      fetchJson(`${API_BASE}/brands`).catch(()=>[])
    ]);

    allProducts = productData.filter(p => p.status === "ACTIVE");
    products = allProducts;
    categories = categoryData;
    brands = brandData;

    renderApp(home());

  }catch(err){
    console.error(err);
    document.getElementById("app").innerHTML =
      `<div class="p-10 text-center"><h1 class="text-3xl font-bold text-red-800">Không kết nối được backend</h1><p class="mt-3">Kiểm tra Spring Boot đang chạy ở cổng 8080 và API /api/products hoạt động.</p></div>`;
  }
}

loadHomePage();