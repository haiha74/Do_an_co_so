function hero(){

  const slides = [
    {
      image: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=1600&auto=format&fit=crop",
      title: "Summer Collection 2026",
      desc: "Đầm, blazer và áo sơ mi thanh lịch cho mùa mới."
    },
    {
      image: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=1600&auto=format&fit=crop",
      title: "Luxury Fashion Week",
      desc: "Thiết kế sang trọng dành cho phong cách hiện đại."
    },
    {
      image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1600&auto=format&fit=crop",
      title: "Elegant New Arrival",
      desc: "Khám phá bộ sưu tập thời trang nữ cao cấp mới nhất."
    }
  ];

  return `
    <section class="relative h-[560px] overflow-hidden bg-black">

      <div id="heroSlides" class="relative w-full h-full">

        ${slides.map((slide,index)=>`
          <div class="hero-slide absolute inset-0 transition-opacity duration-700 ${index === 0 ? 'opacity-100 z-10' : 'opacity-0 z-0'}">

            <img
              class="absolute inset-0 w-full h-full object-cover"
              src="${slide.image}"
            >

            <div class="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent"></div>

            <div class="wrap relative h-full flex items-center text-white">
              <div class="max-w-2xl">

                <p class="uppercase tracking-[.35em] text-red-200 font-semibold">
                  JODOK
                </p>

                <h1 class="serif text-7xl leading-tight mt-4">
                  ${slide.title}
                </h1>

                <p class="text-xl mt-5 text-white/85">
                  ${slide.desc}
                </p>

                <button
                  onclick="go('shop')"
                  class="mt-8 rounded-full bg-white text-black px-8 py-4 font-bold hover:bg-red-800 hover:text-white transition"
                >
                  Khám phá ngay
                </button>

              </div>
            </div>
          </div>
        `).join("")}

      </div>

      <!-- BUTTON LEFT -->
      <button
        onclick="prevHeroSlide()"
        class="absolute left-6 top-1/2 -translate-y-1/2 z-30
               w-14 h-14 rounded-full bg-white/20 backdrop-blur
               text-white text-3xl hover:bg-white hover:text-black transition"
      >
        ‹
      </button>

      <!-- BUTTON RIGHT -->
      <button
        onclick="nextHeroSlide()"
        class="absolute right-6 top-1/2 -translate-y-1/2 z-30
               w-14 h-14 rounded-full bg-white/20 backdrop-blur
               text-white text-3xl hover:bg-white hover:text-black transition"
      >
        ›
      </button>

      <!-- DOTS -->
      <div class="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-3">
        ${slides.map((_,index)=>`
          <button
            onclick="goHeroSlide(${index})"
            class="hero-dot w-3 h-3 rounded-full transition ${index === 0 ? 'bg-white scale-125' : 'bg-white/40'}"
          ></button>
        `).join("")}
      </div>

    </section>
  `;
}

let currentHeroSlide = 0;
let heroInterval;

function updateHeroSlides(){

  const slides = document.querySelectorAll(".hero-slide");
  const dots = document.querySelectorAll(".hero-dot");

  slides.forEach((slide,index)=>{

    if(index === currentHeroSlide){
      slide.classList.remove("opacity-0","z-0");
      slide.classList.add("opacity-100","z-10");
    }else{
      slide.classList.remove("opacity-100","z-10");
      slide.classList.add("opacity-0","z-0");
    }

  });

  dots.forEach((dot,index)=>{

    if(index === currentHeroSlide){
      dot.classList.remove("bg-white/40");
      dot.classList.add("bg-white","scale-125");
    }else{
      dot.classList.remove("bg-white","scale-125");
      dot.classList.add("bg-white/40");
    }

  });

}

function nextHeroSlide(){

  const slides = document.querySelectorAll(".hero-slide");

  currentHeroSlide++;

  if(currentHeroSlide >= slides.length){
    currentHeroSlide = 0;
  }

  updateHeroSlides();
}

function prevHeroSlide(){

  const slides = document.querySelectorAll(".hero-slide");

  currentHeroSlide--;

  if(currentHeroSlide < 0){
    currentHeroSlide = slides.length - 1;
  }

  updateHeroSlides();
}

function goHeroSlide(index){
  currentHeroSlide = index;
  updateHeroSlides();
}

function startHeroAutoSlide(){

  clearInterval(heroInterval);

  heroInterval = setInterval(()=>{
    nextHeroSlide();
  },8000);

}



function categoryGrid(){
  const parentCategories = categories.filter(c => !c.parent && !c.parentId);

  return `
    <section class="wrap py-12">
      <div class="bg-white border rounded-3xl overflow-hidden shadow-sm">
        <h2 class="px-6 py-5 border-b text-xl font-bold uppercase text-neutral-700">
          Danh mục nổi bật
        </h2>

        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          ${parentCategories.map((c,i)=>`
            <button
              onclick="location.href='/products?categoryId=${c.categoryId}'"
              class="h-40 border-r border-b hover:bg-red-50 flex flex-col items-center justify-center gap-3">

              <img
                class="w-20 h-20 rounded-full object-cover"
                src="${c.imageUrl ? c.imageUrl + '?t=' + Date.now() : '/images/no-image.png'}"
              >

              <span class="font-semibold">
                ${c.categoryName}
              </span>

            </button>
          `).join("")}
        </div>
      </div>
    </section>
  `;
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

    setTimeout(()=>{
      startHeroAutoSlide();
    },100);

  }catch(err){
    console.error(err);
    document.getElementById("app").innerHTML =
      `<div class="p-10 text-center"><h1 class="text-3xl font-bold text-red-800">Không kết nối được backend</h1><p class="mt-3">Kiểm tra Spring Boot đang chạy ở cổng 8080 và API /api/products hoạt động.</p></div>`;
  }
}

loadHomePage();