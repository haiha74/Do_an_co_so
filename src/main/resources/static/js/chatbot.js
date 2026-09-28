(function () {
  const API = "http://localhost:8080/api";

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
    }

    #jodok-chat-panel {
      position: fixed;
      right: 22px;
      bottom: 82px;
      z-index: 9999;
      width: min(380px, calc(100vw - 24px));
      height: min(560px, calc(100vh - 110px));
      background: white;
      border: 1px solid #e5e5e5;
      border-radius: 18px;
      box-shadow: 0 12px 40px #0003;
      display: none;
      flex-direction: column;
      overflow: hidden;
      font-family: Arial, sans-serif;
    }

    #jodok-chat-panel.open {
      display: flex;
    }

    .jodok-chat-header {
      padding: 16px;
      background: #991b1b;
      color: white;
      font-weight: 700;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .jodok-chat-header button {
      border: 0;
      background: transparent;
      color: white;
      font-size: 22px;
      cursor: pointer;
    }

    #jodok-chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 14px;
      background: #fafafa;
    }

    .jodok-chat-message {
      max-width: 90%;
      margin-bottom: 12px;
      padding: 10px 12px;
      border-radius: 12px;
      line-height: 1.5;
      font-size: 14px;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }

    .jodok-chat-message.user {
      margin-left: auto;
      background: #991b1b;
      color: white;
    }

    .jodok-chat-message.bot {
      background: #f0f0f0;
      color: #222;
    }

    .jodok-chat-product {
      display: flex;
      gap: 10px;
      padding: 10px;
      margin-bottom: 10px;
      border: 1px solid #e5e5e5;
      border-radius: 12px;
      background: white;
      cursor: pointer;
    }

    .jodok-chat-product img {
      width: 64px;
      height: 82px;
      object-fit: cover;
      border-radius: 8px;
    }

    .jodok-chat-product-info {
      flex: 1;
      min-width: 0;
      font-size: 13px;
      line-height: 1.5;
    }

    .jodok-chat-product-info strong {
      display: block;
      color: #991b1b;
    }

    #jodok-chat-form {
      display: flex;
      gap: 8px;
      padding: 12px;
      border-top: 1px solid #eee;
    }

    #jodok-chat-input {
      flex: 1;
      min-width: 0;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 9px;
      outline: none;
    }

    #jodok-chat-send {
      border: 0;
      border-radius: 9px;
      padding: 0 14px;
      background: #991b1b;
      color: white;
      cursor: pointer;
    }

    #jodok-chat-send:disabled {
      opacity: .5;
      cursor: not-allowed;
    }
  `;

  document.head.appendChild(style);

  const toggle = document.createElement("button");
  toggle.id = "jodok-chat-toggle";
  toggle.textContent = "💬 Chat với JODOK";

  const panel = document.createElement("section");
  panel.id = "jodok-chat-panel";
  panel.innerHTML = `
    <div class="jodok-chat-header">
      <span>Trợ lý mua sắm JODOK</span>
      <button type="button" id="jodok-chat-close" aria-label="Đóng">×</button>
    </div>

    <div id="jodok-chat-messages"></div>

    <form id="jodok-chat-form">
      <input
        id="jodok-chat-input"
        maxlength="500"
        placeholder="Bạn muốn tìm sản phẩm gì?"
        autocomplete="off"
      />
      <button id="jodok-chat-send" type="submit">Gửi</button>
    </form>
  `;

  document.body.append(toggle, panel);

  const messages = panel.querySelector("#jodok-chat-messages");
  const form = panel.querySelector("#jodok-chat-form");
  const input = panel.querySelector("#jodok-chat-input");
  const sendButton = panel.querySelector("#jodok-chat-send");

  toggle.addEventListener("click", () => {
    panel.classList.toggle("open");

    if (panel.classList.contains("open")) {
      input.focus();
    }
  });

  panel.querySelector("#jodok-chat-close").addEventListener("click", () => {
    panel.classList.remove("open");
  });

  function addMessage(text, role) {
    const element = document.createElement("div");
    element.className = "jodok-chat-message " + role;

    // textContent tránh đưa HTML từ câu trả lời vào trang.
    element.textContent = text;

    messages.appendChild(element);
    messages.scrollTop = messages.scrollHeight;

    return element;
  }

  addMessage(
    "Xin chào! Bạn muốn tìm sản phẩm gì? Ví dụ: áo trắng dưới 500k, size L.",
    "bot"
  );

  async function showProducts(chatProducts) {
    /*
     * Tận dụng API sản phẩm và hàm getProductImg()
     * đang có trong common.js để lấy ảnh sản phẩm.
     */
    let productMap = new Map();

    try {
      const response = await fetch(`${API}/products`);

      if (response.ok) {
        const products = await response.json();

        productMap = new Map(
          products.map(p => [Number(p.productId), p])
        );
      }
    } catch (error) {
      console.error("Không tải được ảnh sản phẩm", error);
    }

    for (const item of chatProducts) {
      const product = productMap.get(Number(item.productId));

      const card = document.createElement("div");
      card.className = "jodok-chat-product";

      const image = document.createElement("img");
      image.alt = item.productName;

      if (product && typeof getProductImg === "function") {
        image.src = getProductImg(product);
      } else {
        image.style.display = "none";
      }

      const info = document.createElement("div");
      info.className = "jodok-chat-product-info";

      const name = document.createElement("div");
      name.textContent = item.productName;

      const price = document.createElement("strong");
      price.textContent = Number(item.price).toLocaleString("vi-VN") + "đ";

      const variant = document.createElement("div");
      variant.textContent =
        `Màu: ${item.color || "—"} · Size: ${item.size || "—"}`;

      const stock = document.createElement("div");
      stock.textContent =
        Number(item.stock) > 0
          ? `Còn ${item.stock} sản phẩm`
          : "Hết hàng";

      const action = document.createElement("div");
      action.textContent = "Bấm để xem chi tiết →";
      action.style.color = "#991b1b";

      info.append(name, price, variant, stock, action);
      card.append(image, info);

      card.addEventListener("click", () => {
        window.location.href =
          `/detail?productId=${encodeURIComponent(item.productId)}`;
      });

      messages.appendChild(card);
    }

    messages.scrollTop = messages.scrollHeight;
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();

    const message = input.value.trim();
    if (!message || sendButton.disabled) return;

    addMessage(message, "user");
    input.value = "";

    sendButton.disabled = true;
    const loading = addMessage("Đang tìm sản phẩm cho bạn...", "bot");

    try {
      const response = await fetch(`${API}/chatbot/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      loading.textContent =
        data.reply || "Mình chưa tìm được kết quả phù hợp.";

      if (Array.isArray(data.products) && data.products.length > 0) {
        await showProducts(data.products);
      }

    } catch (error) {
      console.error("Chatbot error:", error);
      loading.textContent =
        "Chatbot đang gặp lỗi kết nối. Bạn vui lòng thử lại sau.";
    } finally {
      sendButton.disabled = false;
      input.focus();
    }
  });
})();