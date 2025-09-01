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
    def __init__(self, base_url="https://ipad-manager.preview.emergentagent.com"):
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

    def test_contract_validation_formula(self):
        """Test the new contract validation formula for assignments"""
        print("\n🔍 Testing Contract Validation Formula...")
        
        # Test scenarios for contract validation
        test_scenarios = [
            {
                "name": "Both Nutzung ON (should trigger warning)",
                "form_fields": {
                    "NutzungEinhaltung": "/Yes",
                    "NutzungKenntnisnahme": "/Yes", 
                    "ausgabeNeu": "/Yes",
                    "ausgabeGebraucht": "/Off",
                    "ITNr": "TEST001",
                    "SuSVorn": "Max",
                    "SuSNachn": "Mustermann"
                },
                "should_warn": True,
                "reason": "NutzungEinhaltung == NutzungKenntnisnahme (both ON)"
            },
            {
                "name": "Both Nutzung OFF (should trigger warning)",
                "form_fields": {
                    "NutzungEinhaltung": "/Off",
                    "NutzungKenntnisnahme": "/Off",
                    "ausgabeNeu": "/Yes", 
                    "ausgabeGebraucht": "/Off",
                    "ITNr": "TEST002",
                    "SuSVorn": "Anna",
                    "SuSNachn": "Schmidt"
                },
                "should_warn": True,
                "reason": "NutzungEinhaltung == NutzungKenntnisnahme (both OFF)"
            },
            {
                "name": "Both Ausgabe ON (should trigger warning)",
                "form_fields": {
                    "NutzungEinhaltung": "/Yes",
                    "NutzungKenntnisnahme": "/Off",
                    "ausgabeNeu": "/Yes",
                    "ausgabeGebraucht": "/Yes",
                    "ITNr": "TEST003", 
                    "SuSVorn": "Peter",
                    "SuSNachn": "Mueller"
                },
                "should_warn": True,
                "reason": "ausgabeNeu == ausgabeGebraucht (both ON)"
            },
            {
                "name": "Both Ausgabe OFF (should trigger warning)",
                "form_fields": {
                    "NutzungEinhaltung": "/Yes",
                    "NutzungKenntnisnahme": "/Off",
                    "ausgabeNeu": "/Off",
                    "ausgabeGebraucht": "/Off",
                    "ITNr": "TEST004",
                    "SuSVorn": "Lisa",
                    "SuSNachn": "Weber"
                },
                "should_warn": True,
                "reason": "ausgabeNeu == ausgabeGebraucht (both OFF)"
            },
            {
                "name": "Different Nutzung, Different Ausgabe (should NOT trigger warning)",
                "form_fields": {
                    "NutzungEinhaltung": "/Yes",
                    "NutzungKenntnisnahme": "/Off",
                    "ausgabeNeu": "/Yes",
                    "ausgabeGebraucht": "/Off",
                    "ITNr": "TEST005",
                    "SuSVorn": "Tom",
                    "SuSNachn": "Fischer"
                },
                "should_warn": False,
                "reason": "All checkboxes are different"
            },
            {
                "name": "Mixed scenario - Nutzung same, Ausgabe different (should trigger warning)",
                "form_fields": {
                    "NutzungEinhaltung": "/Off",
                    "NutzungKenntnisnahme": "/Off",
                    "ausgabeNeu": "/Yes",
                    "ausgabeGebraucht": "/Off",
                    "ITNr": "TEST006",
                    "SuSVorn": "Sarah",
                    "SuSNachn": "Klein"
                },
                "should_warn": True,
                "reason": "NutzungEinhaltung == NutzungKenntnisnahme (both OFF)"
            }
        ]
        
        # Test the validation logic directly by checking existing contracts
        print("\n   🔍 Testing validation logic with existing contracts...")
        
        # Get current assignments to analyze their validation
        success = self.run_api_test(
            "Get Assignments for Validation Analysis",
            "GET",
            "assignments",
            200
        )
        
        if not success:
            return self.log_result("Contract Validation Formula", False, "Could not get assignments for testing")
        
        assignments = self.test_results[-1]['response_data']
        if not isinstance(assignments, list):
            return self.log_result("Contract Validation Formula", False, "Invalid assignments response")
        
        # Analyze existing contracts to verify validation logic
        validation_results = []
        contracts_analyzed = 0
        
        for assignment in assignments:
            if assignment.get('contract_id'):
                contracts_analyzed += 1
                contract_id = assignment['contract_id']
                itnr = assignment['itnr']
                student_name = assignment['student_name']
                contract_warning = assignment.get('contract_warning', False)
                
                print(f"\n   📋 Analyzing Contract for {itnr} -> {student_name}")
                print(f"      Contract ID: {contract_id}")
                print(f"      Warning Status: {contract_warning}")
                
                # Get contract details to verify validation logic
                contract_success = self.run_api_test(
                    f"Get Contract Details - {itnr}",
                    "GET",
                    f"contracts/{contract_id}",
                    200
                )
                
                if contract_success:
                    contract_data = self.test_results[-1]['response_data']
                    form_fields = contract_data.get('form_fields', {})
                    
                    # Apply the same validation logic as the backend
                    nutzung_einhaltung = form_fields.get('NutzungEinhaltung') == '/Yes'
                    # Handle both field name variations
                    nutzung_kenntnisnahme_field = form_fields.get('NutzungKenntnisnahme') or form_fields.get('NutzungKenntnisname', '')
                    nutzung_kenntnisnahme = bool(nutzung_kenntnisnahme_field and nutzung_kenntnisnahme_field != '')
                    ausgabe_neu = form_fields.get('ausgabeNeu') == '/Yes'
                    ausgabe_gebraucht = form_fields.get('ausgabeGebraucht') == '/Yes'
                    
                    # Calculate expected warning
                    expected_warning = (nutzung_einhaltung == nutzung_kenntnisnahme) or (ausgabe_neu == ausgabe_gebraucht)
                    
                    print(f"      Form Fields Analysis:")
                    print(f"        NutzungEinhaltung: {form_fields.get('NutzungEinhaltung')} -> {nutzung_einhaltung}")
                    print(f"        NutzungKenntnisnahme: {nutzung_kenntnisnahme_field} -> {nutzung_kenntnisnahme}")
                    print(f"        ausgabeNeu: {form_fields.get('ausgabeNeu')} -> {ausgabe_neu}")
                    print(f"        ausgabeGebraucht: {form_fields.get('ausgabeGebraucht')} -> {ausgabe_gebraucht}")
                    print(f"      Expected Warning: {expected_warning}")
                    print(f"      Actual Warning: {contract_warning}")
                    
                    if expected_warning == contract_warning:
                        validation_results.append(True)
                        print(f"      ✅ VALIDATION CORRECT")
                    else:
                        validation_results.append(False)
                        print(f"      ❌ VALIDATION INCORRECT - Expected {expected_warning}, got {contract_warning}")
                else:
                    validation_results.append(False)
                    print(f"      ❌ Could not retrieve contract details")
        
        # Calculate overall success
        if contracts_analyzed == 0:
            return self.log_result("Contract Validation Formula", False, "No contracts found to test validation")
        
        successful_validations = sum(validation_results)
        
        if successful_validations == contracts_analyzed:
            return self.log_result(
                "Contract Validation Formula", 
                True, 
                f"All {contracts_analyzed} contract validations are correct"
            )
        else:
            return self.log_result(
                "Contract Validation Formula", 
                False, 
                f"Only {successful_validations}/{contracts_analyzed} contract validations are correct"
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

    def run_comprehensive_test(self):
        """Run all tests in sequence"""
        print("=" * 80)
        print("🚀 STARTING COMPREHENSIVE iPad MANAGEMENT SYSTEM API TESTS")
        print("=" * 80)
        print(f"Testing against: {self.base_url}")
        print(f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Test sequence
        tests = [
            ("Admin Setup", self.test_admin_setup),
            ("Login", self.test_login),
            ("Upload iPads", self.test_upload_ipads),
            ("Get iPads", self.test_get_ipads),
            ("Upload Students", self.test_upload_students),
            ("Get Students", self.test_get_students),
            ("Auto Assignment", self.test_auto_assign),
            ("Get Assignments", self.test_get_assignments),
            ("Contract Validation Formula", self.test_contract_validation_formula),
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