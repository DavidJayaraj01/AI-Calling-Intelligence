import requests
import json

def test_frontend_api():
    """Test the exact API call that frontend makes"""
    
    url = "http://localhost:8000/api/audio/analyze-transcript"
    
    # Same transcript as in frontend
    data = {
        "transcript": """Vendor (TechEdge Rep): Hello Ms. Priya, thanks for joining. I'd love to hear how your team is managing with the new product rollouts.

Distributor (Priya, Nova Distributors): Hi! Honestly, it's been challenging. We're struggling to keep up with the inventory visibility across different regions. Sometimes, we run out of stock in one location while another warehouse has extra. 

Vendor: So the issue is with stock allocation and tracking? 

Distributor: Yes, exactly. It leads to delays and unhappy clients. 

Vendor: I understand. Besides inventory, are there any other pain points your team is experiencing?

Distributor: Yes, marketing materials are another gap. Our sales reps don't always have updated brochures or case studies when pitching to clients. It makes our presentations look outdated."""
    }
    
    headers = {
        'Content-Type': 'application/json'
    }
    
    try:
        print("Testing API endpoint...")
        print(f"URL: {url}")
        print(f"Headers: {headers}")
        print("Making request...")
        
        response = requests.post(url, json=data, headers=headers, timeout=30)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ SUCCESS!")
            print(f"Response Keys: {list(result.keys())}")
            
            # Check what frontend expects
            if 'success' in result and result['success']:
                print("✅ Success field is True")
                if 'data' in result:
                    data = result['data']
                    print(f"Data keys: {list(data.keys()) if isinstance(data, dict) else 'Not a dict'}")
                    
                    # Check specific fields frontend looks for
                    fields_to_check = ['pain_points', 'action_items', 'overall_sentiment', 'recommendations']
                    for field in fields_to_check:
                        if field in data:
                            value = data[field]
                            print(f"✅ {field}: {type(value)} - {len(value) if isinstance(value, (list, str)) else value}")
                        else:
                            print(f"❌ Missing {field}")
                else:
                    print("❌ No 'data' field in response")
            else:
                print(f"❌ Success is False or missing: {result.get('success')}")
                if 'error' in result:
                    print(f"Error: {result['error']}")
        else:
            print(f"❌ HTTP Error: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Exception: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_frontend_api()