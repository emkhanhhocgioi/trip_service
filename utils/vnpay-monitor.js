// VNPay Health Check and Monitoring Utility
const vnpayService = require("./vnpay");

class VNPayMonitor {
  constructor() {
    this.healthStats = {
      totalRequests: 0,
      successfulPayments: 0,
      failedPayments: 0,
      averageProcessingTime: 0,
      lastHealthCheck: null,
      ipDetectionStats: {},
      performanceMetrics: [],
    };
  }

  // Health check for VNPay service
  async healthCheck() {
    const checkStart = Date.now();
    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      checks: {},
      performance: {},
    };

    try {
      // Check environment variables
      health.checks.environment = this.checkEnvironment();

      // Check network connectivity (simplified)
      health.checks.connectivity = this.checkConnectivity();

      // Check return URL accessibility
      health.checks.returnUrl = this.checkReturnUrl();

      // Performance metrics
      health.performance = this.getPerformanceMetrics();

      // Overall status
      const allChecksPass = Object.values(health.checks).every(
        (check) => check.status === "ok"
      );
      health.status = allChecksPass ? "healthy" : "degraded";

      health.processingTime = Date.now() - checkStart;
      this.healthStats.lastHealthCheck = health.timestamp;

      console.log("VNPay Health Check Completed:", health);
      return health;
    } catch (error) {
      health.status = "unhealthy";
      health.error = error.message;
      console.error("VNPay Health Check Failed:", error);
      return health;
    }
  }

  // Check environment configuration
  checkEnvironment() {
    const requiredEnvs = [
      "VNP_TMNCODE",
      "VNP_HASHSECRET",
      "VNP_URL",
      "VNP_RETURN_URL",
    ];
    const missing = requiredEnvs.filter((env) => !process.env[env]);

    return {
      status: missing.length === 0 ? "ok" : "error",
      missing: missing,
      configured: requiredEnvs.filter((env) => !!process.env[env]),
    };
  }

  // Check basic connectivity
  checkConnectivity() {
    try {
      // Basic URL validation
      new URL(process.env.VNP_URL);
      new URL(process.env.VNP_RETURN_URL);

      return {
        status: "ok",
        vnpUrl: process.env.VNP_URL,
        returnUrl: process.env.VNP_RETURN_URL,
      };
    } catch (error) {
      return {
        status: "error",
        error: error.message,
      };
    }
  }

  // Check return URL configuration
  checkReturnUrl() {
    try {
      const returnUrl = new URL(process.env.VNP_RETURN_URL);

      return {
        status: "ok",
        protocol: returnUrl.protocol,
        host: returnUrl.host,
        pathname: returnUrl.pathname,
        isHttps: returnUrl.protocol === "https:",
        isLocalhost: returnUrl.hostname.includes("localhost"),
      };
    } catch (error) {
      return {
        status: "error",
        error: error.message,
      };
    }
  }

  // Get performance metrics
  getPerformanceMetrics() {
    const recentMetrics = this.healthStats.performanceMetrics.slice(-10);

    if (recentMetrics.length === 0) {
      return {
        averageProcessingTime: 0,
        requestCount: this.healthStats.totalRequests,
        successRate: 0,
      };
    }

    const avgProcessingTime =
      recentMetrics.reduce((sum, metric) => sum + metric.processingTime, 0) /
      recentMetrics.length;
    const successRate =
      this.healthStats.totalRequests > 0
        ? (this.healthStats.successfulPayments /
            this.healthStats.totalRequests) *
          100
        : 0;

    return {
      averageProcessingTime: parseFloat(avgProcessingTime.toFixed(2)),
      requestCount: this.healthStats.totalRequests,
      successfulPayments: this.healthStats.successfulPayments,
      failedPayments: this.healthStats.failedPayments,
      successRate: parseFloat(successRate.toFixed(2)),
    };
  }

  // Record payment attempt
  recordPaymentAttempt(success, processingTime, metadata = {}) {
    this.healthStats.totalRequests++;

    if (success) {
      this.healthStats.successfulPayments++;
    } else {
      this.healthStats.failedPayments++;
    }

    // Store performance metrics
    this.healthStats.performanceMetrics.push({
      timestamp: Date.now(),
      success,
      processingTime,
      metadata,
    });

    // Keep only last 100 metrics
    if (this.healthStats.performanceMetrics.length > 100) {
      this.healthStats.performanceMetrics =
        this.healthStats.performanceMetrics.slice(-100);
    }

    // Record IP detection stats
    if (metadata.clientIP) {
      const ipKey = this.isPublicIP(metadata.clientIP) ? "public" : "private";
      this.healthStats.ipDetectionStats[ipKey] =
        (this.healthStats.ipDetectionStats[ipKey] || 0) + 1;
    }
  }

  // Check if IP is public
  isPublicIP(ip) {
    const privateRanges = [
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^127\./,
      /^169\.254\./,
    ];

    return !privateRanges.some((range) => range.test(ip));
  }

  // Get current statistics
  getStats() {
    return {
      ...this.healthStats,
      timestamp: new Date().toISOString(),
    };
  }

  // Reset statistics
  resetStats() {
    this.healthStats = {
      totalRequests: 0,
      successfulPayments: 0,
      failedPayments: 0,
      averageProcessingTime: 0,
      lastHealthCheck: null,
      ipDetectionStats: {},
      performanceMetrics: [],
    };
  }
}

module.exports = new VNPayMonitor();
