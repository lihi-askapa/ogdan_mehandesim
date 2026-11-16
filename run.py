from flask import (
    Flask,
    render_template,
    request,
    redirect,
    url_for,
    flash
)
from flask_mail import Mail, Message
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
from pathlib import Path

import mimetypes
import os


# =========================================================
# טעינת משתני הסביבה
# =========================================================

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env", override=True)


# =========================================================
# יצירת אפליקציית Flask
# =========================================================

app = Flask(
    __name__,
    template_folder="app/templates",
    static_folder="app/static"
)

# =========================================================
# מטמון (cache) לקבצים סטטיים
# תמונות וסרטונים נשמרים בדפדפן לשבוע, כך שבכניסה חוזרת
# הם לא יורדים שוב. CSS/JS נבדקים בכל טעינה כדי ששינויים יופיעו מיד.
# =========================================================

MEDIA_CACHE_SECONDS = 7 * 24 * 60 * 60
MEDIA_EXTENSIONS = (
    ".jpg", ".jpeg", ".png", ".webp", ".svg", ".gif", ".mp4", ".webm"
)


def _static_max_age(filename):
    if filename and filename.lower().endswith(MEDIA_EXTENSIONS):
        return MEDIA_CACHE_SECONDS
    return None


app.get_send_file_max_age = _static_max_age


# נדרש עבור הודעות flash
app.config["SECRET_KEY"] = os.getenv(
    "SECRET_KEY",
    "temporary-development-secret-key"
)


# =========================================================
# הגדרות מייל
# =========================================================

app.config["MAIL_SERVER"] = "smtp.gmail.com"
app.config["MAIL_PORT"] = 587
app.config["MAIL_USE_TLS"] = True
app.config["MAIL_USE_SSL"] = False

app.config["MAIL_USERNAME"] = os.getenv("MAIL_USERNAME")
app.config["MAIL_PASSWORD"] = os.getenv("MAIL_PASSWORD")

app.config["MAIL_DEFAULT_SENDER"] = (
    "אוגדן מהנדסים - אתר",
    app.config["MAIL_USERNAME"]
)

# גודל מרבי לבקשה הכוללת קובץ: 5MB
app.config["MAX_CONTENT_LENGTH"] = 5 * 1024 * 1024

mail = Mail(app)


# =========================================================
# הגדרות קורות חיים
# =========================================================

ALLOWED_CV_EXTENSIONS = {"pdf", "doc", "docx"}


def allowed_cv_file(filename):
    """
    בודק אם לקובץ יש סיומת מותרת.
    """

    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower() in ALLOWED_CV_EXTENSIONS
    )


# =========================================================
# בדיקת הגדרות המייל בהפעלת האתר
# =========================================================

def validate_mail_configuration():
    """
    בודק שהמשתנים הנדרשים לשליחת מייל קיימים.
    הסיסמה עצמה אינה מודפסת.
    """

    missing_settings = []

    if not app.config["MAIL_USERNAME"]:
        missing_settings.append("MAIL_USERNAME")

    if not app.config["MAIL_PASSWORD"]:
        missing_settings.append("MAIL_PASSWORD")

    if missing_settings:
        print(
            "Warning: missing mail settings in .env:",
            ", ".join(missing_settings)
        )
    else:
        print("Mail configuration loaded successfully from .env")


validate_mail_configuration()


# =========================================================
# דפים ראשיים
# =========================================================

@app.route("/")
def home():
    return render_template("index.html")


@app.route("/healthz")
def healthz():
    # בדיקת זמינות קלה - לשימוש שירות "ping" שמונע מהשרת להירדם
    return "ok", 200, {"Cache-Control": "no-store"}


@app.route("/about")
def about():
    return render_template("about.html")


@app.route("/requirements")
def requirements():
    return render_template("requirements.html")


# =========================================================
# שירותים / גלריות
# =========================================================

@app.route("/services/accessibility.html")
def accessibility():
    return render_template("services/accessibility.html")


@app.route("/services/earth_development.html")
def earth_development():
    return render_template("services/earth_development.html")


@app.route("/services/fuel_and_gas.html")
def fuel_and_gas():
    return render_template("services/fuel_and_gas.html")


@app.route("/services/gardening.html")
def gardening():
    return render_template("services/gardening.html")


@app.route("/services/sewage_plants")
def sewage_plants():
    return render_template("sewage_plants.html")


@app.route("/services/supervision_management.html")
def supervision_management():
    return render_template("services/supervision_management.html")


@app.route("/services/urban_development.html")
def urban_development():
    return render_template("services/urban_development.html")


@app.route("/services/water_corporations.html")
def water_corporations():
    return render_template("services/water_corporations.html")


# =========================================================
# שליחת טופס צור קשר / מועמדות
# =========================================================

@app.route("/contact", methods=["POST"])
def contact():

    # האם מדובר בטופס מועמדות עם שדה קורות חיים
    is_job_application = "cv_file" in request.files

    # יעד החזרה במקרה של הצלחה או שגיאה
    if is_job_application:
        redirect_target = url_for("requirements") + "#general-application"
    else:
        redirect_target = url_for("home") + "#contact"

    # =====================================================
    # בדיקת הגדרות המייל
    # =====================================================

    if not app.config["MAIL_USERNAME"] or not app.config["MAIL_PASSWORD"]:
        print("Email sending failed: mail settings are missing from .env")

        flash(
            "הגדרות המייל של האתר אינן מלאות. "
            "אנא נסו שוב מאוחר יותר.",
            "danger"
        )

        return redirect(redirect_target)

    # =====================================================
    # קבלת פרטי הטופס
    # =====================================================

    name = request.form.get("name", "").strip()
    phone = request.form.get("phone", "").strip()
    email = request.form.get("email", "").strip()
    topic = request.form.get("topic", "").strip()
    user_message = request.form.get("message", "").strip()

    cv_file = request.files.get("cv_file")

    # =====================================================
    # בדיקות בסיסיות
    # =====================================================

    if not name or not phone or not email:
        flash(
            "יש למלא שם מלא, מספר טלפון וכתובת דוא״ל.",
            "danger"
        )

        return redirect(redirect_target)

    if not topic:
        if is_job_application:
            topic = "מועמדות כללית"
        else:
            topic = "פנייה מהאתר"

    # =====================================================
    # בדיקת קובץ קורות החיים
    # =====================================================

    if cv_file and cv_file.filename:

        if not allowed_cv_file(cv_file.filename):
            flash(
                "ניתן לצרף קובץ PDF, DOC או DOCX בלבד.",
                "danger"
            )

            return redirect(redirect_target)

        cv_filename = secure_filename(cv_file.filename)

    else:
        cv_filename = None

    # =====================================================
    # יצירת נושא ותוכן המייל
    # =====================================================

    if is_job_application:
        email_subject = f"מועמדות חדשה: {topic} - {name}"
        email_title = "התקבלה מועמדות חדשה דרך אתר אוגדן מהנדסים"

    else:
        email_subject = f"פנייה חדשה מהאתר: {topic} - {name}"
        email_title = "התקבלה פנייה חדשה דרך אתר אוגדן מהנדסים"

    email_body = f"""
{email_title}

שם מלא:
{name}

טלפון:
{phone}

דוא"ל:
{email}

נושא / משרה מבוקשת:
{topic}

הודעה:
{user_message if user_message else "לא נכתבה הודעה נוספת"}

קובץ קורות חיים:
{cv_filename if cv_filename else "לא צורף קובץ"}
"""

    # =====================================================
    # יצירת הודעת המייל
    # =====================================================

    outgoing_message = Message(
        subject=email_subject,
        recipients=["avi.askapa1@gmail.com"],
        body=email_body,
        reply_to=email
    )

    # =====================================================
    # צירוף קורות החיים למייל
    # =====================================================

    if cv_file and cv_file.filename:

        mime_type, _ = mimetypes.guess_type(cv_filename)

        if mime_type is None:
            mime_type = "application/octet-stream"

        file_content = cv_file.read()

        outgoing_message.attach(
            filename=cv_filename,
            content_type=mime_type,
            data=file_content
        )

    # =====================================================
    # שליחת המייל
    # =====================================================

    try:
        mail.send(outgoing_message)

        print(
            "Email sent successfully:",
            name,
            phone,
            email,
            topic,
            cv_filename
        )

    except Exception as error:
        print("Error sending email:", error)

        if is_job_application:
            flash(
                "אירעה שגיאה בשליחת המועמדות. "
                "אנא נסו שוב או שלחו את קורות החיים ישירות למייל.",
                "danger"
            )
        else:
            flash(
                "אירעה שגיאה בשליחת הפנייה. "
                "אנא נסו שוב או צרו קשר ישירות בטלפון או במייל.",
                "danger"
            )

        return redirect(redirect_target)

    # =====================================================
    # הודעת הצלחה וחזרה לעמוד
    # =====================================================

    if is_job_application:
        flash(
            "המועמדות נשלחה בהצלחה! "
            "קורות החיים התקבלו ונחזור אליכם בהקדם.",
            "success"
        )

        return redirect(
            url_for("requirements") + "#general-application"
        )

    flash(
        "הפנייה נשלחה בהצלחה! נחזור אליכם בהקדם.",
        "success"
    )

    return redirect(
        url_for("home") + "#contact"
    )


# =========================================================
# טיפול בקובץ גדול מדי
# =========================================================

@app.errorhandler(413)
def file_too_large(error):

    flash(
        "הקובץ גדול מדי. ניתן לצרף קובץ בגודל של עד 5MB.",
        "danger"
    )

    return redirect(
        url_for("requirements") + "#general-application"
    )


# =========================================================
# הפעלת האתר
# =========================================================

if __name__ == "__main__":
    app.run(debug=True)