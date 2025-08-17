# VNPay QR Payment Integration Guide

## Tổng quan
Hệ thống thanh toán QR cho phép khách hàng thanh toán bằng cách quét mã QR từ ứng dụng ngân hàng hoặc ví điện tử.

## API Endpoints

### 1. Tạo thanh toán QR
```
POST /payment/qr/create
```

**Request Body:**
```json
{
  "orderId": "65a1b2c3d4e5f6789012345",
  "amount": 250000,
  "orderInfo": "Thanh toan ve xe Hanoi - Saigon",
  "bankCode": "NCB",
  "locale": "vn",
  "expiryMinutes": 15
}
```

**Response:**
```json
{
  "success": true,
  "message": "QR payment created successfully",
  "data": {
    "orderId": "65a1b2c3d4e5f6789012345",
    "amount": 250000,
    "orderInfo": "Thanh toan ve xe Hanoi - Saigon",
    "clientIP": "192.168.1.100",
    "expiryTime": "2025-08-09T16:30:00.000Z",
    "qrString": "VNPAY|2.1.0|pay|TMNCODE123|25000000|65a1b2c3d4e5f6789012345|...",
    "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?...",
    "expiryMinutes": 15,
    "createdAt": "2025-08-09T16:15:00.000Z"
  }
}
```

### 2. Kiểm tra trạng thái thanh toán QR
```
GET /payment/qr/status/:orderId
```

**Response:**
```json
{
  "success": true,
  "message": "Payment is still pending",
  "data": {
    "orderId": "65a1b2c3d4e5f6789012345",
    "paymentStatus": "pending",
    "orderStatus": "pending",
    "amount": 250000,
    "qrAttemptTime": "2025-08-09T16:15:00.000Z",
    "qrExpiryTime": "2025-08-09T16:30:00.000Z",
    "vnpayStatus": {
      "orderId": "65a1b2c3d4e5f6789012345",
      "status": "checking",
      "message": "Checking payment status...",
      "timestamp": "2025-08-09T16:20:00.000Z"
    },
    "lastChecked": "2025-08-09T16:20:00.000Z"
  }
}
```

### 3. Xác thực thanh toán QR (callback từ VNPay)
```
GET /payment/qr/verify?vnp_Amount=25000000&vnp_BankCode=NCB&...
```

## Tích hợp Frontend

### 1. Tạo QR Payment
```javascript
const createQRPayment = async (orderData) => {
  try {
    const response = await fetch('/payment/qr/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Hiển thị QR code từ result.data.qrString
      displayQRCode(result.data.qrString);
      // Bắt đầu polling để kiểm tra trạng thái
      startPaymentStatusPolling(result.data.orderId);
    }
  } catch (error) {
    console.error('Error creating QR payment:', error);
  }
};
```

### 2. Polling để kiểm tra trạng thái
```javascript
const startPaymentStatusPolling = (orderId) => {
  const pollInterval = setInterval(async () => {
    try {
      const response = await fetch(`/payment/qr/status/${orderId}`);
      const result = await response.json();
      
      if (result.data.paymentStatus === 'success') {
        clearInterval(pollInterval);
        // Thanh toán thành công
        showPaymentSuccess();
      } else if (result.data.paymentStatus === 'failed') {
        clearInterval(pollInterval);
        // Thanh toán thất bại
        showPaymentFailure();
      } else if (new Date() > new Date(result.data.qrExpiryTime)) {
        clearInterval(pollInterval);
        // QR đã hết hạn
        showQRExpired();
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
    }
  }, 3000); // Kiểm tra mỗi 3 giây
};
```

### 3. Hiển thị QR Code
```javascript
// Sử dụng thư viện qrcode để tạo QR code từ qrString
import QRCode from 'qrcode';

const displayQRCode = async (qrString) => {
  try {
    const qrCodeUrl = await QRCode.toDataURL(qrString);
    document.getElementById('qr-code').src = qrCodeUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
  }
};
```

## Cài đặt thư viện cần thiết

### Backend
```bash
npm install crypto qs moment
```

### Frontend
```bash
npm install qrcode
```

## Lưu ý quan trọng

1. **Thời gian hết hạn:** QR code mặc định có thời gian sống 15 phút
2. **Polling interval:** Nên kiểm tra trạng thái mỗi 3-5 giây
3. **Error handling:** Luôn xử lý các trường hợp lỗi và timeout
4. **Security:** Validate tất cả request từ VNPay callback
5. **User experience:** Hiển thị countdown timer cho người dùng

## Workflow thanh toán QR

1. **Khách hàng chọn thanh toán QR**
2. **Hệ thống tạo QR payment và trả về QR string**
3. **Frontend hiển thị QR code và bắt đầu polling**
4. **Khách hàng quét QR và thanh toán trên app ngân hàng**
5. **VNPay gửi callback đến server**
6. **Server xác thực và cập nhật trạng thái đơn hàng**
7. **Frontend nhận được trạng thái thành công và chuyển trang**

## Các trạng thái thanh toán

- `pending`: Chờ thanh toán
- `success`: Thanh toán thành công
- `failed`: Thanh toán thất bại
- `expired`: QR đã hết hạn
- `cancelled`: Đã hủy thanh toán
