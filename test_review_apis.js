// Test script for Review APIs
// Run: node test_review_apis.js

const axios = require('axios');

const BASE_URL = 'http://localhost:3002/api/reviews';

// Helper function to make requests
const makeRequest = async (method, url, data = null, token = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: {}
    };

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    console.log(`✅ ${method.toUpperCase()} ${url}:`, response.data);
    return response.data;
  } catch (error) {
    console.log(`❌ ${method.toUpperCase()} ${url}:`, error.response?.data || error.message);
    return null;
  }
};

// Test scenarios
const runTests = async () => {
  console.log('🧪 Testing Review APIs...\n');

  // 1. Test lấy tất cả reviews (không cần auth)
  console.log('1. Test lấy tất cả reviews:');
  await makeRequest('GET', '/all');
  console.log('');

  // 2. Test lấy reviews với pagination
  console.log('2. Test lấy reviews với pagination:');
  await makeRequest('GET', '/all?page=1&limit=5');
  console.log('');

  // 3. Test tạo review (cần auth - sẽ fail)
  console.log('3. Test tạo review không có auth:');
  await makeRequest('POST', '/create', {
    userId: '507f1f77bcf86cd799439011',
    routeId: '507f1f77bcf86cd799439012', 
    rating: 5,
    comment: 'Dịch vụ rất tốt'
  });
  console.log('');

  // 4. Test lấy review theo ID không tồn tại
  console.log('4. Test lấy review theo ID không tồn tại:');
  await makeRequest('GET', '/507f1f77bcf86cd799439999');
  console.log('');

  // 5. Test lấy reviews theo route
  console.log('5. Test lấy reviews theo route:');
  await makeRequest('GET', '/route/507f1f77bcf86cd799439012');
  console.log('');

  // 6. Test update review không có auth
  console.log('6. Test update review không có auth:');
  await makeRequest('PUT', '/update/507f1f77bcf86cd799439011', {
    rating: 4,
    comment: 'Updated comment'
  });
  console.log('');

  // 7. Test delete review không có auth
  console.log('7. Test delete review không có auth:');
  await makeRequest('DELETE', '/delete/507f1f77bcf86cd799439011');
  console.log('');

  console.log('🧪 Test completed!');
};

// Run tests
runTests().catch(console.error);
