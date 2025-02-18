import os
import re

def replace_in_files():
    # Get the directory of the current script
    directory = os.path.dirname(os.path.abspath(__file__))
    
    # Counter for modified files
    modified_count = 0
    
    # The type definition pattern to look for
    type_pattern = re.compile(r'type\s+iconProps\s*=\s*{[^}]+};', re.MULTILINE | re.DOTALL)
    
    # Iterate through all files in the directory
    for filename in os.listdir(directory):
        if filename.endswith('.tsx') and filename != 'iconProps.ts':  # Only process TypeScript React files
            file_path = os.path.join(directory, filename)
            
            try:
                # Read the file content
                with open(file_path, 'r', encoding='utf-8') as file:
                    content = file.read()
                
                # Check if the file has the type definition
                if type_pattern.search(content):
                    # Replace the type definition with import
                    new_content = type_pattern.sub('', content)
                    
                    # Add import statement if it doesn't exist
                    if "import { iconProps } from './iconProps'" not in new_content:
                        import_statement = "import { iconProps } from './iconProps';\n"
                        # Find the position after the last import statement
                        last_import_pos = new_content.rfind('import')
                        if last_import_pos != -1:
                            last_import_end = new_content.find('\n', last_import_pos) + 1
                            new_content = new_content[:last_import_end] + import_statement + new_content[last_import_end:]
                        else:
                            # If no imports exist, add at the beginning
                            new_content = import_statement + new_content
                    
                    # Write the modified content back to the file
                    with open(file_path, 'w', encoding='utf-8') as file:
                        file.write(new_content)
                    print(f'Updated: {filename}')
                    modified_count += 1
                
            except Exception as e:
                print(f'Error processing {filename}: {str(e)}')
    
    print(f'\nTotal files modified: {modified_count}')

if __name__ == '__main__':
    replace_in_files()
