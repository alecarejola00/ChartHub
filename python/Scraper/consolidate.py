import pandas as pd
import glob
import os
from collections import defaultdict

# Step 1: Recursively find all CSV files
all_csv_files = glob.glob("COMPANY/**/*.csv", recursive=True)

# Step 2: Group files by their folder
folders = defaultdict(list)
for filepath in all_csv_files:
    folder = os.path.dirname(filepath)
    folders[folder].append(filepath)

# Step 3: Process each folder's CSV files
for folder, files in folders.items():
    try:
        # Read and combine all CSVs in this folder
        combined_df = pd.concat((pd.read_csv(f) for f in files), ignore_index=True)

        # Convert 'Date' column to datetime
        combined_df['Date'] = pd.to_datetime(combined_df['Date'])

        # Sort descending by date
        sorted_df = combined_df.sort_values(by='Date', ascending=True)

        # Save the combined file back to the same folder
        output_path = os.path.join(folder, "stock.csv")
        sorted_df.to_csv(output_path, index=False)

        print(f"Saved sorted CSV to: {output_path}")

    except Exception as e:
        print(f"Error processing folder '{folder}': {e}")