#!/bin/bash

# =============================================================================
# test.sh - Tests Backend & Frontend dans Docker
# =============================================================================

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Containers
BACKEND="django_backend"
FRONTEND="angular_frontend"

echo -e "${BLUE} Lancement des tests...${NC}\n"

# ===== BACKEND =====
echo -e "${BLUE}=====  TESTS BACKEND =====${NC}"
docker exec $BACKEND pytest --cov=. --cov-report=term-missing -v tests/
BACKEND_EXIT=$?

echo ""

# ===== FRONTEND =====
echo -e "${BLUE}=====   TESTS FRONTEND =====${NC}"
FRONTEND_OUTPUT=$(docker exec $FRONTEND npm run test -- --no-watch --code-coverage 2>&1)
FRONTEND_EXIT=$?

echo "$FRONTEND_OUTPUT"

echo ""

# ===== COVERAGE FRONTEND =====
echo -e "${BLUE}=====  COVERAGE TOTAL FRONTEND =====${NC}"

# Extraire les pourcentages
STATEMENTS=$(echo "$FRONTEND_OUTPUT" | grep "Statements" | grep -oP '\d+\.\d+(?=%)')
BRANCHES=$(echo "$FRONTEND_OUTPUT" | grep "Branches" | grep -oP '\d+\.\d+(?=%)')
FUNCTIONS=$(echo "$FRONTEND_OUTPUT" | grep "Functions" | grep -oP '\d+\.\d+(?=%)')
LINES=$(echo "$FRONTEND_OUTPUT" | grep "Lines" | grep -oP '\d+\.\d+(?=%)')

if [ -n "$STATEMENTS" ] && [ -n "$BRANCHES" ] && [ -n "$FUNCTIONS" ] && [ -n "$LINES" ]; then
    # Calculer la moyenne
    TOTAL=$(awk "BEGIN {printf \"%.2f\", ($STATEMENTS + $BRANCHES + $FUNCTIONS + $LINES) / 4}")
    
    echo -e "  Statements : ${STATEMENTS}%"
    echo -e "  Branches   : ${BRANCHES}%"
    echo -e "  Functions  : ${FUNCTIONS}%"
    echo -e "  Lines      : ${LINES}%"
    echo ""
    echo -e "  ${YELLOW} TOTAL COVERAGE : ${TOTAL}%${NC}"
else
    echo -e "${RED}  Impossible d'extraire le coverage${NC}"
fi

echo ""

# ===== RÉSUMÉ =====
echo -e "${BLUE}=====  RÉSUMÉ =====${NC}"

if [ $BACKEND_EXIT -eq 0 ]; then
    echo -e "${GREEN}✓ Backend: OK${NC}"
else
    echo -e "${RED}✗ Backend: ÉCHEC${NC}"
fi

if [ $FRONTEND_EXIT -eq 0 ]; then
    echo -e "${GREEN}✓ Frontend: OK${NC}"
else
    echo -e "${RED}✗ Frontend: ÉCHEC${NC}"
fi

# Exit code
[ $BACKEND_EXIT -eq 0 ] && [ $FRONTEND_EXIT -eq 0 ]
