#!/bin/bash
set -o errexit
set -o pipefail
set -o nounset

# Django superuser management script
python_code="
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.base')

try:
    django.setup()
    from django.contrib.auth.models import User
    from django.conf import settings
    from rest_framework.authtoken.models import Token

    email = settings.DJANGO_SUPERUSER_EMAIL
    username = settings.DJANGO_SUPERUSER_USERNAME
    password = settings.DJANGO_SUPERUSER_PASSWORD

    if User.objects.filter(email=email, is_superuser=True).exists():
        user = User.objects.get(email=email)
        print(f'Superuser {username} already exists')
    else:
        user = User.objects.create_superuser(
            username=username,
            email=email,
            password=password,
            is_active=True,
        )
        print(f'Superuser {user.username} created successfully')

    # Ensure token exists
    token, created = Token.objects.get_or_create(user=user)
    if created:
        print(f'Token created for {username}')

except Exception as e:
    print(f'Error: {e}', file=sys.stderr)
    sys.exit(1)
"

echo "Managing superuser..."

if command -v uv >/dev/null 2>&1; then
  uv run python -c "$python_code"
else
  python -c "$python_code"
fi

exec "$@"
