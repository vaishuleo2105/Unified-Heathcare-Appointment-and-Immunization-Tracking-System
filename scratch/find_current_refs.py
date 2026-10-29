import docx

doc = docx.Document(r'D:\Unified_Healthcare_Project_Report (1).docx')

with open('scratch/current_references.txt', 'w', encoding='utf-8') as f:
    for i, p in enumerate(doc.paragraphs):
        txt = p.text.strip()
        if any(txt.startswith(prefix) for prefix in [
            "As illustrated in Figure", "Figure 3.1 depicts", "Figure 3.2 illustrates", "Figure 3.3 presents",
            "Figure 3.4 outlines", "Figure 3.5 demonstrates", "Figure 4.1 illustrates", "As shown in Figure 4.2",
            "Figure 4.3 displays", "Figure 4.4 illustrates", "Figure 4.5 presents", "Figure 4.6 demonstrates",
            "Figure 4.7 illustrates", "Figure 4.8 displays", "Figure 4.9 depicts", "Figure 4.10 exhibits",
            "Figure 4.11 presents", "Figure 4.12 shows", "Figure 4.13 displays", "Figure 4.14 illustrates",
            "Figure 4.15 displays", "Figure 4.16 depicts", "Figure 4.17 demonstrates", "Figure 4.18 exhibits",
            "Figure 4.19 outlines", "Figure 4.20 presents", "Figure 4.21 shows", "Figure 4.22 displays",
            "Figure 4.23 illustrates", "Table 1.1 outlines", "Table 2.1 specifies", "Table 2.2 enumerates",
            "Table 3.1 summarizes", "Table 5.1 presents", "Algorithm 1 delineates", "Algorithm 2 outlines"
        ]):
            f.write(f"P{i}: {txt}\n\n")

print("Found current references.")
