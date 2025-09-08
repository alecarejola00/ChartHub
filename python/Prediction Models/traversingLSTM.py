import os
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import time

from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Input, LSTM, Dense

def create_lstm_model(input_shape):
    model = Sequential()
    model.add(Input(shape=input_shape))
    model.add(LSTM(units=50, return_sequences=False)) #50 Neurons
    model.add(Dense(1))
    model.compile(optimizer='adam', loss='mean_squared_error')
    return model

def process_stock_csv(folder_path):
    file_path = os.path.join(folder_path, "stock.csv")
    if not os.path.exists(file_path):
        return

    try:
        # 1. Load CSV file
        df = pd.read_csv(file_path)

        # 2. Clean and prepare data
        df['Close'] = df['Close'].replace({',': ''}, regex=True).astype(float)
        df['Date'] = pd.to_datetime(df['Date'])
        df = df.sort_values('Date')

        # 3. Create lag features
        df['Close_1'] = df['Close'].shift(1)
        df['Close_2'] = df['Close'].shift(2)
        df['Close_3'] = df['Close'].shift(3)

        df.dropna(inplace=True)
        X = df[['Close_1', 'Close_2', 'Close_3']]
        y = df['Close']

        # 4. Train-test split
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, shuffle=False)

        # 5. Reshape for LSTM: (samples, time steps, features)
        X_train_lstm = X_train.values.reshape((X_train.shape[0], 1, X_train.shape[1]))
        X_test_lstm = X_test.values.reshape((X_test.shape[0], 1, X_test.shape[1]))

        # 6. Train model
        lstm_model = create_lstm_model(input_shape=(X_train_lstm.shape[1], X_train_lstm.shape[2]))
        lstm_model.fit(X_train_lstm, y_train, epochs=20, batch_size=32, verbose=0)

        # 7. Predict
        y_pred = lstm_model.predict(X_test_lstm)

        # 8. Evaluation
        mse = mean_squared_error(y_test, y_pred)
        rmse = np.sqrt(mse)
        mae = mean_absolute_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)

        # 9. Save metrics
        metrics_file = os.path.join(folder_path, "LSTM_metrics.txt")
        with open(metrics_file, "w") as f:
            f.write(f"RMSE: {rmse:.4f}\n")
            f.write(f"MAE:  {mae:.4f}\n")
            f.write(f"R²:   {r2:.4f}\n")

        # 10. Save predictions
        df_test = df.iloc[len(X_train):].copy()
        df_test['Predicted'] = y_pred
        predictions_file = os.path.join(folder_path, "LSTM_predictions.csv")
        df_test[["Date", "Close", "Predicted"]].to_csv(predictions_file, index=False)

        # 11. Plot
        plt.figure(figsize=(12, 6))
        plt.plot(df_test["Date"], df_test["Close"], label="Actual Price")
        plt.plot(df_test["Date"], df_test["Predicted"], label="Predicted Price", linestyle='--')
        plt.title("Long Short Term Memory Price Prediction")
        plt.xlabel("Date")
        plt.ylabel("Price")
        plt.legend()
        plt.grid(True)
        plt.tight_layout()
        plot_file = os.path.join(folder_path, "LSTM_prediction_plot.png")
        plt.savefig(plot_file)
        plt.close()

        print(f" Done: {file_path}")

    except Exception as e:
        print(f" Error in {file_path}: {e}")

# Traverse the root folder for any `stock.csv`
ROOT_DIR = "COMPANY/"

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
with open("overallCompileTime_LSTM.txt", "w") as f:
    f.write(f"Total runtime for all companies: {total_runtime:.2f} seconds\n")

print(f"All companies processed.")
print(f"Total runtime for all companies: {total_runtime:.2f} seconds")