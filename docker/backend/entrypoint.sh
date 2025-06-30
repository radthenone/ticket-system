#!/bin/bash
# if any of the commands in your code fails for any reason, the entire script fails
set -o errexit
# fail exit if one of your pipe command fails
set -o pipefail
# exits if any of your variables is not set
set -o nounset

echo "Python path: $(which python)"
python -c "import django; print('Django version:', django.__version__)" || echo "Django not found!"

if [ "${ENVIRONMENT:-development}" == "development" ]; then
	mkdir -p static staticfiles media

    echo "Do database migrations..."
    python manage.py migrate --noinput

    echo "Creating superuser..."
    /check_superuser.sh

	echo "Collect static..."
	python manage.py collectstatic --noinput
fi


python manage.py runserver "${DJANGO_HOST}":"${DJANGO_PORT}"