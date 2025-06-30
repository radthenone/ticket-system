#!/bin/bash
set -o errexit
set -o pipefail
set -o nounset

# Validate required environment variables
validate_env_vars() {
    local required_vars=("DJANGO_SUPERUSER_USERNAME" "DJANGO_SUPERUSER_EMAIL" "DJANGO_SUPERUSER_PASSWORD")
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            echo "Error: Missing required environment variable: $var" >&2
            return 1
        fi
    done
}

# Single Django setup and execution function
run_django_script() {
    local operation="$1"

    local python_code="
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.base')

try:
    django.setup()
    from django.contrib.auth import get_user_model
    User = get_user_model()

    username = os.environ['DJANGO_SUPERUSER_USERNAME']
    email = os.environ['DJANGO_SUPERUSER_EMAIL']
    password = os.environ['DJANGO_SUPERUSER_PASSWORD']

    if '$operation' == 'check':
        exists = User.objects.filter(email=email, is_superuser=True).exists()
        print('True' if exists else 'False')

    elif '$operation' == 'create':
        if User.objects.filter(email=email).exists():
            user = User.objects.get(email=email)
            if not user.is_superuser:
                user.is_superuser = True
                user.is_staff = True
                user.save()
                print(f'User {username} promoted to superuser')
            else:
                print(f'Superuser {username} already exists')
        else:
            user = User.objects.create_superuser(username=username, email=email, password=password)
            print(f'Superuser {user.username} created successfully')

except Exception as e:
    print(f'Error: {e}', file=sys.stderr)
    sys.exit(1)
"

    if command -v uv >/dev/null 2>&1; then
        uv run python -c "$python_code"
    else
        python -c "$python_code"
    fi
}

# Main execution
main() {
    if ! validate_env_vars; then
        exit 1
    fi

    echo "Checking superuser status..."

    if [[ $(run_django_script "check") == "False" ]]; then
        echo "Creating superuser..."
        run_django_script "create"
    else
        echo "Superuser already exists"
    fi
}

# Execute only if environment variables are set
if [[ -n "${DJANGO_SUPERUSER_USERNAME:-}" ]] && \
   [[ -n "${DJANGO_SUPERUSER_EMAIL:-}" ]] && \
   [[ -n "${DJANGO_SUPERUSER_PASSWORD:-}" ]]; then
    main
fi

exec "$@"
