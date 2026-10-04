// Refactored from legacy /js/admin.js. Business logic preserved.
// Loaded as a compatibility classic script by admin/admin.js so existing inline handlers keep working.

function changeProductFilter(type, value) {
  if (type === "category") {
    productCategoryFilter = value;
  }

  if (type === "brand") {
    productBrandFilter = value;
  }

  if (type === "status") {
    productStatusFilter = value;
  }

  productPage = 1;
  render();
}

function searchProductAdmin(input) {
  // Không render khi Unikey/IME đang ghép dấu tiếng Việt
  if (input.isComposing) return;

  clearTimeout(productSearchTimer);

  productSearchTimer = setTimeout(() => {
    adminSearch.products = input.value.trim().toLowerCase();
    productPage = 1;
    render();
  }, 350);
}

function finishProductSearch(input) {
  clearTimeout(productSearchTimer);

  adminSearch.products = input.value.trim().toLowerCase();
  productPage = 1;

  render();

  requestAnimationFrame(() => {
    const searchInput =
      document.querySelector('[data-search="products"]');

    if (searchInput) {
      searchInput.focus();

      const end = searchInput.value.length;
      searchInput.setSelectionRange(end, end);
    }
  });
}

function changeProductPage(page) {
  productPage = page;
  render();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function productPagination(totalPages) {
  if (totalPages <= 1) return "";

  let pages = [];

  if (totalPages <= 7) {
    pages = Array.from(
      { length: totalPages },
      (_, i) => i + 1
    );
  } else {
    pages = [
      1,
      2,
      3,
      "...",
      totalPages
    ];

    if (productPage > 3 && productPage < totalPages - 1) {
      pages = [
        1,
        "...",
        productPage,
        "...",
        totalPages
      ];
    }
  }

  return `
    <div class="admin-product-pagination">

      <button
        class="product-page-arrow"
        onclick="changeProductPage(${Math.max(1, productPage - 1)})"
        ${productPage === 1 ? "disabled" : ""}>
        ${icon("chevron-left", "w-4 h-4")}
      </button>

      ${pages.map(page => {
        if (page === "...") {
          return `
            <span class="product-page-dots">...</span>
          `;
        }

        return `
          <button
            onclick="changeProductPage(${page})"
            class="product-page-number
              ${productPage === page ? "active" : ""}">
            ${page}
          </button>
        `;
      }).join("")}

      <button
        class="product-page-arrow"
        onclick="changeProductPage(${Math.min(totalPages, productPage + 1)})"
        ${productPage === totalPages ? "disabled" : ""}>
        ${icon("chevron-right", "w-4 h-4")}
      </button>

    </div>
  `;
}

function productTable() {
  const keyword = (adminSearch.products || "").trim().toLowerCase();

  let filtered = products.filter(p => {
    const name = (p.productName || "").toLowerCase();
    const categoryName = (p.category?.categoryName || "").toLowerCase();
    const brandName = (p.brand?.brandName || "").toLowerCase();

    const matchKeyword =
      name.includes(keyword) ||
      categoryName.includes(keyword) ||
      brandName.includes(keyword);

    const matchCategory =
      !productCategoryFilter ||
      String(p.category?.categoryId || "") === String(productCategoryFilter);

    const matchBrand =
      !productBrandFilter ||
      String(p.brand?.brandId || "") === String(productBrandFilter);

    const matchStatus =
      !productStatusFilter ||
      p.status === productStatusFilter;

    return (
      matchKeyword &&
      matchCategory &&
      matchBrand &&
      matchStatus
    );
  });

  const totalProducts = filtered.length;

  const totalPages = Math.max(
    1,
    Math.ceil(totalProducts / productPageSize)
  );

  if (productPage > totalPages) {
    productPage = totalPages;
  }

  if (productPage < 1) {
    productPage = 1;
  }

  const start = (productPage - 1) * productPageSize;

  const list = filtered.slice(
    start,
    start + productPageSize
  );

  return `
    <div class="admin-product-page">

      <!-- ================= TOOLBAR ================= -->
      <div class="admin-product-toolbar">

        <!-- SEARCH -->
        <div class="admin-product-search">
          ${icon("search", "w-4 h-4")}

          <input
            data-search="products"
            type="search"
            value="${escapeHtml(adminSearch.products || "")}"
            oninput="searchProductAdmin(this)"
            oncompositionend="finishProductSearch(this)"
            autocomplete="off"
            spellcheck="false"
            placeholder="Tìm kiếm sản phẩm..."
          >
        </div>

        <!-- CATEGORY -->
        <select
          class="admin-product-filter"
          onchange="changeProductFilter('category', this.value)"
        >
          <option value="">Danh mục</option>

          ${categories
            .filter(c => c.parent != null)
            .map(c => `
              <option
                value="${c.categoryId}"
                ${
                  String(productCategoryFilter) === String(c.categoryId)
                    ? "selected"
                    : ""
                }
              >
                ${escapeHtml(c.categoryName)}
              </option>
            `)
            .join("")}
        </select>

        <!-- BRAND -->
        <select
          class="admin-product-filter"
          onchange="changeProductFilter('brand', this.value)"
        >
          <option value="">Thương hiệu</option>

          ${brands
          .filter(b => String(b.status || "").toUpperCase() === "ACTIVE")
          .map(b => `
            <option
              value="${b.brandId}"
              ${
                String(productBrandFilter) === String(b.brandId)
                  ? "selected"
                  : ""
              }
            >
              ${escapeHtml(b.brandName || "")}
            </option>
          `)
          .join("")}
        </select>

        <!-- STATUS -->
        <select
          class="admin-product-filter"
          onchange="changeProductFilter('status', this.value)"
        >
          <option value="">Trạng thái</option>

          <option
            value="ACTIVE"
            ${productStatusFilter === "ACTIVE" ? "selected" : ""}
          >
            Đang bán
          </option>

          <option
            value="INACTIVE"
            ${productStatusFilter === "INACTIVE" ? "selected" : ""}
          >
            Ngừng bán
          </option>
        </select>

        <!-- ADD PRODUCT -->
        <button
          type="button"
          onclick="openProductForm()"
          class="admin-add-product"
        >
          ${icon("plus", "w-4 h-4")}
          <span>Thêm sản phẩm</span>
        </button>

      </div>
      <!-- =============== END TOOLBAR =============== -->


      <!-- ================= TABLE ================= -->
      <div class="admin-product-table-wrap">

        <table class="admin-product-table">

          <thead>
            <tr>
              <th>#</th>
              <th>Ảnh</th>
              <th>Tên sản phẩm</th>
              <th>Danh mục</th>
              <th>Thương hiệu</th>
              <th>Giá</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>

          <tbody>

            ${
              list.length
                ? list.map((p, index) => {
                    const number = start + index + 1;
                    const active = p.status === "ACTIVE";

                    return `
                      <tr>

                        <td class="product-index">
                          ${number}
                        </td>

                        <td>
                          <img
                            src="${productImg(p, index)}"
                            class="admin-product-image"
                            alt="${escapeHtml(p.productName || "")}"
                            onerror="this.onerror=null;this.src='/images/no-image.png'"
                          >
                        </td>

                        <td>
                          <div class="admin-product-name">

                            <strong>
                              ${escapeHtml(p.productName || "Chưa có tên")}
                            </strong>

                            ${
                              productHasVariant(p.productId)
                                ? ""
                                : `
                                  <span class="product-no-variant">
                                    Chưa có biến thể
                                  </span>
                                `
                            }

                          </div>
                        </td>

                        <td>
                          ${escapeHtml(
                            p.category?.categoryName || "Chưa có"
                          )}
                        </td>

                        <td>
                          ${escapeHtml(getActiveBrandName(p) || "-")}
                        </td>

                        <td class="admin-product-price">
                          ${money(p.basePrice)}
                        </td>

                        <td>
                          <span class="
                            admin-product-status
                            ${active ? "active" : "inactive"}
                          ">
                            ${active ? "Đang bán" : "Ngừng bán"}
                          </span>
                        </td>

                        <td>
                          <div class="admin-product-actions">

                            <!-- EDIT -->
                            <button
                              type="button"
                              onclick="openProductForm(${p.productId})"
                              title="Chỉnh sửa"
                              class="product-action edit"
                            >
                              ${icon("pencil", "w-4 h-4")}
                            </button>

                            <!-- SHOW / HIDE -->
                            ${
                              active
                                ? `
                                  <button
                                    type="button"
                                    onclick="hideProduct(${p.productId})"
                                    title="Ẩn sản phẩm"
                                    class="product-action view"
                                  >
                                    ${icon("eye", "w-4 h-4")}
                                  </button>
                                `
                                : `
                                  <button
                                    type="button"
                                    onclick="showProduct(${p.productId})"
                                    title="Hiện sản phẩm"
                                    class="product-action view"
                                  >
                                    ${icon("eye-off", "w-4 h-4")}
                                  </button>
                                `
                            }

                            <!-- DELETE -->
                            ${
                              !productHasOrders(p.productId)
                                ? `
                                  <button
                                    type="button"
                                    onclick="deleteProduct(${p.productId})"
                                    title="Xóa sản phẩm"
                                    class="product-action delete"
                                  >
                                    ${icon("trash-2", "w-4 h-4")}
                                  </button>
                                `
                                : ""
                            }

                          </div>
                        </td>

                      </tr>
                    `;
                  }).join("")
                : `
                  <tr>
                    <td
                      colspan="8"
                      class="admin-product-empty"
                    >
                      Không tìm thấy sản phẩm
                    </td>
                  </tr>
                `
            }

          </tbody>

        </table>

      </div>
      <!-- ================= END TABLE ================= -->


      <!-- ================= FOOTER ================= -->
      <div class="admin-product-footer">

        <p>
          Hiển thị
          <b>${list.length ? start + 1 : 0}</b>
          –
          <b>${list.length ? start + list.length : 0}</b>
          / ${totalProducts} sản phẩm
        </p>

        ${productPagination(totalPages)}

      </div>
      <!-- ================ END FOOTER ================ -->

    </div>

    ${productModal()}
  `;
}

function productModal(){
  return `
    <div id="productModal" class="admin-product-modal hidden">

      <div class="admin-product-modal-box">

        <!-- HEADER -->
        <div class="admin-product-form-header">

          <div>
            <h2 id="productFormTitle">
              Thêm sản phẩm
            </h2>

            <p>
              Nhập thông tin sản phẩm trong hệ thống JODOK
            </p>
          </div>

          <button
            type="button"
            class="admin-product-modal-close"
            onclick="closeProductForm()"
          >
            ${icon("x", "w-5 h-5")}
          </button>

        </div>


        <!-- ID SẢN PHẨM - BẮT BUỘC -->
        <input
          type="hidden"
          id="productId"
        >


        <!-- BODY -->
        <div class="admin-product-form-body">


          <!-- ================= LEFT ================= -->
          <div class="admin-product-form-left">


            <!-- TÊN -->
            <div class="admin-form-group">

              <label for="productName">
                Tên sản phẩm
                <span>*</span>
              </label>

              <input
                id="productName"
                type="text"
                placeholder="Nhập tên sản phẩm"
                autocomplete="off"
              >

            </div>


            <!-- BRAND + CATEGORY -->
            <div class="admin-form-row">

              <div class="admin-form-group">

                <label for="productBrand">
                  Thương hiệu
                </label>

                <select id="productBrand">

                  <option value="">
                    Không chọn thương hiệu
                  </option>

                  ${brands.map(b => `
                    <option value="${b.brandId}">
                      ${escapeHtml(b.brandName || "")}
                    </option>
                  `).join("")}

                </select>

              </div>


              <div class="admin-form-group">

                <label for="productCategory">
                  Danh mục
                  <span>*</span>
                </label>

                <select id="productCategory">

                  <option value="">
                    Chọn danh mục
                  </option>

                  ${categories.map(c => `
                    <option value="${c.categoryId}">
                      ${escapeHtml(c.categoryName || "")}
                    </option>
                  `).join("")}

                </select>

              </div>

            </div>


            <!-- DESCRIPTION -->
            <div class="admin-form-group">

              <label for="productDesc">
                Mô tả
              </label>

              <div class="admin-description-editor">

                <div class="admin-editor-toolbar">
                  <button type="button"><b>B</b></button>
                  <button type="button"><i>I</i></button>
                  <button type="button"><u>U</u></button>
                  <span></span>
                  <button type="button">≡</button>
                  <button type="button">•</button>
                </div>

                <textarea
                  id="productDesc"
                  placeholder="Nhập mô tả sản phẩm..."
                ></textarea>

              </div>

            </div>


            <!-- IMAGE -->
            <div class="admin-form-group">

              <label>
                Hình ảnh sản phẩm
              </label>


              <!-- CLICK UPLOAD -->
              <div
                class="admin-product-upload"
                onclick="document.getElementById('productImageFile').click()"
              >

                <div class="admin-upload-icon">
                  ${icon("image-up", "w-7 h-7")}
                </div>

                <strong>
                  Kéo thả hình ảnh vào đây hoặc
                  <em>chọn file</em>
                </strong>

                <small>
                  JPG, JPEG, PNG, WEBP
                </small>

              </div>


              <!-- INPUT THẬT -->
              <input
                id="productImageFile"
                type="file"
                accept="image/*"
                multiple
                hidden
                onchange="previewImage(event)"
              >


              <!-- PREVIEW -->
              <div class="admin-product-preview-box">

                <img
                  id="previewImage"
                  class="admin-product-preview-image hidden"
                  alt="Ảnh sản phẩm"
                >

              </div>


              <p class="admin-upload-note">
                Có thể chọn tối đa 3 ảnh sản phẩm
              </p>

            </div>

          </div>


          <!-- ================= RIGHT ================= -->
          <div class="admin-product-form-right">

            <h3>
              Thông tin cơ bản
            </h3>


            <!-- PRICE -->
            <div class="admin-form-group">

              <label for="productPrice">
                Giá gốc
              </label>

              <div class="admin-price-input">

                <input
                  id="productPrice"
                  type="number"
                  min="0"
                  placeholder="150000"
                >

                <span>đ</span>

              </div>

            </div>


            <!-- STATUS -->
            <div class="admin-form-group">

              <label for="productStatus">
                Trạng thái
              </label>

              <select id="productStatus">

                <option value="ACTIVE">
                  Đang bán
                </option>

                <option value="INACTIVE">
                  Ngừng bán
                </option>

              </select>

            </div>

          </div>

        </div>


        <!-- FOOTER -->
        <div class="admin-product-form-footer">

          <button
            type="button"
            class="admin-product-cancel-btn"
            onclick="closeProductForm()"
          >
            Hủy
          </button>


          <button
            type="button"
            class="admin-product-save-btn"
            onclick="saveProduct()"
          >
            ${icon("save", "w-4 h-4")}

            <span>
              Lưu sản phẩm
            </span>
          </button>

        </div>

      </div>

    </div>
  `;
}

async function openProductForm(id = null){
  // Reset file được chọn của lần mở form trước
  selectedFiles = [];

  const modal = document.getElementById("productModal");

  if(!modal){
    console.error("Không tìm thấy #productModal");
    return;
  }

  modal.classList.remove("hidden");
  modal.classList.add("flex");

  const title = document.getElementById("productFormTitle");
  const idInput = document.getElementById("productId");
  const nameInput = document.getElementById("productName");
  const descInput = document.getElementById("productDesc");
  const priceInput = document.getElementById("productPrice");
  const categoryInput = document.getElementById("productCategory");
  const brandInput = document.getElementById("productBrand");
  const statusInput = document.getElementById("productStatus");
  const fileInput = document.getElementById("productImageFile");
  const preview = document.getElementById("previewImage");

  if(title){
    title.innerText = id ? "Sửa sản phẩm" : "Thêm sản phẩm";
  }

  if(idInput){
    idInput.value = id || "";
  }

  const p = products.find(
    x => Number(x.productId) === Number(id)
  );

  if(nameInput){
    nameInput.value = p?.productName || "";
  }

  if(descInput){
    descInput.value = p?.description || "";
  }

  if(priceInput){
    priceInput.value = p?.basePrice ?? "";
  }

  if(categoryInput){
    categoryInput.value =
      p?.category?.categoryId || "";
  }

  if(brandInput){
    brandInput.value =
      p?.brand?.brandId || "";
  }

  if(statusInput){
    statusInput.value =
      p?.status || "ACTIVE";
  }

  if(fileInput){
    fileInput.value = "";
  }

  // ============================
  // HIỂN THỊ ẢNH HIỆN TẠI
  // ============================
  if(preview){
    if(p){
      const currentImg = productImg(p, 0);

      if(
        currentImg &&
        currentImg !== "/images/no-image.png"
      ){
        preview.src = currentImg;
        preview.classList.remove("hidden");
      }else{
        preview.removeAttribute("src");
        preview.classList.add("hidden");
      }
    }else{
      preview.removeAttribute("src");
      preview.classList.add("hidden");
    }
  }
}

function closeProductForm(){
  const modal =
    document.getElementById("productModal");

  if(!modal) return;

  modal.classList.add("hidden");
  modal.classList.remove("flex");

  const fileInput =
    document.getElementById("productImageFile");

  if(fileInput){
    fileInput.value = "";
  }

  selectedFiles = [];
}

function previewImage(event){
  const input = event.target;

  const files = Array.from(
    input.files || []
  );

  if(files.length === 0){
    selectedFiles = [];

    const preview =
      document.getElementById("previewImage");

    if(preview){
      preview.removeAttribute("src");
      preview.classList.add("hidden");
    }

    return;
  }

  // Chỉ lấy file ảnh
  const imageFiles = files.filter(file =>
    file &&
    file.type &&
    file.type.startsWith("image/")
  );

  if(imageFiles.length !== files.length){
    showToast(
      "Lỗi",
      "Vui lòng chỉ chọn file hình ảnh",
      "error"
    );

    input.value = "";
    selectedFiles = [];

    return;
  }

  if(imageFiles.length > 3){
    showToast(
      "Thông báo",
      "Chỉ sử dụng 3 ảnh đầu tiên",
      "success"
    );
  }

  // QUAN TRỌNG:
  // giữ File object để saveProduct() upload sau
  selectedFiles = imageFiles.slice(0, 3);

  const preview =
    document.getElementById("previewImage");

  if(!preview || !selectedFiles.length){
    return;
  }

  /*
   * Dùng FileReader cho preview FE.
   *
   * Không dùng URL.createObjectURL + revoke ngay
   * sau khi load nữa để tránh preview biến mất.
   */
  const reader = new FileReader();

  reader.onload = function(e){
    preview.src = e.target.result;
    preview.classList.remove("hidden");
  };

  reader.onerror = function(){
    preview.removeAttribute("src");
    preview.classList.add("hidden");

    showToast(
      "Lỗi",
      "Không thể đọc file ảnh đã chọn",
      "error"
    );
  };

  reader.readAsDataURL(selectedFiles[0]);

  showToast(
    "Đã chọn ảnh",
    `Đã chọn ${selectedFiles.length} ảnh. Ảnh sẽ được tải lên khi lưu sản phẩm.`,
    "success"
  );
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

  // =====================================================
  // 1. LẤY DỮ LIỆU FORM
  // =====================================================

  const id =
    document.getElementById("productId").value;


  const body = {

    productName:
      document
        .getElementById("productName")
        .value
        .trim(),

    description:
      document
        .getElementById("productDesc")
        .value
        .trim(),

    basePrice:
      Number(
        document.getElementById("productPrice").value
      ),

    categoryId:
      Number(
        document.getElementById("productCategory").value
      ),

    brandId:
      document.getElementById("productBrand").value
        ? Number(
            document.getElementById("productBrand").value
          )
        : null,

    status:
      document.getElementById("productStatus").value
  };


  // =====================================================
  // 2. VALIDATE FE
  // =====================================================

  if(!body.productName){

    showToast(
      "Lỗi",
      "Vui lòng nhập tên sản phẩm",
      "error"
    );

    return;
  }


  if(!body.categoryId){

    showToast(
      "Lỗi",
      "Vui lòng chọn danh mục",
      "error"
    );

    return;
  }


  if(
    Number.isNaN(body.basePrice) ||
    body.basePrice < 0
  ){

    showToast(
      "Lỗi",
      "Giá sản phẩm không hợp lệ",
      "error"
    );

    return;
  }


  // =====================================================
  // 3. XÁC ĐỊNH POST / PUT
  // =====================================================

  const url = id
    ? `${API_BASE}/products/${id}`
    : `${API_BASE}/products`;


  const method = id
    ? "PUT"
    : "POST";


  // =====================================================
  // DEBUG
  // =====================================================

  console.log(
    "========== SAVE PRODUCT =========="
  );

  console.log(
    "URL:",
    url
  );

  console.log(
    "METHOD:",
    method
  );

  console.log(
    "BODY:",
    body
  );

  console.log(
    "AUTH:",
    adminAuthHeaders()
  );


  // =====================================================
  // 4. LƯU SẢN PHẨM
  // =====================================================

  let res;


  try{

    res = await fetch(
      url,
      {
        method: method,

        headers:
          adminJsonHeaders(),

        body:
          JSON.stringify(body)
      }
    );

  }catch(error){

    console.error(
      "SAVE PRODUCT FETCH ERROR:",
      error
    );


    showToast(
      "Lỗi",
      "Không thể kết nối tới server",
      "error"
    );

    return;
  }


  // =====================================================
  // 5. BACKEND TRẢ LỖI
  // =====================================================

  if(!res.ok){

    const errorText =
      await res.text();


    console.error(
      "SAVE PRODUCT FAILED:",
      {
        status:
          res.status,

        statusText:
          res.statusText,

        url:
          url,

        method:
          method,

        body:
          body,

        response:
          errorText,

        auth:
          adminAuthHeaders()
      }
    );


    let message =
      errorText;


    // Backend có thể trả JSON
    if(errorText){

      try{

        const data =
          JSON.parse(errorText);


        message =
          data.message ||
          data.error ||
          data.detail ||
          errorText;

      }catch(e){

        // Backend trả plain text
      }

    }


    // Nếu backend không trả message
    if(!message){

      if(res.status === 400){

        message =
          "Dữ liệu sản phẩm không hợp lệ (HTTP 400)";

      }else if(res.status === 401){

        message =
          "Phiên đăng nhập không hợp lệ (HTTP 401)";

      }else if(res.status === 403){

        message =
          "Backend từ chối quyền lưu sản phẩm (HTTP 403)";

      }else if(res.status === 404){

        message =
          "Không tìm thấy API lưu sản phẩm (HTTP 404)";

      }else if(res.status === 409){

        message =
          "Dữ liệu sản phẩm bị trùng hoặc xung đột (HTTP 409)";

      }else if(res.status >= 500){

        message =
          `Backend gặp lỗi khi lưu sản phẩm (HTTP ${res.status})`;

      }else{

        message =
          `Lưu sản phẩm thất bại (HTTP ${res.status})`;
      }
    }


    showToast(
      "Lỗi",
      message,
      "error"
    );


    return;
  }


  // =====================================================
  // 6. ĐỌC PRODUCT BACKEND TRẢ VỀ
  // =====================================================

  let product;


  try{

    product =
      await res.json();

  }catch(error){

    console.error(
      "SAVE PRODUCT JSON ERROR:",
      error
    );


    showToast(
      "Lỗi",
      "Backend đã lưu nhưng không trả về dữ liệu sản phẩm hợp lệ",
      "error"
    );

    return;
  }


  console.log(
    "PRODUCT SAVED:",
    product
  );


  // =====================================================
  // 7. KIỂM TRA PRODUCT ID
  // =====================================================

  if(!product?.productId){

    console.error(
      "PRODUCT RESPONSE KHÔNG CÓ productId:",
      product
    );


    showToast(
      "Lỗi",
      "Không xác định được ID sản phẩm vừa lưu",
      "error"
    );

    return;
  }


  // =====================================================
  // 8. UPLOAD ẢNH
  // =====================================================

  if(
    Array.isArray(selectedFiles) &&
    selectedFiles.length > 0
  ){

    console.log(
      "SỐ ẢNH CẦN UPLOAD:",
      selectedFiles.length
    );


    for(
      let i = 0;
      i < selectedFiles.length;
      i++
    ){

      const file =
        selectedFiles[i];


      console.log(
        `UPLOAD IMAGE ${i + 1}:`,
        file
      );


      const formData =
        new FormData();


      formData.append(
        "file",
        file
      );


      // =================================================
      // 8.1 UPLOAD FILE
      // =================================================

      let uploadRes;


      try{

        uploadRes =
          await fetch(
            `${API_BASE}/upload/image`,
            {
              method:
                "POST",

              // KHÔNG set Content-Type
              // browser tự tạo multipart boundary
              headers:
                adminAuthHeaders(),

              body:
                formData
            }
          );

      }catch(error){

        console.error(
          "UPLOAD IMAGE FETCH ERROR:",
          error
        );


        showToast(
          "Lỗi",
          "Sản phẩm đã lưu nhưng không thể kết nối server để upload ảnh",
          "error"
        );

        return;
      }


      // =================================================
      // 8.2 ĐỌC RESPONSE UPLOAD
      // =================================================

      const uploadText =
        await uploadRes.text();


      console.log(
        "UPLOAD STATUS:",
        uploadRes.status
      );


      console.log(
        "UPLOAD RESPONSE:",
        uploadText
      );


      if(!uploadRes.ok){

        let message =
          uploadText;


        if(uploadText){

          try{

            const data =
              JSON.parse(uploadText);


            message =
              data.message ||
              data.error ||
              data.detail ||
              uploadText;

          }catch(e){

          }

        }


        showToast(
          "Lỗi",
          message ||
          `Upload ảnh thất bại (HTTP ${uploadRes.status})`,
          "error"
        );


        return;
      }


      // =================================================
      // 8.3 PARSE RESPONSE UPLOAD
      // =================================================

      let uploadData;


      try{

        uploadData =
          uploadText
            ? JSON.parse(uploadText)
            : {};

      }catch(error){

        console.error(
          "UPLOAD RESPONSE KHÔNG PHẢI JSON:",
          uploadText
        );


        showToast(
          "Lỗi",
          "Server upload ảnh trả dữ liệu không hợp lệ",
          "error"
        );

        return;
      }


      // =================================================
      // 8.4 KIỂM TRA IMAGE URL
      // =================================================

      if(!uploadData?.imageUrl){

        console.error(
          "UPLOAD KHÔNG CÓ imageUrl:",
          uploadData
        );


        showToast(
          "Lỗi",
          "Upload ảnh thành công nhưng backend không trả imageUrl",
          "error"
        );

        return;
      }


      // =================================================
      // 8.5 LƯU ẢNH VÀO PRODUCT
      // =================================================

      const imageBody = {

        productId:
          product.productId,

        imageUrl:
          uploadData.imageUrl,

        isMain:
          i === 0
      };


      console.log(
        "SAVE PRODUCT IMAGE:",
        imageBody
      );


      let imageRes;


      try{

        imageRes =
          await fetch(
            `${API_BASE}/product-images`,
            {
              method:
                "POST",

              headers:
                adminJsonHeaders(),

              body:
                JSON.stringify(imageBody)
            }
          );

      }catch(error){

        console.error(
          "PRODUCT IMAGE FETCH ERROR:",
          error
        );


        showToast(
          "Lỗi",
          "Ảnh đã upload nhưng không thể liên kết ảnh với sản phẩm",
          "error"
        );

        return;
      }


      // =================================================
      // 8.6 KIỂM TRA PRODUCT IMAGE
      // =================================================

      if(!imageRes.ok){

        const imageError =
          await imageRes.text();


        console.error(
          "SAVE PRODUCT IMAGE FAILED:",
          {
            status:
              imageRes.status,

            response:
              imageError,

            body:
              imageBody
          }
        );


        let message =
          imageError;


        if(imageError){

          try{

            const data =
              JSON.parse(imageError);


            message =
              data.message ||
              data.error ||
              data.detail ||
              imageError;

          }catch(e){

          }

        }


        showToast(
          "Lỗi",
          message ||
          `Không thể lưu ảnh sản phẩm (HTTP ${imageRes.status})`,
          "error"
        );


        return;
      }


      console.log(
        `IMAGE ${i + 1} SAVED`
      );
    }
  }


  // =====================================================
  // 9. RESET FILE
  // =====================================================

  selectedFiles = [];


  // =====================================================
  // 10. ĐÓNG FORM
  // =====================================================

  closeProductForm();


  // =====================================================
  // 11. LOAD LẠI DATA
  // =====================================================

  try{

    await init();

  }catch(error){

    console.error(
      "RELOAD ADMIN DATA ERROR:",
      error
    );


    showToast(
      "Lỗi",
      "Sản phẩm đã lưu nhưng không thể tải lại dữ liệu",
      "error"
    );

    return;
  }


  // =====================================================
  // 12. KIỂM TRA BIẾN THỂ
  // GIỮ LOGIC CŨ
  // =====================================================

  const hasVariant =
    productHasVariant(
      product.productId
    );


  // =====================================================
  // 13. CHƯA CÓ BIẾN THỂ
  // =====================================================

  if(!hasVariant){

    currentTab =
      "variants";


    render();


    setTimeout(
      () => {

        openVariantForm();


        const variantProduct =
          document.getElementById(
            "variantProductId"
          );


        if(variantProduct){

          variantProduct.value =
            String(
              product.productId
            );
        }

      },
      100
    );


    showToast(
      "Cần thêm biến thể",
      "Sản phẩm cần có size, màu, SKU, tồn kho để hiển thị mua hàng ở shop",
      "error"
    );


    return;
  }


  // =====================================================
  // 14. THÀNH CÔNG
  // =====================================================

  showToast(
    "Thành công",
    "Đã lưu sản phẩm"
  );
}

function deleteProduct(id){
  showConfirm("Xóa vĩnh viễn sản phẩm này?", async () => {
    const res = await fetch(`${API_BASE}/products/${id}`, {
  method:'DELETE',
  headers: adminAuthHeaders()
});

    if(!res.ok){
      showToast("Lỗi", await res.text(), "error");
      return;
    }

    showToast("Thành công", "Đã xóa sản phẩm");
    await init();
  }, "Xóa");
}

function productHasOrders(productId){
  return orders.some(order =>
    (order.items || []).some(item =>
      item.variant?.product?.productId === productId
    )
  );
}

async function hideProduct(id){
  const p = products.find(x => x.productId === id);

  if(!p) return;

  showConfirm("Ẩn sản phẩm này?", async () => {

    const res = await fetch(`${API_BASE}/products/${id}`,{
      method:"PUT",
      headers: adminJsonHeaders(),
      body:JSON.stringify({
        productName:p.productName,
        description:p.description || "",
        basePrice:p.basePrice,
        categoryId:p.category?.categoryId,
        brandId:p.brand?.brandId || null,
        status:"INACTIVE"
      })
    });

    if(!res.ok){
      showToast("Lỗi","Không thể ẩn sản phẩm","error");
      return;
    }

    showToast("Thành công","Đã ẩn sản phẩm khỏi shop");
    await init();

  }, "Ẩn");
}

async function showProduct(id){
  const p = products.find(x => x.productId === id);

  if(!p) return;

  showConfirm("Hiện lại sản phẩm này trên shop?", async () => {

    const body = {
      productName: p.productName,
      description: p.description || "",
      basePrice: Number(p.basePrice),
      categoryId: p.category?.categoryId || null,
      brandId: p.brand?.brandId || null,
      status: "ACTIVE"
    };

    if(!body.productName || !body.categoryId){
      showToast("Lỗi", "Sản phẩm thiếu tên hoặc danh mục", "error");
      return;
    }

    const res = await fetch(`${API_BASE}/products/${id}`,{
      method:"PUT",
      headers: adminJsonHeaders(),
      body: JSON.stringify(body)
    });

    if(!res.ok){
      const text = await res.text();
      console.error("Lỗi hiện sản phẩm:", text);
      showToast("Lỗi", text || "Không thể hiện sản phẩm", "error");
      return;
    }

    showToast("Thành công","Đã hiện sản phẩm trên shop");
    await init();

    currentTab = "products";
    render();

  }, "Hiện");
}
