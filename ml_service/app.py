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

# This is a separate Gradient Boosting model.  Keeping it separate from the
# appointment-type classifier lets workload balancing use the clinical risk of
# every active patient, rather than a hand-written points table.
risk_model = joblib.load(os.path.join(BASE, 'risk_model.pkl'))
risk_encoders = joblib.load(os.path.join(BASE, 'risk_encoders.pkl'))
risk_label_encoder = joblib.load(os.path.join(BASE, 'risk_label_encoder.pkl'))
risk_features = joblib.load(os.path.join(BASE, 'risk_features.pkl'))

print("ML Service ready. Classes:", le_target.classes_.tolist())

def safe_encode(encoder, value, default=0):
    """Encode a value, return default if unseen."""
    try:
        return int(encoder.transform([str(value).strip().title()])[0])
    except Exception:
        return default

def patient_risk(patient):
    """Return the model-derived risk level, confidence and a 0-100 score."""
    values = {
        'Age': float(patient.get('age', 30)),
        'Gender': safe_encode(risk_encoders.get('Gender'), patient.get('gender', 'Male')),
        'Blood Type': safe_encode(risk_encoders.get('Blood Type'), patient.get('bloodType', 'O+')),
        'Medical Condition': safe_encode(risk_encoders.get('Medical Condition'), patient.get('medicalCondition', 'None')),
        'Medication': safe_encode(risk_encoders.get('Medication'), patient.get('medication', 'None')),
        'Test Results': safe_encode(risk_encoders.get('Test Results'), patient.get('testResults', 'Normal')),
    }
    X = np.array([[values[feature] for feature in risk_features]])
    prediction = risk_model.predict(X)[0]
    probabilities = risk_model.predict_proba(X)[0]
    raw_label = risk_label_encoder.inverse_transform([prediction])[0]
    # Older bundled artifacts predict the test-result class.  Map that output
    # to an urgency level; newly trained artifacts already predict a level.
    level = {
        'Normal': 'Low',
        'Inconclusive': 'Moderate',
        'Abnormal': 'High',
    }.get(raw_label, raw_label)
    confidence = float(probabilities[prediction])

    # Severity gives a consistently interpretable workload contribution while
    # confidence prevents uncertain predictions from being treated as certain.
    severity = {'Low': 25, 'Moderate': 50, 'High': 75, 'Critical': 100}.get(level, 25)
    return {
        'riskLevel': level,
        'riskScore': round(severity * confidence, 2),
        'confidence': round(confidence * 100, 1),
    }

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

    try:
        patient_risks = [patient_risk(patient) for patient in patients]
        average_score = sum(item['riskScore'] for item in patient_risks) / len(patient_risks)
        level = 'Critical' if average_score >= 80 else 'High' if average_score >= 55 else 'Moderate' if average_score >= 30 else 'Low'
        return jsonify({
            'riskScore': round(average_score, 2),
            'riskLevel': level,
            'patientRisks': patient_risks,
            'source': 'gradient_boosting',
        })
    except Exception as e:
        return jsonify({ 'error': str(e) }), 500


if __name__ == '__main__':
    app.run(port=5001, debug=False)
