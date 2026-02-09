"""
Load Testing Suite for LandBiznes Backend
Tests system performance and scalability at 20M+ user capacity
"""

from locust import HttpUser, task, between, events
from locust.contrib.fasthttp import FastHttpUser
import random
import time
import uuid
import json
from datetime import datetime


# ============================================================================
# CONFIGURATION
# ============================================================================

BASE_URL = "http://localhost:8000/api/v1"
ADMIN_TOKEN = "admin_token_here"
USER_TOKEN = "user_token_here"

# Test data
PROPERTY_IDS = [str(uuid.uuid4()) for _ in range(100)]
TRANSACTION_IDS = [str(uuid.uuid4()) for _ in range(100)]
USER_IDS = [str(uuid.uuid4()) for _ in range(100)]


# ============================================================================
# LOAD TEST SCENARIOS
# ============================================================================

class PropertySearchUser(FastHttpUser):
    """Scenario 1: Property Search (1M concurrent requests)"""
    wait_time = between(1, 5)
    
    @task(10)
    def search_properties(self):
        """Search for properties - HIGH VOLUME"""
        query = random.choice(["residential", "commercial", "agricultural"])
        with self.client.get(
            f"{BASE_URL}/land?search={query}&limit=50",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Search failed: {response.status_code}")
    
    @task(5)
    def get_property_details(self):
        """Get individual property - MEDIUM VOLUME"""
        prop_id = random.choice(PROPERTY_IDS)
        with self.client.get(
            f"{BASE_URL}/land/{prop_id}",
            headers={"Authorization": f"Bearer {USER_TOKEN}"},
            catch_response=True
        ) as response:
            if response.status_code in [200, 404]:
                response.success()
            else:
                response.failure(f"Get property failed: {response.status_code}")
    
    @task(3)
    def filter_properties(self):
        """Filter properties by location - MEDIUM VOLUME"""
        lat = random.uniform(-90, 90)
        lon = random.uniform(-180, 180)
        with self.client.get(
            f"{BASE_URL}/land?latitude={lat}&longitude={lon}&radius=10",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Filter failed: {response.status_code}")


class TitleVerificationUser(FastHttpUser):
    """Scenario 2: Title Verification (100K concurrent)"""
    wait_time = between(2, 8)
    
    @task(8)
    def verify_title(self):
        """Initiate title verification"""
        with self.client.post(
            f"{BASE_URL}/api/v1/title-verification/verify",
            json={
                "land_id": random.choice(PROPERTY_IDS),
                "registry_source": "government",
                "urgency": "standard"
            },
            headers={"Authorization": f"Bearer {USER_TOKEN}"},
            catch_response=True
        ) as response:
            if response.status_code in [200, 201]:
                response.success()
            else:
                response.failure(f"Verification failed: {response.status_code}")
    
    @task(5)
    def check_verification_status(self):
        """Check verification status"""
        with self.client.get(
            f"{BASE_URL}/api/v1/title-verification/{random.choice(PROPERTY_IDS)}/status",
            headers={"Authorization": f"Bearer {USER_TOKEN}"},
            catch_response=True
        ) as response:
            if response.status_code in [200, 404]:
                response.success()
            else:
                response.failure(f"Status check failed: {response.status_code}")


class FraudDetectionUser(FastHttpUser):
    """Scenario 3: Fraud Detection (50K concurrent)"""
    wait_time = between(2, 10)
    
    @task(8)
    def analyze_fraud(self):
        """Analyze transaction for fraud"""
        with self.client.post(
            f"{BASE_URL}/api/v1/fraud-detection/analyze",
            json={
                "transaction_id": random.choice(TRANSACTION_IDS),
                "include_historical": True,
                "include_market_comparison": True
            },
            headers={"Authorization": f"Bearer {USER_TOKEN}"},
            catch_response=True
        ) as response:
            if response.status_code in [200, 201]:
                response.success()
            else:
                response.failure(f"Fraud analysis failed: {response.status_code}")
    
    @task(5)
    def get_risk_profile(self):
        """Get party risk profile"""
        user_id = random.choice(USER_IDS)
        with self.client.get(
            f"{BASE_URL}/api/v1/fraud-detection/party/{user_id}/risk-profile",
            headers={"Authorization": f"Bearer {ADMIN_TOKEN}"},
            catch_response=True
        ) as response:
            if response.status_code in [200, 404]:
                response.success()
            else:
                response.failure(f"Risk profile failed: {response.status_code}")


class DisputeFilingUser(FastHttpUser):
    """Scenario 4: Dispute Filing (10K concurrent)"""
    wait_time = between(3, 15)
    
    @task(6)
    def file_dispute(self):
        """File a new dispute"""
        with self.client.post(
            f"{BASE_URL}/api/v1/disputes/file",
            json={
                "dispute_type": random.choice([
                    "boundary_dispute",
                    "ownership_dispute",
                    "title_defect",
                    "payment_default"
                ]),
                "plaintiff_id": random.choice(USER_IDS),
                "defendant_id": random.choice(USER_IDS),
                "land_id": random.choice(PROPERTY_IDS),
                "description": "Test dispute for load testing"
            },
            headers={"Authorization": f"Bearer {USER_TOKEN}"},
            catch_response=True
        ) as response:
            if response.status_code in [200, 201]:
                response.success()
            else:
                response.failure(f"Dispute filing failed: {response.status_code}")
    
    @task(4)
    def get_dispute_details(self):
        """Get dispute details"""
        dispute_id = random.choice(TRANSACTION_IDS)
        with self.client.get(
            f"{BASE_URL}/api/v1/disputes/{dispute_id}",
            headers={"Authorization": f"Bearer {USER_TOKEN}"},
            catch_response=True
        ) as response:
            if response.status_code in [200, 404]:
                response.success()
            else:
                response.failure(f"Get dispute failed: {response.status_code}")


class ComplianceCheckUser(FastHttpUser):
    """Scenario 5: Compliance Checking (30K concurrent)"""
    wait_time = between(2, 8)
    
    @task(7)
    def run_compliance_check(self):
        """Run compliance check on transaction"""
        with self.client.post(
            f"{BASE_URL}/api/v1/compliance/check",
            json={
                "transaction_id": random.choice(TRANSACTION_IDS),
                "check_type": random.choice([
                    "aml_kyc",
                    "fraud_check",
                    "title_verification",
                    "environmental_scan"
                ])
            },
            headers={"Authorization": f"Bearer {USER_TOKEN}"},
            catch_response=True
        ) as response:
            if response.status_code in [200, 201]:
                response.success()
            else:
                response.failure(f"Compliance check failed: {response.status_code}")
    
    @task(3)
    def get_compliance_dashboard(self):
        """Get compliance dashboard"""
        with self.client.get(
            f"{BASE_URL}/api/v1/compliance/dashboard",
            headers={"Authorization": f"Bearer {ADMIN_TOKEN}"},
            catch_response=True
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Dashboard failed: {response.status_code}")


class DigitalSignatureUser(FastHttpUser):
    """Scenario 6: Digital Signatures (20K concurrent)"""
    wait_time = between(3, 10)
    
    @task(6)
    def create_signature_request(self):
        """Create signature request"""
        with self.client.post(
            f"{BASE_URL}/api/v1/signatures/request",
            json={
                "document_id": str(uuid.uuid4()),
                "document_name": "Test Document.pdf",
                "document_type": "settlement_agreement",
                "transaction_id": random.choice(TRANSACTION_IDS),
                "signers_count": 2,
                "fields": []
            },
            headers={"Authorization": f"Bearer {USER_TOKEN}"},
            catch_response=True
        ) as response:
            if response.status_code in [200, 201]:
                response.success()
            else:
                response.failure(f"Create signature request failed: {response.status_code}")


class BlockchainUser(FastHttpUser):
    """Scenario 7: Blockchain Operations (15K concurrent)"""
    wait_time = between(3, 12)
    
    @task(5)
    def register_title_blockchain(self):
        """Register title on blockchain"""
        with self.client.post(
            f"{BASE_URL}/api/v1/blockchain/transactions/record-title",
            json={
                "land_id": random.choice(PROPERTY_IDS),
                "transaction_type": "RegisterTitle",
                "data_to_record": {
                    "owner_id": random.choice(USER_IDS),
                    "registration_date": datetime.utcnow().isoformat()
                },
                "from_address": f"0x{uuid.uuid4().hex[:40]}",
                "to_address": f"0x{uuid.uuid4().hex[:40]}"
            },
            headers={"Authorization": f"Bearer {USER_TOKEN}"},
            catch_response=True
        ) as response:
            if response.status_code in [200, 201]:
                response.success()
            else:
                response.failure(f"Blockchain registration failed: {response.status_code}")
    
    @task(3)
    def verify_title_blockchain(self):
        """Verify title on blockchain"""
        with self.client.get(
            f"{BASE_URL}/api/v1/blockchain/verify-title/{random.choice(PROPERTY_IDS)}",
            headers={"Authorization": f"Bearer {USER_TOKEN}"},
            catch_response=True
        ) as response:
            if response.status_code in [200, 404]:
                response.success()
            else:
                response.failure(f"Blockchain verification failed: {response.status_code}")


class StakeholderUser(FastHttpUser):
    """Scenario 8: Multi-Stakeholder Operations (25K concurrent)"""
    wait_time = between(2, 8)
    
    @task(7)
    def browse_professional_directory(self):
        """Browse professional directory"""
        role = random.choice(["appraiser", "surveyor", "lawyer"])
        with self.client.get(
            f"{BASE_URL}/api/v1/stakeholders/directory?role={role}&verified_only=true",
            headers={"Authorization": f"Bearer {USER_TOKEN}"},
            catch_response=True
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Directory browse failed: {response.status_code}")
    
    @task(3)
    def get_professional_profile(self):
        """Get professional profile"""
        prof_id = random.choice(USER_IDS)
        with self.client.get(
            f"{BASE_URL}/api/v1/stakeholders/profile/{prof_id}",
            headers={"Authorization": f"Bearer {USER_TOKEN}"},
            catch_response=True
        ) as response:
            if response.status_code in [200, 404]:
                response.success()
            else:
                response.failure(f"Profile fetch failed: {response.status_code}")


# ============================================================================
# CUSTOM EVENTS & REPORTING
# ============================================================================

@events.test_start.add_listener
def on_test_start(environment, **kwargs):
    """Called when test starts"""
    print("\n" + "="*70)
    print("LANDBIZNES LOAD TEST SUITE STARTED")
    print("="*70)
    print(f"Start Time: {datetime.utcnow()}")
    print(f"Target: {BASE_URL}")
    print("="*70 + "\n")


@events.test_stop.add_listener
def on_test_stop(environment, **kwargs):
    """Called when test stops"""
    print("\n" + "="*70)
    print("LANDBIZNES LOAD TEST SUITE COMPLETED")
    print("="*70)
    
    # Print summary
    stats = environment.stats
    print(f"\nTotal Requests: {stats.total.num_requests}")
    print(f"Total Failures: {stats.total.num_failures}")
    print(f"Response Time (avg): {stats.total.avg_response_time:.0f}ms")
    print(f"Response Time (min): {stats.total.min_response_time:.0f}ms")
    print(f"Response Time (max): {stats.total.max_response_time:.0f}ms")
    print(f"95th percentile: {stats.total.get_response_time_percentile(0.95):.0f}ms")
    print(f"99th percentile: {stats.total.get_response_time_percentile(0.99):.0f}ms")
    print(f"\nSuccess Rate: {((stats.total.num_requests - stats.total.num_failures) / stats.total.num_requests * 100):.1f}%")
    print("="*70 + "\n")


# ============================================================================
# PERFORMANCE THRESHOLDS
# ============================================================================

PERFORMANCE_TARGETS = {
    "property_search": {
        "response_time_p95": 500,  # 500ms
        "response_time_p99": 1000,  # 1s
        "error_rate": 0.01  # 1%
    },
    "title_verification": {
        "response_time_p95": 2000,  # 2s
        "response_time_p99": 5000,  # 5s
        "error_rate": 0.02  # 2%
    },
    "fraud_detection": {
        "response_time_p95": 3000,  # 3s
        "response_time_p99": 7000,  # 7s
        "error_rate": 0.02  # 2%
    },
    "dispute_filing": {
        "response_time_p95": 2000,  # 2s
        "response_time_p99": 5000,  # 5s
        "error_rate": 0.01  # 1%
    }
}


# ============================================================================
# MONITORING & METRICS
# ============================================================================

class PerformanceMonitor:
    """Track and report performance metrics"""
    
    @staticmethod
    def check_thresholds(stats):
        """Check if performance meets targets"""
        print("\n" + "="*70)
        print("PERFORMANCE ANALYSIS")
        print("="*70)
        
        for scenario_name, targets in PERFORMANCE_TARGETS.items():
            print(f"\n{scenario_name.upper().replace('_', ' ')}")
            print("-" * 40)
            
            # Check response time
            p95 = stats.total.get_response_time_percentile(0.95)
            p99 = stats.total.get_response_time_percentile(0.99)
            
            p95_status = "✓" if p95 <= targets["response_time_p95"] else "✗"
            p99_status = "✓" if p99 <= targets["response_time_p99"] else "✗"
            
            print(f"P95 Response Time: {p95:.0f}ms {p95_status} (target: {targets['response_time_p95']}ms)")
            print(f"P99 Response Time: {p99:.0f}ms {p99_status} (target: {targets['response_time_p99']}ms)")
            
            # Check error rate
            error_rate = stats.total.num_failures / stats.total.num_requests if stats.total.num_requests > 0 else 0
            error_status = "✓" if error_rate <= targets["error_rate"] else "✗"
            print(f"Error Rate: {error_rate*100:.1f}% {error_status} (target: {targets['error_rate']*100:.1f}%)")
        
        print("\n" + "="*70)


# ============================================================================
# SCALABILITY RECOMMENDATIONS
# ============================================================================

"""
SCALABILITY ROADMAP:

At 10M Users:
- Deploy 5+ backend servers (load balanced)
- Use database connection pooling (50+ connections)
- Implement Redis caching for property searches
- Use CDN for static content

At 20M Users:
- Deploy 10+ backend servers
- Implement read replicas for database
- Use Elasticsearch for property search
- Implement rate limiting (1000 req/s per user)
- Use message queue for async operations
- Implement API caching with 5-minute TTL

Performance Targets at 20M Users:
- Property Search: <200ms p95, <500ms p99
- Title Verification: <1000ms p95, <3000ms p99
- Fraud Detection: <2000ms p95, <5000ms p99
- System throughput: 50,000 requests/second
- Database queries: <100ms average
- Memory usage: <80% of available
- CPU usage: <70% average

Monitoring & Alerting:
- Alert on p95 > 1000ms
- Alert on p99 > 3000ms
- Alert on error rate > 2%
- Alert on CPU > 80%
- Alert on memory > 85%
"""
