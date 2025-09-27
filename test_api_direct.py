import requests
import json

def test_api_endpoint():
    print("🧪 Testing Model Test API Endpoint")
    print("=" * 50)
    
    # Test data
    test_transcript = """
    Good morning, thank you for joining our Q3 business review. We have seen significant growth in our partnership this quarter. The new cloud infrastructure deployment has been successful, with 99.9% uptime achieved. However, we have encountered some challenges with the data migration process that we need to address. The pricing structure is working well, but we need to discuss scaling options for next quarter.
    """
    
    try:
        # Test the health endpoint first
        print("🏥 Testing Health Check...")
        health_response = requests.get("http://localhost:8000/api/health")
        if health_response.status_code == 200:
            health_data = health_response.json()
            print("✅ Health Check: PASS")
            print(f"  - OpenAI Configured: {health_data.get('openai_configured', 'N/A')}")
        else:
            print("❌ Health Check: FAIL")
            return
            
        print("\n🔍 Testing Analyze Transcript Endpoint...")
        print(f"📡 Sending request to: http://localhost:8000/api/audio/analyze-transcript")
        print(f"📝 Transcript length: {len(test_transcript)} characters")
        
        # Test the analyze transcript endpoint
        response = requests.post(
            "http://localhost:8000/api/audio/analyze-transcript",
            json={"transcript": test_transcript.strip()},
            headers={"Content-Type": "application/json"}
        )
        
        print(f"📊 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ SUCCESS! API endpoint is working")
            print("\n📈 Analysis Results:")
            print(f"  - Success: {result.get('success')}")
            
            if result.get('success'):
                analysis = result.get('analysis', {})
                print(f"  - Sentiment: {analysis.get('overall_sentiment')}")
                print(f"  - Confidence: {analysis.get('confidence_score')}")
                print(f"  - Pain Points: {len(analysis.get('pain_points', []))}")
                print(f"  - Action Items: {len(analysis.get('action_items', []))}")
                print(f"  - Recommendations: {len(analysis.get('recommendations', []))}")
                print(f"  - Model Used: {result.get('model_used', 'N/A')}")
                print(f"  - Tokens Used: {result.get('tokens_used', 0)}")
                
                # Show some sample results
                if analysis.get('pain_points'):
                    print("\n🔍 Sample Pain Points:")
                    for i, pp in enumerate(analysis.get('pain_points', [])[:2]):
                        print(f"  {i+1}. {pp.get('description', pp)}")
                
                if analysis.get('action_items'):
                    print("\n📋 Sample Action Items:")
                    for i, ai in enumerate(analysis.get('action_items', [])[:2]):
                        print(f"  {i+1}. {ai.get('title', ai)}")
            else:
                print(f"  - Error: {result.get('error')}")
        else:
            print(f"❌ FAILED! Status: {response.status_code}")
            try:
                error_detail = response.json()
                print(f"  - Error: {error_detail}")
            except:
                print(f"  - Raw response: {response.text}")
                
    except requests.exceptions.ConnectionError:
        print("❌ CONNECTION ERROR: Cannot connect to backend")
        print("   Make sure the backend is running on http://localhost:8000")
        print("   Run: cd backend && python main.py")
    except Exception as e:
        print(f"❌ ERROR: {e}")

if __name__ == "__main__":
    test_api_endpoint()