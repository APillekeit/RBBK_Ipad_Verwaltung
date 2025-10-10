#!/usr/bin/env python3
"""
SECURITY TESTING SUITE for iPad Management System
Tests for common security vulnerabilities
"""

import requests
import jwt
import time
import os
from datetime import datetime, timedelta

class SecurityTester:
    def __init__(self, base_url="http://localhost:8001"):
        self.base_url = base_url
        self.token = None
        
    def test_authentication_bypass(self):
        """Test for authentication bypass vulnerabilities"""
        print("🔍 Testing Authentication Bypass...")
        
        # Test 1: Access protected endpoint without token
        response = requests.get(f"{self.base_url}/api/students")
        assert response.status_code == 403, "Unprotected endpoint found!"
        
        # Test 2: Invalid JWT token
        headers = {"Authorization": "Bearer invalid_token"}
        response = requests.get(f"{self.base_url}/api/students", headers=headers)
        assert response.status_code == 401, "Invalid token accepted!"
        
        print("✅ Authentication bypass tests passed")
    
    def test_rate_limiting(self):
        """Test rate limiting on login endpoint"""
        print("🔍 Testing Rate Limiting...")
        
        login_url = f"{self.base_url}/api/auth/login"
        payload = {"username": "admin", "password": "wrong_password"}
        
        # Make 6 rapid requests (limit is 5/minute)
        responses = []
        for i in range(6):
            response = requests.post(login_url, json=payload)
            responses.append(response.status_code)
            time.sleep(0.1)
        
        # Should get rate limited (429) on 6th request
        assert 429 in responses, "Rate limiting not working!"
        print("✅ Rate limiting tests passed")
    
    def test_file_upload_security(self):
        """Test file upload security"""
        print("🔍 Testing File Upload Security...")
        
        # Login first
        self._login()
        headers = {"Authorization": f"Bearer {self.token}"}
        
        # Test 1: Oversized file (simulated)
        large_content = b"A" * (20 * 1024 * 1024)  # 20MB
        files = {"file": ("large.xlsx", large_content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
        
        response = requests.post(f"{self.base_url}/api/ipads/upload", files=files, headers=headers)
        assert response.status_code == 400, "Large file accepted!"
        
        # Test 2: Wrong file type
        files = {"file": ("test.txt", b"test content", "text/plain")}
        response = requests.post(f"{self.base_url}/api/ipads/upload", files=files, headers=headers)
        assert response.status_code == 400, "Wrong file type accepted!"
        
        print("✅ File upload security tests passed")
    
    def test_xss_injection(self):
        """Test XSS injection in text fields"""
        print("🔍 Testing XSS Injection...")
        
        self._login()
        headers = {"Authorization": f"Bearer {self.token}", "Content-Type": "application/json"}
        
        # Test XSS payload in settings
        xss_payload = {"ipad_typ": "<script>alert('XSS')</script>Apple iPad"}
        response = requests.put(f"{self.base_url}/api/settings/global", json=xss_payload, headers=headers)
        
        # Check if XSS was sanitized
        response = requests.get(f"{self.base_url}/api/settings/global", headers=headers)
        if response.status_code == 200:
            data = response.json()
            assert "<script>" not in data.get("ipad_typ", ""), "XSS not sanitized!"
        
        print("✅ XSS injection tests passed")
    
    def test_cors_headers(self):
        """Test CORS configuration"""
        print("🔍 Testing CORS Headers...")
        
        headers = {"Origin": "https://malicious-site.com"}
        response = requests.options(f"{self.base_url}/api/students", headers=headers)
        
        # Should not allow arbitrary origins
        cors_header = response.headers.get("Access-Control-Allow-Origin", "")
        assert cors_header != "*", "CORS allows all origins!"
        
        print("✅ CORS security tests passed")
    
    def test_security_headers(self):
        """Test presence of security headers"""
        print("🔍 Testing Security Headers...")
        
        response = requests.get(f"{self.base_url}/api/auth/setup")
        headers = response.headers
        
        required_headers = [
            "X-Content-Type-Options",
            "X-Frame-Options", 
            "X-XSS-Protection",
            "Content-Security-Policy"
        ]
        
        for header in required_headers:
            assert header in headers, f"Missing security header: {header}"
        
        print("✅ Security headers tests passed")
    
    def _login(self):
        """Helper method to login and get token"""
        if self.token:
            return
            
        response = requests.post(f"{self.base_url}/api/auth/login", 
                               json={"username": "admin", "password": "admin123"})
        if response.status_code == 200:
            self.token = response.json()["access_token"]
    
    def run_all_tests(self):
        """Run all security tests"""
        print("🚨 STARTING SECURITY AUDIT")
        print("=" * 50)
        
        try:
            self.test_authentication_bypass()
            self.test_rate_limiting() 
            self.test_file_upload_security()
            self.test_xss_injection()
            self.test_cors_headers()
            self.test_security_headers()
            
            print("\n🎉 ALL SECURITY TESTS PASSED!")
            
        except AssertionError as e:
            print(f"\n❌ SECURITY TEST FAILED: {e}")
            return False
        except Exception as e:
            print(f"\n💥 TEST ERROR: {e}")
            return False
        
        return True

if __name__ == "__main__":
    tester = SecurityTester()
    tester.run_all_tests()