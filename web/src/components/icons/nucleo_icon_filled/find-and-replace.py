import os

def rename_files():
    # Get the directory of the current script
    directory = os.path.dirname(os.path.abspath(__file__))
    
    # Iterate through all files in the directory
    for filename in os.listdir(directory):
        if filename.startswith('18px_'):
            # Create the new filename by removing '18px_'
            new_filename = filename.replace('18px_', '')
            
            # Create full file paths
            old_file = os.path.join(directory, filename)
            new_file = os.path.join(directory, new_filename)
            
            try:
                # Rename the file
                os.rename(old_file, new_file)
                print(f'Renamed: {filename} -> {new_filename}')
            except Exception as e:
                print(f'Error renaming {filename}: {str(e)}')

if __name__ == '__main__':
    rename_files()
