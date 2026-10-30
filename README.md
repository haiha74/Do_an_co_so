# JODOK - Website bán hàng thời trang

**Đồ án cơ sở - Nhóm 04**

## 1. Giới thiệu đề tài

JODOK là website bán hàng thời trang được nhóm xây dựng trong quá trình thực hiện đồ án cơ sở. Đề tài được chọn với mục đích vận dụng các kiến thức đã học về lập trình web, cơ sở dữ liệu và phân tích thiết kế hệ thống để xây dựng một website bán hàng có các chức năng cơ bản.

Website hỗ trợ khách hàng xem sản phẩm, tìm kiếm, mua hàng và theo dõi đơn hàng. Bên cạnh đó, hệ thống có trang quản trị để người quản lý cập nhật sản phẩm, xử lý đơn hàng và xem các thông tin thống kê của cửa hàng.

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
| Truy cập dữ liệu | Spring Data JPA, Hibernate |
| Bảo mật | Spring Security, JWT |
| Quản lý thư viện | Maven |
| Công cụ phát triển | Git, GitHub, IntelliJ IDEA / VS Code |
| Kiểm thử | JUnit, Apache JMeter |

Dự án được xây dựng theo **kiến trúc Monolithic**, trong đó các chức năng được phát triển và chạy trong cùng một ứng dụng Spring Boot. Mã nguồn được chia thành các lớp như Controller, Service, Repository để dễ quản lý và chỉnh sửa.

## 4. Chức năng chính

### 4.1. Chức năng của khách hàng

- Đăng ký, đăng nhập và quản lý thông tin tài khoản.
- Xem danh sách sản phẩm, tìm kiếm và lọc sản phẩm.
- Xem thông tin chi tiết, hình ảnh, màu sắc và kích cỡ của sản phẩm.
- Thêm sản phẩm vào giỏ hàng, cập nhật số lượng hoặc xóa sản phẩm.
- Đặt hàng và theo dõi trạng thái đơn hàng.
- Xem chương trình khuyến mãi và sử dụng mã giảm giá khi đủ điều kiện.
- Xem và đánh giá sản phẩm.
- Nhận gợi ý sản phẩm và sử dụng chatbot hỗ trợ mua sắm.

### 4.2. Chức năng của quản trị viên

- Xem trang tổng quan và các số liệu của cửa hàng.
- Thêm, sửa, xóa sản phẩm và quản lý hình ảnh sản phẩm.
- Quản lý danh mục, thương hiệu và biến thể sản phẩm (màu sắc, kích cỡ, giá, số lượng).
- Xem thông tin đơn hàng và cập nhật trạng thái xử lý.
- Quản lý các chương trình khuyến mãi, mã giảm giá.
- Quản lý đánh giá của khách hàng.
- Thống kê doanh thu, sản phẩm bán chạy, khách hàng và xuất báo cáo Excel.

*Một số chức năng kết nối dịch vụ ngoài, như thanh toán trực tuyến hoặc chatbot AI, cần cấu hình API để sử dụng.*

## 5. Cấu trúc dự án

```text
DGKDPM/
├── src/
│   ├── main/
│   │   ├── java/                  # Mã nguồn Java
│   │   └── resources/
│   │       ├── static/            # CSS, JavaScript, hình ảnh
│   │       ├── templates/         # Các trang giao diện
│   │       └── application.properties
│   └── test/                      # Kiểm thử
├── pom.xml                        # Cấu hình Maven
├── mvnw                           # Maven Wrapper cho Linux/macOS
├── mvnw.cmd                       # Maven Wrapper cho Windows
└── README.md
```

Trong phần backend, chương trình được chia thành các thành phần chính:

- **Controller:** nhận yêu cầu từ giao diện và trả về kết quả.
- **Service:** xử lý các chức năng và nghiệp vụ của hệ thống.
- **Repository:** thực hiện truy vấn và làm việc với cơ sở dữ liệu.
- **Entity/DTO:** lưu trữ và truyền dữ liệu giữa các phần của chương trình.

## 6. Hướng dẫn cài đặt và chạy chương trình

### Bước 1: Chuẩn bị môi trường

Cần cài đặt **JDK 17**, **MySQL 8.0** và **Git**. Có thể sử dụng IntelliJ IDEA hoặc VS Code để mở mã nguồn. Dự án đã có Maven Wrapper nên không bắt buộc phải cài Maven riêng.

### Bước 2: Tải mã nguồn

Mở Terminal hoặc PowerShell và chạy:

```bash
git clone https://github.com/haiha74/DGKDPM.git
cd DGKDPM
```

### Bước 3: Cấu hình cơ sở dữ liệu

Mở file `src/main/resources/application.properties`, kiểm tra và chỉnh sửa thông tin kết nối MySQL cho phù hợp với máy đang sử dụng.

Ví dụ:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/fashion_clone_demo?createDatabaseIfNotExist=true
spring.datasource.username=root
spring.datasource.password=MAT_KHAU_MYSQL
```

Thay `MAT_KHAU_MYSQL` bằng mật khẩu MySQL trên máy. Tên database và các cấu hình khác cần được đối chiếu với cấu hình đang sử dụng trong dự án. Nếu dự án có file SQL dữ liệu mẫu, có thể import vào MySQL trước khi chạy.

**Lưu ý:** Không đưa mật khẩu cơ sở dữ liệu hoặc API key thật lên GitHub.

### Bước 4: Chạy dự án

Trên Windows:

```powershell
.\mvnw.cmd spring-boot:run
```

Trên Linux/macOS:

```bash
./mvnw spring-boot:run
```

Sau khi ứng dụng chạy thành công, mở trình duyệt và truy cập:

- **Trang khách hàng:** http://localhost:8080/
- **Trang quản trị:** http://localhost:8080/admin

Địa chỉ trên áp dụng khi ứng dụng sử dụng cổng mặc định `8080`.

## 7. Kiểm thử

Trong quá trình làm đồ án, nhóm tiến hành kiểm tra các chức năng như đăng nhập, đăng ký, quản lý sản phẩm, giỏ hàng, đặt hàng và quản lý đơn hàng. Ngoài kiểm thử chức năng, nhóm cũng sử dụng Apache JMeter để xây dựng kịch bản kiểm thử hiệu năng.

Có thể chạy các bài kiểm thử tự động trong dự án bằng lệnh:

```powershell
.\mvnw.cmd test
```

## 8. Hướng phát triển

Nếu có thêm thời gian, nhóm muốn tiếp tục hoàn thiện dự án theo các hướng sau:

- Tối ưu tốc độ tải trang và xử lý dữ liệu.
- Cải thiện giao diện trên điện thoại và máy tính.
- Bổ sung thêm các bài kiểm thử tự động.
- Nâng cao khả năng tìm kiếm, gợi ý sản phẩm và hỗ trợ khách hàng.

## 9. Kết luận

Thông qua đồ án JODOK, nhóm có cơ hội áp dụng những kiến thức đã học vào việc xây dựng một website thương mại điện tử. Trong quá trình thực hiện, nhóm hiểu rõ hơn về cách tổ chức mã nguồn, kết nối cơ sở dữ liệu, xử lý các chức năng của website và kiểm tra lỗi trước khi hoàn thiện sản phẩm.

Dự án được thực hiện nhằm phục vụ mục đích **học tập và nghiên cứu**.
