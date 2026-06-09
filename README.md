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
FashionApplication.java
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
    ├── MM01.pdf
    ├── MM02.pdf
    ├── MM03.pdf
    ├── MM04.pdf
    └── MM05.pdf
```
