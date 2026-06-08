function shop(){
  return header()+`
    <main class="wrap py-12 min-h-[60vh] grid lg:grid-cols-[340px_1fr] gap-7">

      <aside class="bg-white border border-neutral-100 rounded-3xl shadow-sm
      h-[78vh] sticky top-36 p-2 flex flex-col">

        <div class="overflow-y-scroll pr-1 custom-scroll space-y-2">
        <button onclick="clearCategory()"
          class="w-full flex items-center gap-3 px-5 py-4 text-left rounded-2xl text-[18px] font-semibold transition-all duration-200 border-b border-neutral-100/50 mb-2
          ${selectedCategoryId === null 
            ? 'bg-red-50 text-red-800 font-bold shadow-sm' 
            : 'text-neutral-800 hover:bg-neutral-50'}"
        >
          <!-- Icon Grid đại diện cho "Tất cả danh mục" giúp cân bằng layout với các icon bên dưới -->
          <div class="w-16 h-16 rounded-2xl flex items-center justify-center bg-neutral-100 text-neutral-500 transition-colors
            ${selectedCategoryId === null ? '!bg-red-100/60 !text-red-800' : ''}">
            <svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
            </svg>
          </div>
          
          <span>Tất cả danh mục</span>
        </button>

        ${categories
          .filter(c => !c.parent && !c.parentId)
          .map((parent, i) => {
            // Kiểm tra xem danh mục cha này hoặc con của nó có đang được chọn không
            const isParentActive = selectedCategoryId === parent.categoryId;
            const isChildActive = categories.some(child =>
              selectedCategoryId === child.categoryId &&
              (child.parent?.categoryId === parent.categoryId || child.parentId === parent.categoryId)
            );
            const isOpen = isParentActive || isChildActive;

            return `
              <div class="rounded-2xl overflow-hidden transition-all duration-200 ${isOpen ? 'bg-neutral-50/50' : ''}">

                <button onclick="toggleCategory(${parent.categoryId})"
                  class="w-full flex items-center justify-between px-5 py-4 text-left rounded-2xl transition-all duration-200
                  ${isParentActive ? 'bg-red-50 text-red-800 font-bold' : 'text-neutral-800 hover:bg-neutral-50'}">

                  <div class="flex items-center gap-3">
                    <img class="w-16 h-16 rounded-2xl object-cover shadow-md"
                      src="${parent.imageUrl || fallbackImages[i % fallbackImages.length]}">
                    <span class="text-[18px] font-semibold">${parent.categoryName}</span>
                  </div>

                  <!-- Mũi tên SVG mượt mà, tự động xoay khi Open -->
                  <svg class="w-4 h-4 transform transition-transform duration-200 ${isOpen ? 'rotate-180 text-red-800' : 'text-neutral-400'}" 
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>

                <div id="children-${parent.categoryId}"
                  class="${isOpen ? 'block' : 'hidden'}
                  px-2 pb-2 space-y-1 max-h-[280px] overflow-y-scroll custom-scroll">
                  ${categories
                    .filter(child =>
                      child.parent?.categoryId === parent.categoryId ||
                      child.parentId === parent.categoryId
                    )
                    .map(child => {
                      const isCurrentChild = selectedCategoryId === child.categoryId;
                      return `
                        <button onclick="filterCategory(${child.categoryId})"
                          class="w-full flex items-center gap-4 pl-14 pr-5 py-3.5 text-left text-[14px] rounded-xl transition-all duration-200
                          ${isCurrentChild
                            ? 'bg-red-50 text-red-800 font-semibold shadow-sm'
                            : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/70'
                          }">

                          <img
                              class="w-14 h-14 rounded-2xl object-cover border border-neutral-200 shadow-sm"
                              src="${child.imageUrl || fallbackImages[(i+1) % fallbackImages.length]}"
                            >

                            <span>${child.categoryName}</span>

                        </button>
                      `;
                    }).join("")}
                </div>

              </div>
            `;
            }).join("")}
            </div>
            </aside>

      <section>
        <div class="mb-7 flex justify-between items-end gap-4">
          <div>
            <p class="text-red-800 tracking-widest uppercase font-bold">Shop</p>
            <h1 class="serif text-5xl">Danh sách sản phẩm</h1>
            <p class="text-neutral-600 mt-3">
              Chọn danh mục bên trái để chuyển nhanh sang nhóm sản phẩm khác.
            </p>
          </div>

          <select onchange="sortProducts(this.value)"
            class="bg-white border rounded-full px-5 py-3">
            <option value="default">Sắp xếp mặc định</option>
            <option value="asc">Giá tăng dần</option>
            <option value="desc">Giá giảm dần</option>
          </select>
        </div>

        ${productGrid()}
      </section>

    </main>
  `+footer();
}

async function loadProductsPage(){
  try{
    const params = new URLSearchParams(location.search);

    selectedCategoryId = params.get("categoryId")
      ? Number(params.get("categoryId"))
      : null;

    searchKeyword = params.get("keyword") || "";

    const [productData, categoryData, brandData, orderData] = await Promise.all([
      fetchJson(`${API_BASE}/products`),
      fetchJson(`${API_BASE}/categories`),
      fetchJson(`${API_BASE}/brands`).catch(()=>[]),
      fetchJson(`${API_BASE}/orders`).catch(()=>[])
    ]);

    allProducts = productData.filter(p => p.status === "ACTIVE");
    products = allProducts;
    categories = categoryData;
    brands = brandData;
    window.allOrders = orderData;
    window.soldCounts = {};

    await Promise.all(
      allProducts.map(async p => {
        try {
          const count = await fetchJson(`${API_BASE}/products/${p.productId}/sold-count`);
          window.soldCounts[p.productId] = Number(count || 0);
        } catch (e) {
          window.soldCounts[p.productId] = 0;
        }
      })
    );

    if(selectedCategoryId){
      const childIds = categories
        .filter(c =>
          c.parent?.categoryId === selectedCategoryId ||
          c.parentId === selectedCategoryId
        )
        .map(c => c.categoryId);

      const ids = [selectedCategoryId, ...childIds];

      products = allProducts.filter(p =>
        ids.includes(p.category?.categoryId)
      );
    }

    if(searchKeyword){
      const kw = searchKeyword.toLowerCase().trim();

      products = allProducts.filter(p =>
        (p.productName || "").toLowerCase().includes(kw)
      );
    }

    renderApp(shop());

  }catch(err){
    console.error(err);
    document.getElementById("app").innerHTML =
      `<div class="p-10 text-center"><h1 class="text-3xl font-bold text-red-800">Không kết nối được backend</h1><p class="mt-3">Kiểm tra API /api/products hoạt động.</p></div>`;
  }
}

function applyCategoryFilter(categoryId){
  selectedCategoryId = categoryId;

  if(!categoryId){
    products = allProducts;
  }else{
    const childIds = categories
      .filter(c =>
        c.parent?.categoryId === categoryId ||
        c.parentId === categoryId
      )
      .map(c => c.categoryId);

    const ids = [categoryId, ...childIds];

    products = allProducts.filter(p =>
      ids.includes(p.category?.categoryId)
    );
  }

  history.pushState(null, "", categoryId ? `/products?categoryId=${categoryId}` : "/products");
  renderApp(shop());
}

function filterCategory(categoryId){
  applyCategoryFilter(categoryId);
}

function clearCategory(){
  applyCategoryFilter(null);
}

function toggleCategory(parentId){
  applyCategoryFilter(parentId);
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

const urlParams = new URLSearchParams(window.location.search);
const keyword = urlParams.get("keyword");

if(keyword){
  searchKeyword = keyword;

  const searchInput = document.getElementById("searchInput");
  if(searchInput){
    searchInput.value = keyword;
  }

  products = allProducts.filter(p =>
    p.productName?.toLowerCase().includes(keyword.toLowerCase())
  );
}

loadProductsPage();