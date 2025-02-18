import os

def replace_in_files():
    # Get the directory of the current script
    directory = os.path.dirname(os.path.abspath(__file__))
    
    # Counter for modified files
    modified_count = 0
    
    # The exact text to replace
    old_text = '''type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}'''
    
    # Iterate through all files in the directory
    for filename in os.listdir(directory):
        if filename.endswith('.tsx') and filename != 'iconProps.ts':  # Only process TypeScript React files
            file_path = os.path.join(directory, filename)
            
            try:
                # Read the file content
                with open(file_path, 'r', encoding='utf-8') as file:
                    content = file.read()
                
                # Check if the file has the text to replace
                if old_text in content:
                    # Replace the type definition with import
                    new_content = content.replace(old_text, '')
                    
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
