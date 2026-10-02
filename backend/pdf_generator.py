from __future__ import annotations

from datetime import datetime
from io import BytesIO
from pathlib import Path
from typing import Mapping, Any

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas
from pypdf import PdfReader, PdfWriter


def _draw_checkbox(c: canvas.Canvas, x: float, y: float, size: float, checked: bool) -> None:
    c.rect(x, y, size, size)
    if checked:
        c.setLineWidth(1.2)
        c.line(x + 2, y + 2, x + size - 2, y + size - 2)
        c.line(x + 2, y + size - 2, x + size - 2, y + 2)
        c.setLineWidth(1)


def _draw_mark(c: canvas.Canvas, x: float, y: float, size: float) -> None:
    c.setLineWidth(1.2)
    c.line(x + 2, y + 2, x + size - 2, y + size - 2)
    c.line(x + 2, y + size - 2, x + size - 2, y + 2)
    c.setLineWidth(1)

def _answer_set(value: object) -> set[str]:
    if value is None:
        return set()
    if isinstance(value, (list, tuple, set)):
        items = value
    else:
        items = [value]
    out: set[str] = set()
    for item in items:
        if item is None:
            continue
        text = str(item).strip().upper()
        for ch in text:
            if ch.isalpha():
                out.add(ch)
    return out


def _draw_header(c: canvas.Canvas, title: str, margin_x: float, top_y: float) -> None:
    c.setFont("Helvetica-Bold", 14)
    c.drawString(margin_x, top_y, title)

    c.setFont("Helvetica", 9)
    c.drawString(margin_x, top_y - 14, "MATIERE:")
    c.line(margin_x + 55, top_y - 16, margin_x + 220, top_y - 16)
    c.drawString(margin_x, top_y - 30, "NOM:")
    c.line(margin_x + 55, top_y - 32, margin_x + 220, top_y - 32)
    c.drawString(margin_x, top_y - 46, "PRENOM:")
    c.line(margin_x + 55, top_y - 48, margin_x + 220, top_y - 48)
    c.drawString(margin_x, top_y - 62, "DATE:")
    c.line(margin_x + 55, top_y - 64, margin_x + 150, top_y - 64)
    c.drawString(margin_x + 170, top_y - 62, "NIVEAU:")
    c.line(margin_x + 225, top_y - 64, margin_x + 320, top_y - 64)

    box_size = 5 * mm
    c.setFont("Helvetica-Bold", 9)
    c.drawString(margin_x + 330, top_y - 10, "NUMERO ETUDIANT")
    x0 = margin_x + 330
    y0 = top_y - 28
    for i in range(8):
        c.rect(x0 + i * (box_size + 2), y0, box_size, box_size)


def _wrap_text(c: canvas.Canvas, text: str, max_width: float, font_name: str, font_size: int) -> list[str]:
    c.setFont(font_name, font_size)
    words = text.split()
    if not words:
        return []
    lines: list[str] = []
    current = words[0]
    for w in words[1:]:
        trial = f"{current} {w}"
        if c.stringWidth(trial, font_name, font_size) <= max_width:
            current = trial
        else:
            lines.append(current)
            current = w
    lines.append(current)
    return lines


def _draw_statements_page(
    c: canvas.Canvas,
    statements: Mapping[str, str],
    choices_text: Mapping[str, Mapping[str, str]] | None,
) -> None:
    width, height = A4
    margin_x = 16 * mm
    margin_y = 18 * mm

    c.setFont("Helvetica-Bold", 13)
    c.drawString(margin_x, height - margin_y, "Enonces des questions")

    y = height - margin_y - 16
    line_h = 12
    text_w = width - 2 * margin_x

    for q in range(1, 61):
        key = str(q)
        text = statements.get(key)
        opts = (choices_text or {}).get(key, {}) if choices_text else {}
        if not text and not opts:
            continue

        if y < margin_y + 60:
            c.showPage()
            c.setFont("Helvetica-Bold", 13)
            c.drawString(margin_x, height - margin_y, "Enonces des questions")
            y = height - margin_y - 16

        if text:
            prefix = f"Q{q}. "
            lines = _wrap_text(c, text, text_w - 24, "Helvetica", 9)
            if lines:
                c.setFont("Helvetica-Bold", 9)
                c.drawString(margin_x, y, prefix)
                c.setFont("Helvetica", 9)
                c.drawString(margin_x + 24, y, lines[0])
                y -= line_h
                for extra in lines[1:]:
                    if y < margin_y + 40:
                        c.showPage()
                        c.setFont("Helvetica-Bold", 13)
                        c.drawString(margin_x, height - margin_y, "Enonces des questions")
                        y = height - margin_y - 16
                    c.setFont("Helvetica", 9)
                    c.drawString(margin_x + 24, y, extra)
                    y -= line_h
        else:
            c.setFont("Helvetica-Bold", 9)
            c.drawString(margin_x, y, f"Q{q}.")
            y -= line_h

        # Choices
        for letter in ("A", "B", "C", "D"):
            val = (opts or {}).get(letter)
            if not val:
                continue
            line = f"{letter}) {val}"
            lines = _wrap_text(c, line, text_w - 24, "Helvetica", 9)
            for idx, l in enumerate(lines):
                if y < margin_y + 30:
                    c.showPage()
                    c.setFont("Helvetica-Bold", 13)
                    c.drawString(margin_x, height - margin_y, "Enonces des questions")
                    y = height - margin_y - 16
                c.setFont("Helvetica", 9)
                c.drawString(margin_x + 24, y, l)
                y -= line_h

        y -= 4


def generate_statements_pdf(
    statements: Mapping[str, str],
    choices_text: Mapping[str, Mapping[str, str]] | None = None,
) -> bytes:
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    _draw_statements_page(c, statements, choices_text)
    c.showPage()
    c.save()
    return buffer.getvalue()


def generate_qcm_subject_pdf(qcm: Mapping[str, Any]) -> bytes:
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    margin_x = 19 * mm
    margin_y = 14 * mm
    content_w = width - 2 * margin_x
    y = height - margin_y

    def teacher_name() -> str:
        teacher = qcm.get("teacher") or {}
        return (
            f"{teacher.get('first_name') or ''} {teacher.get('last_name') or ''}".strip()
            or str(teacher.get("email") or "-")
        )

    def format_date(value: object) -> str:
        raw = str(value or "").strip()
        try:
            dt = datetime.fromisoformat(raw)
        except ValueError:
            return raw or "-"
        months = [
            "janvier",
            "fevrier",
            "mars",
            "avril",
            "mai",
            "juin",
            "juillet",
            "aout",
            "septembre",
            "octobre",
            "novembre",
            "decembre",
        ]
        return f"{dt.day:02d} {months[dt.month - 1]} {dt.year}"

    def start_page() -> None:
        nonlocal y
        y = height - margin_y
        c.setFont("Helvetica", 7)
        c.drawCentredString(width / 2, y, "QCM Corrector")
        y -= 20

    def page_break_if_needed(required: float) -> None:
        if y - required < margin_y:
            c.showPage()
            start_page()

    def draw_label_value(label: str, value: object) -> None:
        nonlocal y
        box_h = 44
        page_break_if_needed(box_h + 8)
        box_y = y - box_h
        c.setStrokeColorRGB(0.80, 0.85, 0.91)
        c.roundRect(margin_x, box_y, content_w, box_h, 5, stroke=1, fill=0)
        c.setFillColorRGB(0.11, 0.23, 0.39)
        c.setFont("Helvetica-Bold", 7)
        c.drawString(margin_x + 10, box_y + box_h - 13, label.upper())
        c.setFillColorRGB(0, 0, 0)
        c.setFont("Helvetica", 9)
        lines = _wrap_text(c, str(value or "-"), content_w - 20, "Helvetica", 9)[:2]
        for idx, line in enumerate(lines):
            c.drawString(margin_x + 10, box_y + box_h - 29 - idx * 11, line)
        y -= box_h + 9

    def draw_wrapped(text: str, x: float, max_w: float, font: str, size: int, line_h: int) -> float:
        nonlocal y
        lines = _wrap_text(c, text, max_w, font, size)
        c.setFont(font, size)
        for line in lines:
            c.drawString(x, y, line)
            y -= line_h
        return len(lines) * line_h

    start_page()

    c.setFillColorRGB(0.12, 0.23, 0.39)
    c.setFont("Helvetica-Bold", 7)
    c.drawString(margin_x, y, "SUJET DU QCM")
    c.setFillColorRGB(0, 0, 0)
    y -= 18

    c.setFont("Helvetica-Bold", 19)
    c.drawString(margin_x, y, str(qcm.get("title") or "QCM"))
    c.setFont("Helvetica-Bold", 10)
    c.drawRightString(width - margin_x, y + 2, f"Code: {qcm.get('code') or '-'}")
    y -= 14
    c.setFont("Helvetica", 9)
    c.drawRightString(width - margin_x, y + 2, "JUNIA MAROC")
    y -= 14
    c.setStrokeColorRGB(0.74, 0.80, 0.88)
    c.line(margin_x, y, width - margin_x, y)
    y -= 18

    subject = qcm.get("subject") or {}
    klass = qcm.get("class") or {}
    fields = [
        ("Matiere", subject.get("name")),
        ("Professeur", teacher_name()),
        ("Date d'examen", format_date(qcm.get("exam_date"))),
        ("Classe", klass.get("name")),
        ("Questions", len(qcm.get("questions") or [])),
        ("Total points", f"{qcm.get('max_score') or 0:g} points" if isinstance(qcm.get("max_score"), (int, float)) else qcm.get("max_score")),
    ]
    for label, value in fields:
        draw_label_value(label, value)
    y -= 10

    for question in qcm.get("questions") or []:
        options = question.get("options") or []
        prompt = f"{question.get('order')}. {question.get('prompt')}"
        estimated = 38 + 13 * (1 + len(prompt) // 72) + len(options) * 19
        page_break_if_needed(estimated)

        c.setFillColorRGB(0, 0, 0)
        draw_wrapped(prompt, margin_x, content_w, "Helvetica-Bold", 9, 12)
        c.setFont("Helvetica", 8)
        c.drawString(margin_x, y, f"{question.get('points') or 0:g} pt(s)")
        y -= 17
        c.setStrokeColorRGB(0.82, 0.86, 0.92)
        c.line(margin_x, y, width - margin_x, y)
        y -= 13

        for option in options:
            label = str(option.get("key") or "")
            text = str(option.get("text") or "")
            line = f"{label}. {text}"
            draw_wrapped(line, margin_x, content_w, "Helvetica", 9, 16)
        c.setStrokeColorRGB(0.82, 0.86, 0.92)
        c.line(margin_x, y, width - margin_x, y)
        y -= 16

    c.save()
    return buffer.getvalue()


def generate_qcm_answer_key_pdf(qcm: Mapping[str, Any]) -> bytes:
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    margin_x = 19 * mm
    margin_y = 14 * mm
    content_w = width - 2 * margin_x
    y = height - margin_y

    def teacher_name() -> str:
        teacher = qcm.get("teacher") or {}
        return (
            f"{teacher.get('first_name') or ''} {teacher.get('last_name') or ''}".strip()
            or str(teacher.get("email") or "-")
        )

    c.setFont("Helvetica", 7)
    c.drawCentredString(width / 2, y, "QCM Corrector")
    y -= 20

    c.setFillColorRGB(0.12, 0.23, 0.39)
    c.setFont("Helvetica-Bold", 7)
    c.drawString(margin_x, y, "GRILLE DE CORRECTION")
    c.setFillColorRGB(0, 0, 0)
    y -= 18

    c.setFont("Helvetica-Bold", 19)
    c.drawString(margin_x, y, str(qcm.get("title") or "QCM"))
    c.setFont("Helvetica-Bold", 10)
    c.drawRightString(width - margin_x, y + 2, f"Code: {qcm.get('code') or '-'}")
    y -= 13

    subject = qcm.get("subject") or {}
    klass = qcm.get("class") or {}
    c.setFont("Helvetica", 9)
    c.drawString(margin_x, y, f"{subject.get('name') or '-'} - {klass.get('name') or '-'}")
    c.drawRightString(width - margin_x, y, teacher_name())
    y -= 18

    c.setStrokeColorRGB(0.74, 0.80, 0.88)
    c.line(margin_x, y, width - margin_x, y)
    y -= 18

    row_h = 26
    table_h = row_h * (len(qcm.get("questions") or []) + 1)
    if y - table_h < margin_y:
        c.showPage()
        y = height - margin_y

    cols = [
        ("Question", 0.25),
        ("A", 0.10),
        ("B", 0.10),
        ("C", 0.10),
        ("D", 0.10),
        ("Type", 0.18),
        ("Points", 0.17),
    ]
    col_widths = [content_w * frac for _, frac in cols]
    x_positions = [margin_x]
    for w in col_widths[:-1]:
        x_positions.append(x_positions[-1] + w)

    def cell_text(text: str, x: float, y0: float, w: float, bold: bool = False, center: bool = True) -> None:
        c.setFont("Helvetica-Bold" if bold else "Helvetica", 8)
        tx = x + w / 2 if center else x + 8
        if center:
            c.drawCentredString(tx, y0 + 9, text)
        else:
            c.drawString(tx, y0 + 9, text)

    y0 = y - row_h
    c.setStrokeColorRGB(0.80, 0.85, 0.91)
    c.setFillColorRGB(0.98, 0.99, 1)
    c.rect(margin_x, y0, content_w, row_h, stroke=1, fill=1)
    c.setFillColorRGB(0.11, 0.23, 0.39)
    for idx, (heading, _) in enumerate(cols):
        cell_text(heading.upper(), x_positions[idx], y0, col_widths[idx], bold=True, center=idx != 0)
    c.setFillColorRGB(0, 0, 0)
    y = y0

    for question in qcm.get("questions") or []:
        y0 = y - row_h
        c.setStrokeColorRGB(0.86, 0.89, 0.94)
        c.rect(margin_x, y0, content_w, row_h, stroke=1, fill=0)
        expected = {
            str(option.get("key"))
            for option in question.get("options") or []
            if option.get("isCorrect")
        }
        values = [
            str(question.get("order") or ""),
            "X" if "A" in expected else "",
            "X" if "B" in expected else "",
            "X" if "C" in expected else "",
            "X" if "D" in expected else "",
            "Multiple" if question.get("type") == "multiple" else "Unique",
            f"{question.get('points') or 0:g}",
        ]
        for idx, value in enumerate(values):
            is_mark = value == "X"
            c.setFillColorRGB(0.11, 0.23, 0.39) if is_mark else c.setFillColorRGB(0, 0, 0)
            cell_text(value, x_positions[idx], y0, col_widths[idx], bold=is_mark, center=idx != 0)
        y = y0

    c.save()
    return buffer.getvalue()


def generate_questionnaire_pdf(
    answer_key: Mapping[str, str | list[str] | None],
    title: str = "EXAMEN QCM",
    show_answers: bool = False,
    style: str = "sheet",
    statements: Mapping[str, str] | None = None,
    choices_text: Mapping[str, Mapping[str, str]] | None = None,
    template_pdf_path: Path | None = None,
    template_image_path: Path | None = None,
    grid_config: Mapping[str, Any] | None = None,
) -> bytes:
    buffer = BytesIO()
    template_reader = None
    template_page = None
    page_size = A4
    if template_pdf_path and template_pdf_path.exists():
        try:
            template_reader = PdfReader(str(template_pdf_path))
            if template_reader.pages:
                template_page = template_reader.pages[0]
                page_size = (
                    float(template_page.mediabox.width),
                    float(template_page.mediabox.height),
                )
        except Exception:
            template_reader = None
            template_page = None
            page_size = A4

    c = canvas.Canvas(buffer, pagesize=page_size)
    width, height = page_size

    margin_x = 16 * mm
    margin_y = 18 * mm

    use_template_bg = template_image_path and template_image_path.exists()

    if use_template_bg:
        c.drawImage(str(template_image_path), 0, 0, width=width, height=height, preserveAspectRatio=False)
        grid_top = height - margin_y - 92
        grid_bottom = 28 * mm
    elif style == "sheet":
        _draw_header(c, title, margin_x, height - margin_y + 8)
        grid_top = height - margin_y - 88
        grid_bottom = 28 * mm
    else:
        c.setFont("Helvetica-Bold", 16)
        c.drawString(margin_x, height - margin_y, title)
        grid_top = height - margin_y - 70
        grid_bottom = 28 * mm

    grid_height = grid_top - grid_bottom

    rows_per_col = 20
    cols_count = 3
    col_width = (width - 2 * margin_x) / cols_count
    row_h = grid_height / rows_per_col

    checkbox_size = min(5.5 * mm, row_h * 0.55)
    choice_gap = checkbox_size + 4.5 * mm

    if use_template_bg and grid_config and grid_config.get("blocks"):
        blocks = list(grid_config.get("blocks", []))
        q_number = 1
        for block in blocks:
            row_centers = block.get("row_centers") or []
            col_centers = block.get("col_centers") or []
            box_w = float(block.get("box_w", 0.02)) * width
            box_h = float(block.get("box_h", 0.02)) * height
            for ry in row_centers:
                selected = _answer_set(answer_key.get(str(q_number)))
                for ci, cx in enumerate(col_centers):
                    x_center = float(cx) * width
                    y_center = height - (float(ry) * height)
                    x = x_center - box_w / 2
                    y = y_center - box_h / 2
                    choice = ["A", "B", "C", "D"][ci] if ci < 4 else ""
                    if show_answers and choice in selected:
                        _draw_mark(c, x, y, min(box_w, box_h))
                q_number += 1
    else:
        for col in range(cols_count):
            x0 = margin_x + col * col_width
            c.setFont("Helvetica-Bold", 10)
            c.drawString(x0 + 14, grid_top + 6, "A")
            c.drawString(x0 + 14 + choice_gap, grid_top + 6, "B")
            c.drawString(x0 + 14 + 2 * choice_gap, grid_top + 6, "C")
            c.drawString(x0 + 14 + 3 * choice_gap, grid_top + 6, "D")

            for row in range(rows_per_col):
                q_number = col * rows_per_col + row + 1
                y = grid_top - (row + 1) * row_h + (row_h - checkbox_size) / 2
                selected = _answer_set(answer_key.get(str(q_number)))

                c.setFont("Helvetica", 9)
                c.drawString(x0, y + 1, f"{q_number}.")

                for idx, choice in enumerate(["A", "B", "C", "D"]):
                    x = x0 + 12 + idx * choice_gap
                    checked = show_answers and choice in selected
                    _draw_checkbox(c, x, y, checkbox_size, checked)

    if not use_template_bg:
        c.setFont("Helvetica", 8)
        c.drawString(margin_x, 18 * mm, "Instructions: Noircissez la case ou cochez-la avec soin. Ne pas plier la feuille.")

    if statements or choices_text:
        c.showPage()
        _draw_statements_page(c, statements or {}, choices_text)

    c.showPage()
    c.save()
    overlay_bytes = buffer.getvalue()

    if template_page is None:
        return overlay_bytes

    try:
        overlay_reader = PdfReader(BytesIO(overlay_bytes))
        if not overlay_reader.pages:
            return overlay_bytes
        writer = PdfWriter()
        base = template_page
        base.merge_page(overlay_reader.pages[0])
        writer.add_page(base)
        for i in range(1, len(overlay_reader.pages)):
            writer.add_page(overlay_reader.pages[i])
        out = BytesIO()
        writer.write(out)
        return out.getvalue()
    except Exception:
        return overlay_bytes
