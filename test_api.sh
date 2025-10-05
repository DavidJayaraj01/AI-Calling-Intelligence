#!/bin/bash
# Test script to verify API response format

echo "Testing API response format..."
echo "================================="

# Test the API call that the frontend makes
echo "Making API call to analyze-transcript..."
response=$(curl -s -X POST http://localhost:8000/api/audio/analyze-transcript \
  -H "Content-Type: application/json" \
  -d '{"transcript": "Vendor: Hello. Distributor: We have delivery delays, pricing issues, and quality problems."}')

echo "Raw API Response:"
echo "$response" | jq '.'

echo ""
echo "================================="
echo "Checking specific fields:"
echo ""

# Check if analysis field exists
echo "Has analysis field: $(echo "$response" | jq 'has("analysis")')"

# Check if pain_points exists
echo "Pain points count: $(echo "$response" | jq '.analysis.pain_points | length')"

# Check if action_items exists  
echo "Action items count: $(echo "$response" | jq '.analysis.action_items | length')"

# Check if recommendations exists
echo "Recommendations count: $(echo "$response" | jq '.analysis.recommendations | length')"

echo ""
echo "Sample pain point:"
echo "$response" | jq '.analysis.pain_points[0]'

echo ""
echo "Sample action item:"
echo "$response" | jq '.analysis.action_items[0]'

echo ""
echo "Sample recommendation:"
echo "$response" | jq '.analysis.recommendations[0]'