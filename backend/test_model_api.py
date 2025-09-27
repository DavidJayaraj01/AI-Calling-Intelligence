#!/usr/bin/env python3
"""
Test the Model Test API endpoint to ensure it's working correctly
"""

import requests
import json

def test_analyze_transcript():
    """Test the /api/audio/analyze-transcript endpoint"""
    
    print("🧪 Testing Model Test API Endpoint")
    print("=" * 50)
    
    # Test data - sample transcript
    test_transcript = """Vendor (TechEdge Rep): Hello Ms. Priya, thanks for joining. I'd love to hear how your team is managing with the new product rollouts.

Distributor (Priya, Nova Distributors): Hi! Honestly, it's been challenging. We're struggling to keep up with the inventory visibility across different regions. Sometimes, we run out of stock in one location while another warehouse has extra.

Vendor: So the issue is with stock allocation and tracking?

Distributor: Yes, exactly. It leads to delays and unhappy clients.

Vendor: I understand. Besides inventory, are there any other pain points your team is experiencing?

Distributor: Yes, marketing materials are another gap. Our sales reps don't always have updated brochures or case studies when pitching to clients. It makes our presentations look outdated.

Vendor: Got it. That definitely impacts customer confidence. Anything else you'd like to bring up?

Distributor: One last thing — payment flexibility. Some customers are asking for more installment options, but we don't have a clear framework for that. It puts pressure on us during negotiations.

Vendor: Thanks for sharing, Priya. Let me recap: Inventory visibility and stock allocation issues. Outdated or missing marketing materials. Limited flexibility in customer payment options."""

    # API endpoint
    url = "http://localhost:8000/api/audio/analyze-transcript"
    
    # Request payload
    payload = {
        "transcript": test_transcript
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    try:
        print(f"📡 Sending request to: {url}")
        print(f"📝 Transcript length: {len(test_transcript)} characters")
        
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        
        print(f"📊 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ SUCCESS! API endpoint is working")
            print("\n📈 Analysis Results:")
            print(f"  - Success: {result.get('success', False)}")
            
            analysis = result.get('analysis', {})
            if analysis:
                print(f"  - Sentiment: {analysis.get('overall_sentiment', 'N/A')}")
                print(f"  - Confidence: {analysis.get('confidence_score', 0)}")
                print(f"  - Pain Points: {len(analysis.get('pain_points', []))}")
                print(f"  - Action Items: {len(analysis.get('action_items', []))}")
                print(f"  - Recommendations: {len(analysis.get('recommendations', []))}")
            
            print(f"  - Model Used: {result.get('model_used', 'N/A')}")
            print(f"  - Tokens Used: {result.get('tokens_used', 0)}")
            
            return True
        else:
            print(f"❌ ERROR! Status: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Network Error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected Error: {e}")
        return False

def test_health_endpoint():
    """Test the health check endpoint"""
    print("\n🏥 Testing Health Check Endpoint")
    print("-" * 30)
    
    try:
        url = "http://localhost:8000/api/health"
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            health = response.json()
            print("✅ Health Check: PASS")
            print(f"  - OpenAI Configured: {health.get('openai_configured', False)}")
            print(f"  - Version: {health.get('version', 'N/A')}")
            print(f"  - Data Source: {health.get('data_source', 'N/A')}")
            return True
        else:
            print(f"❌ Health Check: FAIL ({response.status_code})")
            return False
    except Exception as e:
        print(f"❌ Health Check Error: {e}")
        return False

if __name__ == "__main__":
    print("🚀 AI Call Intelligence - Model Test API Verification")
    print("=" * 60)
    
    # Test health endpoint first
    health_ok = test_health_endpoint()
    
    if health_ok:
        # Test the main analysis endpoint
        analysis_ok = test_analyze_transcript()
        
        if analysis_ok:
            print("\n🎉 ALL TESTS PASSED!")
            print("Your Model Test page is ready to use at:")
            print("👉 http://localhost:5174/model-test")  # Updated port
        else:
            print("\n⚠️  Analysis endpoint failed - check OpenAI API key")
    else:
        print("\n❌ Backend server not responding - check if it's running")