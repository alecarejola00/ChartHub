import os

# Step 1: Create root "COMPANY" folder
def create_company_root(root_folder='COMPANY'):
    if not os.path.exists(root_folder):
        os.makedirs(root_folder)
        print(f"Root folder '{root_folder}' created.")
    else:
        print(f"Root folder '{root_folder}' already exists.")
    return root_folder

# Step 2: Read values from companyURL.txt
def read_company_urls(file_path):
    with open(file_path, 'r') as file:
        return [line.strip() for line in file if line.strip()]

# Step 3: Create subfolders
def create_subfolders(base_path, folder_names):
    for name in folder_names:
        folder_path = os.path.join(base_path, name)
        if not os.path.exists(folder_path):
            os.makedirs(folder_path)
            print(f"Subfolder '{name}' created inside '{base_path}'.")
        else:
            print(f"Subfolder '{name}' already exists inside '{base_path}'.")

# Main function
def main():
    company_root = create_company_root()
    urls = read_company_urls('updatedCompany.csv')
    create_subfolders(company_root, urls)

if __name__ == '__main__':
    main()
