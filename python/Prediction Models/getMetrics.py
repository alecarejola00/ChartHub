import os
import re
import pandas as pd

base_dir = 'COMPANY'
metrics_filename = 'ANN_metrics.txt'

pattern = {
    'RMSE': re.compile(r'RMSE:\s*([0-9.]+)'),
    'MAE': re.compile(r'MAE:\s*([0-9.]+)'),
    'R2': re.compile(r'R[²^2]:?\s*([0-9.\-]+)')  # Handles R², R^2, R2
}

results = []

for root, dirs, files in os.walk(base_dir):
    if metrics_filename in files:
        filepath = os.path.join(root, metrics_filename)
        with open(filepath, 'r', encoding='latin-1') as f:  # <- fixed encoding
            content = f.read()
            rmse = pattern['RMSE'].search(content)
            mae = pattern['MAE'].search(content)
            r2 = pattern['R2'].search(content)

            results.append({
                'Folder': os.path.basename(root),
                'RMSE': float(rmse.group(1)) if rmse else None,
                'MAE': float(mae.group(1)) if mae else None,
                'R2': float(r2.group(1)) if r2 else None
            })

df = pd.DataFrame(results)
print(df)
# Save LaTeX table
latex_table = df.to_latex(index=False, float_format="%.4f")
print(latex_table)

df.to_csv('ANN_all_metrics.csv', index=False)
with open("ANN_all_metrics.tex", "w") as f:
    f.write(latex_table)
