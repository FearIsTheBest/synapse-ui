import re

with open('src/App.jsx', 'r') as f:
    lines = f.readlines()

# Count divs from return to first conditional
return_line = 1347   # line 1348 in file
first_conditional_line = 3181  # showChangelog &&

section_lines = lines[return_line:first_conditional_line]

# Find all divs with specific IDs or classes
for i, line in enumerate(section_lines[-50:], start=len(section_lines)-50):
    if '<div' in line or '</div>' in line:
        print(f"{i + return_line + 1}: {line.strip()[:120]}")

