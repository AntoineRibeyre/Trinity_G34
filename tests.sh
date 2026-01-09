#!/bin/bash

# =============================================================================
# test.sh - Tests Backend & Frontend dans Docker
# =============================================================================

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Containers
BACKEND="django_backend"
FRONTEND="angular_frontend"

echo -e "${BLUE}🚀 Lancement des tests...${NC}\n"

# ===== BACKEND =====
echo -e "${BLUE}===== 🐍 TESTS BACKEND =====${NC}"
docker exec $BACKEND pytest --cov=. --cov-report=term-missing -v tests/
BACKEND_EXIT=$?

echo ""

# ===== FRONTEND =====
echo -e "${BLUE}===== ⚛️  TESTS FRONTEND =====${NC}"
docker exec $FRONTEND npm run test -- --no-watch --code-coverage
FRONTEND_EXIT=$?

echo ""

# ===== RÉSUMÉ =====
echo -e "${BLUE}===== 📋 RÉSUMÉ =====${NC}"

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
