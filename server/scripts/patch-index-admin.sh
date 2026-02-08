#!/bin/bash
# Авто-вставка adminRoutes у src/index.ts (для VPS, якщо потрібно).
# Запускати з server/: ./scripts/patch-index-admin.sh

set -e
INDEX="src/index.ts"

# 1.1 Додати імпорт, якщо ще немає
grep -q 'from "./routes/admin"' "$INDEX" || \
  sed -i '1i import { adminRoutes } from "./routes/admin";' "$INDEX"

# 1.2 Додати register після першого await app.register(
grep -q 'register(adminRoutes' "$INDEX" || \
  awk '{
    print;
    if (!done && $0 ~ /await app\.register\(/) {
      print "    await app.register(adminRoutes);";
      done=1;
    }
  }' "$INDEX" > /tmp/index.ts && mv /tmp/index.ts "$INDEX"

echo "Done. Check src/index.ts"
