import os
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import time

from sklearn.model_selection import train_test_split
from sklearn.svm import SVR
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

def process_stock_csv(folder_path):
    file_path = os.path.join(folder_path, "stock.csv")
    if not os.path.exists(file_path):
        return

    try:
        # 1. Load CSV file
        df = pd.read_csv(file_path)

        # Clean the 'Close' column (remove commas and convert to float)
        df['Close'] = df['Close'].replace({',': ''}, regex=True).astype(float)

        # 2. Convert 'Date' column to datetime
        df['Date'] = pd.to_datetime(df['Date'])
        df = df.sort_values('Date')

        # 3. Create lag features
        df['Close_1'] = df['Close'].shift(1)
        df['Close_2'] = df['Close'].shift(2)
        df['Close_3'] = df['Close'].shift(3)

        # 4. Target: today’s closing price
        df.dropna(inplace=True)
        X = df[['Close_1', 'Close_2', 'Close_3']]
        y = df['Close']

        # 5. Split data 80-20
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, shuffle=False)

        # 6. Train the SVR model
        svr = SVR(kernel='rbf', C=100, epsilon=0.1)
        svr.fit(X_train, y_train)

        # 7. Predict
        y_pred = svr.predict(X_test)

        # 8. Evaluation: MSE, RMSE, MAE, R²
        mse = mean_squared_error(y_test, y_pred)
        rmse = np.sqrt(mse)
        mae = mean_absolute_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)

        # Save metrics to file
        metrics_file = os.path.join(folder_path, "SVR_metrics.txt")
        with open(metrics_file, "w") as f:
            f.write(f"RMSE: {rmse:.4f}\n")
            f.write(f"MAE:  {mae:.4f}\n")
            f.write(f"R²:   {r2:.4f}\n")

        # Save predictions to CSV
        df_test = df.iloc[len(X_train):].copy()
        df_test['Predicted'] = y_pred
        predictions_file = os.path.join(folder_path, "SVR_predictions.csv")
        df_test[["Date", "Close", "Predicted"]].to_csv(predictions_file, index=False)

        # 9. Plot
        plt.figure(figsize=(12, 6))
        plt.plot(df_test["Date"], df_test["Close"], label="Actual Price")
        plt.plot(df_test["Date"], df_test["Predicted"], label="Predicted Price", linestyle='--')
        plt.title("Support Vector Regression Price Prediction")
        plt.xlabel("Date")
        plt.ylabel("Price")
        plt.legend()
        plt.grid(True)
        plt.tight_layout()
        plot_file = os.path.join(folder_path, "SVR_prediction_plot.png")
        plt.savefig(plot_file)
        plt.close()

        print(f"Done: {file_path}")

    except Exception as e:
        print(f"Error in {file_path}: {e}")

# Traverse the root folder for any `stock.csv`
ROOT_DIR = "COMPANY/" 

# Count total directories to show progress
total_dirs = sum([1 for _, dirs, _ in os.walk(ROOT_DIR) for dir in dirs])
processed_dirs = 0

overall_start_time = time.time()

for root, dirs, files in os.walk(ROOT_DIR):
    for folder in dirs:
        folder_path = os.path.join(root, folder)
        stock_file = os.path.join(folder_path, "stock.csv")
        if os.path.exists(stock_file):
            print(f"Processing {folder_path}... ({processed_dirs + 1}/{total_dirs})")
            process_stock_csv(folder_path)
            processed_dirs += 1

overall_end_time = time.time()
total_runtime = overall_end_time - overall_start_time

# Save overall compile time
with open("overallCompileTime_SVR.txt", "w") as f:
    f.write(f"Total runtime for all companies: {total_runtime:.2f} seconds\n")

print(f" All companies processed.")
print(f" Total runtime for all companies: {total_runtime:.2f} seconds")