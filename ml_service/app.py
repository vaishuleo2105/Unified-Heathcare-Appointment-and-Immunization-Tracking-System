from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import os

app = Flask(__name__)
CORS(app)

BASE = os.path.dirname(os.path.abspath(__file__))

model      = joblib.load(os.path.join(BASE, 'model.pkl'))
encoders   = joblib.load(os.path.join(BASE, 'encoders.pkl'))
le_target  = joblib.load(os.path.join(BASE, 'label_encoder.pkl'))
features   = joblib.load(os.path.join(BASE, 'features.pkl'))

print("ML Service ready. Classes:", le_target.classes_.tolist())

def safe_encode(encoder, value, default=0):
    """Encode a value, return default if unseen."""
    try:
        return int(encoder.transform([str(value).strip().title()])[0])
    except Exception:
        return default

@app.route('/health', methods=['GET'])
def health():
    return jsonify({ 'status': 'ok', 'classes': le_target.classes_.tolist() })

@app.route('/predict-type', methods=['POST'])
def predict_type():
    """
    Predict appointment type from patient profile.
    Body: { age, gender, bloodType, medicalCondition, medication, testResults }
    Returns: { predictedType, confidence, probabilities }
    """
    data = request.get_json()
    if not data:
        return jsonify({ 'error': 'No data provided' }), 400

    try:
        age             = float(data.get('age', 30))
        gender          = safe_encode(encoders['Gender'],           data.get('gender', 'Male'))
        blood_type      = safe_encode(encoders['Blood Type'],       data.get('bloodType', 'O+'))
        medical_cond    = safe_encode(encoders['Medical Condition'],data.get('medicalCondition', 'None'))
        medication      = safe_encode(encoders['Medication'],       data.get('medication', 'None'))
        test_results    = safe_encode(encoders['Test Results'],     data.get('testResults', 'Normal'))

        X = np.array([[age, gender, blood_type, medical_cond, medication, test_results]])

        pred_idx   = model.predict(X)[0]
        pred_proba = model.predict_proba(X)[0]
        pred_label = le_target.inverse_transform([pred_idx])[0]
        confidence = round(float(pred_proba[pred_idx]) * 100, 1)

        probabilities = {
            le_target.inverse_transform([i])[0]: round(float(p) * 100, 1)
            for i, p in enumerate(pred_proba)
        }

        return jsonify({
            'predictedType': pred_label,
            'confidence': confidence,
            'probabilities': probabilities,
        })

    except Exception as e:
        return jsonify({ 'error': str(e) }), 500


@app.route('/doctor-risk-score', methods=['POST'])
def doctor_risk_score():
    """
    Given a list of patient profiles for a doctor's appointments,
    compute an average risk score to assist workload balancing.
    Body: { patients: [{ age, medicalCondition, testResults }] }
    Returns: { riskScore, riskLevel }
    """
    data = request.get_json()
    patients = data.get('patients', [])
    if not patients:
        return jsonify({ 'riskScore': 0, 'riskLevel': 'Low' })

    CONDITION_RISK = {
        'cancer': 5, 'asthma': 4, 'diabetes': 3,
        'hypertension': 3, 'obesity': 2, 'arthritis': 1
    }
    TEST_RISK = { 'abnormal': 3, 'inconclusive': 2, 'normal': 0 }

    total = 0
    for p in patients:
        age   = float(p.get('age', 30))
        cond  = str(p.get('medicalCondition', '')).lower()
        test  = str(p.get('testResults', 'normal')).lower()
        score = CONDITION_RISK.get(cond, 1) + TEST_RISK.get(test, 0)
        if age > 65: score += 2
        total += score

    avg = total / len(patients)
    level = 'Critical' if avg >= 6 else 'High' if avg >= 4 else 'Moderate' if avg >= 2 else 'Low'

    return jsonify({ 'riskScore': round(avg, 2), 'riskLevel': level })


if __name__ == '__main__':
    app.run(port=5001, debug=False)
