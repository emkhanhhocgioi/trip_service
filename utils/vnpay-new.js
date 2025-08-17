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
    const requiredEnvs = [
      "VNP_TMNCODE",
      "VNP_HASHSECRET",
      "VNP_URL",
      "VNP_RETURN_URL",
    ];
    const missing = requiredEnvs.filter((env) => !process.env[env]);

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
  }

  // Create payment URL - studenthub compatible version
  createPaymentUrl(params) {
    // Set timezone to Vietnam
    process.env.TZ = "Asia/Ho_Chi_Minh";
    const date = new Date();
    const createDate = this.formatDate(date);

    // Generate order ID if not provided
    const orderId = params.orderId;
    const amount = params.amount;
    const orderInfo = params.orderInfo || "Thanh toan cho ma GD:" + orderId;
    const locale = params.locale || "vn";
    const currCode = "VND";
    const returnUrl = params.returnUrl || this.vnp_ReturnUrl;

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
    }

    // Sort params alphabetically - using studenthub method
    const sortedParams = this.sortObject(vnp_Params);

    // Generate secure hash - exactly like studenthub
    const signData = querystring.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac("sha512", this.vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
    sortedParams["vnp_SecureHash"] = signed;

    // Return full URL with query string - exactly like studenthub
    return (
      this.vnp_Url +
      "?" +
      querystring.stringify(sortedParams, { encode: false })
    );
  }

  // Verify VNPay return request - studenthub compatible
  verifyReturnUrl(vnpParams) {
    try {
      // Get secure hash from params
      const secureHash = vnpParams["vnp_SecureHash"];

      // Remove secure hash from params
      const clonedParams = { ...vnpParams };
      delete clonedParams["vnp_SecureHash"];
      delete clonedParams["vnp_SecureHashType"];

      // Sort params alphabetically
      const sortedParams = this.sortObject(clonedParams);

      // Generate secure hash
      const signData = querystring.stringify(sortedParams, { encode: false });
      const hmac = crypto.createHmac("sha512", this.vnp_HashSecret);
      const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

      // Compare generated hash with received hash
      return secureHash === signed;
    } catch (error) {
      console.error("VNPay verifyReturnUrl error:", error);
      return false;
    }
  }

  // Sort object by key - studenthub compatible
  sortObject(obj) {
    const sorted = {};
    const keys = Object.keys(obj).sort();

    for (const key of keys) {
      if (typeof obj[key] === "object" && !Array.isArray(obj[key])) {
        sorted[key] = JSON.stringify(this.sortObject(obj[key]));
      } else {
        sorted[key] = encodeURIComponent(obj[key]).replace(/%20/g, "+");
      }
    }

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
