function shop(){
  return header()+`<main class="wrap py-12 grid lg:grid-cols-[260px_1fr] gap-7"><aside class="bg-white border rounded-3xl overflow-hidden shadow-sm h-fit sticky top-36"><h2 class="px-5 py-4 border-b font-bold text-lg uppercase">Bộ lọc</h2><button onclick="clearCategory()" class="w-full p-4 border-b text-left hover:bg-red-50 ${selectedCategoryId===null?'bg-red-50 text-red-800 font-bold':''}">Tất cả sản phẩm</button>${categories.map((c,i)=>`<button onclick="filterCategory(${c.categoryId})" class="w-full flex items-center gap-3 p-4 border-b text-left hover:bg-red-50 ${selectedCategoryId===c.categoryId?'bg-red-50 text-red-800 font-bold':''}"><img class="w-12 h-12 rounded-full object-cover" src="${fallbackImages[i % fallbackImages.length]}"><span>${c.categoryName}</span></button>`).join("")}</aside><section><div class="mb-7 flex justify-between items-end gap-4"><div><p class="text-red-800 tracking-widest uppercase font-bold">Shop</p><h1 class="serif text-5xl">Danh sách sản phẩm</h1><p class="text-neutral-600 mt-3">Chọn danh mục bên trái để chuyển nhanh sang nhóm sản phẩm khác.</p></div><select onchange="sortProducts(this.value)" class="bg-white border rounded-full px-5 py-3"><option value="default">Sắp xếp mặc định</option><option value="asc">Giá tăng dần</option><option value="desc">Giá giảm dần</option></select></div>${productGrid()}</section></main>`+footer();
}

async function loadProductsPage(){
  try{
    const params = new URLSearchParams(location.search);

    selectedCategoryId = params.get("categoryId")
      ? Number(params.get("categoryId"))
      : null;

    searchKeyword = params.get("keyword") || "";

    const [productData, categoryData, brandData] = await Promise.all([
      fetchJson(`${API_BASE}/products`),
      fetchJson(`${API_BASE}/categories`),
      fetchJson(`${API_BASE}/brands`).catch(()=>[])
    ]);

    allProducts = productData.filter(p => p.status === "ACTIVE");
    products = allProducts;
    categories = categoryData;
    brands = brandData;

    if(selectedCategoryId){
      try{
        const data = await fetchJson(`${API_BASE}/products/category/${selectedCategoryId}`);
        products = data.filter(p => p.status === "ACTIVE");
      }catch(e){
        products = allProducts.filter(p => p.category?.categoryId === selectedCategoryId);
      }
    }

    if(searchKeyword){
      try{
        const data = await fetchJson(`${API_BASE}/products/search?keyword=${encodeURIComponent(searchKeyword)}`);
        products = data.filter(p => p.status === "ACTIVE");
      }catch(e){
        products = allProducts.filter(p =>
          (p.productName || "").toLowerCase().includes(searchKeyword.toLowerCase())
        );
      }
    }

    renderApp(shop());

  }catch(err){
    console.error(err);
    document.getElementById("app").innerHTML =
      `<div class="p-10 text-center"><h1 class="text-3xl font-bold text-red-800">Không kết nối được backend</h1><p class="mt-3">Kiểm tra API /api/products hoạt động.</p></div>`;
  }
}

function filterCategory(categoryId){
  location.href = `/products?categoryId=${categoryId}`;
}

function clearCategory(){
  location.href = "/products";
}

function searchEnter(e){
  if(e.key !== "Enter") return;

  const keyword = e.target.value.trim();

  if(keyword){
    location.href = `/products?keyword=${encodeURIComponent(keyword)}`;
  }
}

function sortProducts(type){
  if(type === "asc"){
    products.sort((a,b)=>(a.basePrice||0)-(b.basePrice||0));
  }

  if(type === "desc"){
    products.sort((a,b)=>(b.basePrice||0)-(a.basePrice||0));
  }

  renderApp(shop());
}

loadProductsPage();