import pandas as pd

# File paths
input_file = "companies.csv"
output_file = "companyList.csv"

# Read the CSV file
df = pd.read_csv(input_file)

# Get current column list
cols = df.columns.tolist()

# Swap the first and second column
if len(cols) >= 2:
    cols[0], cols[1] = cols[1], cols[0]
    df = df[cols]
    # Save the modified CSV
    df.to_csv(output_file, index=False)
    print(f"✅ Output saved to {output_file}")
else:
    print("❌ Not enough columns to swap.")
