import os

def clean_files():
    target_files = {'SVR_metricsNV.txt', 'SVR_prediction_plotNV.png', 'SVR_predictionsNV.csv',
                    'RANDOMFOREST_metricsNV.txt','RANDOMFOREST_prediction_plotNV.png','RANDOMFOREST_predictionsNV.csv'}
    
    for root, dirs, files in os.walk('.'):
        for file in files:
            if file in target_files:
                file_path = os.path.join(root, file)
                try:
                    os.remove(file_path)
                    print(f"Successfully removed: {file_path}")
                except Exception as e:
                    print(f"Error removing {file_path}: {str(e)}")

if __name__ == "__main__":
    print("Starting cleaning process...")
    clean_files()
    print("Cleaning complete.")