function authPage(){
  const user = JSON.parse(localStorage.getItem("ha_user") || "null");

  if(user){
    return header()+`
      <main class="wrap py-20 min-h-[60vh] flex items-center justify-center">
        <div class="soft-card p-8 max-w-xl w-full text-center">
          <h1 class="serif text-4xl">Xin chào, ${user.fullname || user.email}</h1>
          <p class="mt-4 text-neutral-600">Email: ${user.email}</p>
          <p class="mt-2 text-neutral-600">Vai trò: ${user.role}</p>
          <button onclick="logout()" class="mt-7 bg-black text-white rounded-full px-8 py-3 font-bold">
            Đăng xuất
          </button>
        </div>
      </main>
    `+footer();
  }

  const isLogin = authMode === "login";

  return header()+`<main class="wrap py-12 lg:py-16">
    <div class="grid lg:grid-cols-[1fr_540px] gap-10 items-center">
      <section class="pr-4">
        <p class="text-red-800 tracking-[.18em] uppercase font-bold text-base mb-5">JODOK ACCOUNT</p>
        <h1 class="serif text-5xl lg:text-6xl leading-tight mb-5">${isLogin ? "Chào mừng bạn quay lại" : "Tạo tài khoản mua hàng"}</h1>
        <p class="text-neutral-700 text-lg lg:text-xl max-w-2xl">Quản lý đơn hàng, lưu sản phẩm yêu thích và nhận voucher cá nhân.</p>
      </section>

      <section class="soft-card p-7 lg:p-8">
        <h2 class="serif text-4xl text-center mb-7">${isLogin ? "Đăng nhập" : "Đăng ký"}</h2>

        ${isLogin ? `
          <div class="space-y-4">
            <input id="loginEmail" class="input-ui" placeholder="Email hoặc số điện thoại">
            <input id="loginPassword" type="password" class="input-ui" placeholder="Mật khẩu">
            <button onclick="login()" class="btn-primary">Đăng nhập</button>
          </div>
          <p class="text-center mt-6 text-base">Chưa có tài khoản? <button onclick="switchAuth('register')" class="text-red-800 font-bold">Đăng ký ngay</button></p>
        ` : `
          <div class="space-y-4">
            <input id="regFullname" class="input-ui" placeholder="Họ và tên">
            <input id="regEmail" class="input-ui" placeholder="Email hoặc số điện thoại">
            <input id="regPassword" type="password" class="input-ui" placeholder="Mật khẩu">
            <input id="regConfirm" type="password" class="input-ui" placeholder="Nhập lại mật khẩu">
            <button onclick="register()" class="btn-primary">Tạo tài khoản</button>
          </div>
          <p class="text-center mt-6 text-base">Đã có tài khoản? <button onclick="switchAuth('login')" class="text-red-800 font-bold">Đăng nhập</button></p>
        `}
        <p id="authMsg" class="text-center mt-4 text-red-800 font-semibold text-sm"></p>
      </section>
    </div>
  </main>`+footer();
}

function loadAuthPage(){
  renderApp(authPage());
}

function switchAuth(type){
  authMode = type;
  renderApp(authPage());
}

async function login(){
  const body = {
    email: document.getElementById('loginEmail').value,
    password: document.getElementById('loginPassword').value
  };

  const res = await fetch(`${API_BASE}/auth/login`, {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify(body)
  });

  const data = await res.json();

  if(!res.ok){
    document.getElementById('authMsg').innerText = data.message || 'Đăng nhập thất bại';
    return;
  }

  if(data.role !== "USER"){
    document.getElementById('authMsg').innerText =
      "Tài khoản Admin/Staff không được đăng nhập ở trang Shop";
    return;
  }

  localStorage.setItem('ha_user', JSON.stringify(data));
  location.href = "/auth";
}

async function register(){
  const password = document.getElementById('regPassword').value;
  const confirm = document.getElementById('regConfirm').value;

  if(password !== confirm){
    document.getElementById('authMsg').innerText = "Mật khẩu nhập lại không khớp";
    return;
  }

  const body = {
    fullname: document.getElementById('regFullname').value,
    email: document.getElementById('regEmail').value,
    phone: "",
    password: password,
    role: "USER",
    address: "",
    status: "ACTIVE"
  };

  const res = await fetch(`${API_BASE}/auth/register`, {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify(body)
  });

  const data = await res.json();

  if(!res.ok){
    document.getElementById('authMsg').innerText = data.message || 'Đăng ký thất bại';
    return;
  }

  showToast(
    "Đăng ký thành công",
    "Vui lòng đăng nhập để tiếp tục",
    "success"
  );

  authMode = "login";
  renderApp(authPage());
}

function logout(){
  localStorage.removeItem('ha_user');
  location.href = "/auth";
}

loadAuthPage();