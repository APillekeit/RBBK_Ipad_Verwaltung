#!/usr/bin/env python3
"""
Test-Script für Docker-Container-Bibliotheken
Testet ob alle PDF- und Excel-Bibliotheken korrekt installiert sind
"""

import sys
import traceback

def test_library(lib_name, import_statement):
    """Teste ob eine Bibliothek importiert werden kann"""
    try:
        exec(import_statement)
        print(f"✅ {lib_name}: OK")
        return True
    except ImportError as e:
        print(f"❌ {lib_name}: FEHLER - {e}")
        return False
    except Exception as e:
        print(f"⚠️  {lib_name}: WARNUNG - {e}")
        return True

def test_pdf_functionality():
    """Teste grundlegende PDF-Funktionalität"""
    try:
        import PyPDF2
        import io
        
        # Erstelle ein minimales PDF zum Testen
        pdf_content = b"""%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
>>
endobj
xref
0 4
0000000000 65535 f 
0000000009 00000 n 
0000000074 00000 n 
0000000120 00000 n 
trailer
<<
/Size 4
/Root 1 0 R
>>
startxref
179
%%EOF"""
        
        reader = PyPDF2.PdfReader(io.BytesIO(pdf_content))
        num_pages = len(reader.pages)
        print(f"✅ PDF-Funktionalität: OK ({num_pages} Seiten gelesen)")
        return True
        
    except Exception as e:
        print(f"❌ PDF-Funktionalität: FEHLER - {e}")
        return False

def test_excel_functionality():
    """Teste grundlegende Excel-Funktionalität"""
    try:
        import pandas as pd
        import io
        
        # Erstelle Test-Excel-Daten
        test_data = {
            'ITNr': ['IPAD001', 'IPAD002'],
            'SuSVorn': ['Max', 'Anna'],
            'SuSNachn': ['Mustermann', 'Schmidt']
        }
        
        df = pd.DataFrame(test_data)
        
        # Test Excel-Export
        excel_buffer = io.BytesIO()
        df.to_excel(excel_buffer, index=False, engine='openpyxl')
        excel_buffer.seek(0)
        
        # Test Excel-Import
        df_read = pd.read_excel(excel_buffer, engine='openpyxl')
        
        if len(df_read) == 2 and 'ITNr' in df_read.columns:
            print(f"✅ Excel-Funktionalität: OK ({len(df_read)} Zeilen gelesen)")
            return True
        else:
            print(f"❌ Excel-Funktionalität: FEHLER - Daten nicht korrekt gelesen")
            return False
            
    except Exception as e:
        print(f"❌ Excel-Funktionalität: FEHLER - {e}")
        return False

def main():
    """Haupttest-Funktion"""
    print("🔍 Teste Docker-Container-Bibliotheken...")
    print("=" * 50)
    
    # Test Grundbibliotheken
    libraries = [
        ("FastAPI", "import fastapi"),
        ("Uvicorn", "import uvicorn"),
        ("Pydantic", "import pydantic"),
        ("Motor (MongoDB)", "import motor"),
        ("PyMongo", "import pymongo"),
        ("Pandas", "import pandas"),
        ("NumPy", "import numpy"),
        ("OpenPyXL", "import openpyxl"),
        ("PyPDF2", "import PyPDF2"),
        ("XlsxWriter", "import xlsxwriter"),
        ("Passlib", "import passlib"),
        ("PyJWT", "import jwt"),
        ("Python-Multipart", "import python_multipart"),
        ("Requests", "import requests"),
        ("Cryptography", "import cryptography"),
        ("Python-Dotenv", "import dotenv"),
    ]
    
    success_count = 0
    total_count = len(libraries)
    
    for lib_name, import_stmt in libraries:
        if test_library(lib_name, import_stmt):
            success_count += 1
    
    print("\n" + "=" * 50)
    print("🧪 Teste spezifische Funktionalitäten...")
    
    # Test spezifische Funktionalitäten
    pdf_ok = test_pdf_functionality()
    excel_ok = test_excel_functionality()
    
    if pdf_ok:
        success_count += 1
    if excel_ok:
        success_count += 1
    total_count += 2
    
    print("\n" + "=" * 50)
    print(f"📊 Testergebnis: {success_count}/{total_count} Tests erfolgreich")
    
    if success_count == total_count:
        print("🎉 Alle Bibliotheken und Funktionen arbeiten korrekt!")
        return 0
    else:
        print("⚠️  Einige Tests fehlgeschlagen. Bitte Logs überprüfen.")
        return 1

if __name__ == "__main__":
    sys.exit(main())