import requests
import sys
import json
from datetime import datetime

class Platform367APITester:
    def __init__(self, base_url="https://figma-vision.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.case_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, list):
                        print(f"   Response: List with {len(response_data)} items")
                    else:
                        print(f"   Response keys: {list(response_data.keys()) if isinstance(response_data, dict) else 'Non-dict response'}")
                except:
                    print(f"   Response: {response.text[:100]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")

            return success, response.json() if response.text and response.status_code < 500 else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_login(self):
        """Test login with admin credentials"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@367.com", "password": "admin123"}
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            if 'user' in response:
                self.user_id = response['user']['id']
                print(f"   Logged in as: {response['user']['full_name']}")
            return True
        return False

    def test_invalid_login(self):
        """Test login with invalid credentials"""
        success, _ = self.run_test(
            "Invalid Login",
            "POST",
            "auth/login",
            401,
            data={"email": "invalid@test.com", "password": "wrongpass"}
        )
        return success

    def test_get_me(self):
        """Test getting current user info"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        return success

    def test_get_pending_cases(self):
        """Test getting pending cases"""
        success, response = self.run_test(
            "Get Pending Cases",
            "GET",
            "cases/pending",
            200
        )
        if success and response:
            print(f"   Found {len(response)} pending cases")
            if response:
                self.case_id = response[0]['id']  # Store first case ID for later tests
                print(f"   First case: {response[0]['title']}")
        return success

    def test_get_reviewed_cases(self):
        """Test getting reviewed cases"""
        success, response = self.run_test(
            "Get Reviewed Cases",
            "GET",
            "cases/reviewed",
            200
        )
        if success and response:
            print(f"   Found {len(response)} reviewed cases")
        return success

    def test_get_case_by_id(self):
        """Test getting a specific case by ID"""
        if not self.case_id:
            print("⚠️  Skipping case by ID test - no case ID available")
            return True
            
        success, response = self.run_test(
            "Get Case by ID",
            "GET",
            f"cases/{self.case_id}",
            200
        )
        return success

    def test_review_case(self):
        """Test reviewing a case (approve)"""
        if not self.case_id:
            print("⚠️  Skipping case review test - no case ID available")
            return True
            
        success, response = self.run_test(
            "Review Case (Approve)",
            "PUT",
            f"cases/{self.case_id}/review",
            200,
            data={
                "status": "approved",
                "comments": "Test approval - automated test"
            }
        )
        return success

    def test_get_traffic_laws(self):
        """Test getting traffic laws"""
        success, response = self.run_test(
            "Get Traffic Laws",
            "GET",
            "traffic-laws",
            200
        )
        if success and response:
            print(f"   Found {len(response)} traffic laws")
        return success

    def test_get_statistics(self):
        """Test getting user statistics"""
        if not self.user_id:
            print("⚠️  Skipping statistics test - no user ID available")
            return True
            
        success, response = self.run_test(
            "Get User Statistics (Current)",
            "GET",
            f"statistics/{self.user_id}?period=current",
            200
        )
        if success:
            print(f"   Statistics: {response}")
        return success

    def test_search_cases(self):
        """Test case search functionality"""
        success, response = self.run_test(
            "Search Cases",
            "GET",
            "search?q=CRV",
            200
        )
        if success and response:
            print(f"   Found {len(response)} cases matching 'CRV'")
        return success

def main():
    print("🚀 Starting Platform 367 API Testing...")
    print("=" * 50)
    
    tester = Platform367APITester()
    
    # Test sequence
    tests = [
        ("Authentication", [
            tester.test_invalid_login,
            tester.test_login,
            tester.test_get_me
        ]),
        ("Case Management", [
            tester.test_get_pending_cases,
            tester.test_get_reviewed_cases,
            tester.test_get_case_by_id,
            tester.test_review_case
        ]),
        ("Additional Features", [
            tester.test_get_traffic_laws,
            tester.test_get_statistics,
            tester.test_search_cases
        ])
    ]
    
    for category, test_functions in tests:
        print(f"\n📋 {category} Tests")
        print("-" * 30)
        
        for test_func in test_functions:
            if not test_func():
                print(f"❌ Critical failure in {test_func.__name__}")
    
    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        failed = tester.tests_run - tester.tests_passed
        print(f"⚠️  {failed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())