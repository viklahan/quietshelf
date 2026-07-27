#!/bin/bash
# Quiet Shelf daily health check
# Run manually: bash /root/quietshelf/qs_healthcheck.sh
# Add to cron for daily at 8am:
#   0 8 * * * /bin/bash /root/quietshelf/qs_healthcheck.sh >> /root/qs_health.log 2>&1

BASE="https://quietshelf.studio"
PASS=0
FAIL=0

ts() { date '+%Y-%m-%d %H:%M:%S'; }
ok()   { echo "[$(ts)] OK    $1"; PASS=$((PASS+1)); }
fail() { echo "[$(ts)] FAIL  $1"; FAIL=$((FAIL+1)); }
warn() { echo "[$(ts)] WARN  $1"; }

echo "========================================"
echo "Quiet Shelf Health Check — $(ts)"
echo "========================================"

# 1. nginx running
if systemctl is-active --quiet nginx; then
  ok "nginx is active"
else
  fail "nginx is DOWN — run: systemctl start nginx"
fi

# 2. quietshelf service running
if systemctl is-active --quiet quietshelf; then
  ok "quietshelf.service is active"
else
  fail "quietshelf.service is DOWN — run: systemctl restart quietshelf"
fi

# 3. Caddy NOT stealing ports 80/443
if docker ps 2>/dev/null | grep -q "caddy"; then
  fail "Caddy container is running — will steal ports on reboot. Stop it: docker update --restart=no 63b81670d8e0 && docker stop 63b81670d8e0"
else
  ok "Caddy not running (ports 80/443 safe)"
fi

# 4. Site responds
HTTP=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$BASE/")
if [ "$HTTP" = "200" ]; then
  ok "Site responds HTTP $HTTP"
else
  fail "Site returned HTTP $HTTP (expected 200) — check nginx and quietshelf service"
fi

# 5. Format themes endpoint
HTTP=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$BASE/api/format/themes")
if [ "$HTTP" = "200" ]; then
  ok "Format /api/format/themes OK"
else
  fail "Format themes endpoint returned HTTP $HTTP"
fi

# 6. Cover suggestions endpoint (200 or 422 both valid, 500 means missing module)
HTTP=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 -X POST "$BASE/api/format/cover-suggestions" -F "title=test")
if [ "$HTTP" = "200" ] || [ "$HTTP" = "422" ]; then
  ok "Cover suggestions endpoint OK (HTTP $HTTP)"
else
  fail "Cover suggestions endpoint returned HTTP $HTTP — likely missing cover_suggestions.py. Run: git pull && systemctl restart quietshelf"
fi

# 7. Waterfall provider active
HEALTH=$(curl -s --max-time 10 "$BASE/api/health" 2>/dev/null)
if echo "$HEALTH" | grep -qi "waterfall\|gemini\|groq\|provider"; then
  ok "Provider waterfall responding"
else
  warn "Health endpoint unexpected response: ${HEALTH:0:100}"
fi

# 8. SSL cert expiry
EXPIRY=$(echo | openssl s_client -connect quietshelf.studio:443 -servername quietshelf.studio 2>/dev/null \
  | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
if [ -n "$EXPIRY" ]; then
  EXPIRY_EPOCH=$(date -d "$EXPIRY" +%s 2>/dev/null)
  NOW_EPOCH=$(date +%s)
  DAYS_LEFT=$(( (EXPIRY_EPOCH - NOW_EPOCH) / 86400 ))
  if [ "$DAYS_LEFT" -lt 14 ]; then
    fail "SSL cert expires in $DAYS_LEFT days — run: certbot renew"
  elif [ "$DAYS_LEFT" -lt 30 ]; then
    warn "SSL cert expires in $DAYS_LEFT days (auto-renews, but watch this)"
  else
    ok "SSL cert valid ($DAYS_LEFT days remaining)"
  fi
else
  warn "Could not check SSL cert expiry"
fi

# 9. Disk space
DISK=$(df / | awk 'NR==2 {print $5}' | tr -d '%')
if [ "$DISK" -gt 90 ]; then
  fail "Disk usage at ${DISK}% — clean up urgently: journalctl --vacuum-time=7d"
elif [ "$DISK" -gt 80 ]; then
  warn "Disk usage at ${DISK}% — getting full"
else
  ok "Disk usage at ${DISK}%"
fi

# 10. Git conflict markers in Python files (the recurring nightmare)
CONFLICTS=$(grep -rl "<<<<<<< \|>>>>>>> " /root/quietshelf/app/ 2>/dev/null | grep "\.py$")
if [ -n "$CONFLICTS" ]; then
  fail "Git conflict markers in Python files: $CONFLICTS — fix before next deploy"
else
  ok "No git conflict markers in Python files"
fi

# 11. cover_suggestions.py present
if [ -f "/root/quietshelf/app/services/format/cover_suggestions.py" ]; then
  ok "cover_suggestions.py present"
else
  fail "cover_suggestions.py MISSING — run: cd /root/quietshelf && git pull && systemctl restart quietshelf"
fi

# 12. nginx upload limit configured
if grep -q "client_max_body_size" /etc/nginx/sites-available/quietshelf 2>/dev/null; then
  ok "nginx client_max_body_size configured (no 413 on uploads)"
else
  fail "nginx client_max_body_size not set — large uploads will 413. Add to /etc/nginx/sites-available/quietshelf location block: client_max_body_size 25M;"
fi

# 13. Waterfall providers configured in .env
for KEY in GEMINI_API_KEY GROQ_API_KEY; do
  VAL=$(grep "^${KEY}=" /root/quietshelf/.env 2>/dev/null | cut -d= -f2)
  if [ -n "$VAL" ] && [ "$VAL" != "YOUR_KEY_HERE" ]; then
    ok "$KEY is set"
  else
    fail "$KEY is missing or placeholder in .env"
  fi
done

# Summary
echo ""
echo "========================================"
echo "PASSED: $PASS  FAILED: $FAIL"
echo "========================================"
if [ "$FAIL" -gt 0 ]; then
  echo "ACTION REQUIRED — see FAIL lines above"
  exit 1
else
  echo "All checks passed. The shelf stands."
  exit 0
fi
