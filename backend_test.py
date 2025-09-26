#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for iPad Management System
Tests all endpoints with proper authentication and data validation
"""

import requests
import sys
import os
from datetime import datetime
import json

class IPadManagementTester:
    def __init__(self, base_url="https://ipadtrack.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_result(self, test_name, success, message="", response_data=None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            status = "✅ PASS"
        else:
            status = "❌ FAIL"
        
        result = f"{status} - {test_name}: {message}"
        print(result)
        self.test_results.append({
            'test': test_name,
            'success': success,
            'message': message,
            'response_data': response_data
        })
        return success

    def run_api_test(self, name, method, endpoint, expected_status, data=None, files=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'
        
        if files:
            # Remove Content-Type for file uploads
            headers.pop('Content-Type', None)

        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                if files:
                    response = requests.post(url, files=files, headers=headers, timeout=30)
                else:
                    response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)

            success = response.status_code == expected_status
            
            try:
                response_json = response.json()
            except:
                response_json = {"raw_response": response.text}

            if success:
                message = f"Status: {response.status_code}"
                if 'message' in response_json:
                    message += f" - {response_json['message']}"
            else:
                message = f"Expected {expected_status}, got {response.status_code}"
                if 'detail' in response_json:
                    message += f" - {response_json['detail']}"

            return self.log_result(name, success, message, response_json)

        except requests.exceptions.RequestException as e:
            return self.log_result(name, False, f"Request failed: {str(e)}")
        except Exception as e:
            return self.log_result(name, False, f"Unexpected error: {str(e)}")

    def test_admin_setup(self):
        """Test admin user setup"""
        return self.run_api_test(
            "Admin Setup",
            "POST",
            "auth/setup",
            200
        )

    def test_login(self, username="admin", password="admin123"):
        """Test login and get token"""
        success = self.run_api_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"username": username, "password": password}
        )
        
        if success and self.test_results[-1]['response_data'].get('access_token'):
            self.token = self.test_results[-1]['response_data']['access_token']
            print(f"   🔑 Token acquired: {self.token[:20]}...")
            return True
        return False

    def test_upload_ipads(self):
        """Test iPad upload"""
        try:
            with open('/app/test_ipads.xlsx', 'rb') as f:
                files = {'file': ('test_ipads.xlsx', f, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
                return self.run_api_test(
                    "Upload iPads",
                    "POST",
                    "ipads/upload",
                    200,
                    files=files
                )
        except FileNotFoundError:
            return self.log_result("Upload iPads", False, "Test file /app/test_ipads.xlsx not found")

    def test_get_ipads(self):
        """Test getting iPads list"""
        success = self.run_api_test(
            "Get iPads",
            "GET",
            "ipads",
            200
        )
        
        if success:
            ipads = self.test_results[-1]['response_data']
            if isinstance(ipads, list):
                print(f"   📱 Found {len(ipads)} iPads")
                if len(ipads) > 0:
                    print(f"   📱 Sample iPad: {ipads[0].get('itnr', 'N/A')} - Status: {ipads[0].get('status', 'N/A')}")
            return True
        return False

    def test_upload_students(self):
        """Test student upload"""
        try:
            with open('/app/test_students.xlsx', 'rb') as f:
                files = {'file': ('test_students.xlsx', f, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
                return self.run_api_test(
                    "Upload Students",
                    "POST",
                    "students/upload",
                    200,
                    files=files
                )
        except FileNotFoundError:
            return self.log_result("Upload Students", False, "Test file /app/test_students.xlsx not found")

    def test_get_students(self):
        """Test getting students list"""
        success = self.run_api_test(
            "Get Students",
            "GET",
            "students",
            200
        )
        
        if success:
            students = self.test_results[-1]['response_data']
            if isinstance(students, list):
                print(f"   👥 Found {len(students)} students")
                if len(students) > 0:
                    student = students[0]
                    print(f"   👥 Sample Student: {student.get('sus_vorn', 'N/A')} {student.get('sus_nachn', 'N/A')}")
            return True
        return False

    def test_auto_assign(self):
        """Test automatic assignment"""
        return self.run_api_test(
            "Auto Assignment",
            "POST",
            "assignments/auto-assign",
            200
        )

    def test_get_assignments(self):
        """Test getting assignments list"""
        success = self.run_api_test(
            "Get Assignments",
            "GET",
            "assignments",
            200
        )
        
        if success:
            assignments = self.test_results[-1]['response_data']
            if isinstance(assignments, list):
                print(f"   🔗 Found {len(assignments)} assignments")
                if len(assignments) > 0:
                    assignment = assignments[0]
                    print(f"   🔗 Sample Assignment: iPad {assignment.get('itnr', 'N/A')} → {assignment.get('student_name', 'N/A')}")
            return True
        return False

    def test_student_detail_view(self):
        """Test student detail view endpoint"""
        print("\n🔍 Testing Student Detail View Endpoint...")
        
        # First get list of students to test with
        success = self.run_api_test(
            "Get Students for Detail Testing",
            "GET",
            "students",
            200
        )
        
        if not success:
            return self.log_result("Student Detail View", False, "Could not get students list for testing")
        
        students = self.test_results[-1]['response_data']
        if not isinstance(students, list) or len(students) == 0:
            return self.log_result("Student Detail View", False, "No students found for testing")
        
        # Test with first student
        test_student = students[0]
        student_id = test_student['id']
        student_name = f"{test_student.get('sus_vorn', '')} {test_student.get('sus_nachn', '')}"
        
        print(f"   👤 Testing with student: {student_name} (ID: {student_id})")
        
        # Test valid student ID
        success = self.run_api_test(
            f"Student Detail View - {student_name}",
            "GET",
            f"students/{student_id}",
            200
        )
        
        if success:
            detail_data = self.test_results[-1]['response_data']
            
            # Verify response structure
            required_fields = ['student', 'current_assignment', 'assignment_history', 'contracts']
            missing_fields = [field for field in required_fields if field not in detail_data]
            
            if missing_fields:
                return self.log_result(
                    "Student Detail View Structure", 
                    False, 
                    f"Missing required fields: {missing_fields}"
                )
            
            # Verify student data completeness
            student_data = detail_data['student']
            print(f"      ✅ Student data: {student_data.get('sus_vorn')} {student_data.get('sus_nachn')}")
            print(f"      📚 Class: {student_data.get('sus_kl', 'N/A')}")
            print(f"      🏠 Address: {student_data.get('sus_str_hnr', 'N/A')}, {student_data.get('sus_plz', 'N/A')} {student_data.get('sus_ort', 'N/A')}")
            
            # Check assignment info
            current_assignment = detail_data['current_assignment']
            assignment_history = detail_data['assignment_history']
            contracts = detail_data['contracts']
            
            print(f"      📱 Current assignment: {'Yes' if current_assignment else 'No'}")
            print(f"      📋 Assignment history: {len(assignment_history)} entries")
            print(f"      📄 Related contracts: {len(contracts)} contracts")
            
            # Test with non-existent student ID
            fake_student_id = "non-existent-student-id-12345"
            not_found_success = self.run_api_test(
                "Student Detail View - Non-existent ID",
                "GET",
                f"students/{fake_student_id}",
                404
            )
            
            if success and not_found_success:
                return self.log_result(
                    "Student Detail View", 
                    True, 
                    f"Successfully retrieved details for {student_name} and properly handled 404 for invalid ID"
                )
            else:
                return self.log_result(
                    "Student Detail View", 
                    False, 
                    "Failed to handle non-existent student ID properly"
                )
        else:
            return self.log_result("Student Detail View", False, "Failed to get student details")

    def test_student_cascading_delete(self):
        """Test student cascading delete endpoint"""
        print("\n🔍 Testing Student Cascading Delete Endpoint...")
        
        # First get list of students
        success = self.run_api_test(
            "Get Students for Delete Testing",
            "GET",
            "students",
            200
        )
        
        if not success:
            return self.log_result("Student Cascading Delete", False, "Could not get students list for testing")
        
        students = self.test_results[-1]['response_data']
        if not isinstance(students, list) or len(students) == 0:
            return self.log_result("Student Cascading Delete", False, "No students found for testing")
        
        # Get assignments to find students with and without active assignments
        assignments_success = self.run_api_test(
            "Get Assignments for Delete Testing",
            "GET",
            "assignments",
            200
        )
        
        if not assignments_success:
            return self.log_result("Student Cascading Delete", False, "Could not get assignments for testing")
        
        assignments = self.test_results[-1]['response_data']
        assigned_student_ids = [a['student_id'] for a in assignments if a.get('is_active', True)]
        
        # Find a student WITH active assignment
        student_with_assignment = None
        student_without_assignment = None
        
        for student in students:
            if student['id'] in assigned_student_ids and not student_with_assignment:
                student_with_assignment = student
            elif student['id'] not in assigned_student_ids and not student_without_assignment:
                student_without_assignment = student
        
        test_results = []
        
        # Test 1: Delete student WITH active assignment
        if student_with_assignment:
            student_id = student_with_assignment['id']
            student_name = f"{student_with_assignment.get('sus_vorn', '')} {student_with_assignment.get('sus_nachn', '')}"
            
            print(f"   🧪 Test 1: Deleting student WITH active assignment: {student_name}")
            
            # Get assignment details before deletion
            assignment_before = None
            ipad_id_before = None
            for assignment in assignments:
                if assignment['student_id'] == student_id and assignment.get('is_active', True):
                    assignment_before = assignment
                    ipad_id_before = assignment['ipad_id']
                    break
            
            if assignment_before:
                print(f"      📱 Student has active assignment to iPad: {assignment_before['itnr']}")
                
                # Perform deletion
                delete_success = self.run_api_test(
                    f"Delete Student with Assignment - {student_name}",
                    "DELETE",
                    f"students/{student_id}",
                    200
                )
                
                if delete_success:
                    delete_response = self.test_results[-1]['response_data']
                    print(f"      ✅ Deletion response: {delete_response.get('message', 'N/A')}")
                    print(f"      📊 Deleted assignments: {delete_response.get('deleted_assignments', 0)}")
                    print(f"      📄 Deleted contracts: {delete_response.get('deleted_contracts', 0)}")
                    print(f"      🔄 Dissolved active assignment: {delete_response.get('dissolved_active_assignment', False)}")
                    
                    # Verify iPad status was updated to "verfügbar"
                    if ipad_id_before:
                        ipads_success = self.run_api_test(
                            "Get iPads after Student Deletion",
                            "GET",
                            "ipads",
                            200
                        )
                        
                        if ipads_success:
                            ipads = self.test_results[-1]['response_data']
                            ipad_after = next((ipad for ipad in ipads if ipad['id'] == ipad_id_before), None)
                            
                            if ipad_after:
                                if ipad_after['status'] == 'verfügbar' and not ipad_after.get('current_assignment_id'):
                                    print(f"      ✅ iPad {assignment_before['itnr']} status correctly set to 'verfügbar'")
                                    test_results.append(True)
                                else:
                                    print(f"      ❌ iPad {assignment_before['itnr']} status not properly updated: {ipad_after['status']}")
                                    test_results.append(False)
                            else:
                                print(f"      ❌ Could not find iPad after deletion")
                                test_results.append(False)
                        else:
                            test_results.append(False)
                    else:
                        test_results.append(True)  # No iPad to check
                else:
                    test_results.append(False)
            else:
                print(f"      ⚠️ Student marked as having assignment but no active assignment found")
                test_results.append(False)
        else:
            print(f"   ⚠️ No student with active assignment found for testing")
            test_results.append(False)
        
        # Test 2: Delete student WITHOUT active assignment
        if student_without_assignment:
            student_id = student_without_assignment['id']
            student_name = f"{student_without_assignment.get('sus_vorn', '')} {student_without_assignment.get('sus_nachn', '')}"
            
            print(f"\n   🧪 Test 2: Deleting student WITHOUT active assignment: {student_name}")
            
            delete_success = self.run_api_test(
                f"Delete Student without Assignment - {student_name}",
                "DELETE",
                f"students/{student_id}",
                200
            )
            
            if delete_success:
                delete_response = self.test_results[-1]['response_data']
                print(f"      ✅ Deletion response: {delete_response.get('message', 'N/A')}")
                print(f"      📊 Deleted assignments: {delete_response.get('deleted_assignments', 0)}")
                print(f"      📄 Deleted contracts: {delete_response.get('deleted_contracts', 0)}")
                test_results.append(True)
            else:
                test_results.append(False)
        else:
            print(f"   ⚠️ No student without active assignment found for testing")
            test_results.append(False)
        
        # Test 3: Delete non-existent student
        fake_student_id = "non-existent-student-id-12345"
        not_found_success = self.run_api_test(
            "Delete Non-existent Student",
            "DELETE",
            f"students/{fake_student_id}",
            404
        )
        
        if not_found_success:
            print(f"      ✅ Properly returned 404 for non-existent student")
            test_results.append(True)
        else:
            test_results.append(False)
        
        # Verify data integrity - check that no orphaned data remains
        print(f"\n   🔍 Verifying data integrity after deletions...")
        
        # Check that deleted students are actually gone
        final_students_success = self.run_api_test(
            "Get Students after Deletions",
            "GET",
            "students",
            200
        )
        
        if final_students_success:
            final_students = self.test_results[-1]['response_data']
            deleted_student_ids = []
            if student_with_assignment:
                deleted_student_ids.append(student_with_assignment['id'])
            if student_without_assignment:
                deleted_student_ids.append(student_without_assignment['id'])
            
            remaining_deleted_students = [s for s in final_students if s['id'] in deleted_student_ids]
            
            if len(remaining_deleted_students) == 0:
                print(f"      ✅ All deleted students properly removed from database")
                test_results.append(True)
            else:
                print(f"      ❌ {len(remaining_deleted_students)} deleted students still found in database")
                test_results.append(False)
        else:
            test_results.append(False)
        
        # Calculate overall success
        successful_tests = sum(test_results)
        total_tests = len(test_results)
        
        if successful_tests == total_tests:
            return self.log_result(
                "Student Cascading Delete", 
                True, 
                f"All {total_tests} deletion tests passed successfully"
            )
        else:
            return self.log_result(
                "Student Cascading Delete", 
                False, 
                f"Only {successful_tests}/{total_tests} deletion tests passed"
            )

    def test_ipad_status_consistency_fix(self):
        """Test iPad status consistency validation and fix functionality"""
        print("\n🔍 Testing iPad Status Consistency Fix...")
        
        # Step 1: Check current iPad status consistency
        print("\n   📊 Step 1: Analyzing current iPad status consistency...")
        
        success = self.run_api_test(
            "Get iPads for Consistency Check",
            "GET",
            "ipads",
            200
        )
        
        if not success:
            return self.log_result("iPad Status Consistency Fix", False, "Could not get iPads for testing")
        
        ipads = self.test_results[-1]['response_data']
        if not isinstance(ipads, list):
            return self.log_result("iPad Status Consistency Fix", False, "Invalid iPads response")
        
        # Identify inconsistent iPads (status "verfügbar" but current_assignment_id not None)
        inconsistent_ipads = []
        consistent_ipads = []
        
        for ipad in ipads:
            status = ipad.get('status', '')
            current_assignment_id = ipad.get('current_assignment_id')
            itnr = ipad.get('itnr', 'Unknown')
            
            if status == 'verfügbar' and current_assignment_id is not None:
                inconsistent_ipads.append(ipad)
                print(f"      ❌ INCONSISTENT: iPad {itnr} - Status: '{status}' but current_assignment_id: {current_assignment_id}")
            else:
                consistent_ipads.append(ipad)
                print(f"      ✅ CONSISTENT: iPad {itnr} - Status: '{status}', current_assignment_id: {current_assignment_id}")
        
        print(f"\n   📈 Consistency Analysis Results:")
        print(f"      Total iPads: {len(ipads)}")
        print(f"      Consistent iPads: {len(consistent_ipads)}")
        print(f"      Inconsistent iPads: {len(inconsistent_ipads)}")
        
        # Check for specific iPad "IPAD001" mentioned in the review request
        ipad001 = next((ipad for ipad in ipads if ipad.get('itnr') == 'IPAD001'), None)
        if ipad001:
            print(f"\n   🔍 Special Check - IPAD001 Status:")
            print(f"      Status: {ipad001.get('status')}")
            print(f"      Current Assignment ID: {ipad001.get('current_assignment_id')}")
            if ipad001.get('status') == 'verfügbar' and ipad001.get('current_assignment_id') is not None:
                print(f"      ❌ IPAD001 has the reported inconsistency!")
            else:
                print(f"      ✅ IPAD001 appears consistent")
        else:
            print(f"\n   ⚠️  IPAD001 not found in database")
        
        # Step 2: Test the fix endpoint
        print(f"\n   🔧 Step 2: Testing iPad status consistency fix endpoint...")
        
        fix_success = self.run_api_test(
            "iPad Status Consistency Fix",
            "POST",
            "ipads/fix-status-consistency",
            200
        )
        
        if not fix_success:
            return self.log_result("iPad Status Consistency Fix", False, "Fix endpoint failed")
        
        fix_response = self.test_results[-1]['response_data']
        fixed_count = fix_response.get('fixed_ipads', 0)
        fix_details = fix_response.get('details', [])
        
        print(f"      ✅ Fix Response: {fix_response.get('message', 'N/A')}")
        print(f"      📊 Fixed iPads Count: {fixed_count}")
        print(f"      📋 Fix Details: {fix_details}")
        
        # Verify the fix worked as expected
        if len(inconsistent_ipads) > 0:
            if fixed_count == len(inconsistent_ipads):
                print(f"      ✅ Fix count matches identified inconsistencies")
            else:
                print(f"      ⚠️  Fix count ({fixed_count}) doesn't match identified inconsistencies ({len(inconsistent_ipads)})")
        
        # Step 3: Verify consistency after fix
        print(f"\n   🔍 Step 3: Verifying consistency after fix...")
        
        post_fix_success = self.run_api_test(
            "Get iPads After Fix",
            "GET",
            "ipads",
            200
        )
        
        if not post_fix_success:
            return self.log_result("iPad Status Consistency Fix", False, "Could not verify iPads after fix")
        
        post_fix_ipads = self.test_results[-1]['response_data']
        post_fix_inconsistent = []
        
        for ipad in post_fix_ipads:
            status = ipad.get('status', '')
            current_assignment_id = ipad.get('current_assignment_id')
            itnr = ipad.get('itnr', 'Unknown')
            
            if status == 'verfügbar' and current_assignment_id is not None:
                post_fix_inconsistent.append(ipad)
                print(f"      ❌ STILL INCONSISTENT: iPad {itnr} - Status: '{status}' but current_assignment_id: {current_assignment_id}")
        
        if len(post_fix_inconsistent) == 0:
            print(f"      ✅ All iPads are now consistent!")
        else:
            print(f"      ❌ {len(post_fix_inconsistent)} iPads still inconsistent after fix")
        
        # Step 4: Test status update logic
        print(f"\n   🧪 Step 4: Testing corrected status update logic...")
        
        # Find an iPad to test with
        test_ipad = None
        for ipad in post_fix_ipads:
            if ipad.get('status') == 'verfügbar':
                test_ipad = ipad
                break
        
        if not test_ipad:
            print(f"      ⚠️  No available iPad found for status update testing")
            status_update_results = [False]
        else:
            ipad_id = test_ipad['id']
            itnr = test_ipad['itnr']
            print(f"      🧪 Testing with iPad: {itnr}")
            
            status_update_results = []
            
            # Test updating to "defekt" - should clear current_assignment_id
            defekt_success = self.run_api_test(
                f"Update iPad {itnr} to defekt",
                "PUT",
                f"ipads/{ipad_id}/status?status=defekt",
                200
            )
            
            if defekt_success:
                # Verify the iPad status and current_assignment_id
                verify_success = self.run_api_test(
                    "Verify iPad After Defekt Update",
                    "GET",
                    "ipads",
                    200
                )
                
                if verify_success:
                    updated_ipads = self.test_results[-1]['response_data']
                    updated_ipad = next((ipad for ipad in updated_ipads if ipad['id'] == ipad_id), None)
                    
                    if updated_ipad:
                        if updated_ipad['status'] == 'defekt' and updated_ipad.get('current_assignment_id') is None:
                            print(f"        ✅ Status 'defekt' correctly clears current_assignment_id")
                            status_update_results.append(True)
                        else:
                            print(f"        ❌ Status 'defekt' failed - Status: {updated_ipad['status']}, Assignment: {updated_ipad.get('current_assignment_id')}")
                            status_update_results.append(False)
                    else:
                        status_update_results.append(False)
                else:
                    status_update_results.append(False)
            else:
                status_update_results.append(False)
            
            # Test updating to "gestohlen" - should clear current_assignment_id
            gestohlen_success = self.run_api_test(
                f"Update iPad {itnr} to gestohlen",
                "PUT",
                f"ipads/{ipad_id}/status?status=gestohlen",
                200
            )
            
            if gestohlen_success:
                verify_success = self.run_api_test(
                    "Verify iPad After Gestohlen Update",
                    "GET",
                    "ipads",
                    200
                )
                
                if verify_success:
                    updated_ipads = self.test_results[-1]['response_data']
                    updated_ipad = next((ipad for ipad in updated_ipads if ipad['id'] == ipad_id), None)
                    
                    if updated_ipad:
                        if updated_ipad['status'] == 'gestohlen' and updated_ipad.get('current_assignment_id') is None:
                            print(f"        ✅ Status 'gestohlen' correctly clears current_assignment_id")
                            status_update_results.append(True)
                        else:
                            print(f"        ❌ Status 'gestohlen' failed - Status: {updated_ipad['status']}, Assignment: {updated_ipad.get('current_assignment_id')}")
                            status_update_results.append(False)
                    else:
                        status_update_results.append(False)
                else:
                    status_update_results.append(False)
            else:
                status_update_results.append(False)
            
            # Test updating back to "verfügbar" - should clear current_assignment_id
            verfuegbar_success = self.run_api_test(
                f"Update iPad {itnr} to verfügbar",
                "PUT",
                f"ipads/{ipad_id}/status?status=verfügbar",
                200
            )
            
            if verfuegbar_success:
                verify_success = self.run_api_test(
                    "Verify iPad After Verfügbar Update",
                    "GET",
                    "ipads",
                    200
                )
                
                if verify_success:
                    updated_ipads = self.test_results[-1]['response_data']
                    updated_ipad = next((ipad for ipad in updated_ipads if ipad['id'] == ipad_id), None)
                    
                    if updated_ipad:
                        if updated_ipad['status'] == 'verfügbar' and updated_ipad.get('current_assignment_id') is None:
                            print(f"        ✅ Status 'verfügbar' correctly clears current_assignment_id")
                            status_update_results.append(True)
                        else:
                            print(f"        ❌ Status 'verfügbar' failed - Status: {updated_ipad['status']}, Assignment: {updated_ipad.get('current_assignment_id')}")
                            status_update_results.append(False)
                    else:
                        status_update_results.append(False)
                else:
                    status_update_results.append(False)
            else:
                status_update_results.append(False)
            
            # Test updating to "zugewiesen" - should preserve current_assignment_id if it exists
            # First, let's find an iPad that has an assignment to test with
            assigned_ipad = None
            for ipad in post_fix_ipads:
                if ipad.get('status') == 'zugewiesen' and ipad.get('current_assignment_id'):
                    assigned_ipad = ipad
                    break
            
            if assigned_ipad:
                assigned_ipad_id = assigned_ipad['id']
                assigned_itnr = assigned_ipad['itnr']
                original_assignment_id = assigned_ipad['current_assignment_id']
                
                print(f"      🧪 Testing 'zugewiesen' status preservation with iPad: {assigned_itnr}")
                
                zugewiesen_success = self.run_api_test(
                    f"Update iPad {assigned_itnr} to zugewiesen (preserve assignment)",
                    "PUT",
                    f"ipads/{assigned_ipad_id}/status?status=zugewiesen",
                    200
                )
                
                if zugewiesen_success:
                    verify_success = self.run_api_test(
                        "Verify iPad After Zugewiesen Update",
                        "GET",
                        "ipads",
                        200
                    )
                    
                    if verify_success:
                        updated_ipads = self.test_results[-1]['response_data']
                        updated_ipad = next((ipad for ipad in updated_ipads if ipad['id'] == assigned_ipad_id), None)
                        
                        if updated_ipad:
                            if updated_ipad['status'] == 'zugewiesen' and updated_ipad.get('current_assignment_id') == original_assignment_id:
                                print(f"        ✅ Status 'zugewiesen' correctly preserves current_assignment_id: {original_assignment_id}")
                                status_update_results.append(True)
                            else:
                                print(f"        ❌ Status 'zugewiesen' failed - Status: {updated_ipad['status']}, Assignment: {updated_ipad.get('current_assignment_id')} (expected: {original_assignment_id})")
                                status_update_results.append(False)
                        else:
                            status_update_results.append(False)
                    else:
                        status_update_results.append(False)
                else:
                    status_update_results.append(False)
            else:
                print(f"        ⚠️  No assigned iPad found to test 'zugewiesen' status preservation")
                status_update_results.append(True)  # Skip this test
        
        # Step 5: Test iPad history consistency
        print(f"\n   📚 Step 5: Testing iPad history consistency...")
        
        # Test iPad history endpoint for consistency
        if test_ipad:
            history_success = self.run_api_test(
                f"Get iPad {test_ipad['itnr']} History",
                "GET",
                f"ipads/{test_ipad['id']}/history",
                200
            )
            
            if history_success:
                history_data = self.test_results[-1]['response_data']
                history_ipad = history_data.get('ipad', {})
                
                # Compare status between main list and history
                main_status = test_ipad.get('status')
                history_status = history_ipad.get('status') if isinstance(history_ipad, dict) else None
                
                if main_status == history_status:
                    print(f"        ✅ iPad status consistent between main list and history: {main_status}")
                    history_consistent = True
                else:
                    print(f"        ❌ iPad status inconsistent - Main: {main_status}, History: {history_status}")
                    history_consistent = False
            else:
                history_consistent = False
        else:
            history_consistent = True  # No iPad to test with
        
        # Calculate overall success
        test_results = []
        
        # 1. Fix endpoint worked
        test_results.append(fix_success)
        
        # 2. All inconsistencies were resolved
        test_results.append(len(post_fix_inconsistent) == 0)
        
        # 3. Status update logic works correctly
        if len(status_update_results) > 0:
            test_results.append(all(status_update_results))
        else:
            test_results.append(True)  # No tests to run
        
        # 4. History consistency
        test_results.append(history_consistent)
        
        successful_tests = sum(test_results)
        total_tests = len(test_results)
        
        # Final summary
        print(f"\n   📊 iPad Status Consistency Fix Summary:")
        print(f"      Initial inconsistent iPads: {len(inconsistent_ipads)}")
        print(f"      iPads fixed by endpoint: {fixed_count}")
        print(f"      Remaining inconsistent iPads: {len(post_fix_inconsistent)}")
        print(f"      Status update tests passed: {sum(status_update_results)}/{len(status_update_results) if status_update_results else 0}")
        print(f"      History consistency: {'✅' if history_consistent else '❌'}")
        
        if successful_tests == total_tests:
            return self.log_result(
                "iPad Status Consistency Fix", 
                True, 
                f"All {total_tests} consistency tests passed. Fixed {fixed_count} inconsistent iPads."
            )
        else:
            return self.log_result(
                "iPad Status Consistency Fix", 
                False, 
                f"Only {successful_tests}/{total_tests} consistency tests passed"
            )
    
    def create_test_contract_with_fields(self, form_fields):
        """Helper method to create a test contract with specific form fields"""
        try:
            # Create a minimal PDF structure with form fields
            pdf_content = self.create_pdf_with_form_fields(form_fields)
            
            files = {'files': ('test_contract.pdf', pdf_content, 'application/pdf')}
            
            # Upload the contract
            url = f"{self.base_url}/api/contracts/upload-multiple"
            headers = {}
            if self.token:
                headers['Authorization'] = f'Bearer {self.token}'
            
            response = requests.post(url, files=files, headers=headers, timeout=30)
            
            return response.status_code in [200, 201]
            
        except Exception as e:
            print(f"      Error creating test contract: {str(e)}")
            return False
    
    def create_pdf_with_form_fields(self, form_fields):
        """Create a simple PDF with form fields for testing"""
        # This creates a minimal PDF structure
        # In a real scenario, you'd use a proper PDF library
        pdf_header = b"%PDF-1.4\n"
        
        # Create a simple PDF object structure
        pdf_body = b"""1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
/AcroForm <<
/Fields [3 0 R 4 0 R 5 0 R 6 0 R 7 0 R 8 0 R 9 0 R]
>>
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [10 0 R]
/Count 1
>>
endobj

"""
        
        # Add form field objects
        field_objects = b""
        obj_num = 3
        
        for field_name, field_value in form_fields.items():
            field_obj = f"""{obj_num} 0 obj
<<
/T ({field_name})
/V ({field_value})
/FT /Tx
>>
endobj

""".encode()
            field_objects += field_obj
            obj_num += 1
        
        # Add page object
        page_obj = f"""{obj_num} 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
>>
endobj

""".encode()
        
        # Create xref table
        xref_start = len(pdf_header) + len(pdf_body) + len(field_objects) + len(page_obj)
        
        xref = f"""xref
0 {obj_num + 1}
0000000000 65535 f 
0000000009 00000 n 
0000000074 00000 n 
""".encode()
        
        # Add xref entries for form fields and page
        current_pos = len(pdf_header) + len(pdf_body)
        for i in range(len(form_fields)):
            xref += f"{current_pos:010d} 00000 n \n".encode()
            # Estimate object size (this is approximate)
            current_pos += 50
        
        xref += f"{current_pos:010d} 00000 n \n".encode()  # Page object
        
        trailer = f"""trailer
<<
/Size {obj_num + 1}
/Root 1 0 R
>>
startxref
{xref_start}
%%EOF""".encode()
        
        return pdf_header + pdf_body + field_objects + page_obj + xref + trailer

    def test_global_settings_api(self):
        """Test Global Settings API endpoints"""
        print("\n🔍 Testing Global Settings API Functionality...")
        
        test_results = []
        
        # Step 1: Test GET /api/settings/global - should return default settings
        print("\n   📋 Step 1: Testing GET global settings (default values)...")
        
        success = self.run_api_test(
            "Get Global Settings - Default",
            "GET",
            "settings/global",
            200
        )
        
        if success:
            settings_data = self.test_results[-1]['response_data']
            
            # Verify default settings structure and values
            expected_fields = ['ipad_typ', 'pencil']
            missing_fields = [field for field in expected_fields if field not in settings_data]
            
            if missing_fields:
                print(f"      ❌ Missing response fields: {missing_fields}")
                test_results.append(False)
            else:
                # Check default values
                ipad_typ = settings_data.get('ipad_typ')
                pencil = settings_data.get('pencil')
                
                print(f"      📱 iPad-Typ: {ipad_typ}")
                print(f"      ✏️  Pencil: {pencil}")
                
                # Verify default values match specification
                if ipad_typ == "Apple iPad" and pencil == "ohne Apple Pencil":
                    print(f"      ✅ Default settings correct")
                    test_results.append(True)
                    default_settings = settings_data
                else:
                    print(f"      ❌ Default settings incorrect - Expected: iPad-Typ='Apple iPad', Pencil='ohne Apple Pencil'")
                    test_results.append(False)
                    default_settings = settings_data
        else:
            print(f"      ❌ Failed to get global settings")
            test_results.append(False)
            default_settings = None
        
        # Step 2: Test PUT /api/settings/global - update settings
        print("\n   🔧 Step 2: Testing PUT global settings (update values)...")
        
        new_settings = {
            "ipad_typ": "Apple iPad Pro",
            "pencil": "mit Apple Pencil"
        }
        
        success = self.run_api_test(
            "Update Global Settings",
            "PUT",
            "settings/global",
            200,
            data=new_settings
        )
        
        if success:
            update_response = self.test_results[-1]['response_data']
            
            # Verify update response
            if (update_response.get('ipad_typ') == new_settings['ipad_typ'] and 
                update_response.get('pencil') == new_settings['pencil'] and
                'message' in update_response):
                print(f"      ✅ Settings update successful")
                print(f"         Message: {update_response.get('message')}")
                print(f"         Updated iPad-Typ: {update_response.get('ipad_typ')}")
                print(f"         Updated Pencil: {update_response.get('pencil')}")
                test_results.append(True)
            else:
                print(f"      ❌ Settings update response incorrect")
                print(f"         Response: {update_response}")
                test_results.append(False)
        else:
            print(f"      ❌ Failed to update global settings")
            test_results.append(False)
        
        # Step 3: Test persistence - GET settings again to verify they were saved
        print("\n   🔍 Step 3: Testing settings persistence...")
        
        success = self.run_api_test(
            "Get Global Settings - After Update",
            "GET",
            "settings/global",
            200
        )
        
        if success:
            updated_settings = self.test_results[-1]['response_data']
            
            # Verify settings persisted
            if (updated_settings.get('ipad_typ') == new_settings['ipad_typ'] and 
                updated_settings.get('pencil') == new_settings['pencil']):
                print(f"      ✅ Settings persistence verified")
                print(f"         Persisted iPad-Typ: {updated_settings.get('ipad_typ')}")
                print(f"         Persisted Pencil: {updated_settings.get('pencil')}")
                test_results.append(True)
            else:
                print(f"      ❌ Settings not properly persisted")
                print(f"         Expected: {new_settings}")
                print(f"         Got: {updated_settings}")
                test_results.append(False)
        else:
            print(f"      ❌ Failed to verify settings persistence")
            test_results.append(False)
        
        # Step 4: Test error handling - invalid data
        print("\n   ⚠️  Step 4: Testing error handling...")
        
        # Test with empty data
        success = self.run_api_test(
            "Update Global Settings - Empty Data",
            "PUT",
            "settings/global",
            200,  # Should still work with defaults
            data={}
        )
        
        if success:
            empty_response = self.test_results[-1]['response_data']
            # Should use defaults when empty
            if (empty_response.get('ipad_typ') == "Apple iPad" and 
                empty_response.get('pencil') == "ohne Apple Pencil"):
                print(f"      ✅ Empty data handled correctly (defaults applied)")
                test_results.append(True)
            else:
                print(f"      ❌ Empty data not handled correctly")
                test_results.append(False)
        else:
            print(f"      ❌ Empty data test failed")
            test_results.append(False)
        
        # Step 5: Reset to original settings for other tests
        print("\n   🔄 Step 5: Resetting to default settings...")
        
        reset_settings = {
            "ipad_typ": "Apple iPad",
            "pencil": "ohne Apple Pencil"
        }
        
        success = self.run_api_test(
            "Reset Global Settings to Default",
            "PUT",
            "settings/global",
            200,
            data=reset_settings
        )
        
        if success:
            print(f"      ✅ Settings reset to defaults")
            test_results.append(True)
        else:
            print(f"      ❌ Failed to reset settings")
            test_results.append(False)
        
        # Calculate overall success
        successful_tests = sum(test_results)
        total_tests = len(test_results)
        
        print(f"\n   📊 Global Settings API Summary:")
        print(f"      Total tests: {total_tests}")
        print(f"      Successful tests: {successful_tests}")
        print(f"      Success rate: {(successful_tests/total_tests*100):.1f}%")
        
        if successful_tests == total_tests:
            return self.log_result(
                "Global Settings API", 
                True, 
                f"All {total_tests} global settings tests passed successfully"
            )
        else:
            return self.log_result(
                "Global Settings API", 
                False, 
                f"Only {successful_tests}/{total_tests} global settings tests passed"
            )

    def test_inventory_export_api(self):
        """Test Inventory Export API endpoint"""
        print("\n🔍 Testing Inventory Export API Functionality...")
        
        test_results = []
        
        # Step 1: Test basic inventory export
        print("\n   📊 Step 1: Testing basic inventory export...")
        
        url = f"{self.base_url}/api/exports/inventory"
        headers = {}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'
        
        try:
            response = requests.get(url, headers=headers, timeout=60)  # Longer timeout for file generation
            
            if response.status_code == 200:
                # Verify it's an Excel file
                content_type = response.headers.get('content-type', '')
                content_disposition = response.headers.get('content-disposition', '')
                
                print(f"      📄 Content-Type: {content_type}")
                print(f"      📎 Content-Disposition: {content_disposition}")
                
                # Check content type
                if 'spreadsheet' in content_type or 'excel' in content_type:
                    print(f"      ✅ Correct Excel content type")
                    test_results.append(True)
                else:
                    print(f"      ❌ Incorrect content type: {content_type}")
                    test_results.append(False)
                
                # Check filename in content disposition
                if 'bestandsliste_' in content_disposition and '.xlsx' in content_disposition:
                    print(f"      ✅ Correct filename format with timestamp")
                    test_results.append(True)
                else:
                    print(f"      ❌ Incorrect filename format: {content_disposition}")
                    test_results.append(False)
                
                # Check file size (should not be empty)
                file_size = len(response.content)
                print(f"      📏 File size: {file_size} bytes")
                
                if file_size > 1000:  # Should be at least 1KB for a proper Excel file
                    print(f"      ✅ File size indicates proper Excel content")
                    test_results.append(True)
                    excel_content = response.content
                else:
                    print(f"      ❌ File size too small: {file_size} bytes")
                    test_results.append(False)
                    excel_content = None
                
            else:
                print(f"      ❌ Export failed with status: {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"         Error: {error_data.get('detail', 'Unknown error')}")
                except:
                    print(f"         Raw response: {response.text[:200]}")
                test_results.append(False)
                excel_content = None
                
        except Exception as e:
            print(f"      ❌ Export request exception: {str(e)}")
            test_results.append(False)
            excel_content = None
        
        # Step 2: Verify Excel file structure (if we got content)
        if excel_content:
            print("\n   🔍 Step 2: Analyzing Excel file structure...")
            
            try:
                import pandas as pd
                import io
                
                # Read Excel file
                df = pd.read_excel(io.BytesIO(excel_content))
                
                print(f"      📊 Excel file loaded successfully")
                print(f"      📏 Rows: {len(df)}, Columns: {len(df.columns)}")
                print(f"      📋 Column headers: {list(df.columns)}")
                
                # Check for required headers
                required_headers = [
                    'Sname', 'SuSNachn', 'SuSVorn', 'SuSKl', 'SuSStrHNr', 'SuSPLZ', 'SuSOrt', 'SuSGeb',
                    'Erz1Nachn', 'Erz1Vorn', 'Erz1StrHNr', 'Erz1PLZ', 'Erz1Ort',
                    'Erz2Nachn', 'Erz2Vorn', 'Erz2StrHNr', 'Erz2PLZ', 'Erz2Ort',
                    'Pencil', 'ITNr', 'SNr', 'Typ', 'AnschJahr', 'AusleiheDatum', 'Rückgabe'
                ]
                
                missing_headers = [h for h in required_headers if h not in df.columns]
                
                if not missing_headers:
                    print(f"      ✅ All required headers present")
                    test_results.append(True)
                else:
                    print(f"      ❌ Missing headers: {missing_headers}")
                    test_results.append(False)
                
                # Check if we have data
                if len(df) > 0:
                    print(f"      ✅ Export contains {len(df)} records")
                    test_results.append(True)
                    
                    # Show sample data
                    print(f"      📋 Sample record:")
                    sample_row = df.iloc[0]
                    for col in ['ITNr', 'Typ', 'Pencil', 'SuSVorn', 'SuSNachn']:
                        if col in sample_row:
                            print(f"         {col}: {sample_row[col]}")
                else:
                    print(f"      ⚠️  Export is empty (no records)")
                    test_results.append(True)  # Empty is valid if no data exists
                
            except Exception as e:
                print(f"      ❌ Error analyzing Excel file: {str(e)}")
                test_results.append(False)
        else:
            print("\n   ⚠️  Step 2: Skipped - no Excel content to analyze")
            test_results.append(False)
        
        # Step 3: Test global settings integration
        print("\n   🔧 Step 3: Testing global settings integration...")
        
        # First, set specific global settings
        test_settings = {
            "ipad_typ": "Apple iPad Air",
            "pencil": "mit Apple Pencil 2"
        }
        
        settings_success = self.run_api_test(
            "Set Test Global Settings for Export",
            "PUT",
            "settings/global",
            200,
            data=test_settings
        )
        
        if settings_success:
            # Now export again and check if settings are reflected
            try:
                response = requests.get(url, headers=headers, timeout=60)
                
                if response.status_code == 200:
                    try:
                        import pandas as pd
                        import io
                        
                        df = pd.read_excel(io.BytesIO(response.content))
                        
                        # Check if global settings are used in export
                        if 'Typ' in df.columns and 'Pencil' in df.columns:
                            # Check if any records use the global settings
                            typ_values = df['Typ'].dropna().unique()
                            pencil_values = df['Pencil'].dropna().unique()
                            
                            print(f"      📊 Typ values in export: {list(typ_values)}")
                            print(f"      📊 Pencil values in export: {list(pencil_values)}")
                            
                            # Should contain our test settings
                            if test_settings['ipad_typ'] in typ_values and test_settings['pencil'] in pencil_values:
                                print(f"      ✅ Global settings properly integrated in export")
                                test_results.append(True)
                            else:
                                print(f"      ❌ Global settings not found in export")
                                print(f"         Expected Typ: {test_settings['ipad_typ']}")
                                print(f"         Expected Pencil: {test_settings['pencil']}")
                                test_results.append(False)
                        else:
                            print(f"      ❌ Typ or Pencil columns missing from export")
                            test_results.append(False)
                            
                    except Exception as e:
                        print(f"      ❌ Error checking global settings integration: {str(e)}")
                        test_results.append(False)
                else:
                    print(f"      ❌ Export failed after setting global settings")
                    test_results.append(False)
                    
            except Exception as e:
                print(f"      ❌ Export request exception: {str(e)}")
                test_results.append(False)
        else:
            print(f"      ❌ Could not set test global settings")
            test_results.append(False)
        
        # Step 4: Reset global settings
        print("\n   🔄 Step 4: Resetting global settings...")
        
        reset_settings = {
            "ipad_typ": "Apple iPad",
            "pencil": "ohne Apple Pencil"
        }
        
        self.run_api_test(
            "Reset Global Settings After Export Test",
            "PUT",
            "settings/global",
            200,
            data=reset_settings
        )
        
        # Step 5: Test error scenarios
        print("\n   ⚠️  Step 5: Testing error scenarios...")
        
        # Test without authentication
        try:
            response = requests.get(url, timeout=30)  # No auth headers
            
            if response.status_code == 401:
                print(f"      ✅ Properly requires authentication (401)")
                test_results.append(True)
            else:
                print(f"      ❌ Should require authentication, got: {response.status_code}")
                test_results.append(False)
                
        except Exception as e:
            print(f"      ❌ Auth test exception: {str(e)}")
            test_results.append(False)
        
        # Calculate overall success
        successful_tests = sum(test_results)
        total_tests = len(test_results)
        
        print(f"\n   📊 Inventory Export API Summary:")
        print(f"      Total tests: {total_tests}")
        print(f"      Successful tests: {successful_tests}")
        print(f"      Success rate: {(successful_tests/total_tests*100):.1f}%")
        
        if successful_tests == total_tests:
            return self.log_result(
                "Inventory Export API", 
                True, 
                f"All {total_tests} inventory export tests passed successfully"
            )
        else:
            return self.log_result(
                "Inventory Export API", 
                False, 
                f"Only {successful_tests}/{total_tests} inventory export tests passed"
            )

    def test_integration_scenarios(self):
        """Test integration scenarios between Global Settings and Inventory Export"""
        print("\n🔍 Testing Integration Scenarios...")
        
        test_results = []
        
        # Step 1: Test settings impact on export with different scenarios
        print("\n   🧪 Step 1: Testing various settings combinations...")
        
        test_scenarios = [
            {
                "name": "Standard iPad Setup",
                "settings": {"ipad_typ": "Apple iPad", "pencil": "ohne Apple Pencil"}
            },
            {
                "name": "Pro iPad Setup", 
                "settings": {"ipad_typ": "Apple iPad Pro", "pencil": "mit Apple Pencil"}
            },
            {
                "name": "Air iPad Setup",
                "settings": {"ipad_typ": "Apple iPad Air", "pencil": "mit Apple Pencil 2"}
            }
        ]
        
        for scenario in test_scenarios:
            print(f"\n      🎯 Testing scenario: {scenario['name']}")
            
            # Set the settings
            settings_success = self.run_api_test(
                f"Set Settings - {scenario['name']}",
                "PUT",
                "settings/global",
                200,
                data=scenario['settings']
            )
            
            if settings_success:
                # Export and verify
                url = f"{self.base_url}/api/exports/inventory"
                headers = {}
                if self.token:
                    headers['Authorization'] = f'Bearer {self.token}'
                
                try:
                    response = requests.get(url, headers=headers, timeout=60)
                    
                    if response.status_code == 200:
                        try:
                            import pandas as pd
                            import io
                            
                            df = pd.read_excel(io.BytesIO(response.content))
                            
                            # Verify settings are reflected
                            if 'Typ' in df.columns and 'Pencil' in df.columns:
                                typ_values = df['Typ'].dropna().unique()
                                pencil_values = df['Pencil'].dropna().unique()
                                
                                expected_typ = scenario['settings']['ipad_typ']
                                expected_pencil = scenario['settings']['pencil']
                                
                                if expected_typ in typ_values and expected_pencil in pencil_values:
                                    print(f"         ✅ Settings correctly applied in export")
                                    test_results.append(True)
                                else:
                                    print(f"         ❌ Settings not found in export")
                                    print(f"            Expected: {expected_typ}, {expected_pencil}")
                                    print(f"            Found Typ: {list(typ_values)}")
                                    print(f"            Found Pencil: {list(pencil_values)}")
                                    test_results.append(False)
                            else:
                                print(f"         ❌ Required columns missing")
                                test_results.append(False)
                                
                        except Exception as e:
                            print(f"         ❌ Error analyzing export: {str(e)}")
                            test_results.append(False)
                    else:
                        print(f"         ❌ Export failed: {response.status_code}")
                        test_results.append(False)
                        
                except Exception as e:
                    print(f"         ❌ Export request failed: {str(e)}")
                    test_results.append(False)
            else:
                print(f"         ❌ Could not set settings for scenario")
                test_results.append(False)
        
        # Step 2: Test data consistency
        print(f"\n   🔍 Step 2: Testing data consistency...")
        
        # Get current data counts
        ipads_success = self.run_api_test(
            "Get iPads Count for Consistency Check",
            "GET",
            "ipads",
            200
        )
        
        students_success = self.run_api_test(
            "Get Students Count for Consistency Check", 
            "GET",
            "students",
            200
        )
        
        assignments_success = self.run_api_test(
            "Get Assignments Count for Consistency Check",
            "GET", 
            "assignments",
            200
        )
        
        if ipads_success and students_success and assignments_success:
            ipads_count = len(self.test_results[-3]['response_data'])
            students_count = len(self.test_results[-2]['response_data'])
            assignments_count = len(self.test_results[-1]['response_data'])
            
            print(f"      📊 Data counts: {ipads_count} iPads, {students_count} students, {assignments_count} assignments")
            
            # Export and verify counts match
            url = f"{self.base_url}/api/exports/inventory"
            headers = {}
            if self.token:
                headers['Authorization'] = f'Bearer {self.token}'
            
            try:
                response = requests.get(url, headers=headers, timeout=60)
                
                if response.status_code == 200:
                    try:
                        import pandas as pd
                        import io
                        
                        df = pd.read_excel(io.BytesIO(response.content))
                        export_rows = len(df)
                        
                        print(f"      📊 Export contains {export_rows} rows")
                        
                        # Export should contain all iPads (one row per iPad)
                        if export_rows == ipads_count:
                            print(f"      ✅ Export row count matches iPad count")
                            test_results.append(True)
                        else:
                            print(f"      ❌ Export row count ({export_rows}) doesn't match iPad count ({ipads_count})")
                            test_results.append(False)
                        
                        # Check for both assigned and unassigned iPads
                        assigned_rows = df[df['SuSVorn'].notna() & (df['SuSVorn'] != '')].shape[0]
                        unassigned_rows = df[df['SuSVorn'].isna() | (df['SuSVorn'] == '')].shape[0]
                        
                        print(f"      📊 Assigned iPads in export: {assigned_rows}")
                        print(f"      📊 Unassigned iPads in export: {unassigned_rows}")
                        
                        if assigned_rows + unassigned_rows == export_rows:
                            print(f"      ✅ Assignment status properly reflected in export")
                            test_results.append(True)
                        else:
                            print(f"      ❌ Assignment status inconsistent in export")
                            test_results.append(False)
                            
                    except Exception as e:
                        print(f"      ❌ Error analyzing export consistency: {str(e)}")
                        test_results.append(False)
                else:
                    print(f"      ❌ Export failed for consistency check")
                    test_results.append(False)
                    
            except Exception as e:
                print(f"      ❌ Export request failed: {str(e)}")
                test_results.append(False)
        else:
            print(f"      ❌ Could not get data counts for consistency check")
            test_results.append(False)
        
        # Step 3: Reset to defaults
        print(f"\n   🔄 Step 3: Resetting to default settings...")
        
        default_settings = {
            "ipad_typ": "Apple iPad",
            "pencil": "ohne Apple Pencil"
        }
        
        self.run_api_test(
            "Reset to Default Settings",
            "PUT",
            "settings/global",
            200,
            data=default_settings
        )
        
        # Calculate overall success
        successful_tests = sum(test_results)
        total_tests = len(test_results)
        
        print(f"\n   📊 Integration Scenarios Summary:")
        print(f"      Total tests: {total_tests}")
        print(f"      Successful tests: {successful_tests}")
        print(f"      Success rate: {(successful_tests/total_tests*100):.1f}%")
        
        if successful_tests == total_tests:
            return self.log_result(
                "Integration Scenarios", 
                True, 
                f"All {total_tests} integration tests passed successfully"
            )
        else:
            return self.log_result(
                "Integration Scenarios", 
                False, 
                f"Only {successful_tests}/{total_tests} integration tests passed"
            )

    def run_comprehensive_test(self):
        """Run all tests in sequence"""
        print("=" * 80)
        print("🚀 STARTING COMPREHENSIVE iPad MANAGEMENT SYSTEM API TESTS")
        print("=" * 80)
        print(f"Testing against: {self.base_url}")
        print(f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Test sequence - Focus on Global Settings and Inventory Export
        tests = [
            ("Admin Setup", self.test_admin_setup),
            ("Login", self.test_login),
            ("Get iPads", self.test_get_ipads),
            ("Get Students", self.test_get_students),
            ("Get Assignments", self.test_get_assignments),
            ("Global Settings API", self.test_global_settings_api),
            ("Inventory Export API", self.test_inventory_export_api),
            ("Integration Scenarios", self.test_integration_scenarios),
        ]
        
        for test_name, test_func in tests:
            print(f"\n{'='*60}")
            print(f"🧪 RUNNING: {test_name}")
            print(f"{'='*60}")
            
            try:
                result = test_func()
                if not result:
                    print(f"⚠️  Test '{test_name}' failed - continuing with remaining tests")
            except Exception as e:
                self.log_result(test_name, False, f"Exception: {str(e)}")
                print(f"💥 Test '{test_name}' crashed: {str(e)}")
        
        # Print final results
        self.print_final_results()
        
        return self.tests_passed == self.tests_run

    def print_final_results(self):
        """Print comprehensive test results"""
        print("\n" + "=" * 80)
        print("📊 FINAL TEST RESULTS")
        print("=" * 80)
        
        print(f"✅ Tests Passed: {self.tests_passed}")
        print(f"❌ Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"📈 Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        print(f"\n📋 DETAILED RESULTS:")
        print("-" * 80)
        
        for result in self.test_results:
            status = "✅" if result['success'] else "❌"
            print(f"{status} {result['test']}: {result['message']}")
        
        if self.tests_passed < self.tests_run:
            print(f"\n⚠️  FAILED TESTS SUMMARY:")
            print("-" * 40)
            failed_tests = [r for r in self.test_results if not r['success']]
            for result in failed_tests:
                print(f"❌ {result['test']}: {result['message']}")
        
        print(f"\n🏁 Test completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 80)

def main():
    """Main test execution"""
    print("🔧 iPad Management System - Backend API Tester")
    print("Testing all endpoints with authentication and file uploads\n")
    
    # Initialize tester
    tester = IPadManagementTester()
    
    # Run comprehensive tests
    success = tester.run_comprehensive_test()
    
    # Return appropriate exit code
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())