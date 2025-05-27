import pandas as pd
import math

# Load the CSV
df = pd.read_csv('RF_all_metrics.csv')

# Filter in-threshold and outliers
in_threshold = df[(df['RMSE'].between(-3, 3)) & (df['MAE'].between(-3, 3))].copy()
outliers = df[~((df['RMSE'].between(-3, 3)) & (df['MAE'].between(-3, 3)))].copy()

# Sort both by descending RMSE
in_threshold = in_threshold.sort_values(by='RMSE', ascending=True).reset_index(drop=True)
outliers = outliers.sort_values(by='RMSE', ascending=True).reset_index(drop=True)

# Helper to format 2-column LaTeX table
def format_multicol_table(df, filename):
    rows = math.ceil(len(df) / 2)
    col1 = df.iloc[:rows].reset_index(drop=True)
    col2 = df.iloc[rows:].reset_index(drop=True)

    with open(filename, 'w') as f:
        f.write('\\begin{table}[H]\n\\centering\n')
        f.write('\\begin{tabular}{|lccc|lccc|}\n\\hline\n')
        f.write('Company & RMSE & MAE & R2 & Company & RMSE & MAE & R2 \\\\\n\\hline\n')

        for i in range(rows):
            if i < len(col1):
                row1 = col1.iloc[i]
            else:
                row1 = {'Folder': '', 'RMSE': 0, 'MAE': 0, 'R2': 0}

            if i < len(col2):
                row2 = col2.iloc[i]
            else:
                row2 = {'Folder': '', 'RMSE': 0, 'MAE': 0, 'R2': 0}

            f.write(f"{row1['Folder']} & {row1['RMSE']:.4f} & {row1['MAE']:.4f} & {row1['R2']:.4f} & "
                    f"{row2['Folder']} & {row2['RMSE']:.4f} & {row2['MAE']:.4f} & {row2['R2']:.4f} \\\\\n")

        f.write('\\hline\n\\end{tabular}\n')
        f.write('\\caption{RF Outside Threshold Table}\n')
        f.write('\\end{table}\n')

# Export
format_multicol_table(in_threshold, 'RF_inThreshold_multicol2.tex')
format_multicol_table(outliers, 'RF_outliers_multicol2.tex')
