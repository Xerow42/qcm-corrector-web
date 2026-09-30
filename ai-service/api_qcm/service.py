from __future__ import annotations

import argparse
import json
from io import BytesIO
from pathlib import Path

import cv2
import easyocr
import numpy as np
from PIL import Image, UnidentifiedImageError
from tensorflow.keras.models import load_model


CURRENT_DIR = Path(__file__).resolve().parent
BOXES_PATH = CURRENT_DIR / "boxes_coords3.json"

WARPED_SIZE = (4504, 6559)
QCM_MODEL_PATH = CURRENT_DIR / "qcm_model2.h5"
STUDENT_ID_MODEL_PATH = CURRENT_DIR / "qcm_model_id_augmente.h5"
OPTION_LABELS = ("A", "B", "C", "D")
QUESTION_COUNT = 60
CHOICES_PER_QUESTION = 4
IMG_SIZE = (64, 64)


class ServiceError(Exception):
    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code
        self.message = message


class InvalidImageError(ServiceError):
    pass


class UnreadableSheetError(ServiceError):
    pass


class ResourceInitializationError(ServiceError):
    pass


_READER = None
_QCM_MODEL = None
_ID_MODEL = None
_QCM_BOXES = None


def order_points(pts):
    pts = np.array(pts, dtype="float32")
    rect = np.zeros((4, 2), dtype="float32")
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]
    rect[2] = pts[np.argmax(s)]
    diff = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(diff)]
    rect[3] = pts[np.argmax(diff)]
    return rect


def find_corner_markers(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    h, w = gray.shape
    search_regions = {
        "tl": (0, 0, int(w * 0.12), int(h * 0.08)),
        "tr": (int(w * 0.88), 0, w, int(h * 0.08)),
        "br": (int(w * 0.88), int(h * 0.92), w, h),
        "bl": (0, int(h * 0.92), int(w * 0.12), h),
    }

    selected_points = []
    selected_contours = []

    for key in ("tl", "tr", "br", "bl"):
        x0, y0, x1, y1 = search_regions[key]
        roi = gray[y0:y1, x0:x1]
        _, roi_binary = cv2.threshold(roi, 200, 255, cv2.THRESH_BINARY_INV)

        contours, _ = cv2.findContours(
            roi_binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
        )
        candidates = []

        for cnt in contours:
            area = cv2.contourArea(cnt)
            if area < 200:
                continue
            x, y, cw, ch = cv2.boundingRect(cnt)
            if cw < 25 or ch < 25:
                continue
            candidates.append((area, cnt))

        if not candidates:
            raise RuntimeError(f"Repere non detecte dans la zone {key}.")

        _, best_cnt = max(candidates, key=lambda item: item[0])
        best_cnt_global = best_cnt + np.array([[[x0, y0]]], dtype=np.int32)
        selected_contours.append(best_cnt_global)

        x, y, cw, ch = cv2.boundingRect(best_cnt_global)
        if key == "tl":
            point = (x, y)
        elif key == "tr":
            point = (x + cw - 1, y)
        elif key == "br":
            point = (x + cw - 1, y + ch - 1)
        else:
            point = (x, y + ch - 1)

        selected_points.append(point)

    return order_points(selected_points), selected_contours


def warp_from_points(image, pts):
    (tl, tr, br, bl) = pts
    max_width = int(max(np.linalg.norm(tr - tl), np.linalg.norm(br - bl)))
    max_height = int(max(np.linalg.norm(br - tr), np.linalg.norm(bl - tl)))

    dst = np.array(
        [
            [0, 0],
            [max_width - 1, 0],
            [max_width - 1, max_height - 1],
            [0, max_height - 1],
        ],
        dtype="float32",
    )

    matrix = cv2.getPerspectiveTransform(pts, dst)
    return cv2.warpPerspective(image, matrix, (max_width, max_height))


def load_boxes(json_path):
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return [
        (
            item["x"] - int(item["h"] / 2),
            item["y"] - int(item["w"] / 2),
            2 * item["w"],
            2 * item["h"],
        )
        for item in data["boxes"]
    ]


def preprocess_for_model(img):
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    img = cv2.resize(img, IMG_SIZE)
    img = img.astype("float32") / 255.0
    img = np.expand_dims(img, axis=0)
    return img


def resize_warped(image: np.ndarray) -> np.ndarray:
    return cv2.resize(image, WARPED_SIZE)


def predict_case(img: np.ndarray, model) -> float:
    img_resized = cv2.resize(img, (64, 64))
    img_resized = img_resized.astype("float32") / 255.0
    img_resized = np.expand_dims(img_resized, axis=0)
    pred = model.predict(img_resized, verbose=0)[0][0]
    return float(pred)


def load_easyocr():
    global _READER
    if _READER is None:
        try:
            _READER = easyocr.Reader(["fr", "en"])
        except Exception as exc:
            raise ResourceInitializationError(
                "easyocr_init_failed",
                f"Impossible de charger EasyOCR: {exc}",
            ) from exc
    return _READER


def load_qcm_model():
    global _QCM_MODEL
    if _QCM_MODEL is None:
        try:
            _QCM_MODEL = load_model(QCM_MODEL_PATH, compile=False)
        except Exception as exc:
            raise ResourceInitializationError(
                "qcm_model_init_failed",
                f"Impossible de charger le modele QCM: {exc}",
            ) from exc
    return _QCM_MODEL


def load_id_model():
    global _ID_MODEL
    if _ID_MODEL is None:
        try:
            _ID_MODEL = load_model(STUDENT_ID_MODEL_PATH)
        except Exception as exc:
            raise ResourceInitializationError(
                "id_model_init_failed",
                f"Impossible de charger le modele ID: {exc}",
            ) from exc
    return _ID_MODEL


def load_qcm_boxes():
    global _QCM_BOXES
    if _QCM_BOXES is None:
        try:
            _QCM_BOXES = load_boxes(BOXES_PATH)
        except Exception as exc:
            raise ResourceInitializationError(
                "boxes_init_failed",
                f"Impossible de charger boxes_coords3.json: {exc}",
            ) from exc
    return _QCM_BOXES


def initialize_resources() -> None:
    load_qcm_boxes()
    load_qcm_model()
    load_id_model()
    load_easyocr()


def enhance_text(img: np.ndarray) -> np.ndarray:
    if len(img.shape) == 2:
        gray = img
    else:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    gray = cv2.resize(gray, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
    blur = cv2.GaussianBlur(gray, (3, 3), 0)
    thresh = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]
    return cv2.cvtColor(strip_horizontal_lines(thresh), cv2.COLOR_GRAY2BGR)


def strip_horizontal_lines(gray_or_binary: np.ndarray) -> np.ndarray:
    cleaned = gray_or_binary.copy()
    if len(cleaned.shape) == 3:
        cleaned = cv2.cvtColor(cleaned, cv2.COLOR_BGR2GRAY)

    dark_threshold = 80
    for row_idx in range(cleaned.shape[0]):
        dark_ratio = float(np.count_nonzero(cleaned[row_idx] < dark_threshold)) / float(
            cleaned.shape[1]
        )
        if dark_ratio > 0.45:
            cleaned[row_idx:row_idx + 3, :] = 255

    return cleaned


def add_white_border(img: np.ndarray, border: int = 30) -> np.ndarray:
    return cv2.copyMakeBorder(
        img,
        border,
        border,
        border,
        border,
        cv2.BORDER_CONSTANT,
        value=(255, 255, 255),
    )


def read_with_easyocr(img: np.ndarray) -> str:
    reader = load_easyocr()

    crop_np = np.array(img)
    results = reader.readtext(
        crop_np, allowlist="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
    )

    texts = []
    for (_, text, prob) in results:
        if prob > 0.3:
            texts.append(text)

    return " ".join(texts).strip()


def clean_text(text: str) -> str:
    cleaned_chars = []
    for char in text:
        if char.isalpha() or char.isspace():
            cleaned_chars.append(char)
        else:
            cleaned_chars.append(" ")
    return " ".join("".join(cleaned_chars).split())


def find_info_box(warped: np.ndarray) -> tuple[int, int, int, int]:
    h, w = warped.shape[:2]
    rx1 = int(w * 0.12)
    rx2 = int(w * 0.70)
    ry1 = int(h * 0.05)
    ry2 = int(h * 0.24)

    roi = warped[ry1:ry2, rx1:rx2]
    gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    thresh = cv2.threshold(
        blur, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU
    )[1]
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (9, 9))
    closed = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel, iterations=2)
    contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    best_box = None
    best_score = -1
    for cnt in contours:
        x, y, bw, bh = cv2.boundingRect(cnt)
        area = bw * bh
        if area < 50000:
            continue
        ratio = bw / float(bh)
        if not (1.8 <= ratio <= 5.5):
            continue
        if area > best_score:
            best_score = area
            best_box = (x + rx1, y + ry1, bw, bh)

    if best_box is None:
        raise UnreadableSheetError(
            "info_box_not_detected",
            "Cadre d'identification non detecte sur la feuille scannee.",
        )

    return best_box


def crop_full_name_field(warped: np.ndarray) -> np.ndarray:
    find_info_box(warped)

    full_y1, full_y2 = 770, 1135
    full_x1, full_x2 = 1260, 2860
    full_name_zone = warped[full_y1:full_y2, full_x1:full_x2]

    return full_name_zone


def extract_full_name(warped: np.ndarray) -> str:
    full_name_zone = crop_full_name_field(warped)

    full_name_img = enhance_text(full_name_zone)
    full_name_img = add_white_border(full_name_img)

    full_name_variants = [
        ("full_name_processed", full_name_img),
        ("full_name_raw_bordered", add_white_border(full_name_zone)),
        (
            "full_name_raw_cleaned",
            add_white_border(
                cv2.cvtColor(
                    strip_horizontal_lines(
                        cv2.cvtColor(full_name_zone, cv2.COLOR_BGR2GRAY)
                    ),
                    cv2.COLOR_GRAY2BGR,
                )
            ),
        ),
    ]

    full_name = ""

    for label, variant in full_name_variants:
        text = read_with_easyocr(variant)
        if clean_text(text):
            full_name = text
            break

    return clean_text(full_name)


def extract_student_id(warped: np.ndarray, model) -> str:
    zone = warped[540:1800, 3210:]

    gray = cv2.cvtColor(zone, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    thresh = cv2.threshold(
        blur, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU
    )[1]

    contours, hierarchy = cv2.findContours(
        thresh, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE
    )
    if hierarchy is None:
        return ""

    id_boxes = []
    for i, cnt in enumerate(contours):
        parent = hierarchy[0][i][3]
        if parent != -1:
            continue

        x, y, w, h = cv2.boundingRect(cnt)

        if w * h > 5000:
            id_boxes.append([x - 10, y - 10, w + 20, h + 20])

    all_boxes = []
    for x, y, w, h in id_boxes:
        y1 = max(y - 8, 0)
        y2 = min(y + h + 8, zone.shape[0])
        x1 = max(x - 8, 0)
        x2 = min(x + w + 8, zone.shape[1])

        img = zone[y1:y2, x1:x2]
        if img.size == 0:
            continue

        pred = predict_case(img, model)
        checked = 1 if pred <= 0.5 else 0
        all_boxes.append((x + w // 2, y + h // 2, checked))

    all_boxes.sort(key=lambda item: item[0])

    columns = []
    current_col = []
    threshold_x = 40

    for box in all_boxes:
        if not current_col:
            current_col.append(box)
            continue

        if abs(box[0] - current_col[0][0]) < threshold_x:
            current_col.append(box)
        else:
            columns.append(current_col)
            current_col = [box]

    if current_col:
        columns.append(current_col)

    student_number = ""

    for col in columns:
        col.sort(key=lambda item: item[1])

        digit = None
        for idx, (_, _, checked) in enumerate(col):
            if checked == 1:
                digit = idx
                break

        student_number += str(digit) if digit is not None else "?"

    return student_number


def group_boxes_by_rows(
    qcm_boxes: list[tuple[int, int, int, int]],
    tolerance: int = 18,
) -> list[list[tuple[int, int, int, int]]]:
    rows: list[list[tuple[int, int, int, int]]] = []
    for box in sorted(qcm_boxes, key=lambda item: (item[1], item[0])):
        _, y, _, h = box
        cy = y + h / 2.0
        for row in rows:
            row_center = np.mean([item[1] + item[3] / 2.0 for item in row])
            if abs(cy - row_center) <= tolerance:
                row.append(box)
                break
        else:
            rows.append([box])

    rows = [sorted(row, key=lambda item: item[0]) for row in rows]
    rows.sort(key=lambda row: np.mean([item[1] + item[3] / 2.0 for item in row]))
    return rows


def group_row_into_questions(
    row: list[tuple[int, int, int, int]],
    choices_per_question: int = CHOICES_PER_QUESTION,
) -> list[list[tuple[int, int, int, int]]]:
    groups: list[list[tuple[int, int, int, int]]] = []
    for start in range(0, len(row), choices_per_question):
        group = row[start:start + choices_per_question]
        if len(group) == choices_per_question:
            groups.append(group)
    return groups


def predict_qcm_box(
    warped: np.ndarray,
    box: tuple[int, int, int, int],
    model,
    padding: int = 16,
) -> tuple[float, float]:
    x, y, w, h = box
    x1 = max(0, x - padding)
    y1 = max(0, y - padding)
    x2 = min(warped.shape[1], x + w + padding)
    y2 = min(warped.shape[0], y + h + padding)

    zone = warped[y1:y2, x1:x2]
    if zone.size == 0:
        return 1.0, 0.0

    zone_gray = cv2.cvtColor(zone, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(zone_gray, (5, 5), 0)
    thresh = cv2.threshold(
        blur, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU
    )[1]

    contours, _ = cv2.findContours(
        thresh,
        cv2.RETR_LIST,
        cv2.CHAIN_APPROX_SIMPLE,
    )

    case_img = zone
    best_area = 0

    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area <= 5000:
            continue

        xr, yr, bw, bh = cv2.boundingRect(cnt)
        candidate = zone[
            max(0, yr - 8):min(zone.shape[0], yr + bh + 8),
            max(0, xr - 8):min(zone.shape[1], xr + bw + 8),
        ]
        if candidate.size == 0:
            continue

        if area > best_area:
            best_area = area
            case_img = candidate

    inp = preprocess_for_model(case_img)
    pred = float(model.predict(inp, verbose=0)[0][0])

    case_gray = cv2.cvtColor(case_img, cv2.COLOR_BGR2GRAY)
    case_thresh = cv2.threshold(
        case_gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU
    )[1]
    dark_ratio = float(np.count_nonzero(case_thresh)) / float(case_thresh.size)

    return pred, dark_ratio


def is_qcm_box_checked(pred_value: float, dark_ratio: float) -> bool:
    if pred_value <= 0.5:
        return True
    if pred_value <= 0.65 and dark_ratio >= 0.18:
        return True
    return False


def extract_qcm_answers(warped: np.ndarray, model) -> dict[str, str]:
    qcm_boxes = load_qcm_boxes()
    rows = group_boxes_by_rows(qcm_boxes)

    answers: dict[str, str] = {}
    question_groups_by_row = [group_row_into_questions(row) for row in rows]
    total_columns = max((len(groups) for groups in question_groups_by_row), default=0)

    for row_index, groups in enumerate(question_groups_by_row):
        for column_index, group in enumerate(groups):
            checked_labels = []

            for option_idx, box in enumerate(group):
                pred_value, dark_ratio = predict_qcm_box(warped, box, model)
                if is_qcm_box_checked(pred_value, dark_ratio):
                    checked_labels.append(OPTION_LABELS[option_idx])

            question_index = row_index + 1 + (column_index * len(rows))
            if question_index <= QUESTION_COUNT:
                answers[f"q{question_index}"] = "".join(checked_labels)

    for missing_question in range(1, QUESTION_COUNT + 1):
        answers.setdefault(f"q{missing_question}", "")

    if total_columns == 0:
        for missing_question in range(1, QUESTION_COUNT + 1):
            answers[f"q{missing_question}"] = ""

    for missing_question in range(len(answers) + 1, QUESTION_COUNT + 1):
        answers[f"q{missing_question}"] = ""

    return answers


def analyze_sheet(image_path: str | Path) -> dict[str, str]:
    image_path = Path(image_path)
    image = cv2.imread(str(image_path))
    if image is None:
        raise InvalidImageError(
            "image_not_found",
            f"Impossible de charger l'image: {image_path}",
        )

    return analyze_sheet_image(image)


def analyze_sheet_image(image: np.ndarray) -> dict[str, str]:
    if image is None:
        raise InvalidImageError(
            "invalid_image",
            "Image scannee invalide ou illisible.",
        )

    try:
        pts, _ = find_corner_markers(image)
        warped = resize_warped(warp_from_points(image, pts))
    except ServiceError:
        raise
    except Exception as exc:
        raise UnreadableSheetError(
            "sheet_alignment_failed",
            f"Impossible de redresser correctement la feuille: {exc}",
        ) from exc

    qcm_model = load_qcm_model()
    id_model = load_id_model()

    nom_complet = extract_full_name(warped)
    student_id = extract_student_id(warped, id_model)
    qcm_answers = extract_qcm_answers(warped, qcm_model)

    result = {
        "nom_complet": nom_complet,
        "id": student_id,
    }
    result.update(qcm_answers)
    return result


def analyze_sheet_bytes(content: bytes) -> dict[str, str]:
    if not content:
        raise InvalidImageError("empty_file", "Le fichier image est vide.")

    try:
        pil_image = Image.open(BytesIO(content)).convert("RGB")
    except UnidentifiedImageError as exc:
        raise InvalidImageError(
            "invalid_image_format",
            "Le fichier envoye n'est pas une image valide.",
        ) from exc
    except Exception as exc:
        raise InvalidImageError(
            "invalid_image",
            f"Impossible de lire l'image envoyee: {exc}",
        ) from exc

    image = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
    return analyze_sheet_image(image)


def main():
    parser = argparse.ArgumentParser(
        description="Fusion OCR nom/prenom, ID et reponses QCM."
    )
    parser.add_argument("image_path", help="Chemin vers l'image de la feuille.")
    args = parser.parse_args()
    
    initialize_resources()
    result = analyze_sheet(args.image_path)
    print(result)


if __name__ == "__main__":
    main()
