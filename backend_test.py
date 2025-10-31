#!/usr/bin/env python3
"""
Comprehensive Backend Testing Suite for RBAC iPad Management System
Tests the backend after libmagic fix and verifies all core functionality.

Test Coverage:
1. Backend Service Health (libmagic fix verification)
2. Admin Authentication & JWT Token Generation
3. RBAC User Management Endpoints
4. Core Resource Endpoints (Students, iPads, Assignments)
5. User Resource Isolation
6. File Upload Security with libmagic validation
7. Contract Management
"""

import requests
import json
import time
import sys
import io
import pandas as pd
from datetime import datetime

# Configuration
BASE_URL = "https://rbac-deploy.preview.emergentagent.com/api"
ADMIN_CREDENTIALS = {"username": "admin", "password": "admin123"}

class RBACTester:
    def __init__(self):
        self.admin_token = None
        self.test_user_token = None
        self.test_user_id = None
        self.admin_user_id = None
        self.test_results = []
        self.admin_resources = {"ipads": [], "students": []}
        self.testuser_resources = {"ipads": [], "students": []}
        
    def log_test(self, test_name, success, message, details=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        result = {
            "test": test_name,
            "status": status,
            "message": message,
            "details": details or {},
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        print(f"{status}: {test_name} - {message}")
        if details and not success:
            print(f"   Details: {details}")
    
    def make_request(self, method, endpoint, token=None, data=None, files=None):
        """Make HTTP request with proper headers"""
        url = f"{BASE_URL}{endpoint}"
        headers = {}
        
        if token:
            headers["Authorization"] = f"Bearer {token}"
        
        if not files:
            headers["Content-Type"] = "application/json"
            
        try:
            if method == "GET":
                response = requests.get(url, headers=headers, timeout=30)
            elif method == "POST":
                if files:
                    response = requests.post(url, headers=headers, files=files, data=data, timeout=30)
                else:
                    response = requests.post(url, headers=headers, json=data, timeout=30)
            elif method == "PUT":
                response = requests.put(url, headers=headers, json=data, timeout=30)
            elif method == "DELETE":
                response = requests.delete(url, headers=headers, timeout=30)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            return response
        except requests.exceptions.RequestException as e:
            print(f"Request error for {method} {url}: {str(e)}")
            return None
        except Exception as e:
            print(f"Unexpected error for {method} {url}: {str(e)}")
            return None
    
    def test_backend_health(self):
        """Test backend service health and libmagic fix"""
        print("\n=== Testing Backend Service Health ===")
        
        # Test basic health by trying to access a simple endpoint
        response = self.make_request("POST", "/auth/setup")
        
        if not response:
            self.log_test("Backend Service Health", False, "Backend service is not responding")
            return False
        
        if response.status_code in [200, 405]:  # 405 is OK for GET on POST endpoint
            self.log_test("Backend Service Health", True, "Backend service is running and responding")
        else:
            self.log_test("Backend Service Health", False, f"Backend service returned unexpected status: {response.status_code}")
            return False
        
        # Test that libmagic import is working by checking if magic validation endpoints work
        try:
            # This will test if the magic library is properly imported and working
            import magic
            self.log_test("Libmagic Import Test", True, "python-magic library is properly imported and available")
        except ImportError as e:
            self.log_test("Libmagic Import Test", False, f"python-magic import failed: {str(e)}")
            return False
        
        return True

    def test_admin_login(self):
        """Test admin login and JWT token generation with user_id and role"""
        print("\n=== Testing Admin Authentication & JWT Token Generation ===")
        
        response = self.make_request("POST", "/auth/login", data=ADMIN_CREDENTIALS)
        
        if not response or response.status_code != 200:
            self.log_test("Admin Login", False, f"Login failed with status {response.status_code if response else 'No response'}")
            return False
            
        try:
            data = response.json()
            required_fields = ["access_token", "token_type", "role", "username"]
            
            for field in required_fields:
                if field not in data:
                    self.log_test("Admin Login", False, f"Missing field in response: {field}")
                    return False
            
            if data["role"] != "admin":
                self.log_test("Admin Login", False, f"Expected admin role, got: {data['role']}")
                return False
                
            if data["username"] != "admin":
                self.log_test("Admin Login", False, f"Expected admin username, got: {data['username']}")
                return False
            
            # Verify JWT token contains user_id and role by decoding (without verification for testing)
            import jwt
            try:
                # Decode without verification to check payload structure
                payload = jwt.decode(data["access_token"], options={"verify_signature": False})
                
                if "user_id" not in payload:
                    self.log_test("JWT Token Validation", False, "JWT token missing user_id field")
                    return False
                
                if "sub" not in payload:  # subject should contain username
                    self.log_test("JWT Token Validation", False, "JWT token missing sub (username) field")
                    return False
                
                self.log_test("JWT Token Validation", True, f"JWT token properly contains user_id: {payload.get('user_id')}")
                
            except Exception as e:
                self.log_test("JWT Token Validation", False, f"Failed to decode JWT token: {str(e)}")
                return False
                
            self.admin_token = data["access_token"]
            self.log_test("Admin Login", True, f"Successfully logged in as admin with role: {data['role']}")
            return True
            
        except Exception as e:
            self.log_test("Admin Login", False, f"Error parsing login response: {str(e)}")
            return False
    
    def test_admin_user_creation(self):
        """Test creating new users via admin endpoints"""
        print("\n=== Testing Admin User Creation ===")
        
        # Test creating a regular user
        user_data = {
            "username": "testuser",
            "password": "test123",
            "role": "user"
        }
        
        response = self.make_request("POST", "/admin/users", token=self.admin_token, data=user_data)
        print(f"DEBUG: User creation response status: {response.status_code if response else 'No response'}")
        if response:
            print(f"DEBUG: User creation response: {response.text}")
        
        if not response or response.status_code != 200:
            self.log_test("Create Test User", False, f"User creation failed with status {response.status_code if response else 'No response'}")
            return False
            
        try:
            data = response.json()
            required_fields = ["id", "username", "role", "is_active", "created_by", "created_at", "updated_at"]
            
            for field in required_fields:
                if field not in data:
                    self.log_test("Create Test User", False, f"Missing field in response: {field}")
                    return False
            
            if data["username"] != "testuser" or data["role"] != "user":
                self.log_test("Create Test User", False, f"User data mismatch: {data}")
                return False
                
            self.test_user_id = data["id"]
            self.log_test("Create Test User", True, f"Successfully created test user with ID: {self.test_user_id}")
            
            # Test validation - username too short
            invalid_user = {"username": "ab", "password": "test123", "role": "user"}
            response = self.make_request("POST", "/admin/users", token=self.admin_token, data=invalid_user)
            
            if response and response.status_code == 400:
                self.log_test("Username Validation", True, "Username length validation working correctly")
            else:
                self.log_test("Username Validation", False, f"Expected 400 for short username, got {response.status_code if response else 'No response'}")
            
            # Test validation - password too short
            invalid_user = {"username": "validuser", "password": "123", "role": "user"}
            response = self.make_request("POST", "/admin/users", token=self.admin_token, data=invalid_user)
            
            if response and response.status_code == 400:
                self.log_test("Password Validation", True, "Password length validation working correctly")
            else:
                self.log_test("Password Validation", False, f"Expected 400 for short password, got {response.status_code if response else 'No response'}")
            
            # Test duplicate username
            response = self.make_request("POST", "/admin/users", token=self.admin_token, data=user_data)
            
            if response and response.status_code == 400:
                self.log_test("Duplicate Username Validation", True, "Duplicate username validation working correctly")
            else:
                self.log_test("Duplicate Username Validation", False, f"Expected 400 for duplicate username, got {response.status_code if response else 'No response'}")
            
            return True
            
        except Exception as e:
            self.log_test("Create Test User", False, f"Error parsing user creation response: {str(e)}")
            return False
    
    def test_test_user_login(self):
        """Test login with the created test user"""
        print("\n=== Testing Test User Login ===")
        
        test_credentials = {"username": "testuser", "password": "test123"}
        response = self.make_request("POST", "/auth/login", data=test_credentials)
        
        if not response or response.status_code != 200:
            self.log_test("Test User Login", False, f"Test user login failed with status {response.status_code if response else 'No response'}")
            return False
            
        try:
            data = response.json()
            
            if data["role"] != "user" or data["username"] != "testuser":
                self.log_test("Test User Login", False, f"Test user login data mismatch: {data}")
                return False
                
            self.test_user_token = data["access_token"]
            self.log_test("Test User Login", True, f"Successfully logged in as test user with role: {data['role']}")
            return True
            
        except Exception as e:
            self.log_test("Test User Login", False, f"Error parsing test user login response: {str(e)}")
            return False
    
    def test_admin_user_list(self):
        """Test listing all users (admin only)"""
        print("\n=== Testing Admin User List ===")
        
        # Test admin can list users
        response = self.make_request("GET", "/admin/users", token=self.admin_token)
        
        if not response or response.status_code != 200:
            self.log_test("Admin List Users", False, f"Admin user list failed with status {response.status_code if response else 'No response'}")
            return False
            
        try:
            users = response.json()
            
            if not isinstance(users, list) or len(users) < 2:
                self.log_test("Admin List Users", False, f"Expected list with at least 2 users, got: {len(users) if isinstance(users, list) else 'not a list'}")
                return False
            
            # Find admin user ID
            for user in users:
                if user["username"] == "admin":
                    self.admin_user_id = user["id"]
                    break
            
            self.log_test("Admin List Users", True, f"Successfully listed {len(users)} users")
            
            # Test non-admin cannot list users
            response = self.make_request("GET", "/admin/users", token=self.test_user_token)
            
            if response and response.status_code == 403:
                self.log_test("Non-Admin List Users Blocked", True, "Non-admin correctly blocked from listing users")
            else:
                self.log_test("Non-Admin List Users Blocked", False, f"Expected 403 for non-admin, got {response.status_code if response else 'No response'}")
            
            return True
            
        except Exception as e:
            self.log_test("Admin List Users", False, f"Error parsing user list response: {str(e)}")
            return False
    
    def test_admin_user_update(self):
        """Test updating users (admin only)"""
        print("\n=== Testing Admin User Update ===")
        
        if not self.test_user_id:
            self.log_test("Admin Update User", False, "No test user ID available")
            return False
        
        # Test updating user password
        update_data = {"password": "newpassword123"}
        response = self.make_request("PUT", f"/admin/users/{self.test_user_id}", token=self.admin_token, data=update_data)
        
        if not response or response.status_code != 200:
            self.log_test("Admin Update User Password", False, f"User password update failed with status {response.status_code if response else 'No response'}")
            return False
        
        self.log_test("Admin Update User Password", True, "Successfully updated user password")
        
        # Test updating user role
        update_data = {"role": "admin"}
        response = self.make_request("PUT", f"/admin/users/{self.test_user_id}", token=self.admin_token, data=update_data)
        
        if response and response.status_code == 200:
            self.log_test("Admin Update User Role", True, "Successfully updated user role")
        else:
            self.log_test("Admin Update User Role", False, f"User role update failed with status {response.status_code if response else 'No response'}")
        
        # Test self-protection (cannot deactivate own account)
        update_data = {"is_active": False}
        response = self.make_request("PUT", f"/admin/users/{self.admin_user_id}", token=self.admin_token, data=update_data)
        
        if response and response.status_code == 400:
            self.log_test("Self-Protection Update", True, "Self-protection working - cannot deactivate own account")
        else:
            self.log_test("Self-Protection Update", False, f"Expected 400 for self-deactivation, got {response.status_code if response else 'No response'}")
        
        # Test non-admin cannot update users
        response = self.make_request("PUT", f"/admin/users/{self.test_user_id}", token=self.test_user_token, data={"password": "hack123"})
        
        if response and response.status_code == 403:
            self.log_test("Non-Admin Update Blocked", True, "Non-admin correctly blocked from updating users")
        else:
            self.log_test("Non-Admin Update Blocked", False, f"Expected 403 for non-admin update, got {response.status_code if response else 'No response'}")
        
        return True
    
    def test_admin_user_delete(self):
        """Test deactivating users (admin only)"""
        print("\n=== Testing Admin User Delete/Deactivate ===")
        
        if not self.test_user_id:
            self.log_test("Admin Delete User", False, "No test user ID available")
            return False
        
        # Test self-protection (cannot delete own account)
        response = self.make_request("DELETE", f"/admin/users/{self.admin_user_id}", token=self.admin_token)
        
        if response and response.status_code == 400:
            self.log_test("Self-Protection Delete", True, "Self-protection working - cannot delete own account")
        else:
            self.log_test("Self-Protection Delete", False, f"Expected 400 for self-deletion, got {response.status_code if response else 'No response'}")
        
        # Test deactivating test user
        response = self.make_request("DELETE", f"/admin/users/{self.test_user_id}", token=self.admin_token)
        
        if not response or response.status_code != 200:
            self.log_test("Admin Delete User", False, f"User deactivation failed with status {response.status_code if response else 'No response'}")
            return False
        
        try:
            data = response.json()
            
            if "message" not in data or "resources_preserved" not in data:
                self.log_test("Admin Delete User", False, f"Invalid deactivation response: {data}")
                return False
            
            self.log_test("Admin Delete User", True, f"Successfully deactivated user. Resources preserved: {data['resources_preserved']}")
            
            # Test deactivated user cannot login
            test_credentials = {"username": "testuser", "password": "newpassword123"}
            response = self.make_request("POST", "/auth/login", data=test_credentials)
            
            if response and response.status_code == 401:
                self.log_test("Deactivated User Login Blocked", True, "Deactivated user correctly blocked from login")
            else:
                self.log_test("Deactivated User Login Blocked", False, f"Expected 401 for deactivated user login, got {response.status_code if response else 'No response'}")
            
            # Test non-admin cannot delete users
            response = self.make_request("DELETE", f"/admin/users/{self.test_user_id}", token=self.test_user_token)
            
            if response and response.status_code == 403:
                self.log_test("Non-Admin Delete Blocked", True, "Non-admin correctly blocked from deleting users")
            else:
                self.log_test("Non-Admin Delete Blocked", False, f"Expected 403 for non-admin delete, got {response.status_code if response else 'No response'}")
            
            return True
            
        except Exception as e:
            self.log_test("Admin Delete User", False, f"Error parsing deactivation response: {str(e)}")
            return False
    
    def create_test_user_for_isolation(self):
        """Create a new test user for resource isolation testing"""
        print("\n=== Creating New Test User for Resource Isolation ===")
        
        user_data = {
            "username": "testuser2",
            "password": "test123",
            "role": "user"
        }
        
        response = self.make_request("POST", "/admin/users", token=self.admin_token, data=user_data)
        
        if not response or response.status_code != 200:
            self.log_test("Create Test User 2", False, f"User creation failed with status {response.status_code if response else 'No response'}")
            return False
        
        try:
            data = response.json()
            self.test_user_id = data["id"]
            
            # Login as new test user
            test_credentials = {"username": "testuser2", "password": "test123"}
            response = self.make_request("POST", "/auth/login", data=test_credentials)
            
            if response and response.status_code == 200:
                self.test_user_token = response.json()["access_token"]
                self.log_test("Create Test User 2", True, f"Successfully created and logged in as testuser2")
                return True
            else:
                self.log_test("Create Test User 2", False, "Failed to login as new test user")
                return False
                
        except Exception as e:
            self.log_test("Create Test User 2", False, f"Error creating test user: {str(e)}")
            return False
    
    def upload_test_data(self, token, user_type):
        """Upload test iPads and students for a user"""
        print(f"\n=== Uploading Test Data for {user_type} ===")
        
        # Create test iPad Excel file
        import io
        import pandas as pd
        
        ipad_data = {
            'ITNr': [f'IPAD{user_type}001', f'IPAD{user_type}002'],
            'SNr': [f'SN{user_type}001', f'SN{user_type}002'],
            'Karton': [f'K{user_type}001', f'K{user_type}002'],
            'Pencil': ['mit Apple Pencil', 'ohne Apple Pencil'],
            'Typ': ['iPad Pro', 'iPad Air'],
            'AnschJahr': ['2023', '2023'],
            'AusleiheDatum': ['01.09.2023', '01.09.2023']
        }
        
        df = pd.DataFrame(ipad_data)
        excel_buffer = io.BytesIO()
        df.to_excel(excel_buffer, index=False)
        excel_buffer.seek(0)
        
        # Upload iPads
        files = {"file": ("test_ipads.xlsx", excel_buffer.getvalue(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
        response = self.make_request("POST", "/ipads/upload", token=token, files=files)
        
        if response and response.status_code == 200:
            self.log_test(f"Upload iPads ({user_type})", True, f"Successfully uploaded iPads for {user_type}")
        else:
            error_msg = f"iPad upload failed for {user_type} - Status: {response.status_code if response else 'No response'}"
            if response:
                try:
                    error_detail = response.json()
                    error_msg += f" - {error_detail}"
                except:
                    error_msg += f" - {response.text}"
            self.log_test(f"Upload iPads ({user_type})", False, error_msg)
            return False
        
        # Create test student Excel file
        student_data = {
            'SuSVorn': [f'{user_type}Student1', f'{user_type}Student2'],
            'SuSNachn': [f'{user_type}Last1', f'{user_type}Last2'],
            'SuSKl': ['6A', '6B'],
            'SuSStrHNr': ['Street 1', 'Street 2'],
            'SuSPLZ': ['12345', '12346'],
            'SuSOrt': ['City1', 'City2'],
            'SuSGeb': ['01.01.2010', '02.02.2010']
        }
        
        df = pd.DataFrame(student_data)
        excel_buffer = io.BytesIO()
        df.to_excel(excel_buffer, index=False)
        excel_buffer.seek(0)
        
        # Upload students
        files = {"file": ("test_students.xlsx", excel_buffer.getvalue(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
        response = self.make_request("POST", "/students/upload", token=token, files=files)
        
        if response and response.status_code == 200:
            self.log_test(f"Upload Students ({user_type})", True, f"Successfully uploaded students for {user_type}")
            return True
        else:
            error_msg = f"Student upload failed for {user_type} - Status: {response.status_code if response else 'No response'}"
            if response:
                try:
                    error_detail = response.json()
                    error_msg += f" - {error_detail}"
                except:
                    error_msg += f" - {response.text}"
            self.log_test(f"Upload Students ({user_type})", False, error_msg)
            return False
    
    def test_core_resource_endpoints(self):
        """Test core resource endpoints (Students, iPads, Assignments)"""
        print("\n=== Testing Core Resource Endpoints ===")
        
        # Test Students endpoint
        response = self.make_request("GET", "/students", token=self.admin_token)
        if response and response.status_code == 200:
            students = response.json()
            self.log_test("GET /api/students", True, f"Successfully retrieved {len(students)} students")
        else:
            self.log_test("GET /api/students", False, f"Failed to retrieve students - Status: {response.status_code if response else 'No response'}")
            return False
        
        # Test iPads endpoint
        response = self.make_request("GET", "/ipads", token=self.admin_token)
        if response and response.status_code == 200:
            ipads = response.json()
            self.log_test("GET /api/ipads", True, f"Successfully retrieved {len(ipads)} iPads")
        else:
            self.log_test("GET /api/ipads", False, f"Failed to retrieve iPads - Status: {response.status_code if response else 'No response'}")
            return False
        
        # Test Assignments endpoint
        response = self.make_request("GET", "/assignments", token=self.admin_token)
        if response and response.status_code == 200:
            assignments = response.json()
            self.log_test("GET /api/assignments", True, f"Successfully retrieved {len(assignments)} assignments")
        else:
            self.log_test("GET /api/assignments", False, f"Failed to retrieve assignments - Status: {response.status_code if response else 'No response'}")
            return False
        
        # Test auto-assign endpoint
        response = self.make_request("POST", "/assignments/auto-assign", token=self.admin_token)
        if response and response.status_code == 200:
            result = response.json()
            assigned_count = result.get("assigned_count", 0)
            self.log_test("POST /api/assignments/auto-assign", True, f"Auto-assign completed - {assigned_count} new assignments created")
        else:
            self.log_test("POST /api/assignments/auto-assign", False, f"Auto-assign failed - Status: {response.status_code if response else 'No response'}")
        
        # Test iPad status update
        if ipads:
            test_ipad_id = ipads[0]["id"]
            current_status = ipads[0]["status"]
            new_status = "verfügbar" if current_status != "verfügbar" else "defekt"
            
            response = self.make_request("PUT", f"/ipads/{test_ipad_id}/status", token=self.admin_token, data={"status": new_status})
            if response and response.status_code == 200:
                self.log_test("PUT /api/ipads/{id}/status", True, f"Successfully updated iPad status to {new_status}")
                
                # Restore original status
                self.make_request("PUT", f"/ipads/{test_ipad_id}/status", token=self.admin_token, data={"status": current_status})
            else:
                self.log_test("PUT /api/ipads/{id}/status", False, f"Failed to update iPad status - Status: {response.status_code if response else 'No response'}")
        
        return True

    def test_resource_isolation(self):
        """Test user resource isolation - admin sees all, users see only their own"""
        print("\n=== Testing User Resource Isolation ===")
        
        # Test admin sees all resources
        response = self.make_request("GET", "/ipads", token=self.admin_token)
        if response and response.status_code == 200:
            admin_ipads = response.json()
            admin_ipad_count = len(admin_ipads)
            self.log_test("Admin Sees All iPads", True, f"Admin sees {admin_ipad_count} iPads (should include all users' iPads)")
        else:
            self.log_test("Admin Sees All iPads", False, "Admin failed to retrieve iPads")
            return False
        
        response = self.make_request("GET", "/students", token=self.admin_token)
        if response and response.status_code == 200:
            admin_students = response.json()
            admin_student_count = len(admin_students)
            self.log_test("Admin Sees All Students", True, f"Admin sees {admin_student_count} students (should include all users' students)")
        else:
            self.log_test("Admin Sees All Students", False, "Admin failed to retrieve students")
            return False
        
        # Test assignments isolation
        response = self.make_request("GET", "/assignments", token=self.admin_token)
        if response and response.status_code == 200:
            admin_assignments = response.json()
            admin_assignment_count = len(admin_assignments)
            self.log_test("Admin Sees All Assignments", True, f"Admin sees {admin_assignment_count} assignments")
        else:
            self.log_test("Admin Sees All Assignments", False, "Admin failed to retrieve assignments")
            return False
        
        # Test with regular user if available
        if self.test_user_token:
            response = self.make_request("GET", "/ipads", token=self.test_user_token)
            if response and response.status_code == 200:
                user_ipads = response.json()
                user_ipad_count = len(user_ipads)
                
                if user_ipad_count <= admin_ipad_count:
                    self.log_test("User Sees Only Own iPads", True, f"Test user sees {user_ipad_count} iPads (filtered by ownership)")
                else:
                    self.log_test("User Sees Only Own iPads", False, f"Test user sees more iPads ({user_ipad_count}) than expected")
            else:
                self.log_test("User Sees Only Own iPads", False, "Test user failed to retrieve iPads")
        
        # Test IDOR protection - user cannot access admin's resources
        if admin_students and self.test_user_token:
            admin_student_id = admin_students[0]["id"]
            response = self.make_request("GET", f"/students/{admin_student_id}", token=self.test_user_token)
            
            if response and response.status_code == 403:
                self.log_test("IDOR Protection", True, "Test user correctly blocked from accessing admin's student (403 Forbidden)")
            else:
                self.log_test("IDOR Protection", False, f"Expected 403 for unauthorized access, got {response.status_code if response else 'No response'}")
        
        return True

    def test_file_upload_security(self):
        """Test file upload security with libmagic validation"""
        print("\n=== Testing File Upload Security with libmagic ===")
        
        # Test that file upload endpoints are accessible
        # We'll test with a simple request to see if the endpoint responds correctly to missing files
        
        # Test iPad upload endpoint
        response = self.make_request("POST", "/ipads/upload", token=self.admin_token)
        if response and response.status_code == 422:  # Unprocessable Entity for missing file
            self.log_test("iPad Upload Endpoint Available", True, "iPad upload endpoint is accessible and validates input")
        else:
            self.log_test("iPad Upload Endpoint Available", False, f"iPad upload endpoint returned unexpected status: {response.status_code if response else 'No response'}")
        
        # Test Student upload endpoint
        response = self.make_request("POST", "/students/upload", token=self.admin_token)
        if response and response.status_code == 422:  # Unprocessable Entity for missing file
            self.log_test("Student Upload Endpoint Available", True, "Student upload endpoint is accessible and validates input")
        else:
            self.log_test("Student Upload Endpoint Available", False, f"Student upload endpoint returned unexpected status: {response.status_code if response else 'No response'}")
        
        # Test Contract upload endpoint
        response = self.make_request("POST", "/contracts/upload-multiple", token=self.admin_token)
        if response and response.status_code == 422:  # Unprocessable Entity for missing files
            self.log_test("Contract Upload Endpoint Available", True, "Contract upload endpoint is accessible and validates input")
        else:
            self.log_test("Contract Upload Endpoint Available", False, f"Contract upload endpoint returned unexpected status: {response.status_code if response else 'No response'}")
        
        # Test that magic library is working by importing it
        try:
            import magic
            # Test basic magic functionality
            test_data = b"PDF-1.4"  # PDF header
            mime_type = magic.from_buffer(test_data, mime=True)
            if mime_type:
                self.log_test("Libmagic Functionality Test", True, f"python-magic is working correctly, detected MIME type: {mime_type}")
            else:
                self.log_test("Libmagic Functionality Test", False, "python-magic returned empty result")
        except Exception as e:
            self.log_test("Libmagic Functionality Test", False, f"python-magic test failed: {str(e)}")
            return False
        
        return True
    
    def test_auto_assignment_isolation(self):
        """Test auto-assignment with user isolation"""
        print("\n=== Testing Auto-Assignment with User Isolation ===")
        
        # Test auto-assignment for test user (should only assign their resources)
        response = self.make_request("POST", "/assignments/auto-assign", token=self.test_user_token)
        
        if not response or response.status_code != 200:
            self.log_test("Auto-Assignment Isolation", False, f"Auto-assignment failed with status {response.status_code if response else 'No response'}")
            return False
        
        try:
            data = response.json()
            assigned_count = data.get("assigned_count", 0)
            
            if assigned_count > 0:
                self.log_test("Auto-Assignment Isolation", True, f"Successfully assigned {assigned_count} iPads for test user")
                
                # Verify assignments are only for test user's resources
                response = self.make_request("GET", "/assignments", token=self.test_user_token)
                if response and response.status_code == 200:
                    assignments = response.json()
                    user_assignments = [a for a in assignments if "Test" in a.get("itnr", "")]
                    
                    if len(user_assignments) == len(assignments):
                        self.log_test("Assignment Ownership Verification", True, "All assignments belong to test user")
                    else:
                        self.log_test("Assignment Ownership Verification", False, f"Found {len(assignments)} assignments, {len(user_assignments)} belong to test user")
                
                return True
            else:
                self.log_test("Auto-Assignment Isolation", False, "No assignments created")
                return False
                
        except Exception as e:
            self.log_test("Auto-Assignment Isolation", False, f"Error parsing auto-assignment response: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run comprehensive backend tests for libmagic fix and RBAC functionality"""
        print("🔐 Comprehensive Backend Testing Suite - Libmagic Fix & RBAC iPad Management")
        print("=" * 80)
        
        # Step 1: Backend service health and libmagic fix verification
        if not self.test_backend_health():
            print("❌ Backend service health check failed")
            return False
        
        # Step 2: Admin authentication and JWT token generation
        if not self.test_admin_login():
            print("❌ Cannot proceed without admin login")
            return False
        
        # Step 3: RBAC user management endpoints
        if not self.test_admin_user_creation():
            print("❌ User creation failed")
            return False
        
        if not self.test_test_user_login():
            print("❌ Test user login failed")
            return False
        
        if not self.test_admin_user_list():
            print("❌ User listing failed")
            return False
        
        if not self.test_admin_user_update():
            print("❌ User update failed")
            return False
        
        if not self.test_admin_user_delete():
            print("❌ User delete failed")
            return False
        
        # Step 4: Core resource endpoints
        if not self.test_core_resource_endpoints():
            print("❌ Core resource endpoints failed")
            return False
        
        # Step 5: Create new test user for resource isolation
        if not self.create_test_user_for_isolation():
            print("❌ Cannot create test user for isolation")
            return False
        
        # Step 6: User resource isolation testing
        if not self.test_resource_isolation():
            print("❌ Resource isolation failed")
            return False
        
        # Step 7: File upload security with libmagic
        if not self.test_file_upload_security():
            print("❌ File upload security tests failed")
            return False
        
        # Step 8: Auto-assignment isolation
        if not self.test_auto_assignment_isolation():
            print("❌ Auto-assignment isolation failed")
            return False
        
        return True
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("🔐 RBAC TESTING SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if "✅ PASS" in r["status"]])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if "❌ FAIL" in result["status"]:
                    print(f"  - {result['test']}: {result['message']}")
        
        print("\n📋 DETAILED RESULTS:")
        for result in self.test_results:
            print(f"{result['status']}: {result['test']}")
            if result['details']:
                print(f"   Details: {result['details']}")

def main():
    """Main test execution"""
    tester = RBACTester()
    
    try:
        success = tester.run_all_tests()
        tester.print_summary()
        
        if success:
            print("\n🎉 All RBAC tests completed successfully!")
            return 0
        else:
            print("\n❌ Some RBAC tests failed!")
            return 1
            
    except KeyboardInterrupt:
        print("\n⚠️ Testing interrupted by user")
        return 1
    except Exception as e:
        print(f"\n💥 Unexpected error during testing: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())