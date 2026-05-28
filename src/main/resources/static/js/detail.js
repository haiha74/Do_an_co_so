let productFeedbacks = [];
let showReviewForm = false;

function detailPage(){
  const p = selectedProduct || products[0];

  if(!p){
    return header()+`<main class="wrap py-20">Không tìm thấy sản phẩm.</main>
${feedbackSection()}
`+footer();
  }

  const activeVariants = selectedProductVariants.filter(v => v.status === "ACTIVE");
  const sizes = [...new Set(activeVariants.map(v => v.size).filter(Boolean))];

  const colors = selectedSize
    ? [...new Set(activeVariants.filter(v => v.size === selectedSize).map(v => v.color).filter(Boolean))]
    : [];

  const selectedVariant = activeVariants.find(v =>
    v.size === selectedSize && v.color === selectedColor
  );

  const displayPrice = selectedVariant?.price || p.basePrice;
  const stock = selectedVariant?.stock ?? 0;

  return header()+`
  <main class="wrap py-12 grid lg:grid-cols-2 gap-10">

    <div class="grid grid-cols-2 gap-4">
      <img class="col-span-2 h-[560px] w-full object-cover rounded-3xl" src="${getProductImg(p,0)}">
      <img class="h-56 w-full object-cover rounded-3xl" src="${getProductImg(p,1)}">
      <img class="h-56 w-full object-cover rounded-3xl" src="${getProductImg(p,2)}">
    </div>

    <div class="bg-white rounded-3xl border shadow-sm p-9 h-fit sticky top-36">

    <div class="flex items-center justify-between mb-7">

      <button
        onclick="location.href='/products'"
        class="group inline-flex items-center gap-3 border border-neutral-300 bg-white hover:bg-black hover:text-white px-5 py-3 rounded-full transition-all duration-300 shadow-sm hover:shadow-lg"
      >
        <span class="text-lg transition-transform duration-300 group-hover:-translate-x-1">
          ←
        </span>

        <span class="font-semibold">
          Quay lại cửa hàng
        </span>
      </button>

      <div class="text-sm text-neutral-400">
        JODOK
      </div>

    </div>
    
      <p class="text-red-800 uppercase tracking-widest font-bold">${getBrandName(p)}</p>

      <h1 class="serif text-5xl mt-3">${p.productName}</h1>

      <p class="mt-4">
        ⭐ 4.9 · Đánh giá tốt · 
        ${p.status === "ACTIVE" ? "Đang bán" : "Ngừng bán"}
      </p>

      <div class="mt-7">
        <b class="text-4xl text-red-800">${formatPrice(displayPrice)}</b>
      </div>

      <p class="mt-6 text-neutral-600">
        ${p.description || "Thiết kế thanh lịch, chất liệu cao cấp."}
      </p>

      <h3 class="font-bold mt-7 mb-3">Kích thước</h3>
      <div class="flex flex-wrap gap-3">
        ${
          sizes.length
          ? sizes.map(s => `
              <button onclick="selectSize('${s}')"
                class="border rounded-xl px-6 py-3 ${selectedSize === s ? 'border-red-800 text-red-800 font-bold bg-red-50' : 'hover:border-red-800'}">
                ${s}
              </button>
            `).join("")
          : `<span class="text-neutral-500">Chưa có biến thể size</span>`
        }
      </div>

      <h3 class="font-bold mt-7 mb-3">Màu sắc</h3>
      <div class="flex flex-wrap gap-3">
        ${
          selectedSize
          ? colors.map(c => `
              <button onclick="selectColor('${c}')"
                class="border rounded-xl px-6 py-3 ${selectedColor === c ? 'border-red-800 text-red-800 font-bold bg-red-50' : 'hover:border-red-800'}">
                ${c}
              </button>
            `).join("")
          : `<span class="text-neutral-500">Vui lòng chọn size trước</span>`
        }
      </div>

      <div class="mt-7">
        <h3 class="font-bold mb-3">Tồn kho</h3>
        ${
          selectedVariant
          ? `<p class="${stock > 0 ? 'text-green-700' : 'text-red-800'} font-bold">
              ${stock > 0 ? `Còn ${stock} sản phẩm` : "Hết hàng"}
            </p>`
          : `<p class="text-neutral-500">Chọn size và màu để xem tồn kho</p>`
        }
      </div>

      <div class="mt-7">
        <h3 class="font-bold mb-3">Số lượng</h3>
        <input type="number"
          min="1"
          max="${stock || 1}"
          value="${selectedQty}"
          onchange="changeQty(this.value)"
          class="border rounded-xl px-4 py-3 w-28">
      </div>

      <div class="mt-8 flex gap-4">
        <button onclick="addToCart()"
          class="flex-1 bg-black text-white rounded-full py-4 font-bold ${!selectedVariant || stock <= 0 ? 'opacity-50' : ''}">
          Thêm vào giỏ
        </button>

        <button onclick="buyNow()"
          class="flex-1 bg-red-800 text-white rounded-full py-4 font-bold ${!selectedVariant || stock <= 0 ? 'opacity-50' : ''}">
          Mua ngay
        </button>
      </div>
    </div>
  </main>
  ${reviewFormSection()}
  ${feedbackSection()}
  `+footer();
}

async function loadDetailPage(){
  const params = new URLSearchParams(location.search);
  const productId = params.get("productId") ? Number(params.get("productId")) : null;
  showReviewForm = params.get("review") === "1";

  if(!productId){
    renderApp(header()+`<main class="wrap py-20">Không tìm thấy sản phẩm.</main>`+footer());
    return;
  }

  try{
    try{
      selectedProduct = await fetchJson(`${API_BASE}/products/${productId}`);
    }catch(e){
      const all = await fetchJson(`${API_BASE}/products`);
      selectedProduct = all.find(p => p.productId === productId);
    }

    try{
      selectedProductVariants = await fetchJson(`${API_BASE}/variants/product/${productId}`);
    }catch(e){
      selectedProductVariants = [];
    }

    try{
  const allReviews = await fetchJson(`${API_BASE}/reviews`);

  productFeedbacks = allReviews.filter(r =>
    r.orderItem?.variant?.product?.productId === productId
  );
  }catch(e){
    productFeedbacks = [];
  }

      selectedSize = "";
      selectedColor = "";
      selectedQty = 1;

      renderApp(detailPage());

    }catch(err){
      console.error(err);
      renderApp(header()+`<main class="wrap py-20">Không tải được sản phẩm.</main>`+footer());
    }
  }

function selectSize(size){
  selectedSize = size;
  selectedColor = "";
  selectedQty = 1;

  renderApp(detailPage());
}

function selectColor(color){
  selectedColor = color;
  selectedQty = 1;

  renderApp(detailPage());
}

function changeQty(value){
  selectedQty = Number(value);
}

function getSelectedVariant(){
  return selectedProductVariants.find(v =>
    v.status === "ACTIVE" &&
    v.size === selectedSize &&
    v.color === selectedColor
  );
}

async function addToCart(){

    const user = JSON.parse(
        localStorage.getItem("ha_user") || "null"
    );

    if(!user){

        showToast(
        "Chưa đăng nhập",
        "Vui lòng đăng nhập để tiếp tục",
        "error"
        );

        setTimeout(()=>{
        location.href = "/auth";
        },1000);

        return false;
    }

    const variant = getSelectedVariant();

    if(!variant){

        showToast(
        "Thiếu thông tin",
        "Vui lòng chọn size và màu sắc",
        "error"
        );

        return false;
    }

    if(variant.stock <= 0){

        showToast(
        "Hết hàng",
        "Sản phẩm hiện đã hết hàng",
        "error"
        );

        return false;
    }

    if(selectedQty < 1 || selectedQty > variant.stock){

        showToast(
        "Không hợp lệ",
        "Số lượng vượt quá tồn kho",
        "error"
        );

        return false;
    }

    try{

        const res = await fetch(`${API_BASE}/cart/add`, {
        method: "POST",
        headers: {
            "Content-Type":"application/json"
        },
        body: JSON.stringify({
            userId: user.userId,
            variantId: variant.variantId,
            quantity: selectedQty
        })
        });

        if(!res.ok){

        let msg = "Thêm giỏ hàng thất bại";

        try{
            const data = await res.json();
            msg = data.message || msg;
        }catch(e){}

        showToast(
            "Không thể thêm",
            msg,
            "error"
        );

        return false;
        }

        showToast(
          "Thành công",
          "Sản phẩm đã được thêm vào giỏ hàng",
          "success"
        );

        await updateCartCount();

        return true;

    }catch(err){

        console.error(err);

        showToast(
        "Lỗi kết nối",
        "Không kết nối được backend",
        "error"
        );

        return false;
    }
    }

async function buyNow(){
  const ok = await addToCart();

  if(ok){
    window.location.href = "/cart";
  }
}

function feedbackSection(){
  return `
    <section class="wrap pb-14">
      <div class="bg-white border rounded-3xl p-8 shadow-sm">
        <div class="flex items-end justify-between mb-6">
          <div>
            <p class="text-red-800 uppercase tracking-widest font-bold">
              Feedback
            </p>
            <h2 class="serif text-4xl mt-2">
              Đánh giá từ đơn hàng hoàn thành
            </h2>
          </div>

          <b class="text-neutral-500">
            ${productFeedbacks.length} đánh giá
          </b>
        </div>

        ${
          productFeedbacks.length
          ? productFeedbacks.map(f => `
            <div class="border-t py-5">
              <div class="flex justify-between gap-4">
                <div>
                  <b>${f.user?.fullname || f.user?.email || "Khách hàng"}</b>
                  <p class="text-sm text-neutral-500">
                    ${f.createdAt ? new Date(f.createdAt).toLocaleDateString("vi-VN") : ""}
                  </p>
                </div>

                <div class="text-yellow-500 font-bold">
                  ${"★".repeat(f.rating)}
                </div>
              </div>

              <p class="mt-3 text-neutral-700">
                ${f.comment}
              </p>

              <p class="text-sm text-neutral-500 mt-2">
                Phân loại: Size ${f.orderItem?.variant?.size || "-"} · Màu ${f.orderItem?.variant?.color || "-"}
              </p>
            </div>
          `).join("")
          : `<p class="text-neutral-500">Chưa có feedback từ đơn hàng hoàn thành.</p>`
        }
      </div>
    </section>
  `;
}

function reviewFormSection(){
  if(!showReviewForm || !selectedProduct) return "";

  return `
    <section class="wrap pb-10">
      <div class="bg-white border rounded-3xl p-8 shadow-sm">
        <h2 class="serif text-4xl mb-6">Đánh giá sản phẩm</h2>

        <div class="grid md:grid-cols-[120px_1fr] gap-6">
          <img src="${getProductImg(selectedProduct,0)}"
            class="w-28 h-36 object-cover rounded-2xl border">

          <div>
            <b class="text-xl">${selectedProduct.productName}</b>

            <div class="mt-5">
              <label class="font-bold">Số sao</label>
              <input id="reviewRating" type="number" min="0" max="5" value="5"
                class="block mt-2 border rounded-xl px-4 py-3 w-32">
            </div>

            <div class="mt-5">
              <label class="font-bold">Comment đánh giá</label>
              <textarea id="reviewComment"
                class="w-full mt-2 border rounded-2xl px-5 py-4 h-32"
                placeholder="Nhập cảm nhận của bạn về sản phẩm..."></textarea>
            </div>

            <button onclick="submitReview()"
              class="mt-5 bg-red-800 text-white rounded-full px-8 py-3 font-bold">
              Gửi đánh giá
            </button>
          </div>
        </div>
      </div>
    </section>
  `;
}

function submitReview(){
  const user = getUser();
  const rating = Number(document.getElementById("reviewRating").value);
  const comment = document.getElementById("reviewComment").value.trim();

  if(rating < 0 || rating > 5){
    showToast("Lỗi", "Số sao phải từ 0 đến 5", "error");
    return;
  }

  if(!comment){
    showToast("Lỗi", "Vui lòng nhập comment đánh giá", "error");
    return;
  }

  const params = new URLSearchParams(location.search);
  const orderItemId = params.get("orderItemId");

  fetch(`${API_BASE}/reviews`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      userId: user.userId,
      orderItemId: Number(orderItemId),
      rating: rating,
      comment: comment,
      imageUrl: null
    })
  })
  .then(async res => {
    if(!res.ok){
      showToast("Lỗi", await res.text(), "error");
      return;
    }

    showToast("Thành công", "Đã gửi đánh giá sản phẩm");

    setTimeout(()=>{
      location.href = `/detail?productId=${selectedProduct.productId}`;
    },1000);
  })
  .catch(() => {
    showToast("Lỗi", "Không kết nối được backend", "error");
  });
}

loadDetailPage();