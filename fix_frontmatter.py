import os
import glob
import subprocess
import re

files = glob.glob("site/src/content/services/*.mdx")

for f in files:
    # Get original file content from git
    try:
        orig = subprocess.check_output(['git', 'show', f'HEAD:{f}']).decode('utf-8')
    except:
        continue
    
    # Extract frontmatter from orig
    orig_match = re.match(r'^---.*?---', orig, re.DOTALL)
    if not orig_match:
        continue
    orig_frontmatter = orig_match.group(0)
    
    # Get current file content
    with open(f, 'r') as file:
        current = file.read()
    
    # Extract frontmatter from current
    current_match = re.match(r'^---.*?---', current, re.DOTALL)
    if not current_match:
        continue
    
    # Replace current frontmatter with original frontmatter
    new_content = current.replace(current_match.group(0), orig_frontmatter, 1)
    
    with open(f, 'w') as file:
        file.write(new_content)
    print(f"Restored frontmatter for {f}")

