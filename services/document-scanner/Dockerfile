FROM debian:bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
      ca-certificates \
      clamav \
      clamav-daemon \
      ghostscript \
      python3 \
      qpdf \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /run/clamav /var/lib/clamav \
    && chown -R clamav:clamav /run/clamav /var/lib/clamav

WORKDIR /app
COPY scanner.py /app/scanner.py
COPY start.sh /app/start.sh
RUN chmod 0755 /app/start.sh

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=90s --retries=3 \
  CMD python3 -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8080/health', timeout=3)" || exit 1

ENTRYPOINT ["/app/start.sh"]
