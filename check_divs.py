import re

with open('src/App.jsx', 'r') as f:
    lines = f.readlines()

# Find the App function
app_func_line = None
for i, line in enumerate(lines):
    if 'function App()' in line:
        app_func_line = i
        break

# Find the return statement that corresponds to the main App return (near line 1348)
return_line = None
if app_func_line is not None:
    for i in range(app_func_line + 1000, len(lines)):  # Start searching from line 1197 area
        if 'return (' in lines[i]:
            return_line = i
            break

if return_line is not None:
    # Count divs from this return statement onwards
    ret_section = ''.join(lines[return_line:])
    
    open_count = len(re.findall(r'<div[\s>]', ret_section))
    close_count = len(re.findall(r'</div>', ret_section))
    
    print(f"App function at line: {app_func_line + 1}")
    print(f"Return statement at line: {return_line + 1}")
    print(f"Opening divs in return: {open_count}")
    print(f"Closing divs in return: {close_count}")
    print(f"Missing closing divs: {open_count - close_count}")
    
    # Find where to add the closing divs
    # Count depth as we go through
    depth = 0
    last_div_close_line = 0
    for i in range(len(lines) - 50, len(lines)):  # Look at last 50 lines
        line = lines[i]
        opens = len(re.findall(r'<div[\s>]', line))
        closes = len(re.findall(r'</div>', line))
        depth += opens - closes
        if closes > 0:
            last_div_close_line = i + 1
    
    print(f"\nLast few lines of file:")
    for i in range(max(0, len(lines) - 10), len(lines)):
        print(f"{i+1}: {lines[i]}", end='')


