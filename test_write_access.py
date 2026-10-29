import docx
import os

target_path = r'D:\Unified_Healthcare_Project_Report (1).docx'

try:
    doc = docx.Document(target_path)
    # Test saving to a temp file first
    temp_path = r'D:\Unified_Healthcare_Project_Report_test_save.docx'
    doc.save(temp_path)
    print("Successfully saved to temp path:", temp_path)
    os.remove(temp_path)
    print("Successfully cleaned up temp path.")
    
    # Now test opening target for write
    with open(target_path, 'r+b') as f:
        print("Target file is WRITABLE (no exclusive Word lock)!")
except PermissionError as pe:
    print(f"PermissionError (File is locked by Word): {pe}")
except Exception as e:
    print(f"Error: {e}")
