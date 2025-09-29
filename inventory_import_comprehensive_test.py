#!/usr/bin/env python3
"""
Comprehensive Inventory Import API Testing
Tests all requirements from the review request
"""

import requests
import pandas as pd
import io
import os
import sys
from datetime import datetime

class InventoryImportTester:
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

    def login(self, username="admin", password="admin123"):
        """Login and get token"""
        url = f"{self.base_url}/api/auth/login"
        response = requests.post(url, json={"username": username, "password": password})
        
        if response.status_code == 200:
            data = response.json()
            self.token = data.get('access_token')
            print(f"🔑 Login successful, token acquired")
            return True
        else:
            print(f"❌ Login failed: {response.status_code}")
            return False

    def run_api_test(self, name, method, endpoint, expected_status, data=None, files=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'
        
        if files:
            # Don't set Content-Type for file uploads
            pass
        else:
            headers['Content-Type'] = 'application/json'

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

    def test_comprehensive_inventory_import(self):
        """Test all inventory import requirements from review request"""
        print("🚀 Starting Comprehensive Inventory Import API Testing...")
        print("=" * 80)
        
        if not self.login():
            print("❌ Cannot continue without authentication")
            return False
        
        # Get existing iPads for testing
        existing_ipads = []
        if self.run_api_test("Get Existing iPads", "GET", "ipads", 200):
            existing_ipads = self.test_results[-1]['response_data']
            print(f"📱 Found {len(existing_ipads)} existing iPads for testing")
        
        # 1. FILE FORMAT TESTING
        print("\n" + "=" * 60)
        print("📁 1. FILE FORMAT TESTING")
        print("=" * 60)
        
        # Test 1.1: Valid XLSX file
        print("\n🧪 Test 1.1: Valid XLSX file import")
        xlsx_data = {
            'ITNr': ['TEST001', 'TEST002', 'TEST003'],
            'SNr': ['SN001', 'SN002', 'SN003'],
            'Typ': ['Apple iPad Pro', 'Apple iPad Air', 'Apple iPad'],
            'Pencil': ['mit Apple Pencil', 'ohne Apple Pencil', 'mit Apple Pencil 2']
        }
        
        df = pd.DataFrame(xlsx_data)
        xlsx_buffer = io.BytesIO()
        df.to_excel(xlsx_buffer, index=False, engine='openpyxl')
        xlsx_buffer.seek(0)
        
        files = {'file': ('test_valid.xlsx', xlsx_buffer.getvalue(), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
        success = self.run_api_test("Import Valid XLSX", "POST", "imports/inventory", 200, files=files)
        
        if success:
            response_data = self.test_results[-1]['response_data']
            print(f"   📊 Results: {response_data.get('created_count', 0)} created, {response_data.get('updated_count', 0)} updated")
        
        # Test 1.2: Valid XLS file (if supported)
        print("\n🧪 Test 1.2: Valid XLS file import")
        try:
            xls_buffer = io.BytesIO()
            df.to_excel(xls_buffer, index=False, engine='xlwt')
            xls_buffer.seek(0)
            
            files = {'file': ('test_valid.xls', xls_buffer.getvalue(), 'application/vnd.ms-excel')}
            self.run_api_test("Import Valid XLS", "POST", "imports/inventory", 200, files=files)
        except Exception as e:
            print(f"   ⚠️  XLS test skipped: {str(e)}")
        
        # Test 1.3: Invalid file formats
        print("\n🧪 Test 1.3: Invalid file format rejection")
        
        # PDF file
        pdf_content = b"%PDF-1.4\nFake PDF content"
        files = {'file': ('test.pdf', pdf_content, 'application/pdf')}
        self.run_api_test("Reject PDF File", "POST", "imports/inventory", 400, files=files)
        
        # TXT file
        txt_content = b"This is a text file"
        files = {'file': ('test.txt', txt_content, 'text/plain')}
        self.run_api_test("Reject TXT File", "POST", "imports/inventory", 400, files=files)
        
        # CSV file
        csv_content = b"ITNr,SNr,Typ,Pencil\nTEST001,SN001,iPad,Pencil"
        files = {'file': ('test.csv', csv_content, 'text/csv')}
        self.run_api_test("Reject CSV File", "POST", "imports/inventory", 400, files=files)
        
        # Test 1.4: Excel engines (openpyxl and xlrd)
        print("\n🧪 Test 1.4: Excel reading with different engines")
        # This is tested implicitly with .xlsx (openpyxl) and .xls (xlrd) above
        
        # 2. COLUMN VALIDATION TESTING
        print("\n" + "=" * 60)
        print("📊 2. COLUMN VALIDATION TESTING")
        print("=" * 60)
        
        # Test 2.1: All required columns present
        print("\n🧪 Test 2.1: All required columns present")
        complete_data = {
            'ITNr': ['COMPLETE001', 'COMPLETE002'],
            'SNr': ['SN_COMP001', 'SN_COMP002'],
            'Typ': ['Apple iPad Pro', 'Apple iPad Air'],
            'Pencil': ['mit Apple Pencil', 'ohne Apple Pencil']
        }
        
        df = pd.DataFrame(complete_data)
        buffer = io.BytesIO()
        df.to_excel(buffer, index=False, engine='openpyxl')
        buffer.seek(0)
        
        files = {'file': ('complete_columns.xlsx', buffer.getvalue(), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
        self.run_api_test("Import Complete Columns", "POST", "imports/inventory", 200, files=files)
        
        # Test 2.2: Missing required columns
        print("\n🧪 Test 2.2: Missing required columns")
        missing_columns_tests = [
            ({'ITNr': ['TEST'], 'SNr': ['SN']}, "Missing Typ and Pencil"),
            ({'ITNr': ['TEST'], 'Typ': ['iPad']}, "Missing SNr and Pencil"),
            ({'SNr': ['SN'], 'Typ': ['iPad'], 'Pencil': ['Pencil']}, "Missing ITNr"),
        ]
        
        for data, test_name in missing_columns_tests:
            df = pd.DataFrame(data)
            buffer = io.BytesIO()
            df.to_excel(buffer, index=False, engine='openpyxl')
            buffer.seek(0)
            
            files = {'file': (f'{test_name.lower().replace(" ", "_")}.xlsx', buffer.getvalue(), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
            self.run_api_test(f"Reject {test_name}", "POST", "imports/inventory", 400, files=files)
        
        # Test 2.3: Extra columns (should be ignored)
        print("\n🧪 Test 2.3: Extra columns should be ignored")
        extra_columns_data = {
            'ITNr': ['EXTRA001', 'EXTRA002'],
            'SNr': ['SN_EXTRA001', 'SN_EXTRA002'],
            'Typ': ['Apple iPad Pro', 'Apple iPad Air'],
            'Pencil': ['mit Apple Pencil', 'ohne Apple Pencil'],
            'ExtraColumn1': ['Extra1', 'Extra2'],
            'ExtraColumn2': ['Extra3', 'Extra4'],
            'RandomData': ['Random1', 'Random2']
        }
        
        df = pd.DataFrame(extra_columns_data)
        buffer = io.BytesIO()
        df.to_excel(buffer, index=False, engine='openpyxl')
        buffer.seek(0)
        
        files = {'file': ('extra_columns.xlsx', buffer.getvalue(), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
        success = self.run_api_test("Import with Extra Columns", "POST", "imports/inventory", 200, files=files)
        
        if success:
            response_data = self.test_results[-1]['response_data']
            if response_data.get('processed_count', 0) > 0:
                print(f"   ✅ Extra columns ignored, processed {response_data.get('processed_count', 0)} iPads")
        
        # 3. DATA PROCESSING TESTING
        print("\n" + "=" * 60)
        print("🔄 3. DATA PROCESSING TESTING")
        print("=" * 60)
        
        # Test 3.1: Creating new iPads
        print("\n🧪 Test 3.1: Creating new iPads from import")
        new_ipads_data = {
            'ITNr': ['NEWCREATE001', 'NEWCREATE002', 'NEWCREATE003'],
            'SNr': ['SN_NEW001', 'SN_NEW002', 'SN_NEW003'],
            'Typ': ['Apple iPad Pro', 'Apple iPad Air', 'Apple iPad Mini'],
            'Pencil': ['mit Apple Pencil', 'ohne Apple Pencil', 'mit Apple Pencil 2']
        }
        
        df = pd.DataFrame(new_ipads_data)
        buffer = io.BytesIO()
        df.to_excel(buffer, index=False, engine='openpyxl')
        buffer.seek(0)
        
        files = {'file': ('new_ipads.xlsx', buffer.getvalue(), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
        success = self.run_api_test("Create New iPads", "POST", "imports/inventory", 200, files=files)
        
        if success:
            response_data = self.test_results[-1]['response_data']
            created_count = response_data.get('created_count', 0)
            updated_count = response_data.get('updated_count', 0)
            
            if created_count > 0 and updated_count == 0:
                print(f"   ✅ Successfully created {created_count} new iPads")
            else:
                print(f"   ❌ Expected only creations, got {created_count} created, {updated_count} updated")
        
        # Test 3.2: Updating existing iPads
        print("\n🧪 Test 3.2: Updating existing iPads")
        if existing_ipads and len(existing_ipads) >= 2:
            update_data = {
                'ITNr': [existing_ipads[0]['itnr'], existing_ipads[1]['itnr']],
                'SNr': ['UPDATED_SN001', 'UPDATED_SN002'],
                'Typ': ['Apple iPad Pro Updated', 'Apple iPad Air Updated'],
                'Pencil': ['mit Apple Pencil Updated', 'ohne Apple Pencil Updated']
            }
            
            df = pd.DataFrame(update_data)
            buffer = io.BytesIO()
            df.to_excel(buffer, index=False, engine='openpyxl')
            buffer.seek(0)
            
            files = {'file': ('update_ipads.xlsx', buffer.getvalue(), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
            success = self.run_api_test("Update Existing iPads", "POST", "imports/inventory", 200, files=files)
            
            if success:
                response_data = self.test_results[-1]['response_data']
                created_count = response_data.get('created_count', 0)
                updated_count = response_data.get('updated_count', 0)
                
                if updated_count > 0 and created_count == 0:
                    print(f"   ✅ Successfully updated {updated_count} existing iPads")
                else:
                    print(f"   ❌ Expected only updates, got {created_count} created, {updated_count} updated")
        else:
            print("   ⚠️  Skipping update test - insufficient existing iPads")
        
        # Test 3.3: Handling empty/blank values
        print("\n🧪 Test 3.3: Handling empty/blank values")
        empty_values_data = {
            'ITNr': ['EMPTY001', '', 'EMPTY003', 'EMPTY004'],  # Empty ITNr should be skipped
            'SNr': ['SN001', 'SN002', '', 'SN004'],  # Empty SNr should be handled
            'Typ': ['Apple iPad', '', 'Apple iPad Air', 'Apple iPad Pro'],  # Empty Typ
            'Pencil': ['mit Apple Pencil', 'ohne Apple Pencil', '', 'mit Apple Pencil 2']  # Empty Pencil
        }
        
        df = pd.DataFrame(empty_values_data)
        buffer = io.BytesIO()
        df.to_excel(buffer, index=False, engine='openpyxl')
        buffer.seek(0)
        
        files = {'file': ('empty_values.xlsx', buffer.getvalue(), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
        success = self.run_api_test("Handle Empty Values", "POST", "imports/inventory", 200, files=files)
        
        if success:
            response_data = self.test_results[-1]['response_data']
            processed_count = response_data.get('processed_count', 0)
            # Should process 3 out of 4 rows (skip empty ITNr)
            if processed_count == 3:
                print(f"   ✅ Correctly processed {processed_count} rows (skipped empty ITNr)")
            else:
                print(f"   ⚠️  Processed {processed_count} rows, expected 3")
        
        # Test 3.4: Duplicate ITNr entries in same file
        print("\n🧪 Test 3.4: Duplicate ITNr entries in same file")
        duplicate_data = {
            'ITNr': ['DUP001', 'DUP002', 'DUP001', 'DUP003'],  # DUP001 appears twice
            'SNr': ['SN001', 'SN002', 'SN001_DUP', 'SN003'],
            'Typ': ['Apple iPad', 'Apple iPad Pro', 'Apple iPad Updated', 'Apple iPad Air'],
            'Pencil': ['mit Apple Pencil', 'ohne Apple Pencil', 'mit Apple Pencil Updated', 'mit Apple Pencil 2']
        }
        
        df = pd.DataFrame(duplicate_data)
        buffer = io.BytesIO()
        df.to_excel(buffer, index=False, engine='openpyxl')
        buffer.seek(0)
        
        files = {'file': ('duplicates.xlsx', buffer.getvalue(), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
        success = self.run_api_test("Handle Duplicate ITNr", "POST", "imports/inventory", 200, files=files)
        
        if success:
            response_data = self.test_results[-1]['response_data']
            print(f"   📊 Processed: {response_data.get('processed_count', 0)}, Errors: {response_data.get('error_count', 0)}")
        
        # Test 3.5: Data sanitization (trim whitespace)
        print("\n🧪 Test 3.5: Data sanitization (trim whitespace)")
        whitespace_data = {
            'ITNr': [' TRIM001 ', '  TRIM002  ', 'TRIM003   '],
            'SNr': ['  SN001  ', ' SN002 ', '   SN003'],
            'Typ': [' Apple iPad Pro ', '  Apple iPad Air  ', 'Apple iPad   '],
            'Pencil': ['  mit Apple Pencil  ', ' ohne Apple Pencil ', '   mit Apple Pencil 2   ']
        }
        
        df = pd.DataFrame(whitespace_data)
        buffer = io.BytesIO()
        df.to_excel(buffer, index=False, engine='openpyxl')
        buffer.seek(0)
        
        files = {'file': ('whitespace.xlsx', buffer.getvalue(), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
        success = self.run_api_test("Data Sanitization", "POST", "imports/inventory", 200, files=files)
        
        if success:
            response_data = self.test_results[-1]['response_data']
            if response_data.get('processed_count', 0) == 3:
                print(f"   ✅ Successfully sanitized and processed {response_data.get('processed_count', 0)} iPads")
        
        # 4. iPAD CREATION VS UPDATE LOGIC
        print("\n" + "=" * 60)
        print("🔄 4. iPAD CREATION VS UPDATE LOGIC")
        print("=" * 60)
        
        # Test 4.1: Mixed scenario (new + existing)
        print("\n🧪 Test 4.1: Mixed scenario (new + existing iPads)")
        if existing_ipads:
            mixed_data = {
                'ITNr': ['MIXED001', 'MIXED002', existing_ipads[0]['itnr'] if existing_ipads else 'EXISTING001'],
                'SNr': ['SN_MIXED001', 'SN_MIXED002', 'SN_EXISTING_UPDATED'],
                'Typ': ['Apple iPad Pro New', 'Apple iPad Air New', 'Apple iPad Existing Updated'],
                'Pencil': ['mit Apple Pencil New', 'ohne Apple Pencil New', 'mit Apple Pencil Updated']
            }
            
            df = pd.DataFrame(mixed_data)
            buffer = io.BytesIO()
            df.to_excel(buffer, index=False, engine='openpyxl')
            buffer.seek(0)
            
            files = {'file': ('mixed_scenario.xlsx', buffer.getvalue(), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
            success = self.run_api_test("Mixed Create/Update", "POST", "imports/inventory", 200, files=files)
            
            if success:
                response_data = self.test_results[-1]['response_data']
                created_count = response_data.get('created_count', 0)
                updated_count = response_data.get('updated_count', 0)
                
                if created_count > 0 and updated_count > 0:
                    print(f"   ✅ Mixed scenario: {created_count} created, {updated_count} updated")
                else:
                    print(f"   ⚠️  Mixed scenario results: {created_count} created, {updated_count} updated")
        
        # Test 4.2: Verify default status for new iPads
        print("\n🧪 Test 4.2: Verify default status 'verfügbar' for new iPads")
        if self.run_api_test("Get iPads After Import", "GET", "ipads", 200):
            all_ipads = self.test_results[-1]['response_data']
            
            # Find iPads we created in tests
            test_patterns = ['TEST', 'COMPLETE', 'EXTRA', 'NEWCREATE', 'EMPTY', 'DUP', 'TRIM', 'MIXED']
            imported_ipads = [ipad for ipad in all_ipads if any(pattern in ipad.get('itnr', '') for pattern in test_patterns)]
            
            if imported_ipads:
                verfuegbar_count = sum(1 for ipad in imported_ipads if ipad.get('status') == 'verfügbar')
                total_imported = len(imported_ipads)
                
                if verfuegbar_count == total_imported:
                    print(f"   ✅ All {total_imported} imported iPads have default status 'verfügbar'")
                else:
                    print(f"   ❌ Only {verfuegbar_count}/{total_imported} imported iPads have status 'verfügbar'")
            else:
                print("   ⚠️  No imported iPads found to check status")
        
        # 5. ERROR HANDLING TESTING
        print("\n" + "=" * 60)
        print("⚠️  5. ERROR HANDLING TESTING")
        print("=" * 60)
        
        # Test 5.1: Malformed Excel files
        print("\n🧪 Test 5.1: Malformed Excel file")
        malformed_content = b"PK\x03\x04FAKE_EXCEL_CONTENT"
        files = {'file': ('malformed.xlsx', malformed_content, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
        self.run_api_test("Reject Malformed Excel", "POST", "imports/inventory", 400, files=files)
        
        # Test 5.2: Empty Excel files
        print("\n🧪 Test 5.2: Empty Excel file")
        empty_df = pd.DataFrame()
        buffer = io.BytesIO()
        empty_df.to_excel(buffer, index=False, engine='openpyxl')
        buffer.seek(0)
        
        files = {'file': ('empty.xlsx', buffer.getvalue(), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
        self.run_api_test("Reject Empty Excel", "POST", "imports/inventory", 400, files=files)
        
        # Test 5.3: Rows missing ITNr (should be skipped)
        print("\n🧪 Test 5.3: Rows missing ITNr should be skipped")
        # This was already tested in Test 3.3 above
        
        # Test 5.4: Invalid data types
        print("\n🧪 Test 5.4: Invalid data types handling")
        invalid_types_data = {
            'ITNr': ['INVALID001', 123, 'INVALID003'],  # Mixed types
            'SNr': ['SN001', None, 'SN003'],
            'Typ': ['Apple iPad', 456, 'Apple iPad Pro'],
            'Pencil': ['mit Apple Pencil', True, 'ohne Apple Pencil']
        }
        
        df = pd.DataFrame(invalid_types_data)
        buffer = io.BytesIO()
        df.to_excel(buffer, index=False, engine='openpyxl')
        buffer.seek(0)
        
        files = {'file': ('invalid_types.xlsx', buffer.getvalue(), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
        success = self.run_api_test("Handle Invalid Data Types", "POST", "imports/inventory", 200, files=files)
        
        if success:
            response_data = self.test_results[-1]['response_data']
            print(f"   📊 Processed: {response_data.get('processed_count', 0)}, Errors: {response_data.get('error_count', 0)}")
        
        # 6. RESPONSE VALIDATION
        print("\n" + "=" * 60)
        print("📋 6. RESPONSE VALIDATION")
        print("=" * 60)
        
        # Test 6.1: Response structure validation
        print("\n🧪 Test 6.1: Response structure validation")
        simple_data = {
            'ITNr': ['RESPONSE001'],
            'SNr': ['SN_RESP001'],
            'Typ': ['Apple iPad'],
            'Pencil': ['mit Apple Pencil']
        }
        
        df = pd.DataFrame(simple_data)
        buffer = io.BytesIO()
        df.to_excel(buffer, index=False, engine='openpyxl')
        buffer.seek(0)
        
        files = {'file': ('response_test.xlsx', buffer.getvalue(), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
        success = self.run_api_test("Response Structure Test", "POST", "imports/inventory", 200, files=files)
        
        if success:
            response_data = self.test_results[-1]['response_data']
            
            # Check required response fields
            required_fields = ['message', 'processed_count', 'created_count', 'updated_count', 'error_count', 'errors']
            missing_fields = [field for field in required_fields if field not in response_data]
            
            if not missing_fields:
                print(f"   ✅ All required response fields present: {required_fields}")
                
                # Check error list limit
                errors = response_data.get('errors', [])
                if len(errors) <= 10:
                    print(f"   ✅ Error list properly limited ({len(errors)} errors)")
                else:
                    print(f"   ❌ Error list too long: {len(errors)} errors (should be ≤10)")
                
                # Check count accuracy
                processed = response_data.get('processed_count', 0)
                created = response_data.get('created_count', 0)
                updated = response_data.get('updated_count', 0)
                error_count = response_data.get('error_count', 0)
                
                print(f"   📊 Counts - Processed: {processed}, Created: {created}, Updated: {updated}, Errors: {error_count}")
                
                # Check success message formatting
                message = response_data.get('message', '')
                if 'created' in message and 'updated' in message:
                    print(f"   ✅ Success message properly formatted: '{message}'")
                else:
                    print(f"   ⚠️  Message format: '{message}'")
            else:
                print(f"   ❌ Missing required response fields: {missing_fields}")
        
        # Test 6.2: Authentication requirement
        print("\n🧪 Test 6.2: Authentication requirement")
        url = f"{self.base_url}/api/imports/inventory"
        files = {'file': ('auth_test.xlsx', buffer.getvalue(), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
        
        try:
            response = requests.post(url, files=files, timeout=30)  # No auth headers
            
            if response.status_code == 401:
                print(f"   ✅ Authentication properly required (401)")
            else:
                print(f"   ❌ Should require authentication, got: {response.status_code}")
        except Exception as e:
            print(f"   ❌ Auth test exception: {str(e)}")
        
        # Print final summary
        self.print_final_summary()
        
        return self.tests_passed == self.tests_run

    def print_final_summary(self):
        """Print comprehensive test summary"""
        print("\n" + "=" * 80)
        print("📊 COMPREHENSIVE INVENTORY IMPORT API TEST RESULTS")
        print("=" * 80)
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        
        print(f"📈 Total Tests Run: {self.tests_run}")
        print(f"✅ Tests Passed: {self.tests_passed}")
        print(f"❌ Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"📊 Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 90:
            print("🎉 EXCELLENT - Inventory Import API is working very well!")
        elif success_rate >= 75:
            print("✅ GOOD - Inventory Import API is mostly functional with minor issues")
        elif success_rate >= 50:
            print("⚠️  MODERATE - Inventory Import API has significant issues that need attention")
        else:
            print("❌ POOR - Inventory Import API has major problems requiring immediate attention")
        
        # Group results by category
        categories = {
            "File Format Tests": [],
            "Column Validation Tests": [],
            "Data Processing Tests": [],
            "Creation vs Update Logic": [],
            "Error Handling Tests": [],
            "Response Validation Tests": []
        }
        
        for result in self.test_results:
            test_name = result['test']
            if any(keyword in test_name.lower() for keyword in ['xlsx', 'xls', 'pdf', 'txt', 'csv', 'format', 'reject']):
                categories["File Format Tests"].append(result)
            elif any(keyword in test_name.lower() for keyword in ['column', 'missing', 'extra', 'complete']):
                categories["Column Validation Tests"].append(result)
            elif any(keyword in test_name.lower() for keyword in ['create', 'update', 'empty', 'duplicate', 'sanitization', 'whitespace']):
                categories["Data Processing Tests"].append(result)
            elif any(keyword in test_name.lower() for keyword in ['mixed', 'status', 'verfügbar']):
                categories["Creation vs Update Logic"].append(result)
            elif any(keyword in test_name.lower() for keyword in ['malformed', 'invalid', 'error']):
                categories["Error Handling Tests"].append(result)
            elif any(keyword in test_name.lower() for keyword in ['response', 'structure', 'auth']):
                categories["Response Validation Tests"].append(result)
        
        print(f"\n📋 DETAILED RESULTS BY CATEGORY:")
        print("-" * 80)
        
        for category, results in categories.items():
            if results:
                passed = sum(1 for r in results if r['success'])
                total = len(results)
                print(f"\n{category}: {passed}/{total} passed")
                for result in results:
                    status = "✅" if result['success'] else "❌"
                    print(f"  {status} {result['test']}: {result['message']}")
        
        # Show failed tests summary
        failed_tests = [r for r in self.test_results if not r['success']]
        if failed_tests:
            print(f"\n⚠️  FAILED TESTS SUMMARY:")
            print("-" * 40)
            for result in failed_tests:
                print(f"❌ {result['test']}: {result['message']}")
        
        print(f"\n🏁 Test completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 80)

def main():
    """Main test execution"""
    print("🔧 Comprehensive Inventory Import API Tester")
    print("Testing all requirements from the review request\n")
    
    # Initialize tester
    tester = InventoryImportTester()
    
    # Run comprehensive tests
    success = tester.test_comprehensive_inventory_import()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()