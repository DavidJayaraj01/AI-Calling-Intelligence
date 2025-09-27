from transformers import AutoTokenizer, AutoModelForSequenceClassification
import os
import zipfile

# ======================
# 1. Load the model & tokenizer
# ======================
model_name = "tabularisai/multilingual-sentiment-analysis"

tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSequenceClassification.from_pretrained(model_name)

# ======================
# 2. Save locally
# ======================
save_dir = "./multilingual_sentiment_model"
os.makedirs(save_dir, exist_ok=True)

model.save_pretrained(save_dir)
tokenizer.save_pretrained(save_dir)
print("Model and tokenizer saved locally at:", save_dir)

# ======================
# 3. Create ZIP file
# ======================
zip_file = "multilingual_sentiment_model.zip"
with zipfile.ZipFile(zip_file, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(save_dir):
        for file in files:
            file_path = os.path.join(root, file)
            arcname = os.path.relpath(file_path, save_dir)
            zipf.write(file_path, arcname)

print("✅ Model packaged into ZIP file:", zip_file)
