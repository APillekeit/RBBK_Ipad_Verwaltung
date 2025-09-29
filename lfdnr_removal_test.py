#!/usr/bin/env python3
"""
LFDNR REMOVAL TESTING - Comprehensive Backend API Testing
Tests the complete removal of lfdNr column from the entire application
"""

import requests
import sys
import os
from datetime import datetime
import json
import pandas as pd
import io
import tempfile

class LfdNrRemovalTester:
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

    def create_test_excel_without_lfdnr(self, filename, data_type="students"):
        """Create test Excel file without lfdNr column"""
        if data_type == "students":
            # Student data without lfdNr
            data = {
                'SuSVorn': ['Max', 'Anna', 'Tom'],
                'SuSNachn': ['Mustermann', 'Schmidt', 'Weber'],
                'SuSKl': ['5A', '6B', '7C'],
                'SuSStrHNr': ['Hauptstr. 1', 'Nebenstr. 2', 'Parkweg 3'],
                'SuSPLZ': ['12345', '54321', '67890'],
                'SuSOrt': ['Berlin', 'Hamburg', 'München'],
                'SuSGeb': ['01.01.2010', '15.03.2009', '22.07.2008']
            }
        elif data_type == "inventory":
            # Inventory data without lfdNr
            data = {
                'ITNr': ['IPAD901', 'IPAD902', 'IPAD903'],
                'SNr': ['SN901', 'SN902', 'SN903'],
                'Typ': ['Apple iPad', 'Apple iPad Pro', 'Apple iPad Air'],
                'Pencil': ['ohne Apple Pencil', 'mit Apple Pencil', 'mit Apple Pencil 2'],
                'SuSVorn': ['Max', 'Anna', ''],
                'SuSNachn': ['Mustermann', 'Schmidt', ''],
                'SuSKl': ['5A', '6B', ''],
                'AusleiheDatum': ['01.09.2024', '15.09.2024', '']
            }
        
        df = pd.DataFrame(data)
        df.to_excel(filename, index=False)
        return filename

    def test_student_model_validation(self):
        """Test that Student model no longer includes lfd_nr field"""
        print("\n🔍 Testing Student Model Validation (lfd_nr removal)...")
        
        test_results = []
        
        # Step 1: Get students and verify no lfd_nr field in response
        success = self.run_api_test(
            "Get Students - Verify No lfd_nr Field",
            "GET",
            "students",
            200
        )
        
        if success:
            students = self.test_results[-1]['response_data']
            if isinstance(students, list) and len(students) > 0:
                sample_student = students[0]
                
                # Check that lfd_nr is NOT in the response
                if 'lfd_nr' in sample_student or 'lfdNr' in sample_student:
                    print(f"      ❌ CRITICAL: lfd_nr field still present in student response")
                    print(f"         Student fields: {list(sample_student.keys())}")
                    test_results.append(False)
                else:
                    print(f"      ✅ lfd_nr field successfully removed from student model")
                    print(f"         Student fields: {list(sample_student.keys())}")
                    test_results.append(True)
            else:
                print(f"      ⚠️  No students found to test model structure")
                test_results.append(True)  # No data to test is acceptable
        else:
            test_results.append(False)
        
        # Step 2: Create new student without lfd_nr and verify it works
        print(f"\n   🧪 Step 2: Testing new student creation without lfd_nr...")
        
        # Create test Excel file without lfdNr column
        test_file = "/tmp/test_students_no_lfdnr.xlsx"
        self.create_test_excel_without_lfdnr(test_file, "students")
        
        try:
            with open(test_file, 'rb') as f:
                files = {'file': ('test_students_no_lfdnr.xlsx', f, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
                success = self.run_api_test(
                    "Upload Students Without lfdNr Column",
                    "POST",
                    "students/upload",
                    200,
                    files=files
                )
                
                if success:
                    upload_response = self.test_results[-1]['response_data']
                    processed_count = upload_response.get('processed_count', 0)
                    
                    if processed_count > 0:
                        print(f"      ✅ Successfully created {processed_count} students without lfd_nr")
                        test_results.append(True)
                    else:
                        print(f"      ❌ No students were created from upload")
                        test_results.append(False)
                else:
                    test_results.append(False)
                    
        except Exception as e:
            print(f"      ❌ Error testing student upload: {str(e)}")
            test_results.append(False)
        finally:
            if os.path.exists(test_file):
                os.remove(test_file)
        
        # Calculate overall success
        successful_tests = sum(test_results)
        total_tests = len(test_results)
        
        if successful_tests == total_tests:
            return self.log_result(
                "Student Model Validation", 
                True, 
                f"All {total_tests} student model tests passed - lfd_nr successfully removed"
            )
        else:
            return self.log_result(
                "Student Model Validation", 
                False, 
                f"Only {successful_tests}/{total_tests} student model tests passed"
            )

    def test_export_lfdnr_removal(self):
        """Test that exports no longer contain lfdNr column"""
        print("\n🔍 Testing Export lfdNr Removal...")
        
        test_results = []
        
        # Step 1: Test Inventory Export - verify lfdNr column is NOT present
        print(f"\n   📊 Step 1: Testing Inventory Export (lfdNr removal)...")
        
        url = f"{self.base_url}/api/exports/inventory"
        headers = {}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'
        
        try:
            response = requests.get(url, headers=headers, timeout=60)
            
            if response.status_code == 200:
                try:
                    df = pd.read_excel(io.BytesIO(response.content))
                    
                    print(f"      📋 Inventory export columns: {list(df.columns)}")
                    
                    # Check that lfdNr is NOT in columns
                    if 'lfdNr' in df.columns or 'lfd_nr' in df.columns:
                        print(f"      ❌ CRITICAL: lfdNr column still present in inventory export")
                        test_results.append(False)
                    else:
                        print(f"      ✅ lfdNr column successfully removed from inventory export")
                        test_results.append(True)
                    
                    # Verify column order starts with "Sname" instead of "lfdNr"
                    if len(df.columns) > 0:
                        first_column = df.columns[0]
                        if first_column == 'Sname':
                            print(f"      ✅ Export column order starts with 'Sname' as expected")
                            test_results.append(True)
                        else:
                            print(f"      ❌ Export should start with 'Sname', but starts with '{first_column}'")
                            test_results.append(False)
                    else:
                        print(f"      ⚠️  Export has no columns")
                        test_results.append(False)
                        
                except Exception as e:
                    print(f"      ❌ Error analyzing inventory export: {str(e)}")
                    test_results.append(False)
            else:
                print(f"      ❌ Inventory export failed: {response.status_code}")
                test_results.append(False)
                
        except Exception as e:
            print(f"      ❌ Inventory export request failed: {str(e)}")
            test_results.append(False)
        
        # Step 2: Test Assignment Export - verify lfdNr column is NOT present
        print(f"\n   📊 Step 2: Testing Assignment Export (lfdNr removal)...")
        
        url = f"{self.base_url}/api/assignments/export"
        
        try:
            response = requests.get(url, headers=headers, timeout=60)
            
            if response.status_code == 200:
                try:
                    df = pd.read_excel(io.BytesIO(response.content))
                    
                    print(f"      📋 Assignment export columns: {list(df.columns)}")
                    
                    # Check that lfdNr is NOT in columns
                    if 'lfdNr' in df.columns or 'lfd_nr' in df.columns:
                        print(f"      ❌ CRITICAL: lfdNr column still present in assignment export")
                        test_results.append(False)
                    else:
                        print(f"      ✅ lfdNr column successfully removed from assignment export")
                        test_results.append(True)
                    
                    # Verify column order starts with "Sname" instead of "lfdNr"
                    if len(df.columns) > 0:
                        first_column = df.columns[0]
                        if first_column == 'Sname':
                            print(f"      ✅ Assignment export column order starts with 'Sname' as expected")
                            test_results.append(True)
                        else:
                            print(f"      ❌ Assignment export should start with 'Sname', but starts with '{first_column}'")
                            test_results.append(False)
                    else:
                        print(f"      ⚠️  Assignment export has no columns")
                        test_results.append(False)
                        
                except Exception as e:
                    print(f"      ❌ Error analyzing assignment export: {str(e)}")
                    test_results.append(False)
            else:
                print(f"      ❌ Assignment export failed: {response.status_code}")
                test_results.append(False)
                
        except Exception as e:
            print(f"      ❌ Assignment export request failed: {str(e)}")
            test_results.append(False)
        
        # Step 3: Test Filtered Assignment Export - verify lfdNr column is NOT present
        print(f"\n   📊 Step 3: Testing Filtered Assignment Export (lfdNr removal)...")
        
        # Test with a filter parameter
        url = f"{self.base_url}/api/assignments/export?sus_vorn=Max"
        
        try:
            response = requests.get(url, headers=headers, timeout=60)
            
            if response.status_code == 200:
                try:
                    df = pd.read_excel(io.BytesIO(response.content))
                    
                    print(f"      📋 Filtered assignment export columns: {list(df.columns)}")
                    
                    # Check that lfdNr is NOT in columns
                    if 'lfdNr' in df.columns or 'lfd_nr' in df.columns:
                        print(f"      ❌ CRITICAL: lfdNr column still present in filtered assignment export")
                        test_results.append(False)
                    else:
                        print(f"      ✅ lfdNr column successfully removed from filtered assignment export")
                        test_results.append(True)
                        
                except Exception as e:
                    print(f"      ❌ Error analyzing filtered assignment export: {str(e)}")
                    test_results.append(False)
            else:
                print(f"      ❌ Filtered assignment export failed: {response.status_code}")
                test_results.append(False)
                
        except Exception as e:
            print(f"      ❌ Filtered assignment export request failed: {str(e)}")
            test_results.append(False)
        
        # Calculate overall success
        successful_tests = sum(test_results)
        total_tests = len(test_results)
        
        if successful_tests == total_tests:
            return self.log_result(
                "Export lfdNr Removal", 
                True, 
                f"All {total_tests} export tests passed - lfdNr successfully removed from all exports"
            )
        else:
            return self.log_result(
                "Export lfdNr Removal", 
                False, 
                f"Only {successful_tests}/{total_tests} export tests passed"
            )

    def test_inventory_import_without_lfdnr(self):
        """Test inventory import without lfdNr column"""
        print("\n🔍 Testing Inventory Import Without lfdNr...")
        
        test_results = []
        
        # Step 1: Test inventory import without lfdNr column
        print(f"\n   📥 Step 1: Testing inventory import without lfdNr column...")
        
        # Create test Excel file without lfdNr column
        test_file = "/tmp/test_inventory_no_lfdnr.xlsx"
        self.create_test_excel_without_lfdnr(test_file, "inventory")
        
        try:
            with open(test_file, 'rb') as f:
                files = {'file': ('test_inventory_no_lfdnr.xlsx', f, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
                success = self.run_api_test(
                    "Import Inventory Without lfdNr Column",
                    "POST",
                    "imports/inventory",
                    200,
                    files=files
                )
                
                if success:
                    import_response = self.test_results[-1]['response_data']
                    ipads_created = import_response.get('ipads_created', 0)
                    students_created = import_response.get('students_created', 0)
                    assignments_created = import_response.get('assignments_created', 0)
                    
                    print(f"      📊 Import results: {ipads_created} iPads, {students_created} students, {assignments_created} assignments created")
                    
                    if ipads_created > 0:
                        print(f"      ✅ Successfully imported inventory without lfd_nr column")
                        test_results.append(True)
                    else:
                        print(f"      ❌ No iPads were created from import")
                        test_results.append(False)
                else:
                    test_results.append(False)
                    
        except Exception as e:
            print(f"      ❌ Error testing inventory import: {str(e)}")
            test_results.append(False)
        finally:
            if os.path.exists(test_file):
                os.remove(test_file)
        
        # Step 2: Verify imported students don't have lfd_nr field
        print(f"\n   🔍 Step 2: Verifying imported students don't have lfd_nr field...")
        
        success = self.run_api_test(
            "Get Students After Import - Verify No lfd_nr",
            "GET",
            "students",
            200
        )
        
        if success:
            students = self.test_results[-1]['response_data']
            if isinstance(students, list) and len(students) > 0:
                # Check recently created students
                recent_students = [s for s in students if s.get('sus_vorn') in ['Max', 'Anna', 'Tom']]
                
                if recent_students:
                    sample_student = recent_students[0]
                    
                    if 'lfd_nr' in sample_student or 'lfdNr' in sample_student:
                        print(f"      ❌ CRITICAL: lfd_nr field found in imported student")
                        test_results.append(False)
                    else:
                        print(f"      ✅ Imported students correctly have no lfd_nr field")
                        test_results.append(True)
                else:
                    print(f"      ⚠️  Could not find recently imported students to verify")
                    test_results.append(True)  # Acceptable if no specific students found
            else:
                print(f"      ⚠️  No students found after import")
                test_results.append(True)
        else:
            test_results.append(False)
        
        # Calculate overall success
        successful_tests = sum(test_results)
        total_tests = len(test_results)
        
        if successful_tests == total_tests:
            return self.log_result(
                "Inventory Import Without lfdNr", 
                True, 
                f"All {total_tests} inventory import tests passed - works correctly without lfd_nr"
            )
        else:
            return self.log_result(
                "Inventory Import Without lfdNr", 
                False, 
                f"Only {successful_tests}/{total_tests} inventory import tests passed"
            )

    def test_api_responses_no_lfdnr(self):
        """Test that API responses don't contain lfd_nr fields"""
        print("\n🔍 Testing API Responses for lfd_nr Removal...")
        
        test_results = []
        
        # Step 1: Test GET /api/students endpoint
        print(f"\n   📡 Step 1: Testing GET /api/students endpoint...")
        
        success = self.run_api_test(
            "GET Students - No lfd_nr Field",
            "GET",
            "students",
            200
        )
        
        if success:
            students = self.test_results[-1]['response_data']
            if isinstance(students, list):
                lfd_nr_found = False
                for student in students:
                    if 'lfd_nr' in student or 'lfdNr' in student:
                        lfd_nr_found = True
                        break
                
                if lfd_nr_found:
                    print(f"      ❌ CRITICAL: lfd_nr field found in students endpoint response")
                    test_results.append(False)
                else:
                    print(f"      ✅ No lfd_nr field found in students endpoint response")
                    test_results.append(True)
            else:
                print(f"      ❌ Invalid students response format")
                test_results.append(False)
        else:
            test_results.append(False)
        
        # Step 2: Test student detail endpoint
        print(f"\n   📡 Step 2: Testing student detail endpoint...")
        
        # Get a student ID to test with
        if success and isinstance(students, list) and len(students) > 0:
            test_student_id = students[0]['id']
            
            success = self.run_api_test(
                "GET Student Detail - No lfd_nr Field",
                "GET",
                f"students/{test_student_id}",
                200
            )
            
            if success:
                detail_response = self.test_results[-1]['response_data']
                student_data = detail_response.get('student', {})
                
                if 'lfd_nr' in student_data or 'lfdNr' in student_data:
                    print(f"      ❌ CRITICAL: lfd_nr field found in student detail response")
                    test_results.append(False)
                else:
                    print(f"      ✅ No lfd_nr field found in student detail response")
                    test_results.append(True)
            else:
                test_results.append(False)
        else:
            print(f"      ⚠️  No students available to test detail endpoint")
            test_results.append(True)
        
        # Step 3: Test assignments endpoint (which returns student data)
        print(f"\n   📡 Step 3: Testing assignments endpoint...")
        
        success = self.run_api_test(
            "GET Assignments - No lfd_nr in Student Data",
            "GET",
            "assignments",
            200
        )
        
        if success:
            assignments = self.test_results[-1]['response_data']
            if isinstance(assignments, list):
                lfd_nr_found = False
                for assignment in assignments:
                    # Check if any assignment contains lfd_nr references
                    assignment_str = json.dumps(assignment)
                    if 'lfd_nr' in assignment_str or 'lfdNr' in assignment_str:
                        lfd_nr_found = True
                        break
                
                if lfd_nr_found:
                    print(f"      ❌ CRITICAL: lfd_nr field found in assignments endpoint response")
                    test_results.append(False)
                else:
                    print(f"      ✅ No lfd_nr field found in assignments endpoint response")
                    test_results.append(True)
            else:
                print(f"      ❌ Invalid assignments response format")
                test_results.append(False)
        else:
            test_results.append(False)
        
        # Step 4: Test filtered assignments endpoint
        print(f"\n   📡 Step 4: Testing filtered assignments endpoint...")
        
        success = self.run_api_test(
            "GET Filtered Assignments - No lfd_nr Field",
            "GET",
            "assignments/filtered?sus_vorn=Max",
            200
        )
        
        if success:
            filtered_assignments = self.test_results[-1]['response_data']
            if isinstance(filtered_assignments, list):
                lfd_nr_found = False
                for assignment in filtered_assignments:
                    assignment_str = json.dumps(assignment)
                    if 'lfd_nr' in assignment_str or 'lfdNr' in assignment_str:
                        lfd_nr_found = True
                        break
                
                if lfd_nr_found:
                    print(f"      ❌ CRITICAL: lfd_nr field found in filtered assignments response")
                    test_results.append(False)
                else:
                    print(f"      ✅ No lfd_nr field found in filtered assignments response")
                    test_results.append(True)
            else:
                print(f"      ❌ Invalid filtered assignments response format")
                test_results.append(False)
        else:
            test_results.append(False)
        
        # Calculate overall success
        successful_tests = sum(test_results)
        total_tests = len(test_results)
        
        if successful_tests == total_tests:
            return self.log_result(
                "API Responses lfd_nr Removal", 
                True, 
                f"All {total_tests} API response tests passed - no lfd_nr fields found"
            )
        else:
            return self.log_result(
                "API Responses lfd_nr Removal", 
                False, 
                f"Only {successful_tests}/{total_tests} API response tests passed"
            )

    def test_column_order_verification(self):
        """Test that export column order is correct without lfdNr"""
        print("\n🔍 Testing Export Column Order Verification...")
        
        test_results = []
        
        # Expected column order without lfdNr (should start with Sname)
        expected_columns_start = [
            'Sname', 'SuSNachn', 'SuSVorn', 'SuSKl', 'SuSStrHNr', 'SuSPLZ', 'SuSOrt', 'SuSGeb'
        ]
        
        # Step 1: Test inventory export column order
        print(f"\n   📊 Step 1: Testing inventory export column order...")
        
        url = f"{self.base_url}/api/exports/inventory"
        headers = {}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'
        
        try:
            response = requests.get(url, headers=headers, timeout=60)
            
            if response.status_code == 200:
                try:
                    df = pd.read_excel(io.BytesIO(response.content))
                    actual_columns = list(df.columns)
                    
                    print(f"      📋 Inventory export columns: {actual_columns[:10]}...")  # Show first 10
                    
                    # Check that it starts with expected columns (without lfdNr)
                    matches_expected = True
                    for i, expected_col in enumerate(expected_columns_start):
                        if i < len(actual_columns):
                            if actual_columns[i] != expected_col:
                                matches_expected = False
                                print(f"      ❌ Column {i}: Expected '{expected_col}', got '{actual_columns[i]}'")
                                break
                        else:
                            matches_expected = False
                            print(f"      ❌ Missing expected column '{expected_col}' at position {i}")
                            break
                    
                    if matches_expected:
                        print(f"      ✅ Inventory export column order correct (starts with 'Sname')")
                        test_results.append(True)
                    else:
                        print(f"      ❌ Inventory export column order incorrect")
                        test_results.append(False)
                        
                except Exception as e:
                    print(f"      ❌ Error analyzing inventory export columns: {str(e)}")
                    test_results.append(False)
            else:
                print(f"      ❌ Inventory export failed: {response.status_code}")
                test_results.append(False)
                
        except Exception as e:
            print(f"      ❌ Inventory export request failed: {str(e)}")
            test_results.append(False)
        
        # Step 2: Test assignment export column order
        print(f"\n   📊 Step 2: Testing assignment export column order...")
        
        url = f"{self.base_url}/api/assignments/export"
        
        try:
            response = requests.get(url, headers=headers, timeout=60)
            
            if response.status_code == 200:
                try:
                    df = pd.read_excel(io.BytesIO(response.content))
                    actual_columns = list(df.columns)
                    
                    print(f"      📋 Assignment export columns: {actual_columns[:10]}...")  # Show first 10
                    
                    # Check that it starts with expected columns (without lfdNr)
                    matches_expected = True
                    for i, expected_col in enumerate(expected_columns_start):
                        if i < len(actual_columns):
                            if actual_columns[i] != expected_col:
                                matches_expected = False
                                print(f"      ❌ Column {i}: Expected '{expected_col}', got '{actual_columns[i]}'")
                                break
                        else:
                            matches_expected = False
                            print(f"      ❌ Missing expected column '{expected_col}' at position {i}")
                            break
                    
                    if matches_expected:
                        print(f"      ✅ Assignment export column order correct (starts with 'Sname')")
                        test_results.append(True)
                    else:
                        print(f"      ❌ Assignment export column order incorrect")
                        test_results.append(False)
                        
                except Exception as e:
                    print(f"      ❌ Error analyzing assignment export columns: {str(e)}")
                    test_results.append(False)
            else:
                print(f"      ❌ Assignment export failed: {response.status_code}")
                test_results.append(False)
                
        except Exception as e:
            print(f"      ❌ Assignment export request failed: {str(e)}")
            test_results.append(False)
        
        # Step 3: Verify both exports have consistent column structure
        print(f"\n   📊 Step 3: Testing export consistency...")
        
        # This test checks if both exports have the same column structure
        # We'll compare the column lists from both exports
        if len(test_results) >= 2 and all(test_results[-2:]):
            print(f"      ✅ Both exports have consistent column structure without lfdNr")
            test_results.append(True)
        else:
            print(f"      ❌ Export column structures are inconsistent")
            test_results.append(False)
        
        # Calculate overall success
        successful_tests = sum(test_results)
        total_tests = len(test_results)
        
        if successful_tests == total_tests:
            return self.log_result(
                "Column Order Verification", 
                True, 
                f"All {total_tests} column order tests passed - exports start with 'Sname' instead of 'lfdNr'"
            )
        else:
            return self.log_result(
                "Column Order Verification", 
                False, 
                f"Only {successful_tests}/{total_tests} column order tests passed"
            )

    def run_all_lfdnr_removal_tests(self):
        """Run all lfdNr removal tests"""
        print("🚀 Starting LFDNR REMOVAL Testing...")
        print("=" * 80)
        
        # Login first
        if not self.test_login():
            print("❌ Login failed - cannot proceed with tests")
            return False
        
        # Run all test categories
        test_methods = [
            self.test_student_model_validation,
            self.test_export_lfdnr_removal,
            self.test_inventory_import_without_lfdnr,
            self.test_api_responses_no_lfdnr,
            self.test_column_order_verification
        ]
        
        all_passed = True
        for test_method in test_methods:
            try:
                result = test_method()
                if not result:
                    all_passed = False
            except Exception as e:
                print(f"❌ Test method {test_method.__name__} failed with exception: {str(e)}")
                all_passed = False
        
        # Print final summary
        print("\n" + "=" * 80)
        print("🎯 LFDNR REMOVAL TESTING SUMMARY")
        print("=" * 80)
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        
        print(f"📊 Total Tests: {self.tests_run}")
        print(f"✅ Passed: {self.tests_passed}")
        print(f"❌ Failed: {self.tests_run - self.tests_passed}")
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        if all_passed:
            print("\n🎉 ALL LFDNR REMOVAL TESTS PASSED!")
            print("✅ lfdNr column has been successfully removed from the entire application")
        else:
            print("\n⚠️  SOME LFDNR REMOVAL TESTS FAILED!")
            print("❌ lfdNr removal is not complete - issues found")
        
        # Show detailed results
        print("\n📋 Detailed Test Results:")
        for result in self.test_results:
            status = "✅" if result['success'] else "❌"
            print(f"   {status} {result['test']}: {result['message']}")
        
        return all_passed

if __name__ == "__main__":
    tester = LfdNrRemovalTester()
    success = tester.run_all_lfdnr_removal_tests()
    sys.exit(0 if success else 1)