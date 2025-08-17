const crypto = require("crypto");
const querystring = require("qs");
const moment = require("moment");

class VNPayService {
  constructor() {
    this.vnp_TmnCode = process.env.VNP_TMNCODE;
    this.vnp_HashSecret = process.env.VNP_HASHSECRET;
    this.vnp_Url = process.env.VNP_URL;
    this.vnp_ReturnUrl = process.env.VNP_RETURN_URL;

    // Validate configuration on startup
    this.validateConfiguration();
  }

  // Validate VNPay configuration
  validateConfiguration() {
    console.log("=== VNPay Configuration Validation Debug ===");
    
    const requiredEnvs = [
      "VNP_TMNCODE",
      "VNP_HASHSECRET",
      "VNP_URL",
      "VNP_RETURN_URL",
    ];
    const missing = requiredEnvs.filter((env) => !process.env[env]);

    console.log("Environment variables check:");
    requiredEnvs.forEach(env => {
      const value = process.env[env];
      if (value) {
        if (env === "VNP_HASHSECRET") {
          console.log(`${env}: *** (length: ${value.length}, first 10 chars: ${value.substring(0, 10)}...)`);
        } else {
          console.log(`${env}: ${value}`);
        }
      } else {
        console.log(`${env}: MISSING`);
      }
    });

    if (missing.length > 0) {
      console.error(
        "VNPay Configuration Error - Missing environment variables:",
        missing
      );
      throw new Error(
        `Missing VNPay environment variables: ${missing.join(", ")}`
      );
    }

    console.log("VNPay Configuration validated successfully");
    console.log("=== End VNPay Configuration Validation Debug ===");
  }

  // Create payment URL - studenthub compatible version
  createPaymentUrl(params) {
    console.log("=== VNPay Payment URL Creation Debug ===");
    console.log("Input params:", JSON.stringify(params, null, 2));
    
    // Set timezone to Vietnam
    process.env.TZ = "Asia/Ho_Chi_Minh";
    const date = new Date();
    const createDate = this.formatDate(date);
    console.log("Created date:", createDate);

    // Generate order ID if not provided
    const orderId = params.orderId;
    const amount = params.amount;
    const orderInfo = params.orderInfo || "Thanh toan cho ma GD:" + orderId;
    const locale = params.locale || "vn";
    const currCode = "VND";
    const returnUrl = params.returnUrl || this.vnp_ReturnUrl;

    console.log("Processing values:");
    console.log("- Order ID:", orderId);
    console.log("- Amount:", amount, "-> VND:", amount * 100);
    console.log("- Order Info:", orderInfo);
    console.log("- Return URL:", returnUrl);
    console.log("- IP Address:", params.ipAddr);

    // Create payment params - exactly like studenthub
    const vnp_Params = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: this.vnp_TmnCode,
      vnp_Locale: locale,
      vnp_CurrCode: currCode,
      vnp_TxnRef: orderId,
      vnp_OrderInfo: orderInfo,
      vnp_OrderType: "other",
      vnp_Amount: amount * 100, // Convert to smallest currency unit (cents)
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: params.ipAddr,
      vnp_CreateDate: createDate,
    };

    // Add bank code if provided
    if (params.bankCode) {
      vnp_Params["vnp_BankCode"] = params.bankCode;
      console.log("Bank code added:", params.bankCode);
    }

    console.log("Raw VNP Params:", JSON.stringify(vnp_Params, null, 2));

    // Sort params alphabetically - using studenthub method
    const sortedParams = this.sortObject(vnp_Params);
    console.log("Sorted VNP Params:", JSON.stringify(sortedParams, null, 2));

    // Generate secure hash - exactly like studenthub
    const signData = querystring.stringify(sortedParams, { encode: false });
    console.log("Sign data string:", signData);
    console.log("Hash secret length:", this.vnp_HashSecret ? this.vnp_HashSecret.length : 'undefined');
    console.log("Hash secret (first 10 chars):", this.vnp_HashSecret ? this.vnp_HashSecret.substring(0, 10) + '...' : 'undefined');
    
    const hmac = crypto.createHmac("sha512", this.vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
    console.log("Generated secure hash:", signed);
    
    sortedParams["vnp_SecureHash"] = signed;

    // Return full URL with query string - exactly like studenthub
    const finalUrl = this.vnp_Url + "?" + querystring.stringify(sortedParams, { encode: false });
    console.log("Final payment URL:", finalUrl);
    console.log("=== End VNPay Payment URL Creation Debug ===");
    
    return finalUrl;
  }

  // Verify VNPay return request - studenthub compatible
  verifyReturnUrl(vnpParams) {
    console.log("=== VNPay Return URL Verification Debug ===");
    console.log("Received VNP Params:", JSON.stringify(vnpParams, null, 2));
    
    try {
      // Get secure hash from params
      const secureHash = vnpParams["vnp_SecureHash"];
      console.log("Received secure hash:", secureHash);

      // Remove secure hash from params
      const clonedParams = { ...vnpParams };
      delete clonedParams["vnp_SecureHash"];
      delete clonedParams["vnp_SecureHashType"];
      
      console.log("Params after removing hash:", JSON.stringify(clonedParams, null, 2));

      // Sort params alphabetically
      const sortedParams = this.sortObject(clonedParams);
      console.log("Sorted params for verification:", JSON.stringify(sortedParams, null, 2));

      // Generate secure hash
      const signData = querystring.stringify(sortedParams, { encode: false });
      console.log("Sign data for verification:", signData);
      console.log("Hash secret (first 10 chars):", this.vnp_HashSecret ? this.vnp_HashSecret.substring(0, 10) + '...' : 'undefined');
      
      const hmac = crypto.createHmac("sha512", this.vnp_HashSecret);
      const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
      console.log("Generated hash for verification:", signed);

      // Compare generated hash with received hash
      const isValid = secureHash === signed;
      console.log("Hash comparison result:", isValid);
      console.log("Expected hash:", signed);
      console.log("Received hash:", secureHash);
      console.log("=== End VNPay Return URL Verification Debug ===");
      
      return isValid;
    } catch (error) {
      console.error("VNPay verifyReturnUrl error:", error);
      console.log("=== End VNPay Return URL Verification Debug (ERROR) ===");
      return false;
    }
  }

  // Sort object by key - studenthub compatible
  sortObject(obj) {
    console.log("=== Sorting Object Debug ===");
    console.log("Input object:", JSON.stringify(obj, null, 2));
    
    const sorted = {};
    const keys = Object.keys(obj).sort();
    console.log("Sorted keys:", keys);

    for (const key of keys) {
      if (typeof obj[key] === "object" && !Array.isArray(obj[key])) {
        sorted[key] = JSON.stringify(this.sortObject(obj[key]));
        console.log(`Key ${key} (object): ${sorted[key]}`);
      } else {
        const originalValue = obj[key];
        const encodedValue = encodeURIComponent(obj[key]).replace(/%20/g, "+");
        sorted[key] = encodedValue;
        console.log(`Key ${key}: "${originalValue}" -> "${encodedValue}"`);
      }
    }

    console.log("Final sorted object:", JSON.stringify(sorted, null, 2));
    console.log("=== End Sorting Object Debug ===");
    return sorted;
  }

  // Get client IP address
  getClientIpAddress(req) {
    return (
      req.headers["x-forwarded-for"] ||
      req.headers["x-real-ip"] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
      "127.0.0.1"
    );
  }

  // Format date for VNPay
  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  // Create QR payment code for VNPay
  createQRPayment(params) {
    console.log("=== VNPay QR Payment Creation Debug ===");
    console.log("Input params:", JSON.stringify(params, null, 2));
    
    try {
      // Set timezone to Vietnam
      process.env.TZ = "Asia/Ho_Chi_Minh";
      const date = new Date();
      const createDate = this.formatDate(date);
      console.log("Created date:", createDate);

      // Extract and validate parameters
      const orderId = params.orderId;
      const amount = params.amount;
      const orderInfo = params.orderInfo || "Thanh toan QR cho ma GD:" + orderId;
      const locale = params.locale || "vn";
      const currCode = "VND";
      const returnUrl = params.returnUrl || this.vnp_ReturnUrl;

      // Validate required fields
      if (!orderId || !amount) {
        throw new Error("Order ID and amount are required for QR payment");
      }

      if (isNaN(amount) || amount <= 0) {
        throw new Error("Amount must be a positive number");
      }

      console.log("Processing QR payment values:");
      console.log("- Order ID:", orderId);
      console.log("- Amount:", amount, "-> VND:", amount * 100);
      console.log("- Order Info:", orderInfo);
      console.log("- Return URL:", returnUrl);
      console.log("- IP Address:", params.ipAddr);

      // Create QR payment params - specific for QR code generation
      const vnp_Params = {
        vnp_Version: "2.1.0",
        vnp_Command: "pay", // For QR, we use 'pay' command
        vnp_TmnCode: this.vnp_TmnCode,
        vnp_Locale: locale,
        vnp_CurrCode: currCode,
        vnp_TxnRef: orderId,
        vnp_OrderInfo: orderInfo,
        vnp_OrderType: "other",
        vnp_Amount: amount * 100, // Convert to smallest currency unit
        vnp_ReturnUrl: returnUrl,
        vnp_IpAddr: params.ipAddr || "127.0.0.1",
        vnp_CreateDate: createDate,
        // QR specific parameters
        vnp_PaymentType: "qr", // Specify QR payment type
      };

      // Add bank code for QR if provided (optional)
      if (params.bankCode) {
        vnp_Params["vnp_BankCode"] = params.bankCode;
        console.log("Bank code added for QR:", params.bankCode);
      }

      // Add QR code expiry time (optional, defaults to 15 minutes)
      const expiryMinutes = params.expiryMinutes || 15;
      const expiryDate = new Date(date.getTime() + expiryMinutes * 60000);
      vnp_Params["vnp_ExpireDate"] = this.formatDate(expiryDate);
      console.log("QR expiry date:", vnp_Params["vnp_ExpireDate"]);

      console.log("Raw QR VNP Params:", JSON.stringify(vnp_Params, null, 2));

      // Sort params alphabetically
      const sortedParams = this.sortObject(vnp_Params);
      console.log("Sorted QR VNP Params:", JSON.stringify(sortedParams, null, 2));

      // Generate secure hash
      const signData = querystring.stringify(sortedParams, { encode: false });
      console.log("QR Sign data string:", signData);
      
      const hmac = crypto.createHmac("sha512", this.vnp_HashSecret);
      const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
      console.log("Generated QR secure hash:", signed);
      
      sortedParams["vnp_SecureHash"] = signed;

      // Create QR payment URL
      const qrPaymentUrl = this.vnp_Url + "?" + querystring.stringify(sortedParams, { encode: false });
      
      // Generate QR code data - this would be used by QR code generator library
      const qrCodeData = {
        paymentUrl: qrPaymentUrl,
        orderId: orderId,
        amount: amount,
        orderInfo: orderInfo,
        expiryTime: expiryDate.toISOString(),
        qrString: this.generateQRString(sortedParams),
        createdAt: date.toISOString()
      };

      console.log("Final QR payment data:", JSON.stringify(qrCodeData, null, 2));
      console.log("=== End VNPay QR Payment Creation Debug ===");
      
      return qrCodeData;

    } catch (error) {
      console.error("QR Payment creation error:", error);
      console.log("=== End VNPay QR Payment Creation Debug (ERROR) ===");
      throw error;
    }
  }

  // Generate QR string format for VNPay
  generateQRString(params) {
    console.log("=== Generating QR String ===");
    
    // VNPay QR format: typically a formatted string that can be converted to QR code
    // This creates a compact string with essential payment information
    const qrData = {
      version: params.vnp_Version,
      command: params.vnp_Command,
      tmnCode: params.vnp_TmnCode,
      amount: params.vnp_Amount,
      txnRef: params.vnp_TxnRef,
      orderInfo: params.vnp_OrderInfo,
      createDate: params.vnp_CreateDate,
      hash: params.vnp_SecureHash
    };

    // Create a compact QR string (you might want to customize this format)
    const qrString = `VNPAY|${qrData.version}|${qrData.command}|${qrData.tmnCode}|${qrData.amount}|${qrData.txnRef}|${encodeURIComponent(qrData.orderInfo)}|${qrData.createDate}|${qrData.hash}`;
    
    console.log("Generated QR string:", qrString);
    console.log("QR string length:", qrString.length);
    console.log("=== End QR String Generation ===");
    
    return qrString;
  }

  // Verify QR payment status
  verifyQRPayment(params) {
    console.log("=== VNPay QR Payment Verification Debug ===");
    console.log("Verification params:", JSON.stringify(params, null, 2));
    
    try {
      // This would typically be called when checking QR payment status
      // Similar to verifyReturnUrl but for QR payments
      return this.verifyReturnUrl(params);
    } catch (error) {
      console.error("QR Payment verification error:", error);
      console.log("=== End VNPay QR Payment Verification Debug (ERROR) ===");
      return false;
    }
  }

  // Check QR payment status (polling function)
  async checkQRPaymentStatus(orderId) {
    console.log("=== Checking QR Payment Status ===");
    console.log("Order ID:", orderId);
    
    try {
      // This would typically make an API call to VNPay to check payment status
      // For now, return a basic structure that can be implemented
      const statusCheck = {
        orderId: orderId,
        status: "checking", // pending, success, failed, expired
        message: "Checking payment status...",
        timestamp: new Date().toISOString()
      };

      console.log("Payment status check result:", statusCheck);
      console.log("=== End QR Payment Status Check ===");
      
      return statusCheck;
    } catch (error) {
      console.error("QR Payment status check error:", error);
      console.log("=== End QR Payment Status Check (ERROR) ===");
      throw error;
    }
  }

  // Get response message for response code
  getResponseMessage(responseCode) {
    const messages = {
      "00": "Giao dịch thành công",
      "07": "Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).",
      "09": "Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng.",
      10: "Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần",
      11: "Giao dịch không thành công do: Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch.",
      12: "Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa.",
      13: "Giao dịch không thành công do Quý khách nhập sai mật khẩu xác thực giao dịch (OTP). Xin quý khách vui lòng thực hiện lại giao dịch.",
      24: "Giao dịch không thành công do: Khách hàng hủy giao dịch",
      51: "Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch.",
      65: "Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày.",
      75: "Ngân hàng thanh toán đang bảo trì.",
      79: "Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định. Xin quý khách vui lòng thực hiện lại giao dịch",
      99: "Các lỗi khác (lỗi còn lại, không có trong danh sách mã lỗi đã liệt kê)",
    };
    return messages[responseCode] || "Lỗi không xác định";
  }
}

module.exports = new VNPayService();
