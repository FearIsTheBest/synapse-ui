import re

with open('src/App.jsx', 'r') as f:
    lines = f.readlines()

# Find JSX section (from return ( on line 1348 onwards)
jsx_start = 1348  # 0-indexed
opening_divs = []
closing_divs = []

for i, line in enumerate(lines[jsx_start:], start=jsx_start+1):
    # Find opening divs
    for match in re.finditer(r'<div(?:\s|>)', line):
        opening_divs.append((i, match.start()))
    
    # Find closing divs
    for match in re.finditer(r'</div>', line):
        closing_divs.append((i, match.start()))

# Match them
open_stack = list(opening_divs)
close_list = list(closing_divs)

unmatchedOpens = []
for div_line, div_pos in open_stack:
    # Try to find a matching close
    found = False
    for i, (close_line, close_pos) in enumerate(close_list):
        if close_line > div_line:
            found = True
            close_list.pop(i)
            break
    if not found:
        unmatchedOpens.append((div_line, div_pos))

print(f"Total opening divs: {len(opening_divs)}")
print(f"Total closing divs: {len(closing_divs)}")
print(f"\nUnmatched opening divs ({len(unmatchedOpens)}):")
for line_num, pos in unmatchedOpens:
    content = lines[line_num - 1].strip()[:100]
    print(f"  Line {line_num}: {content}")

print(f"\nUnmatched closing divs ({len(close_list)}):")
for line_num, pos in close_list:
    content = lines[line_num - 1].strip()[:100]
    print(f"  Line {line_num}: {content}")
