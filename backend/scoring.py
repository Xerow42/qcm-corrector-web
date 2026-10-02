from __future__ import annotations


def _to_set(val: object) -> set[str]:
    if val is None:
        return set()
    if isinstance(val, (list, tuple, set)):
        items = val
    else:
        items = [val]
    out: set[str] = set()
    for item in items:
        if item is None:
            continue
        text = str(item).strip().upper()
        for ch in text:
            if ch.isalpha():
                out.add(ch)
    return out


def score_answers(
    predicted: dict[str, list[str] | str | None],
    expected: dict[str, list[str] | str],
) -> tuple[int, list[int], list[int]]:
    correct: list[int] = []
    wrong: list[int] = []
    for q_str, exp in expected.items():
        got = predicted.get(q_str)
        q = int(q_str)
        if _to_set(got) == _to_set(exp):
            correct.append(q)
        else:
            wrong.append(q)
    return len(correct), correct, wrong
