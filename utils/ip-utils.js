/**
 * Production-ready IP address extraction utility
 * Handles various proxy configurations, load balancers, and CDNs
 */

/**
 * Extract the real client IP address from request headers
 * Works with various proxy setups including Nginx, Apache, Cloudflare, AWS ALB, etc.
 *
 * @param {Object} req - Express request object
 * @param {boolean} debug - Enable debug logging (default: false)
 * @returns {string} - The extracted IP address or '127.0.0.1' as fallback
 */
function getClientIPAddress(req, debug = false) {
  // Handle various proxy headers in order of priority
  const headers = {
    forwardedFor: req.headers["x-forwarded-for"],
    realIp: req.headers["x-real-ip"],
    cfConnectingIp: req.headers["cf-connecting-ip"], // Cloudflare
    xClientIp: req.headers["x-client-ip"],
    xClusterClientIp: req.headers["x-cluster-client-ip"],
    forwarded: req.headers["forwarded"], // RFC 7239
    trueClientIp: req.headers["true-client-ip"], // Akamai
    xOriginalForwardedFor: req.headers["x-original-forwarded-for"], // AWS ALB
  };

  // Debug logging for production troubleshooting
  if (debug) {
    console.log("IP Headers Debug:", {
      ...headers,
      "connection.remoteAddress": req.connection?.remoteAddress,
      "socket.remoteAddress": req.socket?.remoteAddress,
      "req.ip": req.ip, // Express.js req.ip if available
    });
  }

  let clientIp = null;

  // 1. Check X-Forwarded-For header (most common behind proxies/load balancers)
  if (headers.forwardedFor) {
    // X-Forwarded-For can contain multiple IPs, take the first one (original client)
    const ips = headers.forwardedFor.split(",").map((ip) => ip.trim());
    clientIp = ips[0];
  }
  // 2. Check Cloudflare's header
  else if (headers.cfConnectingIp) {
    clientIp = headers.cfConnectingIp;
  }
  // 3. Check True-Client-IP (Akamai, some other CDNs)
  else if (headers.trueClientIp) {
    clientIp = headers.trueClientIp;
  }
  // 4. Check X-Real-IP (nginx proxy)
  else if (headers.realIp) {
    clientIp = headers.realIp;
  }
  // 5. Check X-Original-Forwarded-For (AWS ALB)
  else if (headers.xOriginalForwardedFor) {
    const ips = headers.xOriginalForwardedFor.split(",").map((ip) => ip.trim());
    clientIp = ips[0];
  }
  // 6. Check other proxy headers
  else if (headers.xClientIp) {
    clientIp = headers.xClientIp;
  } else if (headers.xClusterClientIp) {
    clientIp = headers.xClusterClientIp;
  }
  // 7. Parse Forwarded header (RFC 7239)
  else if (headers.forwarded) {
    const match = headers.forwarded.match(/for=([^;,\s]+)/);
    if (match) {
      clientIp = match[1].replace(/"/g, "");
      // Remove port if present
      if (clientIp.startsWith("[")) {
        // IPv6 format
        clientIp = clientIp.replace(/^\[(.+)\]:\d+$/, "$1");
      } else {
        // IPv4 format
        clientIp = clientIp.replace(/:.*$/, "");
      }
    }
  }
  // 8. Use Express.js req.ip if available (when trust proxy is enabled)
  else if (req.ip) {
    clientIp = req.ip;
  }
  // 9. Fallback to connection remote address
  else if (req.connection && req.connection.remoteAddress) {
    clientIp = req.connection.remoteAddress;
  }
  // 10. Final fallback to socket remote address
  else if (req.socket && req.socket.remoteAddress) {
    clientIp = req.socket.remoteAddress;
  }

  // Validate and clean the IP address
  if (clientIp) {
    // Remove IPv6 prefix if present
    clientIp = clientIp.replace(/^::ffff:/, "");

    // Basic IP format validation
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;

    if (ipv4Regex.test(clientIp) || ipv6Regex.test(clientIp)) {
      if (debug) console.log("Final selected IP address:", clientIp);
      return clientIp;
    }
  }

  // Default fallback for localhost/development
  if (debug) console.log("Final selected IP address: 127.0.0.1 (fallback)");
  return "127.0.0.1";
}

/**
 * Validate if an IP address is valid
 * @param {string} ip - IP address to validate
 * @returns {boolean} - True if valid, false otherwise
 */
function isValidIPAddress(ip) {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

/**
 * Check if IP address is private/internal
 * @param {string} ip - IP address to check
 * @returns {boolean} - True if private, false otherwise
 */
function isPrivateIP(ip) {
  const privateRanges = [
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
    /^192\.168\./,
    /^127\./,
    /^169\.254\./, // Link-local
    /^::1$/, // IPv6 localhost
    /^fc00:/, // IPv6 unique local
    /^fe80:/, // IPv6 link-local
  ];

  return privateRanges.some((range) => range.test(ip));
}

module.exports = {
  getClientIPAddress,
  isValidIPAddress,
  isPrivateIP,
};
