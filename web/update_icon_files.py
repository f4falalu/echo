import os
import re

def update_icon_files():
    # Directory containing the icon files
    base_dir = 'src/components/icons'
    
    # Walk through all subdirectories
    for root, dirs, files in os.walk(base_dir):
        for file in files:
            if file.startswith('I12px_') and file.endswith('.tsx'):
                file_path = os.path.join(root, file)
                
                # Read the file content
                with open(file_path, 'r') as f:
                    content = f.read()
                
                # Make the replacements
                # Replace "function " with "function I12px_"
                content = re.sub(r'function (?!I12px_)', 'function I12px_', content)
                
                # Replace "export default " with "export default I12px_"
                content = re.sub(r'export default (?!I12px_)', 'export default I12px_', content)
                
                # Write the updated content back to the file
                with open(file_path, 'w') as f:
                    f.write(content)
                
                print(f"Updated {file_path}")

if __name__ == "__main__":
    update_icon_files() 