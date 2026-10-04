(function () {
  const API = "http://localhost:8080/api";

  /*
   * =========================================================
   * CONVERSATION ID
   * =========================================================
   * Mỗi tab trình duyệt có một conversationId riêng.
   *
   * Backend dùng ID này để nhớ:
   * - Khách vừa tìm gì
   * - Những sản phẩm vừa hiển thị
   * - "mẫu thứ 2" là sản phẩm nào
   * - Câu hỏi tiếp theo đang nói về sản phẩm nào
   */
  let conversationId =
    sessionStorage.getItem("jodokConversationId");

  if (!conversationId) {
    conversationId =
      window.crypto && crypto.randomUUID
        ? crypto.randomUUID()
        : `chat-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}`;

    sessionStorage.setItem(
      "jodokConversationId",
      conversationId
    );
  }

  /*
   * =========================================================
   * CSS
   * =========================================================
   */
  const style = document.createElement("style");

  style.textContent = `
    #jodok-chat-toggle {
      position: fixed;
      right: 22px;
      bottom: 22px;
      z-index: 9998;

      border: 0;
      border-radius: 999px;

      padding: 14px 18px;

      background: #991b1b;
      color: white;

      font-weight: 700;
      cursor: pointer;

      box-shadow: 0 6px 24px #0003;

      transition:
        transform .2s ease,
        box-shadow .2s ease,
        background .2s ease;
    }

    #jodok-chat-toggle:hover {
      background: #7f1d1d;
      transform: translateY(-2px);
      box-shadow: 0 10px 30px #0004;
    }

    #jodok-chat-panel {
      position: fixed;

      right: 22px;
      bottom: 82px;

      z-index: 9999;

      width: min(
        400px,
        calc(100vw - 24px)
      );

      height: min(
        600px,
        calc(100vh - 110px)
      );

      background: white;

      border: 1px solid #e5e5e5;
      border-radius: 18px;

      box-shadow: 0 12px 40px #0003;

      display: none;
      flex-direction: column;

      overflow: hidden;

      font-family:
        Arial,
        sans-serif;
    }

    #jodok-chat-panel.open {
      display: flex;
    }

    /*
     * HEADER
     */
    .jodok-chat-header {
      padding: 15px 16px;

      background: #991b1b;
      color: white;

      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .jodok-chat-header-info {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .jodok-chat-avatar {
      width: 38px;
      height: 38px;

      border-radius: 50%;

      background: white;
      color: #991b1b;

      display: flex;
      align-items: center;
      justify-content: center;

      font-size: 19px;
    }

    .jodok-chat-title {
      font-size: 15px;
      font-weight: 700;
    }

    .jodok-chat-status {
      margin-top: 2px;

      font-size: 11px;
      font-weight: 400;

      opacity: .85;
    }

    .jodok-chat-header button {
      width: 34px;
      height: 34px;

      border: 0;
      border-radius: 50%;

      background: transparent;
      color: white;

      font-size: 23px;

      cursor: pointer;
    }

    .jodok-chat-header button:hover {
      background: #ffffff1f;
    }

    /*
     * MESSAGES
     */
    #jodok-chat-messages {
      flex: 1;

      overflow-y: auto;

      padding: 14px;

      background: #fafafa;

      scroll-behavior: smooth;
    }

    .jodok-chat-message {
      max-width: 88%;

      margin-bottom: 12px;

      padding: 10px 12px;

      border-radius: 13px;

      line-height: 1.5;
      font-size: 14px;

      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }

    .jodok-chat-message.user {
      margin-left: auto;

      background: #991b1b;
      color: white;

      border-bottom-right-radius: 4px;
    }

    .jodok-chat-message.bot {
      margin-right: auto;

      background: #f0f0f0;
      color: #222;

      border-bottom-left-radius: 4px;
    }

    /*
     * LOADING
     */
    .jodok-chat-loading {
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }

    .jodok-chat-loading-dot {
      width: 6px;
      height: 6px;

      border-radius: 50%;

      background: #777;

      animation:
        jodokChatDot 1.2s infinite;
    }

    .jodok-chat-loading-dot:nth-child(2) {
      animation-delay: .15s;
    }

    .jodok-chat-loading-dot:nth-child(3) {
      animation-delay: .3s;
    }

    @keyframes jodokChatDot {
      0%,
      60%,
      100% {
        transform: translateY(0);
        opacity: .4;
      }

      30% {
        transform: translateY(-4px);
        opacity: 1;
      }
    }

    /*
     * PRODUCT CARD
     */
    .jodok-chat-product {
      display: flex;

      gap: 11px;

      padding: 10px;

      margin-bottom: 10px;

      border: 1px solid #e5e5e5;
      border-radius: 13px;

      background: white;

      cursor: pointer;

      transition:
        transform .15s ease,
        box-shadow .15s ease,
        border-color .15s ease;
    }

    .jodok-chat-product:hover {
      transform: translateY(-1px);

      border-color: #d6b5b5;

      box-shadow: 0 5px 16px #00000010;
    }

    .jodok-chat-product-number {
      width: 22px;
      height: 22px;

      flex: 0 0 22px;

      border-radius: 50%;

      background: #991b1b;
      color: white;

      display: flex;
      align-items: center;
      justify-content: center;

      font-size: 11px;
      font-weight: 700;
    }

    .jodok-chat-product img {
      width: 66px;
      height: 84px;

      flex: 0 0 66px;

      object-fit: cover;

      border-radius: 8px;

      background: #f5f5f5;
    }

    .jodok-chat-product-info {
      flex: 1;
      min-width: 0;

      font-size: 13px;
      line-height: 1.45;
    }

    .jodok-chat-product-name {
      font-weight: 600;

      color: #222;

      overflow: hidden;

      display: -webkit-box;

      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }

    .jodok-chat-product-price {
      display: block;

      margin: 3px 0;

      color: #991b1b;

      font-size: 14px;
      font-weight: 700;
    }

    .jodok-chat-product-variant {
      color: #555;
    }

    .jodok-chat-product-stock {
      margin-top: 2px;

      color: #166534;

      font-size: 12px;
    }

    .jodok-chat-product-stock.out {
      color: #991b1b;
    }

    .jodok-chat-product-action {
      margin-top: 5px;

      color: #991b1b;

      font-size: 12px;
      font-weight: 600;
    }

    /*
     * QUICK SUGGESTIONS
     */
    .jodok-chat-suggestions {
      display: flex;
      flex-wrap: wrap;

      gap: 6px;

      margin:
        4px
        0
        13px;
    }

    .jodok-chat-suggestion {
      border: 1px solid #e0caca;
      border-radius: 999px;

      padding: 6px 9px;

      background: white;
      color: #7f1d1d;

      font-size: 11px;

      cursor: pointer;

      transition:
        background .15s ease,
        color .15s ease;
    }

    .jodok-chat-suggestion:hover {
      background: #991b1b;
      color: white;
    }

    /*
     * FORM
     */
    #jodok-chat-form {
      display: flex;
      align-items: center;

      gap: 8px;

      padding: 12px;

      border-top: 1px solid #eee;

      background: white;
    }

    #jodok-chat-input {
      flex: 1;
      min-width: 0;

      padding: 10px 11px;

      border: 1px solid #ddd;
      border-radius: 10px;

      outline: none;

      font-size: 14px;
    }

    #jodok-chat-input:focus {
      border-color: #991b1b;

      box-shadow:
        0 0 0 2px
        rgba(153, 27, 27, .08);
    }

    #jodok-chat-send {
      height: 39px;

      border: 0;
      border-radius: 10px;

      padding: 0 15px;

      background: #991b1b;
      color: white;

      font-weight: 600;

      cursor: pointer;

      transition: background .15s ease;
    }

    #jodok-chat-send:hover {
      background: #7f1d1d;
    }

    #jodok-chat-send:disabled {
      opacity: .5;
      cursor: not-allowed;
    }

    /*
     * MOBILE
     */
    @media (max-width: 520px) {
      #jodok-chat-toggle {
        right: 12px;
        bottom: 12px;
      }

      #jodok-chat-panel {
        right: 12px;
        bottom: 72px;

        width: calc(100vw - 24px);

        height: min(
          620px,
          calc(100vh - 90px)
        );
      }
    }
  `;

  document.head.appendChild(style);

  /*
   * =========================================================
   * CREATE CHAT UI
   * =========================================================
   */

  const toggle =
    document.createElement("button");

  toggle.id =
    "jodok-chat-toggle";

  toggle.type =
    "button";

  toggle.textContent =
    "💬 Chat với JODOK";

  const panel =
    document.createElement("section");

  panel.id =
    "jodok-chat-panel";

  panel.innerHTML = `
    <div class="jodok-chat-header">

      <div class="jodok-chat-header-info">

        <div class="jodok-chat-avatar">
          ✦
        </div>

        <div>
          <div class="jodok-chat-title">
            Trợ lý mua sắm JODOK
          </div>

          <div class="jodok-chat-status">
            ● Đang hoạt động
          </div>
        </div>

      </div>

      <button
        type="button"
        id="jodok-chat-close"
        aria-label="Đóng"
      >
        ×
      </button>

    </div>

    <div id="jodok-chat-messages"></div>

    <form id="jodok-chat-form">

      <input
        id="jodok-chat-input"
        maxlength="500"
        placeholder="Hỏi JODOK về sản phẩm..."
        autocomplete="off"
      />

      <button
        id="jodok-chat-send"
        type="submit"
      >
        Gửi
      </button>

    </form>
  `;

  document.body.append(
    toggle,
    panel
  );

  /*
   * =========================================================
   * ELEMENTS
   * =========================================================
   */

  const messages =
    panel.querySelector(
      "#jodok-chat-messages"
    );

  const form =
    panel.querySelector(
      "#jodok-chat-form"
    );

  const input =
    panel.querySelector(
      "#jodok-chat-input"
    );

  const sendButton =
    panel.querySelector(
      "#jodok-chat-send"
    );

  const closeButton =
    panel.querySelector(
      "#jodok-chat-close"
    );

  /*
   * =========================================================
   * OPEN / CLOSE
   * =========================================================
   */

  toggle.addEventListener(
    "click",
    () => {

      panel.classList.toggle(
        "open"
      );

      if (
        panel.classList.contains(
          "open"
        )
      ) {
        input.focus();
      }
    }
  );

  closeButton.addEventListener(
    "click",
    () => {

      panel.classList.remove(
        "open"
      );
    }
  );

  /*
   * =========================================================
   * MESSAGE
   * =========================================================
   */

  function scrollToBottom() {
    messages.scrollTop =
      messages.scrollHeight;
  }

  function addMessage(
    text,
    role
  ) {

    const element =
      document.createElement(
        "div"
      );

    element.className =
      "jodok-chat-message " +
      role;

    /*
     * Dùng textContent thay innerHTML
     * để tránh HTML/script từ câu trả lời.
     */
    element.textContent =
      text || "";

    messages.appendChild(
      element
    );

    scrollToBottom();

    return element;
  }

  /*
   * =========================================================
   * LOADING
   * =========================================================
   */

  function addLoading() {

    const wrapper =
      document.createElement(
        "div"
      );

    wrapper.className =
      "jodok-chat-message bot";

    const loading =
      document.createElement(
        "div"
      );

    loading.className =
      "jodok-chat-loading";

    loading.innerHTML = `
      <span>JODOK đang suy nghĩ</span>

      <span
        class="jodok-chat-loading-dot"
      ></span>

      <span
        class="jodok-chat-loading-dot"
      ></span>

      <span
        class="jodok-chat-loading-dot"
      ></span>
    `;

    wrapper.appendChild(
      loading
    );

    messages.appendChild(
      wrapper
    );

    scrollToBottom();

    return wrapper;
  }

  /*
   * =========================================================
   * QUICK SUGGESTIONS
   * =========================================================
   */

  function addSuggestions(
    suggestions
  ) {

    if (
      !Array.isArray(suggestions) ||
      suggestions.length === 0
    ) {
      return;
    }

    const wrapper =
      document.createElement(
        "div"
      );

    wrapper.className =
      "jodok-chat-suggestions";

    suggestions.forEach(
      suggestion => {

        const button =
          document.createElement(
            "button"
          );

        button.type =
          "button";

        button.className =
          "jodok-chat-suggestion";

        button.textContent =
          suggestion;

        button.addEventListener(
          "click",
          () => {

            input.value =
              suggestion;

            form.requestSubmit();
          }
        );

        wrapper.appendChild(
          button
        );
      }
    );

    messages.appendChild(
      wrapper
    );

    scrollToBottom();
  }

  /*
   * =========================================================
   * WELCOME MESSAGE
   * =========================================================
   */

  addMessage(
    "Xin chào! Mình là trợ lý mua sắm JODOK. Bạn cứ nói tự nhiên nhu cầu của mình nhé.",
    "bot"
  );

  addSuggestions([
    "Áo nam khoảng 200k",
    "Áo 100k",
    "Đồ nữ màu đen",
    "Shop có những thương hiệu nào?"
  ]);

  /*
   * =========================================================
   * LOAD PRODUCT DATA FOR IMAGE
   * =========================================================
   */

  let productMapCache = null;

  async function getProductMap() {

    /*
     * Không gọi /products lại
     * sau mỗi tin nhắn nếu đã tải rồi.
     */
    if (productMapCache) {
      return productMapCache;
    }

    const map =
      new Map();

    try {

      const response =
        await fetch(
          `${API}/products`
        );

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}`
        );
      }

      const products =
        await response.json();

      if (
        Array.isArray(products)
      ) {

        products.forEach(
          product => {

            map.set(
              Number(
                product.productId
              ),
              product
            );
          }
        );
      }

    } catch (error) {

      console.error(
        "Không tải được dữ liệu ảnh sản phẩm:",
        error
      );
    }

    productMapCache =
      map;

    return map;
  }

  /*
   * =========================================================
   * PRODUCT CARDS
   * =========================================================
   */

  async function showProducts(
    chatProducts
  ) {

    if (
      !Array.isArray(chatProducts) ||
      chatProducts.length === 0
    ) {
      return;
    }

    const productMap =
      await getProductMap();

    chatProducts.forEach(
      (item, index) => {

        const product =
          productMap.get(
            Number(
              item.productId
            )
          );

        const card =
          document.createElement(
            "div"
          );

        card.className =
          "jodok-chat-product";

        /*
         * Số thứ tự cực kỳ quan trọng:
         *
         * Khách nhìn thấy:
         * 1, 2, 3...
         *
         * Sau đó có thể hỏi:
         * "mẫu thứ 2 còn size L không?"
         */
        const number =
          document.createElement(
            "div"
          );

        number.className =
          "jodok-chat-product-number";

        number.textContent =
          String(index + 1);

        /*
         * IMAGE
         */
        const image =
          document.createElement(
            "img"
          );

        image.alt =
          item.productName ||
          "Sản phẩm JODOK";

        if (
          product &&
          typeof getProductImg ===
            "function"
        ) {

          try {

            const imageUrl =
              getProductImg(
                product
              );

            if (imageUrl) {
              image.src =
                imageUrl;
            } else {
              image.style.display =
                "none";
            }

          } catch (error) {

            console.error(
              "Lỗi ảnh sản phẩm:",
              error
            );

            image.style.display =
              "none";
          }

        } else {

          image.style.display =
            "none";
        }

        /*
         * INFO
         */
        const info =
          document.createElement(
            "div"
          );

        info.className =
          "jodok-chat-product-info";

        const name =
          document.createElement(
            "div"
          );

        name.className =
          "jodok-chat-product-name";

        name.textContent =
          item.productName ||
          "Sản phẩm";

        /*
         * PRICE
         */
        const price =
          document.createElement(
            "strong"
          );

        price.className =
          "jodok-chat-product-price";

        const numericPrice =
          Number(item.price);

        price.textContent =
          Number.isFinite(
            numericPrice
          )
            ? numericPrice
                .toLocaleString(
                  "vi-VN"
                ) + "đ"
            : "Liên hệ";

        /*
         * VARIANT
         */
        const variant =
          document.createElement(
            "div"
          );

        variant.className =
          "jodok-chat-product-variant";

        variant.textContent =
          `Màu: ${
            item.color || "—"
          } · Size: ${
            item.size || "—"
          }`;

        /*
         * STOCK
         */
        const stock =
          document.createElement(
            "div"
          );

        stock.className =
          "jodok-chat-product-stock";

        const stockNumber =
          Number(
            item.stock
          );

        if (
          Number.isFinite(
            stockNumber
          ) &&
          stockNumber > 0
        ) {

          stock.textContent =
            `Còn ${stockNumber} sản phẩm`;

        } else {

          stock.textContent =
            "Hết hàng";

          stock.classList.add(
            "out"
          );
        }

        /*
         * ACTION
         */
        const action =
          document.createElement(
            "div"
          );

        action.className =
          "jodok-chat-product-action";

        action.textContent =
          "Xem chi tiết →";

        /*
         * APPEND
         */
        info.append(
          name,
          price,
          variant,
          stock,
          action
        );

        card.append(
          number,
          image,
          info
        );

        /*
         * CLICK PRODUCT
         */
        card.addEventListener(
          "click",
          () => {

            if (
              item.productId ==
              null
            ) {
              return;
            }

            window.location.href =
              `/detail?productId=${encodeURIComponent(
                item.productId
              )}`;
          }
        );

        messages.appendChild(
          card
        );
      }
    );

    scrollToBottom();
  }

  /*
   * =========================================================
   * SEND MESSAGE
   * =========================================================
   */

  async function sendMessage(
    message
  ) {

    addMessage(
      message,
      "user"
    );

    sendButton.disabled =
      true;

    input.disabled =
      true;

    const loading =
      addLoading();

    try {

      /*
       * conversationId được gửi cùng message.
       *
       * Đây là phần backend dùng để
       * nhớ hội thoại.
       */
      const response =
        await fetch(
          `${API}/chatbot/message`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body:
              JSON.stringify({
                message:
                  message,

                conversationId:
                  conversationId
              })
          }
        );

      /*
       * Cố đọc message lỗi từ backend.
       */
      if (!response.ok) {

        let serverMessage =
          "";

        try {

          const errorData =
            await response.json();

          serverMessage =
            errorData.message ||
            errorData.error ||
            "";

        } catch (_) {
          // Không phải JSON.
        }

        throw new Error(
          serverMessage ||
          `HTTP ${response.status}`
        );
      }

      const data =
        await response.json();

      /*
       * Xóa loading.
       */
      loading.remove();

      /*
       * BOT REPLY
       */
      addMessage(
        data.reply ||
          "Mình chưa tìm được kết quả phù hợp.",
        "bot"
      );

      /*
       * PRODUCT CARDS
       */
      if (
        Array.isArray(
          data.products
        ) &&
        data.products.length > 0
      ) {

        await showProducts(
          data.products
        );
      }

    } catch (error) {

      console.error(
        "Chatbot error:",
        error
      );

      loading.remove();

      addMessage(
        "Chatbot đang gặp lỗi kết nối. Bạn vui lòng thử lại sau.",
        "bot"
      );

    } finally {

      sendButton.disabled =
        false;

      input.disabled =
        false;

      input.focus();
    }
  }

  /*
   * =========================================================
   * FORM SUBMIT
   * =========================================================
   */

  form.addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      if (
        sendButton.disabled
      ) {
        return;
      }

      const message =
        input.value.trim();

      if (!message) {
        return;
      }

      /*
       * Frontend cũng giới hạn 500 ký tự
       * giống ChatbotController.
       */
      if (
        message.length > 500
      ) {

        addMessage(
          "Tin nhắn không được vượt quá 500 ký tự.",
          "bot"
        );

        return;
      }

      input.value =
        "";

      await sendMessage(
        message
      );
    }
  );

  /*
   * =========================================================
   * ERROR HANDLER
   * =========================================================
   */

  window.addEventListener(
    "unhandledrejection",
    event => {

      console.error(
        "JODOK chatbot unhandled promise:",
        event.reason
      );
    }
  );
})();