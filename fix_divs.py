with open('src/App.jsx', 'r') as f:
    content = f.read()

# Simply remove the 4 extra</div> tags that appear right before )}
# Look for the pattern of 4 consecutive </div> tags before )}
import re

# Find and remove 4 consecutive      </div> tags before )}
content = content.replace(
    '        </div>\n      </div>\n      </div>\n      </div>\n      )}',
    '      )}'
)

with open('src/App.jsx', 'w') as f:
    f.write(content)

print("Fixed")
