# Hệ thống Admin - Bus Ticket Backend

## Tổng quan

Hệ thống admin cho phép quản lý toàn bộ dữ liệu của ứng dụng đặt vé xe bus, bao gồm:
- Quản lý người dùng (Users)
- Quản lý đối tác (Partners) 
- Quản lý đơn hàng (Orders)
- Quản lý tuyến đường (Routes)
- Quản lý vé (Tickets)
- Quản lý đánh giá (Reviews)

## Cài đặt và khởi tạo

### 1. Tạo Super Admin đầu tiên

Chạy script để tạo tài khoản super admin đầu tiên:

```bash
cd Trip_Service
node create_super_admin.js
```

Thông tin đăng nhập mặc định:
- Email: `superadmin@busticket.com`
- Password: `SuperAdmin123!`

**⚠️ Quan trọng:** Hãy thay đổi mật khẩu sau lần đăng nhập đầu tiên!

### 2. Khởi động server

```bash
npm start
```

Server sẽ chạy trên port 3002.

## API Endpoints

### Authentication

#### Đăng nhập Admin
```
POST /api/admin/login
Content-Type: application/json

{
  "email": "superadmin@busticket.com",
  "password": "SuperAdmin123!"
}
```

#### Tạo Admin mới (chỉ Super Admin)
```
POST /api/admin/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Admin Name",
  "email": "admin@example.com",
  "phone": "0123456789",
  "password": "SecurePassword123!",
  "role": "admin"
}
```

### Dashboard

#### Lấy thống kê tổng quan
```
GET /api/admin/dashboard
Authorization: Bearer <token>
```

### Quản lý người dùng

#### Lấy danh sách người dùng
```
GET /api/admin/users?page=1&limit=10&search=keyword&userType=user
Authorization: Bearer <token>
```

#### Lấy chi tiết người dùng
```
GET /api/admin/users/:userId
Authorization: Bearer <token>
```

#### Cập nhật trạng thái người dùng
```
PATCH /api/admin/users/:userId/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "isVerified": true
}
```

#### Xóa người dùng (chỉ Super Admin)
```
DELETE /api/admin/users/:userId
Authorization: Bearer <token>
```

### Quản lý đối tác

#### Lấy danh sách đối tác
```
GET /api/admin/partners?page=1&limit=10&search=keyword&isVerified=true
Authorization: Bearer <token>
```

#### Lấy chi tiết đối tác
```
GET /api/admin/partners/:partnerId
Authorization: Bearer <token>
```

#### Xác thực/Hủy xác thực đối tác
```
PATCH /api/admin/partners/:partnerId/verify
Authorization: Bearer <token>
Content-Type: application/json

{
  "isVerified": true
}
```

### Quản lý đơn hàng

#### Lấy danh sách đơn hàng
```
GET /api/admin/orders?page=1&limit=10&orderStatus=completed&paymentStatus=paid&search=keyword
Authorization: Bearer <token>
```

#### Lấy chi tiết đơn hàng
```
GET /api/admin/orders/:orderId
Authorization: Bearer <token>
```

### Quản lý tuyến đường

#### Lấy danh sách tuyến đường
```
GET /api/admin/routes?page=1&limit=10&search=keyword&isActive=true&partnerId=123
Authorization: Bearer <token>
```

#### Kích hoạt/Vô hiệu hóa tuyến đường
```
PATCH /api/admin/routes/:routeId/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "isActive": true
}
```

### Quản lý đánh giá

#### Lấy danh sách đánh giá
```
GET /api/admin/reviews?page=1&limit=10&isApproved=true&rating=5
Authorization: Bearer <token>
```

#### Phê duyệt/Từ chối đánh giá
```
PATCH /api/admin/reviews/:reviewId/approve
Authorization: Bearer <token>
Content-Type: application/json

{
  "isApproved": true
}
```

### Quản lý vé

#### Lấy danh sách vé
```
GET /api/admin/tickets?page=1&limit=10&status=active&search=keyword
Authorization: Bearer <token>
```

## Phân quyền

### Các vai trò (Roles)

1. **super_admin**: Toàn quyền
   - Tạo admin mới
   - Xóa dữ liệu
   - Tất cả quyền của admin và moderator

2. **admin**: Quyền quản lý
   - Đọc và chỉnh sửa dữ liệu
   - Không thể xóa dữ liệu
   - Không thể tạo admin mới

3. **moderator**: Quyền xem
   - Chỉ có thể xem dữ liệu
   - Không thể chỉnh sửa hoặc xóa

### Các quyền trên tài nguyên (Permissions)

Mỗi tài nguyên có 3 loại quyền:
- **read**: Xem dữ liệu
- **write**: Chỉnh sửa dữ liệu  
- **delete**: Xóa dữ liệu

Các tài nguyên:
- `users`: Quản lý người dùng
- `partners`: Quản lý đối tác
- `orders`: Quản lý đơn hàng
- `routes`: Quản lý tuyến đường
- `tickets`: Quản lý vé
- `reviews`: Quản lý đánh giá

## Bảo mật

### JWT Token
- Token có thời hạn 24 giờ
- Chứa thông tin: ID, email, role, permissions
- Phải được gửi trong header: `Authorization: Bearer <token>`

### Middleware bảo mật
- `verifyAdminToken`: Xác thực token
- `checkPermission`: Kiểm tra quyền trên tài nguyên
- `requireSuperAdmin`: Yêu cầu quyền super admin

## Response Format

### Thành công
```json
{
  "success": true,
  "message": "Thông báo thành công",
  "data": {
    // Dữ liệu trả về
  }
}
```

### Lỗi
```json
{
  "success": false,
  "message": "Thông báo lỗi"
}
```

### Phân trang
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 10,
      "totalItems": 100,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

## Ví dụ sử dụng

### 1. Đăng nhập
```javascript
const response = await fetch('http://localhost:3002/api/admin/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'superadmin@busticket.com',
    password: 'SuperAdmin123!'
  })
});

const result = await response.json();
const token = result.data.token;
```

### 2. Lấy danh sách người dùng
```javascript
const response = await fetch('http://localhost:3002/api/admin/users?page=1&limit=10', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const users = await response.json();
```

### 3. Xác thực đối tác
```javascript
const response = await fetch(`http://localhost:3002/api/admin/partners/${partnerId}/verify`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    isVerified: true
  })
});
```

## Lưu ý

1. **Environment Variables**: Đảm bảo có biến `JWT_SECRET` trong file `.env`
2. **Database**: Kết nối MongoDB phải hoạt động
3. **CORS**: Đã được cấu hình cho phép tất cả origins
4. **Logging**: Các lỗi sẽ được log ra console
5. **Validation**: Tất cả input đều được validate

## Troubleshooting

### Lỗi thường gặp

1. **401 Unauthorized**: Token không hợp lệ hoặc hết hạn
2. **403 Forbidden**: Không có quyền thực hiện hành động
3. **404 Not Found**: Không tìm thấy dữ liệu
4. **500 Internal Server Error**: Lỗi server hoặc database

### Debug

- Kiểm tra console logs
- Xác thực JWT token tại [jwt.io](https://jwt.io)
- Kiểm tra kết nối database
- Xác thực permissions trong token
