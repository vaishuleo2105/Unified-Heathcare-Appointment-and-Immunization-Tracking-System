import docx

doc = docx.Document(r'D:\Unified_Healthcare_Project_Report (1).docx')

def check_target(label, query):
    print(f"=== {label} ===")
    matches = []
    for i, p in enumerate(doc.paragraphs):
        if query.lower() in p.text.lower():
            matches.append((i, p.text.strip()))
    for idx, txt in matches[:5]:
        print(f"  P{idx}: {txt[:90]}")

check_target("CHAPTER 1", "CHAPTER 1")
check_target("1.1 PROJECT OVERVIEW", "1.1 PROJECT OVERVIEW")
check_target("CHAPTER 2", "CHAPTER 2")
check_target("2.1 EXISTING SYSTEM", "2.1 EXISTING SYSTEM")
check_target("CHAPTER 3", "CHAPTER 3")
check_target("3.1 SYSTEM ARCHITECTURE", "3.1 SYSTEM ARCHITECTURE")
check_target("CHAPTER 4", "CHAPTER 4")
check_target("4.1 USER PORTALS", "4.1 USER PORTALS")
check_target("CHAPTER 5", "CHAPTER 5")
check_target("5.1 TESTING INTRODUCTION", "5.1 TESTING INTRODUCTION")
check_target("CHAPTER 6", "CHAPTER 6")
check_target("6.1 CONCLUSION", "6.1 CONCLUSION")
