#!/usr/bin/env python3
"""
Mide el solapamiento lexico entre las 'description' de las skills ms-* del
repo, para el punto 3 de la auditoria (solapamiento y ambiguedad de
triggers).

Para cada par de skills, calcula el indice de Jaccard sobre las palabras
"significativas" de su description (fuera de una lista de stopwords en
espanol + palabras estructurales propias del framework que aparecen en
todas las descriptions por diseno, como 'ms-*', 'framework', 'trigger').

Uso:
    python .claude/improvement/03/scripts/description_overlap.py
"""
import glob
import itertools
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]

STOPWORDS = set("""
a al algo algun alguna algunas alguno algunos ante antes como con contra
cual cuando de del desde donde durante e el ella ellas ellos en entre era
es esa esas ese eso esos esta estas este esto estos fue ha hay la las le
les lo los mas me mi mientras muy no nos o os para pero poco por porque
que quien quienes se sequien si sin sobre su sus te tu tus un una uno unos
y ya
""".split())

# Palabras estructurales del propio framework: aparecen por diseno en casi
# todas las descriptions (son el "namespace" comun), asi que solapan sin que
# eso sea ambiguedad real de cara al usuario.
FRAMEWORK_WORDS = {
    "changesdir", "inprogress", "implemented", "framework", "trigger", "ms",
    "skill", "usuario", "parte", "proyecto", "pide", "change", "fix",
}

WORD_RE = re.compile(r"[a-záéíóúñü]+", re.IGNORECASE)


def keywords(description: str) -> set:
    words = {w.lower() for w in WORD_RE.findall(description)}
    return words - STOPWORDS - FRAMEWORK_WORDS


def main():
    skills = {}
    for skill_md in sorted(glob.glob(str(ROOT / ".claude/skills/*/SKILL.md"))):
        raw = open(skill_md, encoding="utf-8").read()
        m = re.search(r"^description:\s?(.*)$", raw, re.MULTILINE)
        if not m:
            continue
        name = Path(skill_md).parent.name
        skills[name] = keywords(m.group(1))

    pairs = []
    for a, b in itertools.combinations(sorted(skills), 2):
        shared = skills[a] & skills[b]
        union = skills[a] | skills[b]
        jaccard = len(shared) / len(union) if union else 0
        pairs.append((jaccard, a, b, sorted(shared)))

    pairs.sort(reverse=True)

    print(f"{'skill A':22s} {'skill B':22s} {'jaccard':>8s}  palabras compartidas")
    for jaccard, a, b, shared in pairs:
        print(f"{a:22s} {b:22s} {jaccard:8.2f}  {', '.join(shared) if shared else '-'}")


if __name__ == "__main__":
    main()
