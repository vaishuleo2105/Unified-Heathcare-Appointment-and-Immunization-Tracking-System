"""
Training Strategy:
- The healthcare_dataset.csv is synthetic (uniform distribution across classes).
  It cannot be used to train a meaningful classifier for admission type.
- Instead, we use it to:
    1. Learn the full vocabulary of medical conditions, medications, blood types etc.
    2. Build a realistic patient profile encoder
    3. Train a model on AUGMENTED data that reflects real clinical patterns:
       - Emergency: high-risk conditions (Cancer, Asthma), Abnormal test results, elderly
       - Consultation: Diabetes, Hypertension, Obesity, Inconclusive results, middle-aged
       - General Checkup: young/middle-aged, Normal results, elective conditions
       - Follow-up: repeat visits, prior appointments
       - Vaccination: young patients, no major condition
"""

import zipfile
import pandas as pd
import numpy as np
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
import joblib
import os

ZIP_PATH = r"D:\College\PG\Placement\healthcare_dataset.csv.zip"
z = zipfile.ZipFile(ZIP_PATH)
df = pd.read_csv(z.open('healthcare_dataset.csv'))
for col in df.select_dtypes(include='object').columns:
    df[col] = df[col].str.strip().str.title()

print(f"Base dataset: {df.shape[0]} rows")

# ── Build clinically meaningful labels using domain rules ─────────────────────
# These rules reflect real clinical triage logic

def assign_appointment_type(row):
    cond = str(row['Medical Condition']).lower()
    test = str(row['Test Results']).lower()
    age  = row['Age']
    med  = str(row['Medication']).lower()

    # Emergency: critical conditions + abnormal results + elderly
    if test == 'abnormal' and cond in ['cancer', 'asthma'] and age > 60:
        return 'Emergency'
    if test == 'abnormal' and cond == 'cancer':
        return 'Emergency'
    if test == 'abnormal' and age > 70:
        return 'Emergency'

    # Vaccination: young patients, no serious condition
    if age < 18:
        return 'Vaccination'
    if age < 30 and cond not in ['cancer', 'asthma'] and test == 'normal':
        return 'Vaccination'

    # Follow-up: inconclusive results (needs re-check)
    if test == 'inconclusive':
        return 'Follow-up'

    # Consultation: chronic conditions needing management
    if cond in ['diabetes', 'hypertension', 'obesity']:
        return 'Consultation'
    if test == 'abnormal' and cond in ['arthritis', 'diabetes', 'hypertension']:
        return 'Consultation'

    # Emergency: remaining abnormal cases
    if test == 'abnormal':
        return 'Emergency'

    # General Checkup: normal results, routine
    return 'General Checkup'

df['AppointmentType'] = df.apply(assign_appointment_type, axis=1)

print("Appointment Type distribution (after clinical rules):")
print(df['AppointmentType'].value_counts())

# ── Features ──────────────────────────────────────────────────────────────────
features = ['Age', 'Gender', 'Blood Type', 'Medical Condition', 'Medication', 'Test Results']
target   = 'AppointmentType'

df = df[features + [target]].dropna()

encoders = {}
df_enc = df.copy()
cat_cols = ['Gender', 'Blood Type', 'Medical Condition', 'Medication', 'Test Results']
for col in cat_cols:
    le = LabelEncoder()
    df_enc[col] = le.fit_transform(df[col])
    encoders[col] = le

le_target = LabelEncoder()
y = le_target.fit_transform(df_enc[target])
X = df_enc[features].values

print(f"\nClasses: {le_target.classes_}")
print(f"Class distribution: {dict(zip(le_target.classes_, np.bincount(y)))}")

# ── Train ─────────────────────────────────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

print("\nTraining Gradient Boosting Classifier...")
model = GradientBoostingClassifier(
    n_estimators=200,
    learning_rate=0.1,
    max_depth=6,
    min_samples_split=5,
    subsample=0.8,
    random_state=42
)
model.fit(X_train, y_train)

y_pred = model.predict(X_test)
acc = accuracy_score(y_test, y_pred)
print(f"\nAccuracy: {acc:.4f} ({acc*100:.2f}%)")
print("\nClassification Report:")
print(classification_report(y_test, y_pred, target_names=le_target.classes_))

print("\nFeature Importances:")
for f, imp in sorted(zip(features, model.feature_importances_), key=lambda x: -x[1]):
    print(f"  {f}: {imp:.4f}")

# ── Save ──────────────────────────────────────────────────────────────────────
OUT_DIR = os.path.dirname(os.path.abspath(__file__))
joblib.dump(model,     os.path.join(OUT_DIR, 'model.pkl'))
joblib.dump(encoders,  os.path.join(OUT_DIR, 'encoders.pkl'))
joblib.dump(le_target, os.path.join(OUT_DIR, 'label_encoder.pkl'))
joblib.dump(features,  os.path.join(OUT_DIR, 'features.pkl'))

print(f"\nSaved: model.pkl, encoders.pkl, label_encoder.pkl, features.pkl")
print(f"Location: {OUT_DIR}")
