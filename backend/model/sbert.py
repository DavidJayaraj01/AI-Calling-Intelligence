from sentence_transformers import SentenceTransformer

model_name = "all-MiniLM-L6-v2"
save_dir = "./all_MiniLM_L6_v2"

# Load the pretrained model
model = SentenceTransformer(model_name)

# Save it locally
model.save(save_dir)

print(f"Model saved locally at: {save_dir}")

import zipfile
import os

zip_file = "all_MiniLM_L6_v2.zip"
with zipfile.ZipFile(zip_file, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(save_dir):
        for file in files:
            file_path = os.path.join(root, file)
            arcname = os.path.relpath(file_path, save_dir)
            zipf.write(file_path, arcname)

print(f"✅ Model packaged into ZIP file: {zip_file}")
