#!/usr/bin/env node

/**
 * Master Test Runner
 * Runs all test suites and provides comprehensive report
 */

const { runDatabaseTests } = require('./database-test');
const { runCompleteTests } = require('./complete-e2e-test');
const { runFinalVerification } = require('./final-verification');

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

async function runAllTests() {
  log('🧪 Running Complete Test Suite for Doctor Reception System');
  log('='.repeat(70));
  
  const results = {
    database: false,
    e2e: false,
    verification: false
  };
  
  try {
    log('📊 1/3 Running Database Tests...');
    results.database = await runDatabaseTests();
    log(`Database Tests: ${results.database ? 'PASSED' : 'FAILED'}`, results.database ? 'success' : 'error');
  } catch (error) {
    log(`Database Tests: FAILED - ${error.message}`, 'error');
  }
  
  log('-'.repeat(50));
  
  try {
    log('🌐 2/3 Running End-to-End Tests...');
    results.e2e = await runCompleteTests();
    log(`E2E Tests: ${results.e2e ? 'PASSED' : 'FAILED'}`, results.e2e ? 'success' : 'error');
  } catch (error) {
    log(`E2E Tests: FAILED - ${error.message}`, 'error');
  }
  
  log('-'.repeat(50));
  
  try {
    log('🎯 3/3 Running Final Verification...');
    results.verification = await runFinalVerification();
    log(`Final Verification: ${results.verification ? 'PASSED' : 'FAILED'}`, results.verification ? 'success' : 'error');
  } catch (error) {
    log(`Final Verification: FAILED - ${error.message}`, 'error');
  }
  
  // Final Summary
  log('='.repeat(70));
  log('📋 COMPREHENSIVE TEST SUMMARY');
  log('='.repeat(70));
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  
  log(`Database Tests:      ${results.database ? '✅ PASSED' : '❌ FAILED'}`);
  log(`End-to-End Tests:    ${results.e2e ? '✅ PASSED' : '❌ FAILED'}`);
  log(`Final Verification:  ${results.verification ? '✅ PASSED' : '❌ FAILED'}`);
  log('');
  log(`Overall: ${passedTests}/${totalTests} test suites passed`);
  
  if (passedTests === totalTests) {
    log('');
    log('🎉 ALL TESTS PASSED! Your Doctor Reception System is fully functional!', 'success');
    log('');
    log('🚀 Ready for Production:');
    log('   ✅ Database connection and operations working');
    log('   ✅ Frontend and backend integration working');
    log('   ✅ Authentication flow working');
    log('   ✅ Protected routes working');
    log('   ✅ PWA configuration working');
    log('   ✅ API endpoints working');
    log('');
    log('📱 Test your app now:');
    log('   1. Open http://localhost:3000');
    log('   2. Sign up as a doctor');
    log('   3. Record a consultation');
    log('   4. Generate AI summaries');
    log('');
    log('🌐 Deploy to production:');
    log('   Follow the guide in DEPLOYMENT.md');
    
  } else {
    log('');
    log('⚠️  Some tests failed. Please check the issues above.', 'warning');
    
    if (!results.database) {
      log('   🔧 Database: Check Supabase connection and credentials', 'error');
    }
    
    if (!results.e2e) {
      log('   🔧 E2E: Check server status and RLS policies', 'error');
    }
    
    if (!results.verification) {
      log('   🔧 Verification: Run database/fix-rls-policies.sql in Supabase', 'error');
    }
  }
  
  log('='.repeat(70));
  
  return passedTests === totalTests;
}

// Run all tests
if (require.main === module) {
  runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      log(`Fatal error: ${error.message}`, 'error');
      process.exit(1);
    });
}

module.exports = { runAllTests };
