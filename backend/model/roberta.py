import pandas as pd
import torch
from datasets import Dataset
from transformers import RobertaTokenizer, RobertaForSequenceClassification, Trainer, TrainingArguments
from sklearn.metrics import accuracy_score, f1_score
import numpy as np

# ======================
# 1. Load Dataset
# ======================
df = pd.read_csv("synthetic_vendor_distributor_dataset.csv")

# Encode labels
df["pain_point"] = df["pain_point"].astype("category")
labels = df["pain_point"].cat.codes.tolist()
label2id = {cat: i for i, cat in enumerate(df["pain_point"].cat.categories)}
id2label = {i: cat for cat, i in label2id.items()}

texts = df["conversation"].tolist()

# ======================
# 2. HuggingFace Dataset
# ======================
dataset = Dataset.from_dict({"text": texts, "label": labels})
dataset = dataset.train_test_split(test_size=0.2, seed=42)

# ======================
# 3. Tokenizer
# ======================
tokenizer = RobertaTokenizer.from_pretrained("roberta-base")

def tokenize_function(examples):
    return tokenizer(examples["text"], padding="max_length", truncation=True, max_length=128)

tokenized_datasets = dataset.map(tokenize_function, batched=True)

# ======================
# 4. Model
# ======================
model = RobertaForSequenceClassification.from_pretrained(
    "roberta-base",
    num_labels=len(label2id),
    id2label=id2label,
    label2id=label2id
)

# ======================
# 5. Metrics
# ======================
def compute_metrics(eval_pred):
    logits, labels = eval_pred
    preds = np.argmax(logits, axis=-1)
    return {
        "accuracy": accuracy_score(labels, preds),
        "f1": f1_score(labels, preds, average="weighted"),
    }

training_args = TrainingArguments(
    output_dir="./results",
    per_device_train_batch_size=4,
    per_device_eval_batch_size=4,
    num_train_epochs=3,
    weight_decay=0.01,
    logging_dir="./logs",
    logging_steps=10,
    save_total_limit=2,
)


# ======================
# 7. Trainer
# ======================
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=tokenized_datasets["train"],
    eval_dataset=tokenized_datasets["test"],
    tokenizer=tokenizer,
    compute_metrics=compute_metrics,
)

trainer.train()

# ======================
# 8. Save Model
# ======================
trainer.save_model("./roberta_finetuned")
tokenizer.save_pretrained("./roberta_finetuned")

print("✅ Training complete! Model saved at ./roberta_finetuned")

# ======================
# 9. Test Inference
# ======================
sample_text = "Order confirmation issues have been happening repeatedly."
inputs = tokenizer(sample_text, return_tensors="pt", padding=True, truncation=True)

with torch.no_grad():
    outputs = model(**inputs)
    pred_class = torch.argmax(outputs.logits).item()

print(f"Text: {sample_text}")
print(f"Predicted Pain Point: {id2label[pred_class]}")

# import zipfile, os

# zipf = zipfile.ZipFile("roberta_finetuned.zip", "w")
# for root, dirs, files in os.walk("./roberta_finetuned"):
#     for file in files:
#         zipf.write(os.path.join(root, file),
#                    arcname=os.path.relpath(os.path.join(root, file), "./roberta_finetuned"))
# zipf.close()
# print("Model exported as roberta_finetuned.zip")
