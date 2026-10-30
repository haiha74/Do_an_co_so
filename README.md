# JODOK - Website bán hàng thời trang

**Đồ án liên ngành CNTT - Nhóm 05**

## 1. Giới thiệu đề tài

JODOK là website bán hàng thời trang do nhóm xây dựng trong quá trình thực hiện đồ án liên ngành. Nhóm chọn đề tài này để vận dụng kiến thức về lập trình web, cơ sở dữ liệu và phân tích thiết kế hệ thống vào một sản phẩm thực tế.

Website có hai phần chính: trang mua sắm dành cho khách hàng và trang quản trị dành cho người quản lý. Khách hàng có thể tìm kiếm sản phẩm, chọn biến thể, đặt hàng và theo dõi đơn hàng. Quản trị viên có thể quản lý sản phẩm, đơn hàng, khuyến mãi và xem báo cáo thống kê.

Dự án phục vụ mục đích học tập và nghiên cứu.

## 2. Thành viên thực hiện

| STT | Họ và tên | Mã sinh viên |
| --- | --- | --- |
| 1 | Nguyễn Hải Hà | 23010469 |
| 2 | Vũ Thị Hải Yến | 23010421 |

## 3. Công nghệ sử dụng

| Thành phần | Công nghệ |
| --- | --- |
| Backend | Java 17, Spring Boot 3.5.x |
| Frontend | HTML, CSS, JavaScript, Thymeleaf |
| Cơ sở dữ liệu | MySQL 8.0 |
| Làm việc với dữ liệu | Spring Data JPA, Hibernate |
| Bảo mật | Spring Security, JWT |
| Quản lý thư viện | Maven |
| Công cụ phát triển | Git, GitHub, IntelliJ IDEA / VS Code |
| Kiểm thử chức năng | Kiểm thử hộp đen thủ công, quản lý các ca kiểm thử bằng Excel |


## 4. Chức năng chính

### 4.1. Khách hàng

- Đăng ký, đăng nhập và cập nhật thông tin tài khoản.
- Xem, tìm kiếm và lọc sản phẩm.
- Xem chi tiết sản phẩm, chọn màu sắc và kích cỡ.
- Thêm sản phẩm vào giỏ hàng, thay đổi số lượng và xóa khỏi giỏ hàng.
- Đặt hàng và theo dõi trạng thái đơn hàng.
- Xem khuyến mãi, sử dụng mã giảm giá theo điều kiện áp dụng.
- Xem và đánh giá sản phẩm.
- Nhận gợi ý sản phẩm và sử dụng chatbot hỗ trợ mua sắm.

### 4.2. Quản trị viên

- Xem trang tổng quan của cửa hàng.
- Quản lý sản phẩm, hình ảnh, danh mục, thương hiệu và biến thể sản phẩm.
- Xem, xử lý và cập nhật trạng thái đơn hàng.
- Quản lý khuyến mãi và mã giảm giá.
- Quản lý đánh giá của khách hàng.
- Xem thống kê doanh thu, sản phẩm bán chạy, khách hàng và xuất báo cáo Excel.

*Một số chức năng có tích hợp dịch vụ bên ngoài cần được cấu hình API phù hợp để sử dụng.*

## 5. Cấu trúc thư mục

```text
Do_an_co_so/
├── .mvn/                       # Maven Wrapper
├── src/
│   ├── main/
│   │   ├── java/               # Mã nguồn Java
│   │   └── resources/          # Giao diện, file tĩnh và cấu hình
│   └── test/                   # Thư mục dành cho mã kiểm thử (nếu có)
├── uploads/                    # Thư mục ảnh/tệp tải lên của dự án
├── docs/                       # Tài liệu của nhóm
│   ├── meeting-minutes/        # Biên bản các buổi họp 
│   ├── reports/                # Báo cáo đồ án 
│   └── testcases/              # Danh sách ca kiểm thử 
├── pom.xml                     # Cấu hình Maven
├── mvnw                        # Chạy Maven trên Linux/macOS
├── mvnw.cmd                    # Chạy Maven trên Windows
└── README.md                   # Giới thiệu và hướng dẫn dự án
```

Các tài liệu của nhóm được đặt trong thư mục [`docs`](docs/):

| Loại tài liệu | Thư mục lưu trữ | Nội dung |
| --- | --- | --- |
| Biên bản họp (Meeting Minutes) | [`docs/meeting-minutes/`](docs/meeting-minutes/) | Nội dung họp, các công việc được phân chia và tiến độ của nhóm |
| Báo cáo (Report) | [`docs/reports/`](docs/reports/) | Báo cáo đồ án |
| Ca kiểm thử (Test Cases) | [`docs/testcases/`](docs/testcases/) | File Excel mô tả testcase và kết quả kiểm thử thủ công |

## 6. Hướng dẫn cài đặt và chạy

### Bước 1: Chuẩn bị

- Cài đặt JDK 17, MySQL 8.0 và Git.
- Sử dụng IntelliJ IDEA hoặc VS Code để mở dự án.
- Dự án có Maven Wrapper nên không bắt buộc phải cài Maven riêng.

### Bước 2: Tải mã nguồn

```bash
git clone https://github.com/haiha74/Do_an_co_so.git
cd Do_an_co_so
```

### Bước 3: Cấu hình cơ sở dữ liệu

Tạo hoặc chuẩn bị cơ sở dữ liệu MySQL, sau đó kiểm tra cấu hình trong `src/main/resources/application.properties` theo môi trường đang chạy. Ví dụ về thông tin kết nối:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/ten_database?createDatabaseIfNotExist=true
spring.datasource.username=root
spring.datasource.password=MAT_KHAU_CUA_BAN
```

### Bước 4: Chạy dự án

Trên Windows (PowerShell):

```powershell
.\mvnw.cmd spring-boot:run
```

Trên Linux/macOS:

```bash
./mvnw spring-boot:run
```

Khi chương trình chạy thành công và sử dụng cổng mặc định `8080`, truy cập:

- Trang khách hàng: http://localhost:8080/
- Trang quản trị: http://localhost:8080/admin
- - Trang quản trị: http://localhost:8080/staff

## 7. Kiểm thử chức năng

Nhóm sử dụng **phương pháp kiểm thử hộp đen (Black-box Testing)** và thực hiện **kiểm thử thủ công** trên giao diện website. Khi kiểm thử, nhóm dựa vào dữ liệu đầu vào và kết quả mong đợi để kiểm tra xem chức năng có hoạt động đúng hay không, không dựa vào mã nguồn bên trong.

Các chức năng được đưa vào danh sách kiểm thử gồm đăng ký, đăng nhập, tìm kiếm sản phẩm, giỏ hàng, đặt hàng và một số chức năng quản trị như quản lý sản phẩm, biến thể, danh mục và đơn hàng.

Nhóm lập danh sách testcase bằng **Microsoft Excel (`.xlsx`)**. Mỗi testcase có thể ghi mã kiểm thử, chức năng, mục đích kiểm tra, dữ liệu đầu vào, các bước thực hiện, kết quả mong đợi, kết quả thực tế và trạng thái đạt/không đạt (Pass/Fail). Khi thực hiện, nhóm ghi lại kết quả và chỉnh sửa những lỗi phát hiện được.

**File Excel testcase và kết quả kiểm thử được lưu tại:** [`docs/testcases/`](docs/testcases/).

Các testcase được thực hiện thủ công; file Excel là tài liệu theo dõi kiểm thử, không phải mã kiểm thử tự động.

## 8. Tài liệu quá trình thực hiện

Ngoài mã nguồn, nhóm lưu các tài liệu liên quan đến quá trình làm đồ án trong thư mục [`docs`](docs/), gồm:

- **Meeting Minutes:** biên bản họp, trao đổi nội dung và phân chia công việc.
- **Report:** tài liệu báo cáo các giai đoạn thực hiện và báo cáo đồ án.
- **Test Cases:** bảng Excel ghi các trường hợp kiểm thử, các bước thực hiện và kết quả.

