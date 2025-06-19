#!/usr/bin/env python3
"""
Standalone script to generate gNB EMC Dashboard API documentation
Run this script to generate HTML documentation without starting the Flask server
"""

import os
import sys

# Add the backend directory to the path so we can import our modules
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

def main():
    """Generate API documentation"""
    try:
        from api_docs import generate_api_docs
        
        # Create docs directory if it doesn't exist
        docs_dir = os.path.join(backend_dir, "generated_docs")
        os.makedirs(docs_dir, exist_ok=True)
        
        # Generate documentation
        print("Generating gNB EMC Dashboard API documentation...")
        doc_file = generate_api_docs(docs_dir)
        
        print(f"✅ Documentation generated successfully!")
        print(f"📄 File: {doc_file}")
        print(f"🌐 Open in browser: file://{os.path.abspath(doc_file)}")
        
        # Also print instructions for accessing via Flask server
        print("\n" + "="*60)
        print("📋 How to access the documentation:")
        print("="*60)
        print("1. Static HTML file:")
        print(f"   Open: {os.path.abspath(doc_file)}")
        print("\n2. Via Flask server:")
        print("   Start server: python WebDashboard.py")
        print("   Visit: http://localhost:5000/api/docs")
        print("   Or root info: http://localhost:5000/")
        
        return doc_file
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("Make sure you're running this from the backend directory")
        return None
    except Exception as e:
        print(f"❌ Error generating documentation: {e}")
        return None

if __name__ == "__main__":
    main()