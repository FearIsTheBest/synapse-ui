import re

with open('src/App.jsx', 'r') as f:
    content = f.read()
    lines = content.split('\n')

# Count opening and closing divs from line 1349 onwards
jsx_start = 1348  # 0-indexed for line 1349
jsx_content = '\n'.join(lines[jsx_start:])

open_divs = len(re.findall(r'<div', jsx_content))
close_divs = len(re.findall(r'</div>', jsx_content))

print(f"Opening divs in JSX: {open_divs}")
print(f"Closing divs in JSX: {close_divs}")
print(f"Difference: {open_divs - close_divs}")

# Track where the imbalance becomes critical
open_count = 0
close_count = 0
max_balance = 0
max_line = 0
for i, line in enumerate(lines[jsx_start:], start=jsx_start+1):
    open_in_line = len(re.findall(r'<div', line))
    close_in_line = len(re.findall(r'</div>', line))
    open_count += open_in_line
    close_count += close_in_line
    balance = open_count - close_count
    if balance > max_balance:
        max_balance = balance
        max_line = i

print(f"\nMax imbalance: {max_balance} at line {max_line}")
print(f"Final balance: {open_count - close_count}")
