#!/bin/bash

# =============================================================================
# Script de tests avec couverture - Backend (pytest) & Frontend (npm)
# =============================================================================

set -e  # Arrêter le script en cas d'erreur

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Noms des containers (à adapter selon votre configuration)
BACKEND_CONTAINER=" django_backend"
FRONTEND_CONTAINER="angular_frontend"

# =============================================================================
# Fonctions utilitaires
# =============================================================================

print_header() {
    echo ""
    echo -e "${BLUE}=============================================================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}=============================================================================${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Vérifier si un container existe et est en cours d'exécution
check_container() {
    local container_name=$1
    if ! docker ps --format '{{.Names}}' | grep -q "^${container_name}$"; then
        print_error "Le container '${container_name}' n'est pas en cours d'exécution"
        print_info "Containers actifs:"
        docker ps --format '  - {{.Names}}'
        return 1
    fi
    return 0
}

# =============================================================================
# Tests Backend (Python/Pytest)
# =============================================================================

run_backend_tests() {
    print_header "🐍 TESTS BACKEND (Python/Pytest)"
    
    # Vérifier le container
    if ! check_container "$BACKEND_CONTAINER"; then
        return 1
    fi
    
    print_info "Exécution des tests pytest avec couverture..."
    echo ""
    
    # Exécuter pytest avec couverture
    docker exec "$BACKEND_CONTAINER" pytest \
        --cov=. \
        --cov-report=xml \
        --cov-report=html \
        --cov-report=term-missing \
        --ignore=tests/ \
        -v tests/
    
    local exit_code=$?
    
    echo ""
    if [ $exit_code -eq 0 ]; then
        print_success "Tests backend réussis!"
    else
        print_error "Tests backend échoués (code: $exit_code)"
    fi
    
    # Afficher l'emplacement des rapports
    echo ""
    print_info "Rapports de couverture générés:"
    echo "  - XML:  coverage.xml"
    echo "  - HTML: htmlcov/index.html"
    
    return $exit_code
}

# =============================================================================
# Tests Frontend (Node.js/npm)
# =============================================================================

run_frontend_tests() {
    print_header "⚛️  TESTS FRONTEND (Node.js/npm)"
    
    # Vérifier le container
    if ! check_container "$FRONTEND_CONTAINER"; then
        return 1
    fi
    
    print_info "Exécution des tests npm avec couverture..."
    echo ""
    
    # Exécuter les tests npm avec couverture
    docker exec "$FRONTEND_CONTAINER" npm run test:coverage
    
    local exit_code=$?
    
    echo ""
    if [ $exit_code -eq 0 ]; then
        print_success "Tests frontend réussis!"
    else
        print_error "Tests frontend échoués (code: $exit_code)"
    fi
    
    # Afficher le rapport de couverture
    echo ""
    print_header "📊 RAPPORT DE COUVERTURE FRONTEND"
    
    # Essayer d'afficher le résumé de couverture (format lcov/istanbul)
    if docker exec "$FRONTEND_CONTAINER" test -f coverage/lcov-report/index.html 2>/dev/null; then
        print_info "Rapport HTML disponible: coverage/lcov-report/index.html"
    fi
    
    # Afficher le fichier de résumé s'il existe
    if docker exec "$FRONTEND_CONTAINER" test -f coverage/coverage-summary.json 2>/dev/null; then
        print_info "Résumé de couverture:"
        docker exec "$FRONTEND_CONTAINER" cat coverage/coverage-summary.json 2>/dev/null | head -50
    fi
    
    return $exit_code
}

# =============================================================================
# Copier les rapports localement
# =============================================================================

copy_reports() {
    print_header "📁 COPIE DES RAPPORTS LOCALEMENT"
    
    local reports_dir="./coverage-reports"
    mkdir -p "$reports_dir/backend" "$reports_dir/frontend"
    
    # Copier les rapports backend
    print_info "Copie des rapports backend..."
    docker cp "$BACKEND_CONTAINER:/app/coverage.xml" "$reports_dir/backend/" 2>/dev/null && \
        print_success "coverage.xml copié" || print_warning "coverage.xml non trouvé"
    
    docker cp "$BACKEND_CONTAINER:/app/htmlcov" "$reports_dir/backend/" 2>/dev/null && \
        print_success "htmlcov/ copié" || print_warning "htmlcov/ non trouvé"
    
    # Copier les rapports frontend
    print_info "Copie des rapports frontend..."
    docker cp "$FRONTEND_CONTAINER:/app/coverage" "$reports_dir/frontend/" 2>/dev/null && \
        print_success "coverage/ copié" || print_warning "coverage/ non trouvé"
    
    echo ""
    print_info "Rapports disponibles dans: $reports_dir"
}

# =============================================================================
# Afficher l'aide
# =============================================================================

show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -b, --backend     Exécuter uniquement les tests backend"
    echo "  -f, --frontend    Exécuter uniquement les tests frontend"
    echo "  -a, --all         Exécuter tous les tests (par défaut)"
    echo "  -c, --copy        Copier les rapports localement après les tests"
    echo "  --backend-container NAME   Nom du container backend (défaut: $BACKEND_CONTAINER)"
    echo "  --frontend-container NAME  Nom du container frontend (défaut: $FRONTEND_CONTAINER)"
    echo "  -h, --help        Afficher cette aide"
    echo ""
    echo "Exemples:"
    echo "  $0                          # Exécuter tous les tests"
    echo "  $0 -b                       # Tests backend uniquement"
    echo "  $0 -f -c                    # Tests frontend + copie des rapports"
    echo "  $0 --backend-container api  # Utiliser 'api' comme container backend"
}

# =============================================================================
# Main
# =============================================================================

main() {
    local run_backend=false
    local run_frontend=false
    local copy_reports_flag=false
    local backend_exit=0
    local frontend_exit=0
    
    # Parser les arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -b|--backend)
                run_backend=true
                shift
                ;;
            -f|--frontend)
                run_frontend=true
                shift
                ;;
            -a|--all)
                run_backend=true
                run_frontend=true
                shift
                ;;
            -c|--copy)
                copy_reports_flag=true
                shift
                ;;
            --backend-container)
                BACKEND_CONTAINER="$2"
                shift 2
                ;;
            --frontend-container)
                FRONTEND_CONTAINER="$2"
                shift 2
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                print_error "Option inconnue: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # Si aucune option spécifique, exécuter tout
    if [ "$run_backend" = false ] && [ "$run_frontend" = false ]; then
        run_backend=true
        run_frontend=true
    fi
    
    print_header "🚀 TIME MANAGER - TESTS AVEC COUVERTURE"
    print_info "Backend container:  $BACKEND_CONTAINER"
    print_info "Frontend container: $FRONTEND_CONTAINER"
    
    # Exécuter les tests backend
    if [ "$run_backend" = true ]; then
        run_backend_tests || backend_exit=$?
    fi
    
    # Exécuter les tests frontend
    if [ "$run_frontend" = true ]; then
        run_frontend_tests || frontend_exit=$?
    fi
    
    # Copier les rapports si demandé
    if [ "$copy_reports_flag" = true ]; then
        copy_reports
    fi
    
    # Résumé final
    print_header "📋 RÉSUMÉ"
    
    if [ "$run_backend" = true ]; then
        if [ $backend_exit -eq 0 ]; then
            print_success "Backend: SUCCÈS"
        else
            print_error "Backend: ÉCHEC (code: $backend_exit)"
        fi
    fi
    
    if [ "$run_frontend" = true ]; then
        if [ $frontend_exit -eq 0 ]; then
            print_success "Frontend: SUCCÈS"
        else
            print_error "Frontend: ÉCHEC (code: $frontend_exit)"
        fi
    fi
    
    # Code de sortie global
    if [ $backend_exit -ne 0 ] || [ $frontend_exit -ne 0 ]; then
        exit 1
    fi
    
    echo ""
    print_success "Tous les tests ont réussi!"
}

# Exécuter le script
main "$@"
