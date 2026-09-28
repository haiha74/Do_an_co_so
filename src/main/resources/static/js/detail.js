let productFeedbacks = [];
let showReviewForm = false;
let reviewImageFile = null;
let reviewImagePreviewUrl = null;

function productDetailImages(p){
  const imgs = [...(p.images || [])]
    .sort((a,b) => Number(a.imageId || 0) - Number(b.imageId || 0))
    .map(img => img.imageUrl)
    .filter(Boolean);

  const main = imgs[0] || getProductImg(p,0);
  const second = imgs[1] || main;
  const third = imgs[2] || second;

  return `
    <img class="col-span-2 h-[560px] w-full object-cover rounded-3xl" src="${main}">
    <img class="h-56 w-full object-cover rounded-3xl" src="${second}">
    <img class="h-56 w-full object-cover rounded-3xl" src="${third}">
  `;
}

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
      ${productDetailImages(p)}
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
            "Content-Type":"application/json",
            "Authorization":"Bearer " + user.token
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

              ${f.imageUrl ? `
                <div class="mt-4">
                  <img
                    src="${f.imageUrl}"
                    alt="Ảnh đánh giá"
                    onclick="window.open('${f.imageUrl}', '_blank')"
                    class="
                      w-28 h-28
                      object-cover
                      rounded-2xl
                      border
                      cursor-pointer
                      hover:opacity-90
                      transition
                    "
                  >
                </div>
              ` : ""}

              <p class="text-sm text-neutral-500 mt-2">
                Phân loại:
                Size ${f.orderItem?.variant?.size || "-"}
                ·
                Màu ${f.orderItem?.variant?.color || "-"}
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

        <h2 class="serif text-4xl mb-6">
          Đánh giá sản phẩm
        </h2>

        <div class="grid md:grid-cols-[120px_1fr] gap-6">

          <img
            src="${getProductImg(selectedProduct,0)}"
            class="w-28 h-36 object-cover rounded-2xl border"
          >

          <div>

            <b class="text-xl">
              ${selectedProduct.productName}
            </b>

            <div class="mt-5">
              <label class="font-bold">
                Số sao
              </label>

              <input
                id="reviewRating"
                type="number"
                min="1"
                max="5"
                value="5"
                class="block mt-2 border rounded-xl px-4 py-3 w-32"
              >
            </div>

            <div class="mt-5">
              <label class="font-bold">
                Comment đánh giá
              </label>

              <textarea
                id="reviewComment"
                class="w-full mt-2 border rounded-2xl px-5 py-4 h-32"
                placeholder="Nhập cảm nhận của bạn về sản phẩm..."
              ></textarea>
            </div>

            <div class="mt-5">

              <label class="font-bold">
                Hình ảnh sản phẩm
              </label>

              <p class="text-sm text-neutral-500 mt-1">
                Không bắt buộc · JPG, PNG, WEBP · tối đa 5MB
              </p>

              <input
                id="reviewImage"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onchange="selectReviewImage(event)"
                class="hidden"
              >

              <label
                for="reviewImage"
                class="
                  mt-3
                  border-2 border-dashed
                  rounded-2xl
                  p-6
                  flex flex-col
                  items-center
                  justify-center
                  cursor-pointer
                  hover:border-red-800
                  transition
                "
              >
                ${icon("image-plus", "w-8 h-8")}

                <span class="mt-2 font-semibold">
                  Thêm hình ảnh
                </span>

                <span class="text-sm text-neutral-500">
                  Chọn ảnh thực tế của sản phẩm
                </span>
              </label>

              <div
                id="reviewImagePreview"
                class="mt-4">
              </div>

            </div>

            <button
              id="submitReviewBtn"
              onclick="submitReview()"
              class="mt-5 bg-red-800 text-white rounded-full px-8 py-3 font-bold"
            >
              Gửi đánh giá
            </button>

          </div>
        </div>
      </div>
    </section>
  `;
}

function selectReviewImage(event){

  const file = event.target.files?.[0];

  if(!file){
    reviewImageFile = null;
    return;
  }

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp"
  ];

  if(!allowedTypes.includes(file.type)){
    showToast(
      "Ảnh không hợp lệ",
      "Chỉ chấp nhận JPG, PNG hoặc WEBP",
      "error"
    );

    event.target.value = "";
    reviewImageFile = null;
    return;
  }

  if(file.size > 5 * 1024 * 1024){
    showToast(
      "Ảnh quá lớn",
      "Ảnh không được vượt quá 5MB",
      "error"
    );

    event.target.value = "";
    reviewImageFile = null;
    return;
  }

  reviewImageFile = file;

  if(reviewImagePreviewUrl){
    URL.revokeObjectURL(reviewImagePreviewUrl);
  }

  reviewImagePreviewUrl =
    URL.createObjectURL(file);

  const preview =
    document.getElementById("reviewImagePreview");

  preview.innerHTML = `
    <div class="relative w-32">

      <img
        src="${reviewImagePreviewUrl}"
        class="
          w-32 h-32
          object-cover
          rounded-2xl
          border
        "
      >

      <button
        type="button"
        onclick="removeReviewImage()"
        class="
          absolute
          -top-2 -right-2
          w-7 h-7
          rounded-full
          bg-black text-white
          font-bold
          flex items-center justify-center
        "
      >
        ×
      </button>

    </div>
  `;

  if(window.lucide){
    lucide.createIcons();
  }
}

function removeReviewImage(){

  reviewImageFile = null;

  if(reviewImagePreviewUrl){
    URL.revokeObjectURL(reviewImagePreviewUrl);
    reviewImagePreviewUrl = null;
  }

  const input =
    document.getElementById("reviewImage");

  if(input){
    input.value = "";
  }

  const preview =
    document.getElementById("reviewImagePreview");

  if(preview){
    preview.innerHTML = "";
  }
}

async function submitReview(){

  const user = getUser();

  if(!user?.token){
    showToast(
      "Chưa đăng nhập",
      "Vui lòng đăng nhập để đánh giá",
      "error"
    );
    return;
  }

  const rating =
    Number(
      document.getElementById("reviewRating").value
    );

  const comment =
    document
      .getElementById("reviewComment")
      .value
      .trim();

  if(rating < 1 || rating > 5){
    showToast(
      "Lỗi",
      "Số sao phải từ 1 đến 5",
      "error"
    );
    return;
  }

  if(!comment){
    showToast(
      "Lỗi",
      "Vui lòng nhập comment đánh giá",
      "error"
    );
    return;
  }

  const params =
    new URLSearchParams(location.search);

  const orderItemId =
    params.get("orderItemId");

  if(!orderItemId){
    showToast(
      "Lỗi",
      "Không xác định được sản phẩm trong đơn hàng",
      "error"
    );
    return;
  }

  const button =
    document.getElementById("submitReviewBtn");

  try{

    if(button){
      button.disabled = true;
      button.innerText = "Đang gửi...";
      button.classList.add("opacity-60");
    }

    // 1. Upload ảnh trước nếu khách có chọn ảnh
    const imageUrl =
      await uploadReviewImage();

    // 2. Sau đó mới tạo review
    const res = await fetch(
      `${API_BASE}/reviews`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Authorization":
            "Bearer " + user.token
        },

        body: JSON.stringify({
          orderItemId: Number(orderItemId),
          rating: rating,
          comment: comment,
          imageUrl: imageUrl
        })
      }
    );

    if(!res.ok){

      let message =
        "Không thể gửi đánh giá";

      try{
        const data = await res.json();
        message =
          data.message ||
          data.error ||
          message;
      }catch(e){

        try{
          message = await res.text();
        }catch(ignore){}
      }

      throw new Error(message);
    }

    showToast(
      "Thành công",
      "Đã gửi đánh giá sản phẩm"
    );

    setTimeout(()=>{
      location.href =
        `/detail?productId=${selectedProduct.productId}`;
    },1000);

  }catch(err){

    console.error(err);

    showToast(
      "Lỗi",
      err.message || "Không thể gửi đánh giá",
      "error"
    );

  }finally{

    if(button){
      button.disabled = false;
      button.innerText = "Gửi đánh giá";
      button.classList.remove("opacity-60");
    }
  }
}

async function uploadReviewImage(){

  if(!reviewImageFile){
    return null;
  }

  const user = getUser();

  if(!user?.token){
    throw new Error("Bạn chưa đăng nhập");
  }

  const formData = new FormData();
  formData.append("file", reviewImageFile);

  const res = await fetch(
    `${API_BASE}/upload/image`,
    {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + user.token
      },
      body: formData
    }
  );

  const text = await res.text();

  console.log("UPLOAD STATUS:", res.status);
  console.log("UPLOAD RESPONSE:", text);

  if(!res.ok){
    let message = "Upload ảnh thất bại";

    if(text){
      try{
        const data = JSON.parse(text);
        message = data.message || data.error || message;
      }catch(e){
        message = text;
      }
    }

    throw new Error(message);
  }

  if(!text){
    throw new Error("Backend upload ảnh không trả dữ liệu");
  }

  let data;

  try{
    data = JSON.parse(text);
  }catch(e){
    console.error("Upload response không phải JSON:", text);
    throw new Error("Dữ liệu trả về từ upload ảnh không hợp lệ");
  }

  if(!data.imageUrl){
    throw new Error("Backend không trả về imageUrl");
  }

  return data.imageUrl;
}

loadDetailPage();