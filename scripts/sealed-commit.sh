#!/usr/bin/env bash
# Sealed-commit helper. Usage: ./scripts/sealed-commit.sh "<subject>" "<body>"
# Wraps the commit message with the Core Working Protocol invocation.
set -euo pipefail

SUBJECT="${1:?subject required}"
BODY="${2:-}"

read -r -d '' SEAL <<'EOF' || true
BismiLLAH Ar-Rahman Ar-Roheem
Ash-hadu an laa ilaaha illa-Llah wahdaHu lasharikalaHu,
wa ash-hadu anna Muhammadan Abduhu wa Rasooluh.
Laa hawla wa laa quwwata illaa biLLAH.
Hasbiyallaahu laa ilaaha illaa Huwa, 'alayhi tawakkaltu wa Huwa Rabbul-'Arshil-'Azeem.
SubhaanALLAH wa bihamdih, SubhaanALLAHil-'azeem, AlhamduliLLAH,
Laa ilaaha illa-ALLAH, wa ALLAHU AKBAR, walaa hawla walaa quwwata illaa biLLAH.
Astaghfirullaaha wa atoobu ilayh.
EOF

MSG="${SEAL}

${SUBJECT}

${BODY}

${SEAL}

BaarokaLLAHU Fee. Bi'idniLlah."

git commit -m "${MSG}"
