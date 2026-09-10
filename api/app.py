from flask import Flask, request, jsonify
import joblib
import pandas as pd
import os


app = Flask(__name__)


# --------------------------------------------------
# 1. Load the trained ML model
# --------------------------------------------------

MODEL_PATH = os.path.join(
    os.path.dirname(__file__),
    "..",
    "model",
    "diabetes_risk_model.pkl"
)

model = joblib.load(MODEL_PATH)


# --------------------------------------------------
# 2. Define the features expected by the model
# --------------------------------------------------

FEATURES = [
    "age",
    "gender",
    "polyuria",
    "polydipsia",
    "sudden_weight_loss",
    "weakness",
    "polyphagia",
    "genital_thrush",
    "visual_blurring",
    "itching",
    "irritability",
    "delayed_healing",
    "partial_paresis",
    "muscle_stiffness",
    "alopecia",
    "obesity"
]


BINARY_FEATURES = [
    "polyuria",
    "polydipsia",
    "sudden_weight_loss",
    "weakness",
    "polyphagia",
    "genital_thrush",
    "visual_blurring",
    "itching",
    "irritability",
    "delayed_healing",
    "partial_paresis",
    "muscle_stiffness",
    "alopecia",
    "obesity"
]


# --------------------------------------------------
# 3. Prediction endpoint
# --------------------------------------------------

@app.route("/predict", methods=["POST"])
def predict():

    # Get JSON sent to the API
    data = request.get_json()

    if not data:
        return jsonify({
            "error": "Request body must contain JSON data."
        }), 400


    # --------------------------------------------------
    # Validate that all 16 fields are present
    # --------------------------------------------------

    missing_fields = [
        feature for feature in FEATURES
        if feature not in data
    ]

    if missing_fields:
        return jsonify({
            "error": "Missing required fields.",
            "missing_fields": missing_fields
        }), 400


    # --------------------------------------------------
    # Validate age
    # --------------------------------------------------

    try:
        age = int(data["age"])
    except (ValueError, TypeError):
        return jsonify({
            "error": "Age must be a number."
        }), 400

    if age <= 0 or age > 120:
        return jsonify({
            "error": "Age must be between 1 and 120."
        }), 400


    # --------------------------------------------------
    # Validate gender
    # --------------------------------------------------

    if data["gender"] not in ["Male", "Female"]:
        return jsonify({
            "error": "Gender must be Male or Female."
        }), 400


    # --------------------------------------------------
    # Convert categorical values to numbers
    # --------------------------------------------------

    processed_data = {}

    processed_data["age"] = age

    processed_data["gender"] = {
        "Female": 0,
        "Male": 1
    }[data["gender"]]


    for feature in BINARY_FEATURES:

        if data[feature] not in ["Yes", "No"]:
            return jsonify({
                "error": f"{feature} must be Yes or No."
            }), 400

        processed_data[feature] = {
            "No": 0,
            "Yes": 1
        }[data[feature]]


    # --------------------------------------------------
    # Create DataFrame in exact training order
    # --------------------------------------------------

    input_data = pd.DataFrame(
        [processed_data],
        columns=FEATURES
    )


    # --------------------------------------------------
    # Make prediction
    # --------------------------------------------------

    prediction = model.predict(input_data)[0]

    probabilities = model.predict_proba(input_data)[0]

    probability_positive = float(probabilities[1])


    # --------------------------------------------------
    # Convert model output to application terminology
    # --------------------------------------------------

    if prediction == 1:

        risk = "Higher"

        message = (
            "Your responses indicate a higher chance of diabetes. "
            "Consider visiting a healthcare professional for a checkup."
        )

    else:

        risk = "Lower"

        message = (
            "Your responses indicate a lower chance of diabetes "
            "based on this screening. If you have concerns or symptoms, "
            "consider discussing them with a healthcare professional."
        )


    # --------------------------------------------------
    # Return result
    # --------------------------------------------------

    return jsonify({
        "risk": risk,
        "probability": round(probability_positive, 4),
        "message": message
    })


# --------------------------------------------------
# 4. Health check endpoint
# --------------------------------------------------

@app.route("/", methods=["GET"])
def home():

    return jsonify({
        "status": "ok",
        "message": "Diabetes Risk Prediction API is running."
    })


# --------------------------------------------------
# 5. Start Flask server
# --------------------------------------------------

if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=False
    )