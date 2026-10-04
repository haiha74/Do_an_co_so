// Refactored from legacy /js/admin.js. Business logic preserved.
// Loaded as a compatibility classic script by admin/admin.js so existing inline handlers keep working.

function categoryPanel() {

  // ==========================================
  // SEARCH
  // ==========================================
  const keyword = String(
    adminSearch.categories || ""
  )
    .trim()
    .toLowerCase();


  // ==========================================
  // STATUS FILTER
  // ==========================================
  const selectedStatus = String(
    adminSearch.categoryStatus || "ALL"
  )
    .trim()
    .toUpperCase();


  // ==========================================
  // SORT FILTER
  // ==========================================
  const selectedSort = String(
    adminSearch.categorySort || "newest"
  );


  // ==========================================
  // FILTER
  // ==========================================
  let list = categories.filter(c => {

    const name = String(
      c.categoryName || ""
    )
      .trim()
      .toLowerCase();


    const description = String(
      c.description || ""
    )
      .trim()
      .toLowerCase();


    const status = String(
      c.status || ""
    )
      .trim()
      .toUpperCase();


    // SEARCH
    const matchKeyword =
      keyword === "" ||
      name.includes(keyword) ||
      description.includes(keyword);


    // STATUS
    let matchStatus = true;

    if (selectedStatus === "ACTIVE") {
      matchStatus = status === "ACTIVE";
    }

    if (selectedStatus === "HIDDEN") {
      matchStatus = status !== "ACTIVE";
    }


    return matchKeyword && matchStatus;
  });


  // ==========================================
  // SORT MỚI NHẤT / CŨ NHẤT
  // ==========================================
  list = [...list].sort((a, b) => {

    /*
      Nếu API có createdAt -> dùng createdAt.

      Nếu category không có createdAt
      -> dùng categoryId.

      categoryId lớn hơn = tạo sau.
    */

    const getSortValue = category => {

      if (category.createdAt) {

        const time =
          new Date(category.createdAt).getTime();

        if (!Number.isNaN(time)) {
          return time;
        }
      }

      return Number(
        category.categoryId || 0
      );
    };


    const aValue = getSortValue(a);
    const bValue = getSortValue(b);


    if (selectedSort === "oldest") {
      return aValue - bValue;
    }

    return bValue - aValue;
  });


  // ==========================================
  // PRODUCT COUNT
  // ==========================================
  const productCountMap = new Map();

  products.forEach(p => {

    const categoryId = Number(
      p?.category?.categoryId ??
      p?.categoryId ??
      0
    );

    if (!categoryId) return;

    productCountMap.set(
      categoryId,
      (productCountMap.get(categoryId) || 0) + 1
    );
  });


  // ==========================================
  // HTML
  // ==========================================
  return `
    <div class="soft-card overflow-hidden">


      <!-- ================= TOOLBAR ================= -->

      <div class="p-5 border-b border-neutral-200">

        <div class="flex items-center gap-3">


          <!-- SEARCH -->
          <div class="relative flex-1">

            <span
              class="
                absolute
                left-4
                top-1/2
                -translate-y-1/2
                text-neutral-400
                pointer-events-none
              "
            >
              ${icon("search", "w-5 h-5")}
            </span>


            <input
              id="categorySearchInput"

              type="text"

              value="${adminSearch.categories || ""}"

              placeholder="Tìm kiếm danh mục..."

              oninput="
                adminSearch.categories =
                  this.value.toLowerCase();

                render();
              "

              class="
                w-full
                h-11
                border
                border-neutral-200
                rounded-lg
                pl-11
                pr-4
                text-sm
                outline-none
                bg-white
                focus:border-red-800
                focus:ring-1
                focus:ring-red-800
              "
            >

          </div>


          <!-- ================= STATUS ================= -->

          <select
            id="categoryStatusFilter"

            onchange="
              adminSearch.categoryStatus =
                this.value;

              render();
            "

            class="
              h-11
              min-w-[190px]
              border
              border-neutral-200
              rounded-lg
              px-2
              bg-white
              text-sm
              text-neutral-700
              outline-none
              cursor-pointer
              focus:border-red-800
              focus:ring-1
              focus:ring-red-800
            "
          >

            <option
              value="ALL"
              ${selectedStatus === "ALL"
                ? "selected"
                : ""}
            >
              Tất cả trạng thái
            </option>


            <option
              value="ACTIVE"
              ${selectedStatus === "ACTIVE"
                ? "selected"
                : ""}
            >
              Đang hiển thị
            </option>


            <option
              value="HIDDEN"
              ${selectedStatus === "HIDDEN"
                ? "selected"
                : ""}
            >
              Đã ẩn
            </option>

          </select>


          <!-- ================= SORT ================= -->

          <select
            id="categorySortFilter"

            onchange="
              adminSearch.categorySort =
                this.value;

              render();
            "

            class="
              h-11
              min-w-[155px]
              border
              border-neutral-200
              rounded-lg
              px-2
              bg-white
              text-sm
              text-neutral-700
              outline-none
              cursor-pointer
              focus:border-red-800
              focus:ring-1
              focus:ring-red-800
            "
          >

            <option
              value="newest"
              ${selectedSort === "newest"
                ? "selected"
                : ""}
            >
              Mới nhất
            </option>


            <option
              value="oldest"
              ${selectedSort === "oldest"
                ? "selected"
                : ""}
            >
              Cũ nhất
            </option>

          </select>


          <!-- ================= ADD ================= -->

          <button
            type="button"

            onclick="openCategoryForm()"

            class="
              h-11
              inline-flex
              items-center
              justify-center
              gap-2
              bg-red-800
              hover:bg-red-900
              text-white
              font-semibold
              rounded-lg
              px-5
              whitespace-nowrap
              transition
            "
          >
            ${icon("plus", "w-4 h-4")}

            Thêm danh mục
          </button>

        </div>

      </div>


      <!-- ================= TABLE ================= -->

      <div class="overflow-x-auto">

        <table class="w-full text-left">

          <thead
            class="
              bg-neutral-50
              text-sm
              text-neutral-500
              border-b
              border-neutral-200
            "
          >

            <tr>

              <th class="px-6 py-4">
                #
              </th>

              <th class="px-6 py-4">
                Tên danh mục
              </th>

              <th class="px-6 py-4">
                Mô tả
              </th>

              <th class="px-6 py-4 text-center">
                Số sản phẩm
              </th>

              <th class="px-6 py-4">
                Trạng thái
              </th>

              <th class="px-6 py-4 text-center">
                Hành động
              </th>

            </tr>

          </thead>


          <tbody>

            ${
              list.length

                ? list.map((c, index) => {

                    const categoryId =
                      Number(c.categoryId || 0);


                    const productCount =
                      productCountMap.get(
                        categoryId
                      ) || 0;


                    /*
                     * Dùng CHÍNH status API trả về.
                     *
                     * ACTIVE = đang hiển thị.
                     * Còn lại = đã ẩn.
                     */
                    const isActive =
                      String(c.status || "")
                        .trim()
                        .toUpperCase()
                        === "ACTIVE";


                    return `
                      <tr
                        class="
                          border-b
                          border-neutral-100
                          hover:bg-neutral-50/70
                        "
                      >

                        <!-- STT -->
                        <td class="px-6 py-4 text-neutral-500">

                          ${index + 1}

                        </td>


                        <!-- CATEGORY -->
                        <td class="px-6 py-4">

                          <div
                            class="
                              flex
                              items-center
                              gap-3
                            "
                          >

                            <img
                              src="${
                                c.imageUrl ||
                                "/images/no-image.png"
                              }"

                              alt="${
                                c.categoryName ||
                                "Danh mục"
                              }"

                              onerror="
                                this.src='/images/no-image.png'
                              "

                              class="
                                w-10
                                h-10
                                rounded-lg
                                object-cover
                                border
                                border-neutral-200
                                bg-neutral-50
                              "
                            >


                            <span
                              class="
                                font-semibold
                                text-neutral-900
                              "
                            >
                              ${
                                c.categoryName ||
                                "Không có tên"
                              }
                            </span>

                          </div>

                        </td>


                        <!-- DESCRIPTION -->
                        <td
                          class="
                            px-6
                            py-4
                            text-sm
                            text-neutral-500
                          "
                        >

                          ${
                            c.description ||
                            "Không có mô tả"
                          }

                        </td>


                        <!-- PRODUCT COUNT -->
                        <td
                          class="
                            px-6
                            py-4
                            text-center
                            font-semibold
                          "
                        >

                          ${productCount}

                        </td>


                        <!-- STATUS -->
                        <td class="px-6 py-4">

                          <span
                            class="
                              inline-flex
                              items-center
                              rounded-full
                              px-3
                              py-1
                              text-xs
                              font-semibold

                              ${
                                isActive
                                  ? "bg-green-50 text-green-700"
                                  : "bg-neutral-100 text-neutral-600"
                              }
                            "
                          >

                            ${
                              isActive
                                ? "Đang hiển thị"
                                : "Đã ẩn"
                            }

                          </span>

                        </td>


                        <!-- ACTION -->
                        <td class="px-6 py-4">

                          <div
                            class="
                              flex
                              items-center
                              justify-center
                              gap-2
                            "
                          >

                            <button
                              type="button"

                              onclick="
                                openCategoryForm(
                                  ${c.categoryId}
                                )
                              "

                              title="Sửa danh mục"

                              class="
                                w-9
                                h-9
                                inline-flex
                                items-center
                                justify-center
                                border
                                border-neutral-200
                                rounded-lg
                                text-neutral-600
                                hover:border-red-800
                                hover:text-red-800
                              "
                            >
                              ${icon(
                                "pencil",
                                "w-4 h-4"
                              )}
                            </button>


                            <button
                              type="button"

                              onclick="
                                deleteCategory(
                                  ${c.categoryId}
                                )
                              "

                              title="Xóa danh mục"

                              class="
                                w-9
                                h-9
                                inline-flex
                                items-center
                                justify-center
                                border
                                border-red-100
                                rounded-lg
                                text-red-700
                                hover:bg-red-50
                              "
                            >
                              ${icon(
                                "trash-2",
                                "w-4 h-4"
                              )}
                            </button>

                          </div>

                        </td>

                      </tr>
                    `;

                  }).join("")

                : `
                  <tr>

                    <td
                      colspan="6"
                      class="
                        px-6
                        py-12
                        text-center
                        text-neutral-400
                      "
                    >

                      Không tìm thấy danh mục phù hợp

                    </td>

                  </tr>
                `
            }

          </tbody>

        </table>

      </div>


      <!-- ================= FOOTER ================= -->

      <div
        class="
          px-6
          py-4
          border-t
          border-neutral-100
          flex
          items-center
          justify-between
        "
      >

        <p class="text-sm text-neutral-500">

          Hiển thị

          <b class="text-neutral-800">
            ${list.length}
          </b>

          /

          <b class="text-neutral-800">
            ${categories.length}
          </b>

          danh mục

        </p>

      </div>

    </div>

    ${categoryModal()}
  `;
}

function categoryModal(){
  return `<div id="categoryModal" class="fixed inset-0 bg-black/40 z-[999] hidden items-center justify-center p-5">
    <div class="bg-white rounded-3xl p-7 w-full max-w-lg shadow-xl">
      <div class="flex justify-between items-center mb-5"><h2 id="categoryFormTitle" class="serif text-3xl">Thêm danh mục</h2><button onclick="closeCategoryForm()" class="text-2xl">×</button></div>
      <input type="hidden" id="categoryId">
      <div class="space-y-4">
        <input id="categoryName" class="input-ui" placeholder="Tên danh mục">
        <textarea id="categoryDesc" class="input-ui" placeholder="Mô tả"></textarea>
        <div>
          <label class="font-semibold">Ảnh danh mục</label>
          <input id="categoryImageFile" type="file" accept="image/*"
            class="mt-2 block w-full border rounded-xl p-3"
            onchange="previewCategoryImage(event)">
          <img id="previewCategoryImage"
            class="mt-4 w-32 h-32 object-cover rounded-xl border hidden">
        </div>
        <select id="categoryParent" class="input-ui"><option value="">Không có danh mục cha</option>${categories.map(c=>`<option value="${c.categoryId}">${c.categoryName}</option>`).join('')}</select>
        <select id="categoryStatus" class="input-ui"><option value="ACTIVE">ACTIVE</option><option value="INACTIVE">INACTIVE</option></select>
        <button onclick="saveCategory()" class="btn-primary w-full">Lưu danh mục</button>
      </div>
    </div>
  </div>`;
}

function openCategoryForm(id=null){
  document.getElementById('categoryModal').classList.remove('hidden');
  document.getElementById('categoryModal').classList.add('flex');
  document.getElementById('categoryFormTitle').innerText = id ? 'Sửa danh mục' : 'Thêm danh mục';
  document.getElementById('categoryId').value = id || '';

  const c = categories.find(x => x.categoryId === id);
    document.getElementById('categoryName').value = c?.categoryName || '';
    document.getElementById('categoryDesc').value = c?.description || '';
    selectedCategoryFile = null;
  document.getElementById('categoryImageFile').value = '';

  const preview = document.getElementById('previewCategoryImage');

  if(c?.imageUrl){
    preview.src = c.imageUrl;
    preview.classList.remove('hidden');
  }else{
    preview.src = '';
    preview.classList.add('hidden');
  }
  document.getElementById('categoryParent').value = c?.parent?.categoryId || '';
  document.getElementById('categoryStatus').value = c?.status || 'ACTIVE';
}

function closeCategoryForm(){
  document.getElementById('categoryModal').classList.add('hidden');
  document.getElementById('categoryModal').classList.remove('flex');
}

async function saveCategory(){
  const id = document.getElementById('categoryId').value;

  const body = {
    categoryName: document.getElementById('categoryName').value.trim(),
    description: document.getElementById('categoryDesc').value.trim(),
    parentId: document.getElementById('categoryParent').value
      ? Number(document.getElementById('categoryParent').value)
      : null,
    status: document.getElementById('categoryStatus').value
  };

  if(!body.categoryName){
    showToast("Lỗi", "Vui lòng nhập tên danh mục", "error");
    return;
  }

  const url = id ? `${API_BASE}/categories/${id}` : `${API_BASE}/categories`;
  const method = id ? 'PUT' : 'POST';

  const res = await fetch(url,{
    method,
    headers: adminJsonHeaders(),
    body:JSON.stringify(body)
  });

  if(!res.ok){
  showToast("Lỗi", await res.text(), "error");
  return;
}

const category = await res.json();

if(selectedCategoryFile){
  const formData = new FormData();
  formData.append('file', selectedCategoryFile);

  const uploadRes = await fetch(`${API_BASE}/upload/image`, {
    method: 'POST',
    headers: adminAuthHeaders(),
    body: formData
  });

  const uploadData = await uploadRes.json();

  if(!uploadRes.ok){
    showToast("Lỗi", uploadData.message || "Upload ảnh danh mục thất bại", "error");
    return;
  }

  const updateBody = {
    ...body,
    imageUrl: uploadData.imageUrl
  };

  const updateRes = await fetch(`${API_BASE}/categories/${category.categoryId}`, {
    method: 'PUT',
    headers: adminJsonHeaders(),
    body: JSON.stringify(updateBody)
  });

  if(!updateRes.ok){
    showToast("Cảnh báo", "Danh mục đã lưu nhưng lưu ảnh thất bại", "error");
    return;
  }
}

selectedCategoryFile = null;
closeCategoryForm();

showToast("Thành công", "Đã lưu danh mục");

await init();
}

function deleteCategory(id){
  showConfirm("Xóa danh mục này?", async () => {
    const res = await fetch(
      `${API_BASE}/categories/${id}`,
      {
        method:'DELETE',
        headers: adminAuthHeaders()
      }
    );

    if(!res.ok){
      showToast("Lỗi", "Không thể xóa danh mục đang có sản phẩm hoặc danh mục con", "error");
      return;
    }

    showToast("Thành công", "Đã xóa danh mục");
    await init();
  });
}
