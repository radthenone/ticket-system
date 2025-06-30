ARG UV_VERSION=0.7.17

FROM ghcr.io/astral-sh/uv:${UV_VERSION}-python3.12-bookworm-slim

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    gcc \
    python3-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /src

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy

COPY backend/pyproject.toml backend/uv.lock /src/

RUN --mount=type=cache,target=/root/.cache/uv \
	uv pip compile pyproject.toml --all-extras -o requirements.txt && \
    uv pip install --system -r requirements.txt

COPY backend/src/ /src/
COPY docker/backend/commands/check_superuser.sh /check_superuser.sh
COPY docker/backend/entrypoint.sh /entrypoint.sh

RUN chmod +x /check_superuser.sh && \
    chmod +x /entrypoint.sh

WORKDIR /src

ENV VIRTUAL_ENV="/src/.venv"
ENV PATH="/src/.venv/bin:$PATH"

ENTRYPOINT ["/entrypoint.sh"]