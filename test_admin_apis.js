const axios = require('axios');

// Base URL for API
const BASE_URL = 'http://localhost:3002/api/admin';

// Test admin credentials
const TEST_ADMIN = {
  email: 'superadmin@busticket.com',
  password: 'SuperAdmin123!'
};

let authToken = '';

// Test functions
async function testAdminLogin() {
  try {
    console.log('🔐 Testing admin login...');
    
    const response = await axios.post(`${BASE_URL}/login`, TEST_ADMIN);
    
    if (response.data.success) {
      authToken = response.data.data.token;
      console.log('✅ Login successful');
      console.log('Token:', authToken.substring(0, 20) + '...');
      console.log('Admin Role:', response.data.data.admin.role);
      return true;
    } else {
      console.log('❌ Login failed:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Login error:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testDashboardStats() {
  try {
    console.log('\n📊 Testing dashboard stats...');
    
    const response = await axios.get(`${BASE_URL}/dashboard`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.success) {
      console.log('✅ Dashboard stats retrieved');
      console.log('Summary:', response.data.data.summary);
      return true;
    } else {
      console.log('❌ Dashboard stats failed:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Dashboard stats error:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testGetUsers() {
  try {
    console.log('\n👥 Testing get users...');
    
    const response = await axios.get(`${BASE_URL}/users?page=1&limit=5`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.success) {
      console.log('✅ Users retrieved');
      console.log('Total users:', response.data.data.pagination.totalUsers);
      console.log('Users on page:', response.data.data.users.length);
      return true;
    } else {
      console.log('❌ Get users failed:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Get users error:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testGetPartners() {
  try {
    console.log('\n🤝 Testing get partners...');
    
    const response = await axios.get(`${BASE_URL}/partners?page=1&limit=5`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.success) {
      console.log('✅ Partners retrieved');
      console.log('Total partners:', response.data.data.pagination.totalPartners);
      console.log('Partners on page:', response.data.data.partners.length);
      return true;
    } else {
      console.log('❌ Get partners failed:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Get partners error:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testGetOrders() {
  try {
    console.log('\n📋 Testing get orders...');
    
    const response = await axios.get(`${BASE_URL}/orders?page=1&limit=5`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.success) {
      console.log('✅ Orders retrieved');
      console.log('Total orders:', response.data.data.pagination.totalOrders);
      console.log('Orders on page:', response.data.data.orders.length);
      return true;
    } else {
      console.log('❌ Get orders failed:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Get orders error:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testGetRoutes() {
  try {
    console.log('\n🚌 Testing get routes...');
    
    const response = await axios.get(`${BASE_URL}/routes?page=1&limit=5`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.success) {
      console.log('✅ Routes retrieved');
      console.log('Total routes:', response.data.data.pagination.totalRoutes);
      console.log('Routes on page:', response.data.data.routes.length);
      return true;
    } else {
      console.log('❌ Get routes failed:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Get routes error:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testGetReviews() {
  try {
    console.log('\n⭐ Testing get reviews...');
    
    const response = await axios.get(`${BASE_URL}/reviews?page=1&limit=5`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.success) {
      console.log('✅ Reviews retrieved');
      console.log('Total reviews:', response.data.data.pagination.totalReviews);
      console.log('Reviews on page:', response.data.data.reviews.length);
      return true;
    } else {
      console.log('❌ Get reviews failed:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Get reviews error:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testGetTickets() {
  try {
    console.log('\n🎫 Testing get tickets...');
    
    const response = await axios.get(`${BASE_URL}/tickets?page=1&limit=5`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.success) {
      console.log('✅ Tickets retrieved');
      console.log('Total tickets:', response.data.data.pagination.totalTickets);
      console.log('Tickets on page:', response.data.data.tickets.length);
      return true;
    } else {
      console.log('❌ Get tickets failed:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Get tickets error:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testUnauthorizedAccess() {
  try {
    console.log('\n🔒 Testing unauthorized access...');
    
    const response = await axios.get(`${BASE_URL}/users`);
    
    console.log('❌ Unauthorized access should have failed but succeeded');
    return false;
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Unauthorized access properly blocked');
      return true;
    } else {
      console.log('❌ Unexpected error:', error.response?.data?.message || error.message);
      return false;
    }
  }
}

// Main test function
async function runAllTests() {
  console.log('🚀 Starting Admin API Tests...\n');
  console.log('Make sure the server is running on localhost:3002\n');

  let passedTests = 0;
  let totalTests = 0;

  // Test 1: Login
  totalTests++;
  if (await testAdminLogin()) {
    passedTests++;
  }

  if (authToken) {
    // Test 2: Dashboard
    totalTests++;
    if (await testDashboardStats()) {
      passedTests++;
    }

    // Test 3: Users
    totalTests++;
    if (await testGetUsers()) {
      passedTests++;
    }

    // Test 4: Partners
    totalTests++;
    if (await testGetPartners()) {
      passedTests++;
    }

    // Test 5: Orders
    totalTests++;
    if (await testGetOrders()) {
      passedTests++;
    }

    // Test 6: Routes
    totalTests++;
    if (await testGetRoutes()) {
      passedTests++;
    }

    // Test 7: Reviews
    totalTests++;
    if (await testGetReviews()) {
      passedTests++;
    }

    // Test 8: Tickets
    totalTests++;
    if (await testGetTickets()) {
      passedTests++;
    }
  }

  // Test 9: Unauthorized access
  totalTests++;
  if (await testUnauthorizedAccess()) {
    passedTests++;
  }

  console.log('\n' + '='.repeat(50));
  console.log(`📊 Test Results: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Admin API is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please check the implementation.');
  }
  console.log('='.repeat(50));
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  runAllTests,
  testAdminLogin,
  testDashboardStats,
  testGetUsers,
  testGetPartners,
  testGetOrders,
  testGetRoutes,
  testGetReviews,
  testGetTickets,
  testUnauthorizedAccess
};
