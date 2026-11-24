"""Keep explanations of independent cores and compatibility wrappers tied to real source."""
import ast
from pathlib import Path

def source_segment(path, name):
    source = path.read_text()
    nodes = ast.parse(source).body
    for part in name.split("."):
        node = next(n for n in nodes if isinstance(n, (ast.ClassDef, ast.FunctionDef)) and n.name == part)
        nodes = node.body
    return ast.get_source_segment(source, node)

def refresh_explanations(data, root):
    root = Path(root)
    selections = {
        "cast": [
            ("cast_setup", "توسيع مفتاح CAST", "اشتقاق مفاتيح القناع والدوران وفق RFC 2144. المفاتيح حتى 80 بت تستخدم 12 دورة، والأطول تستخدم 16 دورة."),
            ("_cast_block", "دورات CAST الثلاث", "تتناوب دوال الجمع وXOR والطرح مع الدوران وصناديق S1–S4؛ يعكس فك التشفير ترتيب الدورات والمفاتيح."),
            ("cast_encrypt", "تشفير الرسالة", "حشو PKCS#7 ثم تشفير كتل مستقلة بحجم 8 بايت؛ جدول المفتاح يُحسب مرة واحدة للرسالة."),
        ],
        "blowfish": [
            ("Blowfish.__init__", "توليد P وصناديق S المعتمدة على المفتاح", "تبدأ الجداول بثوابت مشتقة من π، ثم تُخلط بالمفتاح وتُحدّث بتشفير متكرر لكتلة صفرية."),
            ("Blowfish._f", "الدالة F", "تقسيم الكلمة إلى أربعة بايتات واستخدامها لفهرسة صناديق S؛ تدمج النتائج بالجمع النمطي وXOR."),
            ("Blowfish._words", "دورات فيستل وفكها", "تطبق 16 دورة مع التبييض النهائي. عند فك التشفير يُعكس ترتيب مصفوفة P."),
        ],
    }
    for algo, entries in selections.items():
        path = root / algo / f"{algo}_manual.py"
        data[algo]["manual-python"] = [dict(
            id=f"{algo}-source-{index}", role=title, category="cipher", badge="Pure Python",
            snippet=source_segment(path, name), explanation=text, htmlExplanation=f"<p>{text}</p>",
        ) for index, (name, title, text) in enumerate(entries)]
    for algo in ("rc5", "rc6", "idea"):
        text = "واجهة توافق تعيد تصدير التطبيق اليدوي؛ لا تستخدم مكتبة تشفير مستقلة. الاختبار المرجعي موجود في مجموعة الاختبارات."
        data[algo]["libs-python"] = [dict(
            id=f"{algo}-wrapper", role="واجهة توافق للتطبيق اليدوي", category="cipher", badge="Compatibility wrapper",
            snippet=(root / algo / f"{algo}_libs.py").read_text(), explanation=text, htmlExplanation=f"<p>{text}</p>",
        )]
