# Hệ Thống Bán Hàng Thời Trang Trực Tuyến

## Giới thiệu

Đây là đồ án môn Đồ Án Cơ Sở, xây dựng hệ thống bán hàng thời trang trực tuyến trên nền tảng Web nhằm hỗ trợ khách hàng mua sắm trực tuyến và hỗ trợ doanh nghiệp quản lý hoạt động kinh doanh.

### Công nghệ sử dụng

#### Backend
- Java 21
- Spring Boot 3
- Spring Data JPA
- Maven

#### Frontend
- HTML
- CSS
- JavaScript
- TailwindCSS

#### Database
- MySQL 8

---

## Chức năng hệ thống

### Khách hàng (User)

- Đăng ký tài khoản
- Đăng nhập
- Xem sản phẩm
- Tìm kiếm sản phẩm
- Xem chi tiết sản phẩm
- Thêm vào giỏ hàng
- Đặt hàng
- Xem lịch sử đơn hàng
- Đánh giá sản phẩm
- Sử dụng voucher

### Nhân viên (Staff)

- Quản lý đơn hàng
- Cập nhật trạng thái đơn hàng
- Quản lý kho hàng
- Quản lý sản phẩm

### Quản trị viên (Admin)

- Quản lý người dùng
- Quản lý nhân viên
- Phân quyền tài khoản
- Quản lý sản phẩm
- Quản lý danh mục
- Quản lý thương hiệu
- Quản lý voucher
- Quản lý đơn hàng
- Thống kê doanh thu

---

## Hướng dẫn cài đặt

### 1. Clone project

```bash
git clone https://github.com/haiha74/Do_an_co_so.git
```

### 2. Tạo Database

```sql
CREATE DATABASE fashionweb;
```

Import file:

```text
database/fashionweb.sql
```

### 3. Cấu hình Database

Mở file:

```text
src/main/resources/application.properties
```

Cập nhật:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/fashionweb?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=Asia/Ho_Chi_Minh
spring.datasource.username=root
spring.datasource.password=123456

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
```

### 4. Chạy ứng dụng

```bash
mvn spring-boot:run
```

hoặc chạy class:

```text
TmdtApplication.java
```

### 5. Truy cập hệ thống

```text
http://localhost:8080
```

---

## Cấu trúc thư mục

```text
Do_an_co_so
│
├── src/main
├── uploads
├── pom.xml
├── README.md
│
├── database
│   └── fashionweb.sql
│
├── report
│   └── BaoCao_DACS.pdf
│
└── meeting-minutes
    ├── MM01.docx
    ├── MM02.docx
    ├── MM03.docx
    ├── MM04.docx
    └── MM05.docx
```

---

## Thành viên thực hiện

| MSSV | Họ tên | Vai trò |
|-------|---------|----------|
| 23010421 | Vũ Thị Hải Yến | PM, BA, FE, Tester |
| 23010469 | Nguyễn Hải Hà | BE, FE |

---

## Kết quả

Hệ thống đã triển khai thành công các chức năng chính của một website bán hàng thời trang trực tuyến, đáp ứng yêu cầu quản lý sản phẩm, khách hàng, đơn hàng, thanh toán và thống kê doanh thu.

---

## Mục đích

Dự án được thực hiện phục vụ học phần Đồ Án Cơ Sở tại Trường Đại học Thủ đô Hà Nội.
