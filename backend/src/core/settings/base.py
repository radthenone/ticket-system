# IMPORTS
import os

from core.paths import PROJECT_DIR, SRC_DIR

# GLOBAL SETTINGS
SECRET_KEY = str(os.environ.get("DJANGO_SECRET_KEY", "secret_key"))
DEBUG = bool(os.environ.get("DJANGO_DEBUG", 1))
ALLOWED_HOSTS = list(
    str(os.environ.get("DJANGO_ALLOWED_HOSTS", "127.0.0.1,localhost")).split(",")
)
ROOT_URLCONF = "core.urls"
WSGI_APPLICATION = "core.wsgi.application"

DJANGO_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]

THIRD_PARTY_APPS = [
    "rest_framework",
    "rest_framework.authtoken",
    "corsheaders",
]

APPS = [
    "apps.tickets",
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + APPS

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": PROJECT_DIR / "db.sqlite3",
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

LANGUAGE_CODE = "pl-pl"

TIME_ZONE = "Europe/Warsaw"

USE_I18N = True

USE_TZ = True


STATIC_URL = "static/"
STATICFILES_DIRS = [SRC_DIR / "static"]
STATIC_ROOT = SRC_DIR / "staticfiles"

MEDIA_URL = "media/"
MEDIA_ROOT = SRC_DIR / "media"


DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [SRC_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

DJANGO_SUPERUSER_USERNAME = os.environ.get("DJANGO_SUPERUSER_USERNAME", "admin")
DJANGO_SUPERUSER_EMAIL = os.environ.get("DJANGO_SUPERUSER_EMAIL", "admin@example.com")
DJANGO_SUPERUSER_PASSWORD = os.environ.get("DJANGO_SUPERUSER_PASSWORD", "admin")

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework.authentication.TokenAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.AllowAny",),
}

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "filters": {"require_debug_true": {"()": "django.utils.log.RequireDebugTrue"}},
    "formatters": {"rich": {"datefmt": "[%X]"}},
    "handlers": {
        "console": {
            "class": "rich.logging.RichHandler",
            "filters": ["require_debug_true"],
            "formatter": "rich",
            "level": "DEBUG",
            "rich_tracebacks": True,
            "tracebacks_show_locals": True,
        }
    },
    "loggers": {"django": {"handlers": ["console"], "level": "INFO"}},
}
